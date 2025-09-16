// src/projects/entities/project.entity.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
// import { Team } from 'src/teams/entities/team.entity';
import { ProjectStatus } from 'src/common/enums/project-status.enum';

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: ProjectStatus,
        default: ProjectStatus.NOT_STARTED,
    })
    status: ProjectStatus;

    @Column({ type: 'timestamptz', nullable: true })
    deadline?: Date;

    // @ManyToOne(() => Team, (team) => team.projects, { onDelete: 'CASCADE' })
    // team: Team;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
