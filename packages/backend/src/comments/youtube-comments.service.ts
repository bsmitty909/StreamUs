import { Injectable, Logger } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsGateway } from './comments.gateway';
import { OAuthService } from '../oauth/oauth.service';
import { CommentSource } from '../database/entities/comment.entity';

@Injectable()
export class YoutubeCommentsService {
  private readonly logger = new Logger(YoutubeCommentsService.name);
  private pollingIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentsGateway: CommentsGateway,
    private readonly oauthService: OAuthService,
  ) {}

  async startPolling(streamId: string, userId: string, liveChatId: string) {
    if (this.pollingIntervals.has(streamId)) {
      this.logger.warn(`Already polling for stream ${streamId}`);
      return;
    }

    this.logger.log(`Starting YouTube comment polling for stream ${streamId}`);

    const poll = async () => {
      try {
        const connection = await this.oauthService.findConnection(
          userId,
          'youtube',
        );

        if (!connection) {
          this.logger.error('No YouTube OAuth connection found');
          return;
        }

        const comments = await this.fetchLiveChatMessages(
          connection.accessToken,
          liveChatId,
        );

        for (const comment of comments) {
          const savedComment = await this.commentsService.createComment({
            streamId,
            source: CommentSource.YOUTUBE,
            externalId: comment.id,
            authorName: comment.authorDetails.displayName,
            authorImage: comment.authorDetails.profileImageUrl,
            text: comment.snippet.displayMessage,
            timestamp: new Date(comment.snippet.publishedAt),
            metadata: {
              channelId: comment.authorDetails.channelId,
              isChatOwner: comment.authorDetails.isChatOwner,
              isChatModerator: comment.authorDetails.isChatModerator,
            },
          });

          await this.commentsGateway.broadcastNewComment(
            streamId,
            savedComment,
          );
        }
      } catch (error) {
        this.logger.error(`Error polling YouTube comments: ${error.message}`);
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
      this.logger.log(`Stopped YouTube comment polling for stream ${streamId}`);
    }
  }

  private async fetchLiveChatMessages(
    accessToken: string,
    liveChatId: string,
  ): Promise<any[]> {
    const url = new URL('https://www.googleapis.com/youtube/v3/liveChat/messages');
    url.searchParams.set('liveChatId', liveChatId);
    url.searchParams.set('part', 'snippet,authorDetails');
    url.searchParams.set('maxResults', '200');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }
}
