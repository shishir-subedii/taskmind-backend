import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from 'src/common/auth/AuthGuard';
import { Roles } from 'src/common/auth/AuthRoles';
import { UserRole } from 'src/common/enums/auth-roles.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Tasks')
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @Roles(UserRole.MANAGER, UserRole.SUPERADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 404, description: 'Project or assigned user not found' })
  async create(@Body() dto: CreateTaskDto) {
    const data = await this.taskService.create(dto);
    return {
      success: true,
      message: 'Task created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Fetch all tasks' })
  @ApiResponse({ status: 200, description: 'List of all tasks' })
  async findAll() {
    const data = await this.taskService.findAll();
    return {
      success: true,
      message: 'Tasks fetched successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Task ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Task fetched successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.taskService.findOne(id);
    return {
      success: true,
      message: 'Task fetched successfully',
      data,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing task' })
  @ApiParam({ name: 'id', type: 'string', description: 'Task ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    const data = await this.taskService.update(id, dto);
    return {
      success: true,
      message: 'Task updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', type: 'string', description: 'Task ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(@Param('id') id: string) {
    await this.taskService.remove(id);
    return {
      success: true,
      message: 'Task deleted successfully',
      data: null,
    };
  }
}
