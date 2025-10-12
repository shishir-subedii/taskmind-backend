import { DataSource } from 'typeorm';
import { User } from 'src/user/entity/user.entity';
import { Project } from 'src/project/entities/project.entity';

export async function ProjectSeeder(dataSource: DataSource) {
    const userRepository = dataSource.getRepository(User);
    const projectRepository = dataSource.getRepository(Project);

    const existing = await userRepository.findOne({ where: { email: 'manager@taskmind.com' } });


    const findMember = await userRepository.findOne({
        where: {
            email: 'member@taskmind.com'
        }
    })

    if (existing) {
        await projectRepository.save(
            projectRepository.create({
                name: 'Initial Project',
                description: 'This is the initial seeded project.',
                deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                assets: [],
                manager: existing,
                teamMembers: [
                    findMember!,
                ],
            }),
        );

        console.log('project seeded');
    } else {
        console.log('no manager user found, skipping seeding project');
    }
}
