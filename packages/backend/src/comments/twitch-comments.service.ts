import { Injectable, Logger } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsGateway } from './comments.gateway';
import { OAuthService } from '../oauth/oauth.service';
import { CommentSource } from '../database/entities/comment.entity';

@Injectable()
export class TwitchCommentsService {
  private readonly logger = new Logger(TwitchCommentsService.name);
  private pollingIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentsGateway: CommentsGateway,
    private readonly oauthService: OAuthService,
  ) {}

  async startPolling(streamId: string, userId: string, channelId: string) {
    if (this.pollingIntervals.has(streamId)) {
      this.logger.warn(`Already polling for stream ${streamId}`);
      return;
    }

    this.logger.log(`Starting Twitch comment polling for stream ${streamId}`);

    const poll = async () => {
      try {
        const connection = await this.oauthService.findConnection(
          userId,
          'twitch',
        );

        if (!connection) {
          this.logger.error('No Twitch OAuth connection found');
          return;
        }

        const comments = await this.fetchChatMessages(
          connection.accessToken,
          channelId,
        );

        for (const comment of comments) {
          const savedComment = await this.commentsService.createComment({
            streamId,
            source: CommentSource.TWITCH,
            externalId: comment.id,
            authorName: comment.user_name,
            authorImage: comment.user_image,
            text: comment.message,
            timestamp: new Date(comment.created_at),
            metadata: {
              userId: comment.user_id,
              badges: comment.badges,
              color: comment.color,
            },
          });

          await this.commentsGateway.broadcastNewComment(
            streamId,
            savedComment,
          );
        }
      } catch (error) {
        this.logger.error(`Error polling Twitch comments: ${error.message}`);
      }
    };

    await poll();
    const interval = setInterval(poll, 3000);
    this.pollingIntervals.set(streamId, interval);
  }

  stopPolling(streamId: string) {
    const interval = this.pollingIntervals.get(streamId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(streamId);
      this.logger.log(`Stopped Twitch comment polling for stream ${streamId}`);
    }
  }

  private async fetchChatMessages(
    accessToken: string,
    channelId: string,
  ): Promise<any[]> {
    const url = new URL('https://api.twitch.tv/helix/chat/messages');
    url.searchParams.set('broadcaster_id', channelId);
    url.searchParams.set('first', '100');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Twitch API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }
}
