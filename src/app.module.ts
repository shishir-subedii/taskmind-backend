
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/user.module';
import { AppConfigModule } from './common/config/config.module';
import { DatabaseModule } from './database/database.module';
import { JwtmoduleModule } from './common/jwtmodule/jwtmodule.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ProjectModule } from './project/project.module';
import { CoreModule } from './common/core/core.module';
import { TaskModule } from './task/task.module';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: configService.get<number>('RATE_LIMIT_TTL', 60000),
            limit: configService.get<number>('RATE_LIMIT_MAX', 70),
          },
        ],
      }),
    }),
    DatabaseModule,
    UsersModule,
    CoreModule,
    AuthModule,
    AppConfigModule,
    JwtmoduleModule,
    FileUploadModule,
    ProjectModule,
    TaskModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // add throttler guard globally
    },
  ],
})
export class AppModule { }
