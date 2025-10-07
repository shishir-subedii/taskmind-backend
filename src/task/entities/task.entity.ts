import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { TaskStatus } from 'src/common/enums/task-status.enum';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entity/user.entity';

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    sNo: number;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'varchar', nullable: true })
    title?: string | null;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @ManyToOne(() => Project, (project) => project.tasks, {
        onDelete: 'CASCADE', // optional but common (delete all tasks if project is deleted)
    })
    project: Project;

    @Column({ type: 'varchar', array: true, nullable: true })
    assets?: string[] | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    assignedTo?: User | null;

    @Column({
        type: 'enum',
        enum: TaskStatus,
        default: TaskStatus.ASSIGNED,
    })
    status: TaskStatus;

    @Column({ type: 'timestamptz', nullable: true })
    clockIn?: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    clockOut?: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    assignedAt?: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    deadline?: Date | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
