import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID, IsDateString } from 'class-validator';

export class CreateProjectDto {
    @ApiProperty({ example: 'AI Dashboard', description: 'Name of the project' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Building an AI-based project management system', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: '2025-12-30T23:59:59Z', required: false })
    @IsOptional()
    @IsDateString()
    deadline?: Date;

    @ApiProperty({
        example: ['https://drive.google.com/file1', 'https://drive.google.com/file2'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    assets?: string[];

    @ApiProperty({
        example: 'uuid-of-manager',
        required: false,
        description: 'Manager user ID for this project',
    })
    @IsOptional()
    @IsUUID()
    managerId?: string;

    @ApiProperty({
        example: ['uuid1', 'uuid2'],
        required: false,
        description: 'Array of user IDs for team members',
    })
    @IsOptional()
    @IsArray()
    teamMemberIds?: string[];
}
