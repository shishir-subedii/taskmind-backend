import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiBadRequestResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/auth/AuthGuard';
import { Roles } from 'src/common/auth/AuthRoles';
import { Request } from 'express';

@Controller('user')
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
    @ApiBearerAuth()
    @ApiBadRequestResponse({
        description: 'User not found',
    })
    @Get()
    @UseGuards(JwtAuthGuard)
    @Roles('user', 'admin') 
    async getProfile(@Req() req: Request) {
        const user = req['user'] as { email: string };
        const userProfile = await this.userService.getUserProfile(user.email);
        return {
            // success: true,
            message: 'User profile retrieved successfully',
            data: userProfile,
        };
    }
}
