import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from 'src/user/entity/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) { }

  async createNotification(user: User, message?: string) {
    const notification = this.notificationRepo.create({ user, message });
    return this.notificationRepo.save(notification);
  }

  async findUserNotifications(userId: string) {
    return this.notificationRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepo.findOne({ where: { id: notificationId, user: { id: userId } } });
    if (!notification) throw new Error('Notification not found');
    notification.read = true;
    return this.notificationRepo.save(notification);
  }
}
