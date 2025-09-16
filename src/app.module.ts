
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/user.module';
import { AppConfigModule } from './common/config/config.module';
import { DatabaseModule } from './database/database.module';
import { JwtmoduleModule } from './common/jwtmodule/jwtmodule.module';
import { ProjectModule } from './project/project.module';

@Module({
  imports: [
    DatabaseModule, UsersModule, AuthModule, AppConfigModule, JwtmoduleModule, ProjectModule
  ],
  providers: [],
})
export class AppModule { }
