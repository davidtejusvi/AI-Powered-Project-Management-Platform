import { AppDataSource } from '../data-source';
import { Notification } from '../entities/Notification';
import { NotificationType } from '../types';
import { pubsub } from './task.service';

export const notificationService = {
    async send(
        userId: string,
        type: NotificationType,
        title: string,
        body: string,
        metadata: Record<string, unknown> = {},
        actionUrl?: string,
    ): Promise<Notification> {
        const repo = AppDataSource.getRepository(Notification);
        const notification = repo.create({ userId, type, title, body, metadata, actionUrl });
        const saved = await repo.save(notification);
        pubsub.publish(`NOTIFICATION_${userId}`, { notificationReceived: saved });
        return saved;
    },

    async list(userId: string, unreadOnly = false): Promise<Notification[]> {
        const qb = AppDataSource.getRepository(Notification)
            .createQueryBuilder('n')
            .where('n.userId = :userId', { userId });
        if (unreadOnly) qb.andWhere('n.isRead = false');
        return qb.orderBy('n.createdAt', 'DESC').limit(50).getMany();
    },

    async markRead(id: string, userId: string): Promise<Notification> {
        const repo = AppDataSource.getRepository(Notification);
        const n = await repo.findOne({ where: { id, userId } });
        if (!n) throw new Error('Notification not found');
        n.isRead = true;
        return repo.save(n);
    },
};
