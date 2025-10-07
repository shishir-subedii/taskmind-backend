import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    ManyToMany,
    JoinTable,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Task } from 'src/task/entities/task.entity';
import { User } from 'src/user/entity/user.entity';

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    // Each project can have many tasks
    @OneToMany(() => Task, (task) => task.project, { cascade: true })
    tasks: Task[];

    // Manager (single user) for this project
    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    manager: User | null;

    // Team members for this project (many users)
    @ManyToMany(() => User)
    @JoinTable({
        name: 'project_team_members',
        joinColumn: { name: 'project_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
    })
    teamMembers: User[];

    @Column({ type: 'timestamptz', nullable: true })
    deadline: Date | null;

    @Column({ type: 'varchar', array: true, nullable: true })
    assets: string[] | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
