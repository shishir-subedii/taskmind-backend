
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/user.module';
import { AppConfigModule } from './common/config/config.module';
import { DatabaseModule } from './database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtmoduleModule } from './common/jwtmodule/jwtmodule.module';

@Module({
  imports: [
    DatabaseModule, UsersModule, AuthModule, AppConfigModule, JwtmoduleModule
  ],
  providers: [],
})
export class AppModule { }
