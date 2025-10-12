import { DataSource } from 'typeorm';
import { Task } from 'src/task/entities/task.entity';
import { User } from 'src/user/entity/user.entity';
import { Project } from 'src/project/entities/project.entity';
import { TaskPriority } from 'src/common/enums/task-priority.enum';
import { TaskStatus } from 'src/common/enums/task-status.enum';

export async function TaskSeeder(dataSource: DataSource) {
    const taskRepo = dataSource.getRepository(Task);
    const userRepo = dataSource.getRepository(User);
    const projectRepo = dataSource.getRepository(Project);

    // Find seeded member and project
    const member = await userRepo.findOne({ where: { email: 'member@taskmind.com' } });
    const project = await projectRepo.findOne({ where: { name: 'Initial Project' } });

    if (!member || !project) {
        console.log('Skipping TaskSeeder — missing member or project.');
        return;
    }

    // Check if already exists
    const existing = await taskRepo.findOne({ where: { sNo: 1 } });
    if (existing) {
        console.log('Task already exists, skipping.');
        return;
    }

    // Create and save task
    const task = taskRepo.create({
        sNo: 1,
        title: 'Set up project structure',
        description: 'Initialize backend modules and environment setup.',
        priority: TaskPriority.HIGH,
        status: TaskStatus.ASSIGNED,
        assignedTo: member,
        project: project,
        assets: [],
        assignedAt: new Date(),
        deadline: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
    });

    await taskRepo.save(task);
    console.log('Task seeded successfully and linked to project + member.');
}
