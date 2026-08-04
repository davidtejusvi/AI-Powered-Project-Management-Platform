import OpenAI from 'openai';
import { AppDataSource } from '../data-source';
import { AIPromptRecord } from '../entities/AIPromptRecord';
import { Workspace } from '../entities/Workspace';
import { Task } from '../entities/Task';
import { taskService } from './task.service';
import { AIGenerationError, NotFoundError, UserInputError } from '../lib/errors';
import { redis } from '../lib/redis';
import { CreateTaskInput, TaskPriority } from '../types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ParsedTask {
    title: string;
    description: string;
    priority: TaskPriority;
    estimatedHours: number;
    tags: string[];
}

function validateGeneratedTasks(tasks: ParsedTask[]) {
    const errors: string[] = [];
    const validPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    tasks.forEach((t, i) => {
        if (!t.title || t.title.length > 200) errors.push(`Task[${i}] title invalid`);
        if (!validPriorities.includes(t.priority)) errors.push(`Task[${i}] priority invalid`);
        if (typeof t.estimatedHours !== 'number' || t.estimatedHours < 0)
            errors.push(`Task[${i}] estimatedHours invalid`);
        if (!Array.isArray(t.tags)) errors.push(`Task[${i}] tags must be array`);
    });
    return { isValid: errors.length === 0, errors };
}

export const aiService = {
    async generateTasks(workspaceId: string, prompt: string, userId: string) {
        // Rate limit: 10 requests per workspace per hour
        const rateLimitKey = `ai:ratelimit:${workspaceId}`;
        const count = await redis.incr(rateLimitKey);
        if (count === 1) await redis.expire(rateLimitKey, 3600);
        if (count > 10) {
            throw new UserInputError('AI generation rate limit exceeded. Try again in an hour.');
        }

        const wsRepo = AppDataSource.getRepository(Workspace);
        const workspace = await wsRepo.findOne({ where: { id: workspaceId } });
        if (!workspace) throw new NotFoundError('Workspace not found');

        const existingTasks = await AppDataSource.getRepository(Task)
            .createQueryBuilder('t')
            .select('t.title')
            .where('t.workspaceId = :workspaceId', { workspaceId })
            .limit(20)
            .getMany();

        const systemPrompt = `You are a project management assistant for the workspace "${workspace.name}".
Generate a structured list of actionable tasks based on the user's project goal.
${existingTasks.length > 0 ? `Existing tasks: ${existingTasks.map((t) => t.title).join(', ')}` : ''}
Return ONLY valid JSON with this structure:
{
  "tasks": [
    {
      "title": "string (max 200 chars)",
      "description": "string",
      "priority": "CRITICAL|HIGH|MEDIUM|LOW",
      "estimatedHours": number,
      "tags": ["string"]
    }
  ]
}
Generate between 3-15 tasks. Do not include markdown, only JSON.`;

        const promptRepo = AppDataSource.getRepository(AIPromptRecord);
        const record = promptRepo.create({
            workspaceId,
            requestedById: userId,
            prompt,
            model: 'gpt-4o',
            status: 'PENDING',
        });
        await promptRepo.save(record);

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                response_format: { type: 'json_object' },
                max_tokens: 4096,
                temperature: 0.3,
            });

            const rawContent = response.choices[0].message.content ?? '{"tasks":[]}';
            const parsed = JSON.parse(rawContent) as { tasks: ParsedTask[] };
            const validation = validateGeneratedTasks(parsed.tasks || []);

            if (!validation.isValid) {
                throw new AIGenerationError(`Invalid task structure: ${validation.errors.join(', ')}`);
            }

            const tasksToCreate = (parsed.tasks || []).slice(0, 50);

            const inputs: CreateTaskInput[] = tasksToCreate.map((t) => ({
                workspaceId,
                title: t.title,
                description: t.description,
                priority: t.priority,
                estimatedHours: t.estimatedHours,
                tags: t.tags,
                aiGenerated: true,
                aiPromptId: record.id,
                creatorId: userId,
            }));

            const tasks = await taskService.bulkCreateTasks(inputs, workspaceId);

            record.status = 'SUCCESS';
            record.tokensPrompt = response.usage?.prompt_tokens ?? 0;
            record.tokensCompletion = response.usage?.completion_tokens ?? 0;
            record.tasksGenerated = tasks.length;
            await promptRepo.save(record);

            return {
                tasks,
                tokensUsed: response.usage?.total_tokens ?? 0,
                model: 'gpt-4o',
                promptSummary: prompt.slice(0, 200),
            };
        } catch (err: any) {
            record.status = 'FAILED';
            record.errorMessage = err.message;
            await promptRepo.save(record);
            throw err;
        }
    },
};
