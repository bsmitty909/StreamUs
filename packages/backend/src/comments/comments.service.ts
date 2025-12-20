import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, CommentSource, CommentStatus } from '../database/entities/comment.entity';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async createComment(data: {
    streamId: string;
    source: CommentSource;
    externalId: string;
    authorName: string;
    authorImage?: string;
    text: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }): Promise<Comment> {
    const existing = await this.commentRepository.findOne({
      where: {
        externalId: data.externalId,
        source: data.source,
      },
    });

    if (existing) {
      return existing;
    }

    const comment = this.commentRepository.create(data);
    return this.commentRepository.save(comment);
  }

  async getCommentsByStream(
    streamId: string,
    options?: {
      status?: CommentStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<Comment[]> {
    const query = this.commentRepository
      .createQueryBuilder('comment')
      .where('comment.streamId = :streamId', { streamId })
      .orderBy('comment.timestamp', 'DESC');

    if (options?.status) {
      query.andWhere('comment.status = :status', { status: options.status });
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    return query.getMany();
  }

  async updateCommentStatus(
    commentId: string,
    status: CommentStatus,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.status = status;
    return this.commentRepository.save(comment);
  }

  async bulkUpdateStatus(
    commentIds: string[],
    status: CommentStatus,
  ): Promise<void> {
    await this.commentRepository
      .createQueryBuilder()
      .update(Comment)
      .set({ status })
      .whereInIds(commentIds)
      .execute();
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.commentRepository.delete(commentId);
  }

  async getRecentComments(
    streamId: string,
    since: Date,
  ): Promise<Comment[]> {
    return this.commentRepository
      .createQueryBuilder('comment')
      .where('comment.streamId = :streamId', { streamId })
      .andWhere('comment.timestamp > :since', { since })
      .orderBy('comment.timestamp', 'ASC')
      .getMany();
  }
}
