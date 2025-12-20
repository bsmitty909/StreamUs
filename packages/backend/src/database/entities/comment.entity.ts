import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Stream } from './stream.entity';

export enum CommentSource {
  YOUTUBE = 'youtube',
  TWITCH = 'twitch',
  FACEBOOK = 'facebook',
}

export enum CommentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

@Entity('comments')
@Index(['streamId', 'timestamp'])
@Index(['streamId', 'status'])
@Index(['externalId', 'source'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  streamId: string;

  @ManyToOne(() => Stream, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'streamId' })
  stream: Stream;

  @Column({
    type: 'enum',
    enum: CommentSource,
  })
  source: CommentSource;

  @Column()
  externalId: string;

  @Column()
  authorName: string;

  @Column({ nullable: true })
  authorImage?: string;

  @Column('text')
  text: string;

  @Column({
    type: 'enum',
    enum: CommentStatus,
    default: CommentStatus.PENDING,
  })
  status: CommentStatus;

  @Column('timestamp')
  timestamp: Date;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
