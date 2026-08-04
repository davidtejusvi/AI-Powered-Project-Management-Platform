import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { redis } from '../lib/redis';
import { AuthenticationError } from '../lib/errors';
import { JWTPayload, RegisterInput, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds

function signAccessToken(user: User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        sub: user.id,
        email: user.email,
        roles: user.roles,
        workspaces: [],
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function signRefreshToken(userId: string): string {
    return jwt.sign({ sub: userId, type: 'refresh', jti: uuidv4() }, JWT_SECRET, {
        expiresIn: '7d',
    });
}

export const authService = {
    async register(input: RegisterInput) {
        const repo = AppDataSource.getRepository(User);
        const existing = await repo.findOne({ where: { email: input.email.toLowerCase() } });
        if (existing) {
            throw new AuthenticationError('Email already registered');
        }

        const passwordHash = await bcrypt.hash(input.password, 12);
        const user = repo.create({
            email: input.email.toLowerCase(),
            displayName: input.displayName,
            passwordHash,
            roles: ['USER'] as UserRole[],
            isActive: true,
        });
        await repo.save(user);

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user.id);
        await redis.set(`session:${user.id}`, refreshToken, 'EX', REFRESH_EXPIRES_IN);

        return { accessToken, refreshToken, user };
    },

    async login(email: string, password: string) {
        const repo = AppDataSource.getRepository(User);
        const user = await repo
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.email = :email', { email: email.toLowerCase() })
            .getOne();

        if (!user || !user.passwordHash) {
            throw new AuthenticationError('Invalid credentials');
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            throw new AuthenticationError('Invalid credentials');
        }

        user.lastLoginAt = new Date();
        await repo.save(user);

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user.id);
        await redis.set(`session:${user.id}`, refreshToken, 'EX', REFRESH_EXPIRES_IN);

        return { accessToken, refreshToken, user };
    },

    async refreshAccessToken(token: string) {
        let payload: any;
        try {
            payload = jwt.verify(token, JWT_SECRET) as any;
        } catch {
            throw new AuthenticationError('Invalid refresh token');
        }

        if (payload.type !== 'refresh') {
            throw new AuthenticationError('Invalid token type');
        }

        const stored = await redis.get(`session:${payload.sub}`);
        if (!stored) {
            throw new AuthenticationError('Session expired');
        }

        const repo = AppDataSource.getRepository(User);
        const user = await repo.findOne({ where: { id: payload.sub } });
        if (!user) throw new AuthenticationError('User not found');

        const accessToken = signAccessToken(user);
        const newRefreshToken = signRefreshToken(user.id);
        await redis.set(`session:${user.id}`, newRefreshToken, 'EX', REFRESH_EXPIRES_IN);

        return { accessToken, refreshToken: newRefreshToken, user };
    },

    async logout(userId: string) {
        await redis.del(`session:${userId}`);
    },

    validateToken(token: string): JWTPayload {
        try {
            return jwt.verify(token, JWT_SECRET) as JWTPayload;
        } catch {
            throw new AuthenticationError('Invalid token');
        }
    },
};
