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
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TaskService {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(Project)
        private readonly projectRepo: Repository<Project>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectQueue('mail-queue') private readonly mailQueue: Queue,
    ) { }

    // Utility: Fetch user or fail
    private async getUserOrFail(userId: string): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    // Utility: Fetch project or fail
    private async getProjectOrFail(projectId: string): Promise<Project> {
        const project = await this.projectRepo.findOne({
            where: { id: projectId },
            relations: ['manager', 'teamMembers'],
        });
        if (!project) throw new NotFoundException('Project not found');
        return project;
    }

    // Utility: Verify if user has allowed role(s)
    private verifyRole(user: User, allowedRoles: UserRole[]) {
        if (!allowedRoles.includes(user.role)) {
            throw new ForbiddenException(
                `Access denied. Allowed roles: ${allowedRoles.join(', ')}`,
            );
        }
    }

    // Utility: Verify if user is manager of a project
    private verifyManagerOfProject(user: User, project: Project) {
        if (project.manager?.id !== user.id) {
            throw new ForbiddenException('You are not the manager of this project');
        }
    }

    // Utility: Verify if user is a member of a project
    private verifyMemberOfProject(user: User, project: Project) {
        const isMember = project.teamMembers.some((m) => m.id === user.id);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this project');
        }
    }

    // Utility: Verify if user is a Manager or SuperAdmin
    private verifyManagerOrSuperAdmin(user: User) {
        if (![UserRole.MANAGER, UserRole.SUPERADMIN].includes(user.role)) {
            throw new ForbiddenException('Only Manager or SuperAdmin can perform this action');
        }
    }

    // Create Task
    async create(dto: CreateTaskDto, userId: string) {
        const user = await this.getUserOrFail(userId);
        this.verifyManagerOrSuperAdmin(user);

        const project = await this.getProjectOrFail(dto.projectId);
        console.log("Project fetched:", project);

        if (user.role === UserRole.MANAGER) {
            this.verifyManagerOfProject(user, project);
        }

        let assignedUser: User | null = null;
        if (dto.assignedToId) {
            assignedUser = await this.getUserOrFail(dto.assignedToId);
            this.verifyMemberOfProject(assignedUser, project);
        }
        console.log("Assigned User:", assignedUser);

        const task = this.taskRepo.create({
            sNo: dto.sNo,
            title: dto.title,
            description: dto.description,
            project,
            assets: dto.assets ?? [],
            assignedTo: assignedUser ?? null,
            assignedAt: assignedUser ? new Date() : null,
            deadline: dto.deadline ? new Date(dto.deadline) : null,
        });

        if (assignedUser) {
            // Enqueue email job
            await this.mailQueue.add('send-task-assignment-email', {
                userEmail: assignedUser.email,
                subject: `Task Assigned: ${task.title}`,
                content: `You have been assigned a new task: ${task.title}. Please check your dashboard for more details.`,
            });
        }

        return this.taskRepo.save(task);
    }

    // Find all tasks
    async findAll() {
        return this.taskRepo.find({
            relations: ['project', 'assignedTo'],
            order: { createdAt: 'DESC' },
        });
    }

    // Find one task
    async findOne(id: string) {
        const task = await this.taskRepo.findOne({
            where: { id },
            relations: ['project', 'assignedTo'],
        });
        if (!task) throw new NotFoundException('Task not found');
        return task;
    }

    //add multiple tasks. 
    async createMultiple(dtos: CreateTaskDto[], userId: string) {
        const user = await this.getUserOrFail(userId);
        this.verifyManagerOrSuperAdmin(user);
        const tasks: Task[] = [];

        for (const dto of dtos) {
            const project = await this.getProjectOrFail(dto.projectId);
            if (user.role === UserRole.MANAGER) {
                this.verifyManagerOfProject(user, project);
            }
            let assignedUser: User | null = null;
            if (dto.assignedToId) {
                assignedUser = await this.getUserOrFail(dto.assignedToId);
                this.verifyMemberOfProject(assignedUser, project);
            }
            const task = this.taskRepo.create({
                sNo: dto.sNo,
                title: dto.title,
                description: dto.description,
                project,
                assets: dto.assets ?? [],
                assignedTo: assignedUser ?? null,
                assignedAt: assignedUser ? new Date() : null,
                deadline: dto.deadline ? new Date(dto.deadline) : null,
            });
            tasks.push(task);
        }
        return this.taskRepo.save(tasks);
    }

    // Update Task
    async update(id: string, dto: UpdateTaskDto, userId: string) {
        const task = await this.findOne(id);
        const user = await this.getUserOrFail(userId);

        if (user.role === UserRole.MEMBER && task.assignedTo?.id !== userId) {
            throw new ForbiddenException('Members cannot update tasks not assigned to them');
        }

        if (user.role === UserRole.MANAGER && task.project) {
            const project = await this.getProjectOrFail(task.project.id);
            this.verifyManagerOfProject(user, project);
        }

        Object.assign(task, dto);

        if (dto.assignedToId) {
            const newAssignedUser = await this.getUserOrFail(dto.assignedToId);
            this.verifyMemberOfProject(newAssignedUser, task.project);
            task.assignedTo = newAssignedUser;
            task.assignedAt = new Date();
        }

        if (dto.projectId) {
            const newProject = await this.getProjectOrFail(dto.projectId);
            task.project = newProject;
        }

        return this.taskRepo.save(task);
    }

    // Remove Task
    async remove(id: string, userId: string) {
        const task = await this.findOne(id);
        const user = await this.getUserOrFail(userId);
        this.verifyManagerOrSuperAdmin(user);

        if (user.role === UserRole.MANAGER && task.project) {
            const project = await this.getProjectOrFail(task.project.id);
            this.verifyManagerOfProject(user, project);
        }

        await this.taskRepo.remove(task);
    }

    // Find tasks by project
    async findByProject(projectId: string, userId: string) {
        const project = await this.getProjectOrFail(projectId);
        const user = await this.getUserOrFail(userId);

        if (user.role === UserRole.MANAGER) this.verifyManagerOfProject(user, project);
        if (user.role === UserRole.MEMBER) this.verifyMemberOfProject(user, project);

        return this.taskRepo.find({
            where: { project },
            relations: ['project', 'assignedTo'],
        });
    }

    // Find tasks by assigned user
    async findByUser(userId: string) {
        const user = await this.getUserOrFail(userId);
        const data = await this.taskRepo.find({
            where: { assignedTo: {id: user.id} },
            relations: ['project', 'assignedTo'],
        });
        return data;
    }

    // Find tasks by status
    async findByStatus(status: TaskStatus) {
        return this.taskRepo.find({
            where: { status },
            relations: ['project', 'assignedTo'],
        });
    }

    // Find tasks by user and status
    async findByUserAndStatus(userId: string, status: TaskStatus) {
        const user = await this.getUserOrFail(userId);
        return this.taskRepo.find({
            where: { assignedTo: user, status },
            relations: ['project', 'assignedTo'],
        });
    }

    // Find tasks by project and user
    async findByProjectAndUser(projectId: string, userId: string) {
        const project = await this.getProjectOrFail(projectId);
        const user = await this.getUserOrFail(userId);
        this.verifyMemberOfProject(user, project);

        return this.taskRepo.find({
            where: { project, assignedTo: user },
            relations: ['project', 'assignedTo'],
        });
    }

    // Clock In
    async clockIn(id: string, userId: string) {
        const task = await this.taskRepo.findOne({
            where: { id, assignedTo: { id: userId } },
            relations: ['assignedTo'],
        });
        if (!task) throw new NotFoundException('Task not found or not assigned to this user');
        task.clockIn = new Date();
        return this.taskRepo.save(task);
    }

    // Clock Out
    async clockOut(id: string, userId: string) {
        const task = await this.taskRepo.findOne({
            where: { id, assignedTo: { id: userId } },
            relations: ['assignedTo'],
        });
        if (!task) throw new NotFoundException('Task not found or not assigned to this user');
        task.clockOut = new Date();
        return this.taskRepo.save(task);
    }

    // Change Task Status
    async changeStatus(id: string, status: TaskStatus, userId: string) {
        const user = await this.getUserOrFail(userId);
        const task = await this.taskRepo.findOne({
            where: { id },
            relations: ['assignedTo', 'project', 'project.manager'],
        });
        if (!task) throw new NotFoundException('Task not found');

        if (user.role === UserRole.MEMBER) {
            if (!task.assignedTo || task.assignedTo.id !== userId) {
                throw new ForbiddenException('You are not allowed to update this task status');
            }
            if (status !== TaskStatus.SUBMITTED) {
                throw new ForbiddenException("Members can only mark their tasks as 'SUBMITTED'");
            }
            task.status = status;
            return this.taskRepo.save(task);
        }

        if (user.role === UserRole.MANAGER) {
            if (!task.project || !task.project.manager || task.project.manager.id !== userId) {
                throw new ForbiddenException('You are not the manager of this project');
            }
            task.status = status;
            return this.taskRepo.save(task);
        }

        if (user.role === UserRole.SUPERADMIN) {
            task.status = status;
            return this.taskRepo.save(task);
        }

        throw new ForbiddenException('You are not authorized to perform this action');
    }
}
