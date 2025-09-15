import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiBadRequestResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UserRegisterDto } from './dto/UserRegisterDto';
import { UserLoginDto } from './dto/UserLoginDto';
import { JwtAuthGuard } from 'src/common/auth/AuthGuard';
import { Roles } from 'src/common/auth/AuthRoles';
import { changePasswordDto } from './dto/ChangePasswordDto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /*
  Register new user
  */

  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({
    status: 201,
    description: 'New user created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Password and Confirm Password donot match',
  })
  @ApiBadRequestResponse({
    description: 'Email is already in use',
  })
  @ApiBody({
    type: UserRegisterDto,
  })
  @Post('register')
  async register(@Body() userData: UserRegisterDto) {
    const user = await this.authService.register(userData);
    return {
      // success: true,
      message: 'User registered successfully',
      data: user,
    };
  }

  /*
  Login user 
  */
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
  })
  @ApiBadRequestResponse({
    description: 'User not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid password',
  })
  @ApiBody({
    type: UserLoginDto,
  })
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginData: UserLoginDto) {
    const responseData = await this.authService.login(loginData);
    return {
      // success: true,
      message: 'Login successful',
      data: responseData
    };
  }
  /*
  Logout
  */
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully',
  })
  @ApiBearerAuth()
  @ApiBadRequestResponse({
    description: 'User not found',
  })
  @Get('logout')
  @UseGuards(JwtAuthGuard)
  @Roles('user', 'admin')
  async logout(@Req() req: Request) {
    const user = req['user'] as { email: string };
    const token = req.headers['authorization']?.split(' ')[1]; // Extract Bearer token

    if (!token) {
      return {
        success: false,
        message: 'Authorization token not found',
      };
    }

    await this.authService.logout(user.email, token);

    return {
      // success: true,
      message: 'User logged out successfully',
    };
  }

  /*
  Change user password
  */
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'User password changed successfully',
  })
  @ApiBearerAuth()
  @ApiBadRequestResponse({
    description: 'User not found',
  })
  @ApiBadRequestResponse({
    description: 'Old password is incorrect',
  })
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @Roles('user', 'admin')
  async changePassword(@Req() req: Request, @Body() body: changePasswordDto) {
    const user = req['user'] as { email: string };
    const updatedUser = await this.authService.changePassword(user.email, body);
    return {
      // success: true,
      message: 'Password changed successfully',
      data: updatedUser,
    };
  }

}

