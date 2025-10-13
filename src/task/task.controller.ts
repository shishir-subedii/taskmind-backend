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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from 'src/common/auth/AuthGuard';
import { Roles } from 'src/common/auth/AuthRoles';
import { UserRole } from 'src/common/enums/auth-roles.enum';
import { TaskStatus } from 'src/common/enums/task-status.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Tasks')
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @Post('create/:projectId/with-ai')
  @ApiOperation({ summary: 'Extract tasks from manager text and create them' })
  @ApiParam({ name: 'projectId', description: 'UUID of the project' })
  @ApiBody({
    description: 'Text from manager describing tasks',
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', example: 'Today John will work on login page...' },
      },
      required: ['text'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Tasks created successfully',
    type: [CreateTaskDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden. User is not manager.' })
  @UseGuards(JwtAuthGuard) // protect this endpoint
  async extractAndCreateTasks(
    @Param('projectId') projectId: string,
    @Body('text') text: string,
    @Req() req,
  ) {
    const res = await this.taskService.extractAndCreateTasks(text, projectId, req.user.id);
    return {
      success: true,
      message: 'Tasks created successfully',
      data: res,
    };
  }

  // Create a new task (Manager / SuperAdmin only)
  @Roles(UserRole.MANAGER, UserRole.SUPERADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 404, description: 'Project or assigned user not found' })
  async create(@Body() dto: CreateTaskDto, @Req() req) {
    const userId = req.user.id;
    const data = await this.taskService.create(dto, userId);
    return {
      success: true,
      message: 'Task created successfully',
      data,
    };
  }

  // Get all tasks
  @Get()
  @ApiOperation({ summary: 'Fetch all tasks' })
  @ApiResponse({ status: 200, description: 'List of all tasks' })
  async findAll() {
    const data = await this.taskService.findAll();
    return { success: true, message: 'Tasks fetched successfully', data };
  }

  //find your tasks.
  @Get('tasks/my-tasks')
  @ApiOperation({ summary: 'Fetch tasks assigned to the logged-in user' })
  @ApiResponse({ status: 200, description: 'List of tasks assigned to the user' })
  async findMyTasks(@Req() req) {
    const userId = req.user.id;
    console.log("User ID:", userId); // Debug log
    const data = await this.taskService.findByUser(userId);
    return { success: true, message: 'Tasks fetched successfully', data };
  }

  // Get single task by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Task ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Task fetched successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.taskService.findOne(id);
    return { success: true, message: 'Task fetched successfully', data };
  }

  // Update task (Manager / SuperAdmin)
  @Roles(UserRole.MANAGER, UserRole.SUPERADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing task' })
  @ApiParam({ name: 'id', type: 'string', description: 'Task ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @Req() req) {
    const userId = req.user.id;
    const data = await this.taskService.update(id, dto, userId);
    return { success: true, message: 'Task updated successfully', data };
  }

  // Delete task (Manager / SuperAdmin)
  @Roles(UserRole.MANAGER, UserRole.SUPERADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', type: 'string', description: 'Task ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    await this.taskService.remove(id, userId);
    return { success: true, message: 'Task deleted successfully', data: null };
  }

  // Fetch tasks by project ID
  @Get('project/:projectId')
  @ApiOperation({ summary: 'Fetch tasks by project ID' })
  @ApiParam({ name: 'projectId', type: 'string', description: 'Project ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Tasks fetched successfully' })
  async findByProject(@Param('projectId') projectId: string, @Req() req) {
    const userId = req.user.id;
    const data = await this.taskService.findByProject(projectId, userId);
    return { success: true, message: 'Tasks fetched successfully', data };
  }

  // Fetch tasks by user ID
  @Get('user/:userId')
  @ApiOperation({ summary: 'Fetch tasks by assigned user ID' })
  @ApiParam({ name: 'userId', type: 'string', description: 'User ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Tasks fetched successfully' })
  async findByUser(@Param('userId') userId: string) {
    const data = await this.taskService.findByUser(userId);
    return { success: true, message: 'Tasks fetched successfully', data };
  }

  // Fetch tasks by status
  @Get('status/:status')
  @ApiOperation({ summary: 'Fetch tasks by status' })
  @ApiParam({ name: 'status', enum: TaskStatus, description: 'Task status' })
  @ApiResponse({ status: 200, description: 'Tasks fetched successfully' })
  async findByStatus(@Param('status') status: TaskStatus) {
    const data = await this.taskService.findByStatus(status);
    return { success: true, message: 'Tasks fetched successfully', data };
  }

  // Fetch tasks by user ID and status
  @Get('user/:userId/status/:status')
  @ApiOperation({ summary: 'Fetch tasks by user ID and status' })
  @ApiParam({ name: 'userId', type: 'string', description: 'User ID (UUID)' })
  @ApiParam({ name: 'status', enum: TaskStatus, description: 'Task status' })
  @ApiResponse({ status: 200, description: 'Tasks fetched successfully' })
  async findByUserAndStatus(
    @Param('userId') userId: string,
    @Param('status') status: TaskStatus,
  ) {
    const data = await this.taskService.findByUserAndStatus(userId, status);
    return { success: true, message: 'Tasks fetched successfully', data };
  }

  // Fetch tasks by project and user
  @Get('project/:projectId/user/:userId')
  @ApiOperation({ summary: 'Fetch tasks by project ID and user ID' })
  @ApiParam({ name: 'projectId', type: 'string', description: 'Project ID (UUID)' })
  @ApiParam({ name: 'userId', type: 'string', description: 'User ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Tasks fetched successfully' })
  async findByProjectAndUser(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    const data = await this.taskService.findByProjectAndUser(projectId, userId);
    return { success: true, message: 'Tasks fetched successfully', data };
  }

  // Clock in
  @Patch(':id/clock-in')
  @ApiOperation({ summary: 'Clock in to a task (assigned user only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Task ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Clock-in recorded successfully' })
  async clockIn(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    const data = await this.taskService.clockIn(id, userId);
    return { success: true, message: 'Clock-in recorded successfully', data };
  }

  // Clock out
  @Patch(':id/clock-out')
  @ApiOperation({ summary: 'Clock out of a task (assigned user only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Task ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Clock-out recorded successfully' })
  async clockOut(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    const data = await this.taskService.clockOut(id, userId);
    return { success: true, message: 'Clock-out recorded successfully', data };
  }

  // Change task status (with role-based access)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Change task status (role-based rules apply)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Task ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Task status updated successfully' })
  async changeStatus(@Param('id') id: string, @Body('status') status: TaskStatus, @Req() req) {
    const userId = req.user.id;
    const data = await this.taskService.changeStatus(id, status, userId);
    return { success: true, message: 'Task status updated successfully', data };
  }
}
