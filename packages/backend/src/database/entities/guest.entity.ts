import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { GuestRole, GuestPermissions } from '@streamus/shared';
import { Stream } from './stream.entity';
import { User } from './user.entity';

@Entity('guests')
export class Guest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  streamId: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column()
  displayName: string;

  @Column({ unique: true })
  joinToken: string;

  @Column({ type: 'varchar' })
  role: GuestRole;

  @Column({ type: 'jsonb' })
  permissions: GuestPermissions;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  joinedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Stream, (stream) => stream.guests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'streamId' })
  stream: Stream;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
