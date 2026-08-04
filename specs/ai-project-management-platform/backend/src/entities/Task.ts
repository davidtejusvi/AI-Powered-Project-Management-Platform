import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { TaskStatus, TaskPriority } from '../types';

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    workspaceId!: string;

    @Column({ length: 200 })
    title!: string;

    @Column({ nullable: true, type: 'text' })
    description?: string;

    @Column({ type: 'varchar', default: 'BACKLOG' })
    status!: TaskStatus;

    @Column({ type: 'varchar', default: 'MEDIUM' })
    priority!: TaskPriority;

    @Column({ type: 'float', default: 1.0 })
    position!: number;

    @Column({ nullable: true })
    assigneeId?: string;

    @Column()
    creatorId!: string;

    @Column({ nullable: true })
    dueDate?: Date;

    @Column({ nullable: true, type: 'float' })
    estimatedHours?: number;

    @Column({ type: 'simple-array', nullable: true })
    tags!: string[];

    @Column({ default: false })
    aiGenerated!: boolean;

    @Column({ nullable: true })
    aiPromptId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
