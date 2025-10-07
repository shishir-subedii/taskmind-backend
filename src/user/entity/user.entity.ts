import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
} from 'typeorm';

import { UserRole } from 'src/common/enums/auth-roles.enum';
import { Project } from 'src/project/entities/project.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', unique: true })
    email: string;

    @Column({ type: 'varchar', nullable: true })
    name: string | null;

    @Column({ type: 'varchar', select: false, nullable: true })
    password: string | null;

    @Column({
        type: 'text',
        array: true,
        nullable: true,
        select: false,
        default: () => 'ARRAY[]::TEXT[]',
    })
    accessTokens: string[] | null;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.MEMBER,
    })
    role: UserRole;

    @ManyToOne(() => Project, project => project.id, { nullable: true, onDelete: 'SET NULL' })
    project: Project | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
