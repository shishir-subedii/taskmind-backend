import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entity/user.entity';

@Injectable()
export class TaskService {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(Project)
        private readonly projectRepo: Repository<Project>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    async create(dto: CreateTaskDto) {
        const project = await this.projectRepo.findOne({ where: { id: dto.projectId } });
        if (!project) throw new NotFoundException('Project not found');

        const task = this.taskRepo.create({
            sNo: dto.sNo,
            name: dto.name,
            title: dto.title,
            description: dto.description,
            project,
            assets: dto.assets ?? [],
            deadline: dto.deadline ? new Date(dto.deadline) : null,
        });

        if (dto.assignedToId) {
            const user = await this.userRepo.findOne({ where: { id: dto.assignedToId } });
            if (!user) throw new NotFoundException('Assigned user not found');
            task.assignedTo = user;
            task.assignedAt = new Date();
        }

        return this.taskRepo.save(task);
    }

    async findAll() {
        return this.taskRepo.find({
            relations: ['project', 'assignedTo'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string) {
        const task = await this.taskRepo.findOne({
            where: { id },
            relations: ['project', 'assignedTo'],
        });
        if (!task) throw new NotFoundException('Task not found');
        return task;
    }

    async update(id: string, dto: UpdateTaskDto) {
        const task = await this.findOne(id);

        Object.assign(task, dto);

        if (dto.assignedToId) {
            const user = await this.userRepo.findOne({ where: { id: dto.assignedToId } });
            if (!user) throw new NotFoundException('Assigned user not found');
            task.assignedTo = user;
            task.assignedAt = new Date();
        }

        if (dto.projectId) {
            const project = await this.projectRepo.findOne({ where: { id: dto.projectId } });
            if (!project) throw new NotFoundException('Project not found');
            task.project = project;
        }

        return this.taskRepo.save(task);
    }

    async remove(id: string) {
        const task = await this.findOne(id);
        await this.taskRepo.remove(task);
    }
}
