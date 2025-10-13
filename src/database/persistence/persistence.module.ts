import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from 'src/project/entities/project.entity';
import { Task } from 'src/task/entities/task.entity';
import { User } from 'src/user/entity/user.entity';
import { Notification } from 'src/notification/entities/notification.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Project,
            Task,
            Notification,
        ]),
    ],
    exports: [TypeOrmModule], // Export so other modules can inject repositories
})
export class PersistenceModule { }
