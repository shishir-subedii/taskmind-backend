import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [UsersModule, JwtModule.register({}) //We can remove JWT module config because there is a global JwtModule in src/common/jwtmodule/jwtmodule.module.ts
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
