import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, OneToMany,
} from 'typeorm';
import { UserRole } from '../types';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true, length: 320 })
    email!: string;

    @Column({ length: 100 })
    displayName!: string;

    @Column({ nullable: true })
    avatarUrl?: string;

    @Column({ nullable: true, select: false })
    passwordHash?: string;

    @Column({ type: 'simple-array', default: 'USER' })
    roles!: UserRole[];

    @Column({ default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    lastLoginAt?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
