import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Workspace, WorkspaceMember } from './entities/Workspace';
import { Task } from './entities/Task';
import { Notification } from './entities/Notification';
import { AIPromptRecord } from './entities/AIPromptRecord';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aipm',
    synchronize: true, // auto-create tables in dev; use migrations in prod
    logging: process.env.NODE_ENV === 'development',
    entities: [User, Workspace, WorkspaceMember, Task, Notification, AIPromptRecord],
    migrations: ['src/migrations/*.ts'],
});
