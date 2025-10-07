import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from 'src/project/entities/project.entity';
import { Task } from 'src/task/entities/task.entity';
import { User } from 'src/user/entity/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Project,
            Task
        ]),
    ],
    exports: [TypeOrmModule], // Export so other modules can inject repositories
})
export class PersistenceModule { }
