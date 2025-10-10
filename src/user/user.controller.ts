import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiBadRequestResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/auth/AuthGuard';
import { Request } from 'express';
import { userPayloadType } from 'src/common/types/auth.types';

@ApiTags('Users')
@Controller('user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }
    /*
     Get user profile
     */
    @ApiOperation({ summary: 'Get user profile' })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
    })
    @ApiBadRequestResponse({
        description: 'User not found',
    })
    @Get()
    async getProfile(@Req() req: Request) {
        const user = req['user'] as userPayloadType;
        const userProfile = await this.userService.getUserProfile(user.email);
        return {
            success: true,
            message: 'User profile retrieved successfully',
            data: userProfile,
        };
    }

    //get all users
    @Get('all')
    async getAllUsers() {
        const users = await this.userService.findAll();
        return {
            success: true,
            message: 'Users retrieved successfully',
            data: users,
        };
    }
}
