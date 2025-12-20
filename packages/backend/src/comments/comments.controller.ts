import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentStatus } from '../database/entities/comment.entity';

@Controller('streams/:streamId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async getComments(
    @Param('streamId') streamId: string,
    @Query('status') status?: CommentStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.commentsService.getCommentsByStream(streamId, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Patch(':commentId/status')
  async updateCommentStatus(
    @Param('commentId') commentId: string,
    @Body('status') status: CommentStatus,
  ) {
    return this.commentsService.updateCommentStatus(commentId, status);
  }

  @Post('bulk-update')
  async bulkUpdateStatus(
    @Body('commentIds') commentIds: string[],
    @Body('status') status: CommentStatus,
  ) {
    await this.commentsService.bulkUpdateStatus(commentIds, status);
    return { success: true };
  }

  @Delete(':commentId')
  async deleteComment(@Param('commentId') commentId: string) {
    await this.commentsService.deleteComment(commentId);
    return { success: true };
  }
}
