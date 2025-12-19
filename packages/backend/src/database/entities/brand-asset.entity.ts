import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('brand_assets')
export class BrandAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column()
  type: string;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ nullable: true })
  fileName?: string;

  @Column({ type: 'jsonb', nullable: true })
  settings?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.brandAssets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
