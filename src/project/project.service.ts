import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from 'src/user/entity/user.entity';

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

    if (dto.managerId) {
      const manager = await this.userRepo.findOne({ where: { id: dto.managerId } });
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

    if (dto.managerId) {
      const manager = await this.userRepo.findOne({ where: { id: dto.managerId } });
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


  async assignManager(projectId: string, managerId: string) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const user = await this.userRepo.findOne({ where: { id: managerId } });
    if (!user) throw new NotFoundException('User not found');

    project.manager = user;
    return this.projectRepo.save(project);
  }

  async addMember(projectId: string, memberId: string) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['teamMembers'], // must load teamMembers to modify
    });
    if (!project) throw new NotFoundException('Project not found');

    const user = await this.userRepo.findOne({ where: { id: memberId } });
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
}
