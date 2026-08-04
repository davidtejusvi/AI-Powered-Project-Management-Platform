import { GraphQLContext } from '../types';
import { authService } from '../services/auth.service';
import { workspaceService } from '../services/workspace.service';
import { taskService, pubsub } from '../services/task.service';
import { aiService } from '../services/ai.service';
import { notificationService } from '../services/notification.service';
import { AuthenticationError, ForbiddenError } from '../lib/errors';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { AIPromptRecord } from '../entities/AIPromptRecord';
import { Task } from '../entities/Task';
import { Workspace } from '../entities/Workspace';

function requireAuth(ctx: GraphQLContext) {
    if (!ctx.user) throw new AuthenticationError('Must be logged in');
    return ctx.user;
}

export const resolvers = {
    Query: {
        me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            return AppDataSource.getRepository(User).findOne({ where: { id: user.sub } });
        },

        workspace: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            return workspaceService.getWorkspace(id, user.sub);
        },

        workspaces: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            return workspaceService.listUserWorkspaces(user.sub);
        },

        task: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            return taskService.getTask(id, user.sub);
        },

        tasks: async (_: unknown, { workspaceId, filter }: any, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            return taskService.listTasks(workspaceId, filter || {}, user.sub);
        },

        notifications: async (_: unknown, { unreadOnly }: any, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            return notificationService.list(user.sub, unreadOnly || false);
        },

        adminStats: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            if (!user.roles.includes('ADMIN') && !user.roles.includes('SUPER_ADMIN')) {
                throw new ForbiddenError('Admin access required');
            }
            const [totalUsers, totalWorkspaces, totalTasks, totalAIRequests] = await Promise.all([
                AppDataSource.getRepository(User).count(),
                AppDataSource.getRepository(Workspace).count(),
                AppDataSource.getRepository(Task).count(),
                AppDataSource.getRepository(AIPromptRecord).count(),
            ]);
            return { totalUsers, totalWorkspaces, totalTasks, totalAIRequests };
        },
    },

    Workspace: {
        members: async (workspace: Workspace) => {
            return workspaceService.getMembers(workspace.id);
        },
    },

    Mutation: {
        register: async (_: unknown, { input }: any) => authService.register(input),

        login: async (_: unknown, { email, password }: any) => authService.login(email, password),

        refreshToken: async (_: unknown, { token }: any) => authService.refreshAccessToken(token),

        logout: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            await authService.logout(user.sub);
            return true;
        },

        createWorkspace: async (_: unknown, { input }: any, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            return workspaceService.createWorkspace(user.sub, input);
        },

        inviteMember: async (_: unknown, { workspaceId, userId, role }: any, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            return workspaceService.inviteMember(workspaceId, userId, role, user.sub);
        },

        createTask: async (_: unknown, { input }: any, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            return taskService.createTask(input, user.sub);
        },

        updateTask: async (_: unknown, { id, input }: any, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            return taskService.updateTask(id, input, user.sub);
        },

        moveTask: async (_: unknown, { id, status }: any, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            return taskService.moveTask(id, status, user.sub);
        },

        deleteTask: async (_: unknown, { id }: any, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            return taskService.deleteTask(id, user.sub);
        },

        generateTasks: async (_: unknown, { workspaceId, prompt }: any, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            return aiService.generateTasks(workspaceId, prompt, user.sub);
        },

        markNotificationRead: async (_: unknown, { id }: any, ctx: GraphQLContext) => {
            const user = requireAuth(ctx);
            return notificationService.markRead(id, user.sub);
        },
    },

    Subscription: {
        taskUpdated: {
            subscribe: (_: unknown, { workspaceId }: any) =>
                pubsub.asyncIterator([`TASK_UPDATED_${workspaceId}`]),
        },
        notificationReceived: {
            subscribe: (_: unknown, __: unknown, ctx: GraphQLContext) => {
                const user = requireAuth(ctx);
                return pubsub.asyncIterator([`NOTIFICATION_${user.sub}`]);
            },
        },
    },
};
