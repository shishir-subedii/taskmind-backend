import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/entity/user.entity';
import { UserRole } from 'src/common/enums/auth-roles.enum';

export async function SuperAdminSeeder(dataSource: DataSource) {
    const userRepository = dataSource.getRepository(User);

    const existing = await userRepository.findOne({ where: { email: 'superadmin@taskmind.com' } });

    if (!existing) {
        const hashedPassword = await bcrypt.hash('securePassword123', 10);

        await userRepository.save(
            userRepository.create({
                name: 'Super Admin',
                email: 'superadmin@taskmind.com',
                password: hashedPassword,
                accessTokens: [],
                role: UserRole.SUPERADMIN,
            }),
        );

        console.log('SuperAdmin user seeded');
    } else {
        console.log('SuperAdmin user already exists');
    }
}
