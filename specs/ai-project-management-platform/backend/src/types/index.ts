export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Permission = 'read' | 'write' | 'delete' | 'manage_members' | 'manage_settings' | 'manage_billing';
export type NotificationType =
    | 'TASK_ASSIGNED'
    | 'TASK_MENTIONED'
    | 'TASK_COMPLETED'
    | 'WORKSPACE_INVITED'
    | 'AI_TASKS_GENERATED'
    | 'FILE_UPLOADED';

export interface JWTPayload {
    sub: string;
    email: string;
    roles: UserRole[];
    workspaces: string[];
    iat: number;
    exp: number;
}

export interface GraphQLContext {
    user: JWTPayload | null;
    req: import('express').Request;
}

export interface RegisterInput {
    email: string;
    password: string;
    displayName: string;
}

export interface CreateWorkspaceInput {
    name: string;
    description?: string;
}

export interface CreateTaskInput {
    workspaceId: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    assigneeId?: string;
    dueDate?: string;
    estimatedHours?: number;
    tags?: string[];
    status?: TaskStatus;
    aiGenerated?: boolean;
    aiPromptId?: string;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    assigneeId?: string;
    dueDate?: string;
    estimatedHours?: number;
    tags?: string[];
}

export interface TaskFilter {
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    search?: string;
}

export const ROLE_PERMISSION_MAP: Record<MemberRole, Permission[]> = {
    OWNER: ['read', 'write', 'delete', 'manage_members', 'manage_settings', 'manage_billing'],
    ADMIN: ['read', 'write', 'delete', 'manage_members'],
    MEMBER: ['read', 'write'],
    VIEWER: ['read'],
};
