import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class changePasswordSuperadminDto {
    @ApiProperty({example: 'email@gmail.com'})
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'newPassword123' })
    @IsString()
    newPassword: string;
}

export class changeEmailSuperadminDto {
    @ApiProperty({example: 'email@gmail.com'})
    @IsEmail()
    oldEmail: string;

    @ApiProperty({example: 'newemail@gmail.com'})
    @IsEmail()
    newEmail: string;
}

export class deleteUserDto {
    @ApiProperty({example: 'email@gmail.com'})
    @IsEmail()
    email: string;
}