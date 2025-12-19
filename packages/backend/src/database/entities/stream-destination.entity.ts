import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DestinationPlatform, DestinationStatus } from '@streamus/shared';
import { Stream } from './stream.entity';

@Entity('stream_destinations')
export class StreamDestination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  streamId: string;

  @Column({
    type: 'varchar',
    enum: DestinationPlatform,
  })
  platform: DestinationPlatform;

  @Column({ type: 'text' })
  rtmpUrl: string;

  @Column({ type: 'text' })
  streamKey: string;

  @Column({
    type: 'varchar',
    enum: DestinationStatus,
    default: DestinationStatus.PENDING,
  })
  status: DestinationStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Stream, (stream) => stream.destinations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'streamId' })
  stream: Stream;
}
