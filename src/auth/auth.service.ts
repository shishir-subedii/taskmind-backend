import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
} from '@nestjs/common';
import { UserRegisterDto } from './dto/UserRegisterDto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserLoginDto } from './dto/UserLoginDto';
import { changePasswordDto } from './dto/ChangePasswordDto';
import { loginResponseType } from 'src/common/types/auth.types';

@Injectable()
export class AuthService {
    constructor(
        @Inject(forwardRef(() => UserService))
        private userService: UserService,
        private jwt: JwtService
    ) { }

    async register(user: UserRegisterDto) {
        if (user.password !== user.confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }
        return await this.userService.register(user);
    }

    async login(loginData: UserLoginDto): Promise<loginResponseType> {
        const { email, password } = loginData;
        if (!email || !password) {
            throw new BadRequestException('Email and Password are required');
        }

        const user = await this.userService.findCompleteProfileByEmail(email);
        if (!user) {
            throw new BadRequestException('Invalid credentials');
        }

        if (!user.password) {
            throw new BadRequestException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException('Invalid credentials');
        }

        const { accessToken } = await this.genTokens(
            user.id.toString(),
            user.email,
            user.role,
        );

        // Add the generated token to accessTokens list
        await this.userService.addAccessToken(user.email, accessToken);

        return {
            accessToken,
            role: user.role,
        };
    }

    async logout(email: string, token: string) {
        // Remove only the current token (per-session logout)
        await this.userService.removeAccessToken(email, token);
    }

    async logoutAllSessions(email: string, password: string) {
        const user = await this.userService.findCompleteProfileByEmail(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password!);
        if (!isPasswordValid) {
            throw new BadRequestException('Invalid password');
        }

        await this.userService.removeAllAccessTokens(email);
    }


    async genTokens(id: string, email: string, role: string) {
        const accessToken = this.jwt.sign(
            { id, email, role },
            {
                secret: process.env.JWT_ACCESS_SECRET,
                expiresIn: process.env.JWT_ACCESS_EXPIRE,
            },
        );

        return { accessToken };
    }

    async changePassword(email: string, body: changePasswordDto) {
        const updatedUser = await this.userService.changePassword(email, body);
        if (!updatedUser) {
            throw new BadRequestException('User not found or password change failed');
        }
        return updatedUser;
    }

    //by superadmin
    async changeEmail(oldEmail: string, newEmail: string) {
        const updatedUser = await this.userService.changeEmail(oldEmail, newEmail);
        if (!updatedUser) {
            throw new BadRequestException('User not found or email change failed');
        }
        return updatedUser;
    }

    //by superadmin 
    async changePasswordBySuperAdmin(email: string, newPassword: string) {
        const user = await this.userService.changePasswordBySuperadmin(email, newPassword);
        if (!user) {
            throw new BadRequestException('User not found or password change failed');
        }
        return user;
    }

    //by superadmin
    async deleteUser(email: string) {
        const result = await this.userService.deleteUser(email);
        if (!result) {
            throw new BadRequestException('User not found or deletion failed');
        }
        return result;
    }

}
