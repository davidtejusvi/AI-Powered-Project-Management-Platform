import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('ai_prompt_records')
export class AIPromptRecord {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    workspaceId!: string;

    @Column()
    requestedById!: string;

    @Column({ type: 'text' })
    prompt!: string;

    @Column({ default: 'gpt-4o' })
    model!: string;

    @Column({ default: 0 })
    tokensPrompt!: number;

    @Column({ default: 0 })
    tokensCompletion!: number;

    @Column({ default: 0 })
    tasksGenerated!: number;

    @Column({ type: 'varchar', default: 'PENDING' })
    status!: 'PENDING' | 'SUCCESS' | 'FAILED';

    @Column({ nullable: true, type: 'text' })
    errorMessage?: string;

    @CreateDateColumn()
    createdAt!: Date;
}
