import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { UserRegisterDto } from 'src/auth/dto/UserRegisterDto';
import * as bcrypt from 'bcrypt';
import { changePasswordDto } from 'src/auth/dto/ChangePasswordDto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async register(userData: UserRegisterDto) {
        const existingUser = await this.findOneByEmail(userData.email);
        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const newUser = this.usersRepository.create({
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            accessTokens: [], // initialize empty token list
        });

        return await this.usersRepository.save(newUser);
    }

    async findAll() {
        return this.usersRepository.find();
    }

    async findOneById(id: string) {
        return this.usersRepository.findOne({ where: { id } });
    }

    async findOneByEmail(email: string) {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findCompleteProfileByEmail(email: string) {
        return this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .addSelect('user.accessTokens')
            .where('user.email = :email', { email })
            .getOne();
    }

    // ✅ Add token to user's token array
    async addAccessToken(email: string, newToken: string) {
        const user = await this.findCompleteProfileByEmail(email);
        if (!user) throw new BadRequestException('User not found');

        user.accessTokens = [...(user.accessTokens || []), newToken];
        await this.usersRepository.save(user);
    }

    // ✅ Remove a specific token (logout from one device)
    async removeAccessToken(email: string, tokenToRemove: string) {
        const user = await this.findCompleteProfileByEmail(email);
        if (!user) throw new BadRequestException('User not found');

        user.accessTokens = (user.accessTokens || []).filter(
            token => token !== tokenToRemove,
        );
        await this.usersRepository.save(user);
    }

    // ✅ Optional: remove all tokens (logout from all devices)
    async removeAllAccessTokens(email: string) {
        await this.usersRepository.update({ email }, { accessTokens: [] });
    }

    async getUserProfile(email: string) {
        const user = await this.findOneByEmail(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        return user;
    }

    async changePassword(email: string, body: changePasswordDto) {
        const user = await this.findCompleteProfileByEmail(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (body.newPassword !== body.confirmNewPassword) {
            throw new BadRequestException(
                'New password and confirm password do not match',
            );
        }

        const isOldPasswordValid = await bcrypt.compare(
            body.oldPassword,
            user.password,
        );
        if (!isOldPasswordValid) {
            throw new BadRequestException('Old password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(body.newPassword, 10);
        user.password = hashedPassword;
        user.accessTokens = []; // logout from all devices after password change

        try {
            return await this.usersRepository.save(user);
        } catch (error) {
            throw new InternalServerErrorException('Failed to change password');
        }
    }
}
