import { Injectable, Logger } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsGateway } from './comments.gateway';
import { OAuthService } from '../oauth/oauth.service';
import { CommentSource } from '../database/entities/comment.entity';

@Injectable()
export class FacebookCommentsService {
  private readonly logger = new Logger(FacebookCommentsService.name);
  private pollingIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentsGateway: CommentsGateway,
    private readonly oauthService: OAuthService,
  ) {}

  async startPolling(streamId: string, userId: string, videoId: string) {
    if (this.pollingIntervals.has(streamId)) {
      this.logger.warn(`Already polling for stream ${streamId}`);
      return;
    }

    this.logger.log(`Starting Facebook comment polling for stream ${streamId}`);

    const poll = async () => {
      try {
        const connection = await this.oauthService.findConnection(
          userId,
          'facebook',
        );

        if (!connection) {
          this.logger.error('No Facebook OAuth connection found');
          return;
        }

        const comments = await this.fetchLiveComments(
          connection.accessToken,
          videoId,
        );

        for (const comment of comments) {
          const savedComment = await this.commentsService.createComment({
            streamId,
            source: CommentSource.FACEBOOK,
            externalId: comment.id,
            authorName: comment.from.name,
            authorImage: comment.from.picture?.data?.url,
            text: comment.message,
            timestamp: new Date(comment.created_time),
            metadata: {
              fromId: comment.from.id,
              parentId: comment.parent?.id,
            },
          });

          await this.commentsGateway.broadcastNewComment(
            streamId,
            savedComment,
          );
        }
      } catch (error) {
        this.logger.error(`Error polling Facebook comments: ${error.message}`);
      }
    };

    await poll();
    const interval = setInterval(poll, 5000);
    this.pollingIntervals.set(streamId, interval);
  }

  stopPolling(streamId: string) {
    const interval = this.pollingIntervals.get(streamId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(streamId);
      this.logger.log(`Stopped Facebook comment polling for stream ${streamId}`);
    }
  }

  private async fetchLiveComments(
    accessToken: string,
    videoId: string,
  ): Promise<any[]> {
    const url = new URL(`https://graph.facebook.com/v18.0/${videoId}/comments`);
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('fields', 'id,from,message,created_time,parent');
    url.searchParams.set('filter', 'stream');
    url.searchParams.set('limit', '100');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Facebook API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }
}
