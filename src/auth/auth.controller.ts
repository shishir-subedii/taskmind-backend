import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiBadRequestResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UserRegisterDto } from './dto/UserRegisterDto';
import { UserLoginDto } from './dto/UserLoginDto';
import { JwtAuthGuard } from 'src/common/auth/AuthGuard';
import { changePasswordDto } from './dto/ChangePasswordDto';
import { userPayloadType } from 'src/common/types/auth.types';
import { LogOutAllDto } from './dto/LogoutAll.Dto';
import { changeEmailSuperadminDto, changePasswordSuperadminDto, deleteUserDto } from './dto/SuperAdminAuth.Dto';
import { Roles } from 'src/common/auth/AuthRoles';
import { UserRole } from 'src/common/enums/auth-roles.enum';

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPERADMIN) // only superadmin can create new users
  async register(@Body() userData: UserRegisterDto) {
    const user = await this.authService.register(userData);
    return {
      success: true,
      message: 'Registration successful',
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
  Logout from all sessions 
  Take password in body and token in header
  */
  @Patch('logout-all')
  @ApiOperation({ summary: 'Logout user from all sessions' })
  @ApiBearerAuth()
  @ApiBadRequestResponse({
    description: 'User not found',
  })
  @ApiBody({
    type: LogOutAllDto,
  })
  @UseGuards(JwtAuthGuard)
  async logoutAll(@Req() req: Request, @Body() body: LogOutAllDto) {
    const user = req['user'] as userPayloadType;
    await this.authService.logoutAllSessions(user.email, body.password);
    return {
      success: true,
      message: 'User logged out from all sessions successfully',
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
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req: Request, @Body() body: changePasswordDto) {
    const user = req['user'] as userPayloadType;
    const updatedUser = await this.authService.changePassword(user.email, body);
    return {
      // success: true,
      message: 'Password changed successfully',
      data: updatedUser,
    };
  }


  //change password for superadmin without old password
  @ApiOperation({ summary: 'Change user password by superadmin' })
  @ApiResponse({
    status: 200,
    description: 'User password changed successfully',
  })
  @ApiBearerAuth()
  @ApiBadRequestResponse({
    description: 'User not found',
  })
  @ApiBody({
    type: changePasswordSuperadminDto
  })
  @Patch('change-password-by-superadmin')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN)
  async changePasswordBySuperAdmin(@Body() body: changePasswordSuperadminDto) {
    const updatedUser = await this.authService.changePasswordBySuperAdmin(body.email, body.newPassword);
    return {
      success: true,
      message: 'Password changed successfully by superadmin',
      data: updatedUser,
    };
  }

  //change email for superadmin
  @ApiOperation({ summary: 'Change user email by superadmin' })
  @ApiResponse({
    status: 200,
    description: 'User email changed successfully',
  })
  @ApiBearerAuth()
  @ApiBadRequestResponse({
    description: 'User not found',
  })
  @ApiBody({
    type: changeEmailSuperadminDto
  })
  @Patch('change-email-by-superadmin')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN)
  async changeEmailBySuperAdmin(@Body() body: changeEmailSuperadminDto) {
    const updatedUser = await this.authService.changeEmail(body.oldEmail, body.newEmail);
    return {
      // success: true,
      message: 'Email changed successfully by superadmin',
      data: updatedUser,
    };
  }

  //delete user by superadmin
  @ApiOperation({ summary: 'Delete user by superadmin' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiBearerAuth()
  @ApiBadRequestResponse({
    description: 'User not found',
  })
  @ApiBody({
    type: deleteUserDto
  })
  @Delete('delete-user-by-superadmin')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN)
  async deleteUserBySuperAdmin(@Body() body: deleteUserDto) {
    const result = await this.authService.deleteUser(body.email);
    return {
      success: true,
      message: 'User deleted successfully by superadmin',
      data: result,
    };
  }
}