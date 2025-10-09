import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsUUID,
    IsArray,
    IsDateString,
    IsInt,
} from 'class-validator';

export class CreateTaskDto {
    @ApiProperty({
        example: 1,
        description: 'Serial number of the task within the project',
    })
    @IsInt()
    sNo: number;

    @ApiProperty({
        example: 'Design UI Wireframe',
        description: 'Name of the task',
    })
    @IsString()
    name: string;

    @ApiPropertyOptional({
        example: 'Homepage layout',
        description: 'Short title for the task',
    })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({
        example: 'Create the homepage wireframe using Figma.',
        description: 'Detailed description of the task',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        example: 'a8f8d2f0-4b3b-4e4b-8e4a-ef4cfa123456',
        description: 'UUID of the project this task belongs to',
    })
    @IsUUID()
    projectId: string;

    @ApiPropertyOptional({
        example: ['asset1.png', 'asset2.pdf'],
        description: 'Array of asset filenames or URLs related to this task',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    assets?: string[];

    @ApiPropertyOptional({
        example: 'b3a7c3a0-2c1e-4a5b-b8b5-3c22b2a51c9d',
        description: 'UUID of the user assigned to this task',
    })
    @IsOptional()
    @IsUUID()
    assignedToId?: string;

    @ApiPropertyOptional({
        example: '2025-10-20T17:00:00.000Z',
        description: 'Deadline for the task in ISO date format',
    })
    @IsOptional()
    @IsDateString()
    deadline?: string;
}
