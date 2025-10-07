import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MailModule } from 'src/common/mail/mail.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
         MailModule
    ],
    providers: [UserService],
    controllers: [UserController],
    exports: [UserService]
})
export class UsersModule { }