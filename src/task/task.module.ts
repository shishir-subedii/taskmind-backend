import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { MailModule } from 'src/common/mail/mail.module';
import { MailQueueModule } from 'src/common/mail/queue/mail.queue.module';

@Module({
  imports: [MailModule, MailQueueModule],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
