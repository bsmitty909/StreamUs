import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { RecordingStatus } from '@streamus/shared';
import { Stream } from './stream.entity';

@Entity('recordings')
export class Recording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  streamId: string;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ type: 'text', nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize?: number;

  @Column({ type: 'int', nullable: true })
  duration?: number;

  @Column({ nullable: true })
  resolution?: string;

  @Column({ nullable: true })
  format?: string;

  @Column({ type: 'varchar' })
  status: RecordingStatus;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Stream, (stream) => stream.recordings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'streamId' })
  stream: Stream;
}
