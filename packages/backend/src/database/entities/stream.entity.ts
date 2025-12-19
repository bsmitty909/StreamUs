import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { StreamStatus } from '@streamus/shared';
import type { StreamSettings } from '@streamus/shared';
import { User } from './user.entity';
import { StreamDestination } from './stream-destination.entity';
import { Guest } from './guest.entity';
import { Recording } from './recording.entity';

@Entity('streams')
export class Stream {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    enum: StreamStatus,
    default: StreamStatus.DRAFT,
  })
  status: StreamStatus;

  @Column({ nullable: true })
  livekitRoomName?: string;

  @Column({ type: 'jsonb', nullable: true })
  settings?: StreamSettings;

  @Column({ type: 'timestamp', nullable: true })
  scheduledStart?: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualStart?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.streams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => StreamDestination, (destination) => destination.stream)
  destinations: StreamDestination[];

  @OneToMany(() => Guest, (guest) => guest.stream)
  guests: Guest[];

  @OneToMany(() => Recording, (recording) => recording.stream)
  recordings: Recording[];
}
