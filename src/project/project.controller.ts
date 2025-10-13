import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { JwtAuthGuard } from 'src/common/auth/AuthGuard';
import { Roles } from 'src/common/auth/AuthRoles';
import { UserRole } from 'src/common/enums/auth-roles.enum';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  @Roles(UserRole.SUPERADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, type: Project })
  async create(@Body() dto: CreateProjectDto) {
    const res = await this.projectService.create(dto);
    return{
      success: true,
      message: 'Project created successfully',
      data: res,
    }
  }

  @Roles(UserRole.SUPERADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, type: [Project] })
  async findAll() {
    const res = await this.projectService.findAll();
    return{
      success: true,
      message: 'Projects retrieved successfully',
      data: res,
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, type: Project })
  async findOne(@Param('id') id: string) {
    const res = await  this.projectService.findOne(id);
    return{
      success: true,
      message: 'Project retrieved successfully',
      data: res,
    }
  }

  //find my projects
  @Get('projects/my-projects')
  @ApiOperation({ summary: 'Fetch my projects' })
  @ApiResponse({ status: 200, description: 'List of my projects' })
  async findMyProjects(@Req() req) {
    const res = await  this.projectService.findMyProjects(req.user.id);
    return{
      success: true,
      message: 'Projects retrieved successfully',
      data: res,
    }
  }

  @Roles(UserRole.SUPERADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, type: Project })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    const res = await this.projectService.update(id, dto);
    return{
      success: true,
      message: 'Project updated successfully',
      data: res,
    }
  }

  @Roles(UserRole.SUPERADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  async remove(@Param('id') id: string) {
    const res = await this.projectService.remove(id);
    return{
      success: true,
      message: 'Project deleted successfully',
      data: res,
    }
  }

  @Roles(UserRole.SUPERADMIN)
  @Patch(':projectId/assign-manager/:managerId')
  @ApiOperation({ summary: 'Assign a manager (user) to a project' })
  @ApiParam({ name: 'projectId', type: 'string' })
  @ApiParam({ name: 'managerId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Manager assigned successfully' })
  async assignManager(
    @Param('projectId') projectId: string,
    @Param('managerId') managerId: string,
  ) {
    const res = await this.projectService.assignManager(projectId, managerId);
    return{
      success: true,
      message: 'Manager assigned successfully',
      data: res,
    }
  }

  @Roles(UserRole.SUPERADMIN)
  @Patch(':projectId/add-member/:memberId')
  @ApiOperation({ summary: 'Add a member (user) to a project' })
  @ApiParam({ name: 'projectId', type: 'string' })
  @ApiParam({ name: 'memberId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Member added successfully' })
  async addMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    const res = await this.projectService.addMember(projectId, memberId);
    return{
      success: true,
      message: 'Member added successfully',
      data: res,
    }
  }

  @Roles(UserRole.SUPERADMIN)
  @Patch(':projectId/remove-member/:memberId')
  @ApiOperation({ summary: 'Remove a member (user) from a project' })
  @ApiParam({ name: 'projectId', type: 'string' })
  @ApiParam({ name: 'memberId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  async removeMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    const res = await this.projectService.removeMember(projectId, memberId);
    return{
      success: true,
      message: 'Member removed successfully',
      data: res,
    }
  }
}
