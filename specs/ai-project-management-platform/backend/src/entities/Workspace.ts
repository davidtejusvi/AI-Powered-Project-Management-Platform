import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, OneToMany, ManyToOne, JoinColumn,
} from 'typeorm';
import { MemberRole, TaskPriority } from '../types';

@Entity('workspaces')
export class Workspace {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 80 })
    name!: string;

    @Column({ length: 100 })
    slug!: string;

    @Column({ nullable: true, type: 'text' })
    description?: string;

    @Column()
    ownerId!: string;

    @Column({ type: 'jsonb', default: '{}' })
    settings!: {
        allowPublicInvites: boolean;
        defaultTaskPriority: TaskPriority;
        aiGenerationEnabled: boolean;
        maxFileUploadMb: number;
    };

    @Column({ default: false })
    isArchived!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

@Entity('workspace_members')
export class WorkspaceMember {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    userId!: string;

    @Column()
    workspaceId!: string;

    @Column({ type: 'varchar', default: 'MEMBER' })
    role!: MemberRole;

    @CreateDateColumn()
    joinedAt!: Date;
}
