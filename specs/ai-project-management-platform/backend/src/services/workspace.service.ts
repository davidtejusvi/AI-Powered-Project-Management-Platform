import { AppDataSource } from '../data-source';
import { Workspace, WorkspaceMember } from '../entities/Workspace';
import { ForbiddenError, NotFoundError } from '../lib/errors';
import {
    CreateWorkspaceInput, MemberRole, Permission,
    ROLE_PERMISSION_MAP,
} from '../types';

function slugify(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const workspaceService = {
    async createWorkspace(userId: string, input: CreateWorkspaceInput) {
        const wsRepo = AppDataSource.getRepository(Workspace);
        const memRepo = AppDataSource.getRepository(WorkspaceMember);

        const workspace = wsRepo.create({
            name: input.name,
            slug: slugify(input.name),
            description: input.description,
            ownerId: userId,
            settings: {
                allowPublicInvites: false,
                defaultTaskPriority: 'MEDIUM',
                aiGenerationEnabled: true,
                maxFileUploadMb: 100,
            },
        });
        await wsRepo.save(workspace);

        const member = memRepo.create({
            userId,
            workspaceId: workspace.id,
            role: 'OWNER',
        });
        await memRepo.save(member);

        return workspace;
    },

    async getWorkspace(id: string, requesterId: string) {
        await assertPermission(requesterId, id, 'read');
        const ws = await AppDataSource.getRepository(Workspace).findOne({ where: { id } });
        if (!ws) throw new NotFoundError('Workspace not found');
        return ws;
    },

    async listUserWorkspaces(userId: string) {
        const members = await AppDataSource.getRepository(WorkspaceMember).find({
            where: { userId },
        });
        const ids = members.map((m) => m.workspaceId);
        if (ids.length === 0) return [];
        return AppDataSource.getRepository(Workspace)
            .createQueryBuilder('ws')
            .where('ws.id IN (:...ids)', { ids })
            .getMany();
    },

    async inviteMember(workspaceId: string, targetUserId: string, role: MemberRole, inviterId: string) {
        await assertPermission(inviterId, workspaceId, 'manage_members');
        const memRepo = AppDataSource.getRepository(WorkspaceMember);
        const existing = await memRepo.findOne({ where: { workspaceId, userId: targetUserId } });
        if (existing) {
            existing.role = role;
            return memRepo.save(existing);
        }
        const member = memRepo.create({ workspaceId, userId: targetUserId, role });
        return memRepo.save(member);
    },

    async getMembers(workspaceId: string) {
        return AppDataSource.getRepository(WorkspaceMember).find({ where: { workspaceId } });
    },
};

export async function assertPermission(
    userId: string,
    workspaceId: string,
    requiredPermission: Permission,
): Promise<void> {
    const member = await AppDataSource.getRepository(WorkspaceMember).findOne({
        where: { workspaceId, userId },
    });
    if (!member) throw new ForbiddenError('Not a member of this workspace');
    const perms = ROLE_PERMISSION_MAP[member.role];
    if (!perms.includes(requiredPermission)) {
        throw new ForbiddenError(`Role '${member.role}' lacks permission '${requiredPermission}'`);
    }
}
