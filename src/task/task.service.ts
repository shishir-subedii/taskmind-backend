import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entity/user.entity';
import { TaskStatus } from 'src/common/enums/task-status.enum';
import { UserRole } from 'src/common/enums/auth-roles.enum';

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

    async create(dto: CreateTaskDto, userId: string) {

        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.role === UserRole.MEMBER) {
            throw new ForbiddenException('Members are not allowed to create tasks');
        }

        const findUser = await this.userRepo.findOne({
            where: { id: dto.assignedToId },
        });
        const project = await this.projectRepo.findOne({ where: { id: dto.projectId }, relations: ['manager', 'teamMembers'] });
        if (!project) throw new NotFoundException('Project not found');

        console.log(project);
        console.log(user);

        if (user.role === UserRole.MANAGER && project.manager?.id !== userId) {
            throw new ForbiddenException('You are not the manager of this project');
        }

        if (!project.teamMembers.some(member => member.id === findUser!.id)) {
            throw new ForbiddenException('User is not a member of this project');
        }

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

    async update(id: string, dto: UpdateTaskDto, userId: string) {
        const task = await this.findOne(id);

        if (task.assignedTo?.id !== userId) {
            const user = await this.userRepo.findOne({ where: { id: userId } });
            if (!user) throw new NotFoundException('User not found');
            if (user.role === UserRole.MEMBER) {
                throw new ForbiddenException('Members are not allowed to update tasks');
            }
            if (user.role === UserRole.MANAGER) {
                if (!task.project) {
                    throw new ForbiddenException('Task is not associated with any project');
                }
                const project = await this.projectRepo.findOne({ where: { id: task.project.id }, relations: ['manager'] });
                if (!project) throw new NotFoundException('Project not found');
                if (project.manager?.id !== userId) {
                    throw new ForbiddenException('You are not the manager of this project');
                }
            }
        }

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

    //fetch tasks by project id
    async findByProject(projectId: string) {
        const project = await this.projectRepo.findOne({ where: { id: projectId } });
        if (!project) throw new NotFoundException('Project not found');

        return this.taskRepo.find({
            where: { project },
            relations: ['project', 'assignedTo'],
        });
    }

    //fetch tasks by assigned user id
    async findByUser(userId: string) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        return this.taskRepo.find({
            where: { assignedTo: user },
            relations: ['project', 'assignedTo'],
        });
    }

    //fetch tasks by status
    async findByStatus(status: TaskStatus) {
        return this.taskRepo.find({
            where: { status },
            relations: ['project', 'assignedTo'],
        });
    }

    //fetch tasks by assigned user id and status
    async findByUserAndStatus(userId: string, status: TaskStatus) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        return this.taskRepo.find({
            where: { assignedTo: user, status },
            relations: ['project', 'assignedTo'],
        });
    }

    //fetch tasks by project id and user id 
    async findByProjectAndUser(projectId: string, userId: string) {
        const project = await this.projectRepo.findOne({ where: { id: projectId } });
        if (!project) throw new NotFoundException('Project not found');

        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        return this.taskRepo.find({
            where: { project, assignedTo: user },
            relations: ['project', 'assignedTo'],
        });
    }

    //clock IN
    async clockIn(id: string, userId: string) {
        const task = await this.taskRepo.findOne({
            where: { id, assignedTo: { id: userId } },
            relations: ['assignedTo'],
        });
        if (!task) throw new NotFoundException('Task not found or not assigned to this user');
        task.clockIn = new Date();
        return this.taskRepo.save(task);
    }

    //clock OUT
    async clockOut(id: string, userId: string) {
        const task = await this.taskRepo.findOne({
            where: { id, assignedTo: { id: userId } },
            relations: ['assignedTo'],
        });
        if (!task) throw new NotFoundException('Task not found or not assigned to this user');
        task.clockOut = new Date();
        return this.taskRepo.save(task);
    }

    async changeStatus(id: string, status: TaskStatus, userId: string) {
        // 1. Fetch user
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // 2. Fetch task with necessary relations
        const task = await this.taskRepo.findOne({
            where: { id },
            relations: ['assignedTo', 'project', 'project.manager'],
        });
        if (!task) throw new NotFoundException('Task not found');

        const isMember = user.role === UserRole.MEMBER;
        const isManager = user.role === UserRole.MANAGER;
        const isSuperAdmin = user.role === UserRole.SUPERADMIN;

        // 3. Member-specific rules
        if (isMember) {
            // member can only mark as SUBMITTED
            if (status !== TaskStatus.SUBMITTED) {
                throw new ForbiddenException(
                    "Members are only allowed to mark their tasks as 'SUBMITTED'.",
                );
            }

            // task must be assigned to the member
            if (!task.assignedTo || task.assignedTo.id !== userId) {
                throw new ForbiddenException(
                    'You are not allowed to update the status of this task.',
                );
            }

            task.status = status;
            return await this.taskRepo.save(task);
        }

        // 4. Manager-specific rules
        if (isManager) {
            if (!task.project || !task.project.manager || task.project.manager.id !== userId) {
                throw new ForbiddenException(
                    'You are not the manager of the project this task belongs to.',
                );
            }

            task.status = status;
            return await this.taskRepo.save(task);
        }

        // 5. SuperAdmin can change status without restriction
        if (isSuperAdmin) {
            task.status = status;
            return await this.taskRepo.save(task);
        }

        // 6. Default fallback (shouldn't reach here)
        throw new ForbiddenException('You are not authorized to perform this action.');
    }

}
