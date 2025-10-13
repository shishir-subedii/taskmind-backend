import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from '../mail.service';

@Processor('mail-queue')
export class MailQueueProcessor extends WorkerHost {
    constructor(private readonly mailService: MailService) {
        super();
    }

    async process(job: Job<any>) {
        switch (job.name) {
            case 'send-task-assignment-email':
                const { userEmail, subject, content } = job.data;
                await this.mailService.sendCustomMail(userEmail, subject, content);
                break;

            default:
                console.warn(`No processor defined for job name: ${job.name}`);
                break;
        }
    }
}
