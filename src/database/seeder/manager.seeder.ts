import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/entity/user.entity';
import { UserRole } from 'src/common/enums/auth-roles.enum';

export async function ManagerSeeder(dataSource: DataSource) {
    const userRepository = dataSource.getRepository(User);

    const existing = await userRepository.findOne({ where: { email: 'manager@taskmind.com' } });

    if (!existing) {
        const hashedPassword = await bcrypt.hash('securePassword123', 10);

        await userRepository.save(
            userRepository.create({
                // id: '23b1f1d4-8c3a-4e2b-9f1e-123456789abc',
                name: 'Manager',
                email: 'manager@taskmind.com',
                password: hashedPassword,
                accessTokens: [],
                role: UserRole.MANAGER,
            }),
        );

        console.log('manager user seeded');
    } else {
        console.log('manager user already exists');
    }
}
