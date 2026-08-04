import { AppDataSource } from '../data-source';
import { Task } from '../entities/Task';
import { assertPermission } from './workspace.service';
import { NotFoundError } from '../lib/errors';
import { CreateTaskInput, TaskFilter, TaskStatus, UpdateTaskInput } from '../types';
import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

function computeNewPosition(tasks: Task[], status: TaskStatus): number {
    const col = tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);
    if (col.length === 0) return 1.0;
    return col[col.length - 1].position + 1.0;
}

export const taskService = {
    async createTask(input: CreateTaskInput, creatorId: string): Promise<Task> {
        await assertPermission(creatorId, input.workspaceId, 'write');
        const repo = AppDataSource.getRepository(Task);
        const allTasks = await repo.find({ where: { workspaceId: input.workspaceId } });
        const position = computeNewPosition(allTasks, input.status || 'BACKLOG');

        const task = repo.create({
            ...input,
            creatorId,
            status: input.status || 'BACKLOG',
            priority: input.priority || 'MEDIUM',
            tags: input.tags || [],
            position,
        });
        const saved = await repo.save(task);
        pubsub.publish(`TASK_UPDATED_${input.workspaceId}`, { taskUpdated: saved });
        return saved;
    },

    async getTask(id: string, requesterId: string): Promise<Task> {
        const task = await AppDataSource.getRepository(Task).findOne({ where: { id } });
        if (!task) throw new NotFoundError('Task not found');
        await assertPermission(requesterId, task.workspaceId, 'read');
        return task;
    },

    async listTasks(workspaceId: string, filter: TaskFilter, requesterId: string): Promise<Task[]> {
        await assertPermission(requesterId, workspaceId, 'read');
        const qb = AppDataSource.getRepository(Task)
            .createQueryBuilder('task')
            .where('task.workspaceId = :workspaceId', { workspaceId });

        if (filter?.status) qb.andWhere('task.status = :status', { status: filter.status });
        if (filter?.priority) qb.andWhere('task.priority = :priority', { priority: filter.priority });
        if (filter?.assigneeId) qb.andWhere('task.assigneeId = :assigneeId', { assigneeId: filter.assigneeId });
        if (filter?.search) qb.andWhere('task.title ILIKE :search', { search: `%${filter.search}%` });

        return qb.orderBy('task.position', 'ASC').getMany();
    },

    async updateTask(id: string, input: UpdateTaskInput, requesterId: string): Promise<Task> {
        const repo = AppDataSource.getRepository(Task);
        const task = await repo.findOne({ where: { id } });
        if (!task) throw new NotFoundError('Task not found');
        await assertPermission(requesterId, task.workspaceId, 'write');

        Object.assign(task, input);
        const saved = await repo.save(task);
        pubsub.publish(`TASK_UPDATED_${task.workspaceId}`, { taskUpdated: saved });
        return saved;
    },

    async moveTask(id: string, status: TaskStatus, requesterId: string): Promise<Task> {
        const repo = AppDataSource.getRepository(Task);
        const task = await repo.findOne({ where: { id } });
        if (!task) throw new NotFoundError('Task not found');
        await assertPermission(requesterId, task.workspaceId, 'write');

        const allTasks = await repo.find({ where: { workspaceId: task.workspaceId } });
        task.status = status;
        task.position = computeNewPosition(allTasks.filter((t) => t.id !== id), status);

        const saved = await repo.save(task);
        pubsub.publish(`TASK_UPDATED_${task.workspaceId}`, { taskUpdated: saved });
        return saved;
    },

    async deleteTask(id: string, requesterId: string): Promise<boolean> {
        const repo = AppDataSource.getRepository(Task);
        const task = await repo.findOne({ where: { id } });
        if (!task) throw new NotFoundError('Task not found');
        await assertPermission(requesterId, task.workspaceId, 'delete');
        await repo.remove(task);
        return true;
    },

    async bulkCreateTasks(inputs: CreateTaskInput[], workspaceId: string): Promise<Task[]> {
        const repo = AppDataSource.getRepository(Task);
        const allTasks = await repo.find({ where: { workspaceId } });
        let basePosition = allTasks.length > 0
            ? Math.max(...allTasks.map((t) => t.position)) + 1.0
            : 1.0;

        const tasks = inputs.map((input, i) =>
            repo.create({
                ...input,
                workspaceId,
                status: 'BACKLOG',
                priority: input.priority || 'MEDIUM',
                tags: input.tags || [],
                position: basePosition + i,
            }),
        );
        return repo.save(tasks);
    },
};
