import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';
import { NotificationType } from '../types';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    userId!: string;

    @Column({ type: 'varchar' })
    type!: NotificationType;

    @Column()
    title!: string;

    @Column({ type: 'text' })
    body!: string;

    @Column({ nullable: true })
    actionUrl?: string;

    @Column({ default: false })
    isRead!: boolean;

    @Column({ type: 'jsonb', default: '{}' })
    metadata!: Record<string, unknown>;

    @CreateDateColumn()
    createdAt!: Date;
}
