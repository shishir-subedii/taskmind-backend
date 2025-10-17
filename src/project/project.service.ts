import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from 'src/user/entity/user.entity';
import { UserRole } from 'src/common/enums/auth-roles.enum';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async create(dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      deadline: dto.deadline ?? null,
      assets: dto.assets ?? null,
    });

    if (dto.managerEmail) {
      const manager = await this.userRepo.findOne({ where: { email: dto.managerEmail } });
      if (!manager) throw new NotFoundException(`Manager not found`);
      project.manager = manager;
    }

    if (dto.teamMemberIds?.length) {
      const teamMembers = await this.userRepo.findBy({ id: In(dto.teamMemberIds) });
      project.teamMembers = teamMembers;
    }

    return this.projectRepo.save(project);
  }

  findAll(): Promise<Project[]> {
    return this.projectRepo.find({
      relations: ['manager', 'teamMembers', 'tasks'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMyProjects(userId: string): Promise<Project[]> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.MANAGER) {
      return this.projectRepo.find({
        where: { manager: { id: user.id } },
        relations: ['manager', 'teamMembers', 'tasks'],
        order: { createdAt: 'DESC' },
      });
    }

    if (user.role === UserRole.MEMBER) {
      return this.projectRepo
        .createQueryBuilder('project')
        .leftJoinAndSelect('project.manager', 'manager')
        .leftJoinAndSelect('project.teamMembers', 'teamMember')
        .leftJoinAndSelect('project.tasks', 'task')
        .where('teamMember.id = :userId', { userId: user.id })
        .orderBy('project.createdAt', 'DESC')
        .getMany();
    }

    return [];
  }


  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['manager', 'teamMembers', 'tasks'],
    });
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    if (dto.managerEmail) {
      const manager = await this.userRepo.findOne({ where: { email: dto.managerEmail } });
      if (!manager) throw new NotFoundException(`Manager not found`);
      project.manager = manager;
    }

    if (dto.teamMemberIds) {
      const members = await this.userRepo.findBy({ id: In(dto.teamMemberIds) });
      project.teamMembers = members;
    }

    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  async remove(id: string): Promise<{ message: string }> {
    const project = await this.findOne(id);
    await this.projectRepo.remove(project);
    return { message: `Project ${project.name} deleted successfully.` };
  }


  async assignManager(projectId: string, managerEmail: string) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const user = await this.userRepo.findOne({ where: { email: managerEmail } });
    if (!user) throw new NotFoundException('User not found');
    user.role = UserRole.MANAGER;
    await this.userRepo.save(user);

    project.manager = user;
    return this.projectRepo.save(project);
  }

  async addMember(projectId: string, memberEmail: string) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['teamMembers'], // must load teamMembers to modify
    });
    if (!project) throw new NotFoundException('Project not found');

    const user = await this.userRepo.findOne({ where: { email: memberEmail } });
    if (!user) throw new NotFoundException('User not found');

    // Prevent duplicate additions
    const alreadyMember = project.teamMembers?.some((m) => m.id === user.id);
    if (alreadyMember) {
      throw new BadRequestException('User is already a team member');
    }

    // Add to array and save
    project.teamMembers = [...(project.teamMembers || []), user];
    return this.projectRepo.save(project);
  }


  async removeMember(projectId: string, memberId: string) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['teamMembers'], // must load teamMembers to modify
    });
    if (!project) throw new NotFoundException('Project not found');
    const user = await this.userRepo.findOne({ where: { id: memberId } });
    if (!user) throw new NotFoundException('User not found');
    const isMember = project.teamMembers?.some((m) => m.id === user.id);
    if (!isMember) {
      throw new BadRequestException('User is not a team member');
    }
    project.teamMembers = project.teamMembers.filter((m) => m.id !== user.id);
    return this.projectRepo.save(project);
  }

  //find members of a project
  async findMembers(projectId: string): Promise<User[]> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['teamMembers'],
    });
    if (!project) throw new NotFoundException('Project not found');
    return project.teamMembers; 
  }
}
