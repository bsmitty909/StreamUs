import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, youtube_v3 } from 'googleapis';
import axios from 'axios';

export interface YouTubeAuthUrl {
  authUrl: string;
  state: string;
}

export interface YouTubeTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}

export interface YouTubeLiveBroadcast {
  id: string;
  title: string;
  description: string;
  scheduledStartTime: string;
  rtmpUrl: string;
  streamKey: string;
  status: string;
}

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private oauth2Client: any;
  private youtube: youtube_v3.Youtube;

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get('YOUTUBE_CLIENT_ID');
    const clientSecret = this.configService.get('YOUTUBE_CLIENT_SECRET');
    const redirectUri = this.configService.get('YOUTUBE_REDIRECT_URI') || 'http://localhost:3000/api/youtube/callback';

    if (clientId && clientSecret) {
      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri,
      );

      this.youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client,
      });
    } else {
      this.logger.warn('YouTube OAuth credentials not configured');
    }
  }

  generateAuthUrl(userId: string): YouTubeAuthUrl {
    if (!this.oauth2Client) {
      throw new Error('YouTube OAuth not configured');
    }

    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.force-ssl',
        'https://www.googleapis.com/auth/youtube.readonly',
      ],
      state,
      prompt: 'consent',
    });

    return { authUrl, state };
  }

  async exchangeCodeForTokens(code: string): Promise<YouTubeTokens> {
    if (!this.oauth2Client) {
      throw new Error('YouTube OAuth not configured');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      };
    } catch (error) {
      this.logger.error(`Failed to exchange code for tokens: ${error.message}`, error.stack);
      throw new Error(`Failed to authenticate with YouTube: ${error.message}`);
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<YouTubeTokens> {
    if (!this.oauth2Client) {
      throw new Error('YouTube OAuth not configured');
    }

    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || refreshToken,
        expiryDate: credentials.expiry_date,
      };
    } catch (error) {
      this.logger.error(`Failed to refresh access token: ${error.message}`, error.stack);
      throw new Error(`Failed to refresh YouTube access token: ${error.message}`);
    }
  }

  async createLiveBroadcast(
    accessToken: string,
    title: string,
    description: string,
    scheduledStartTime: Date,
  ): Promise<YouTubeLiveBroadcast> {
    if (!this.oauth2Client) {
      throw new Error('YouTube OAuth not configured');
    }

    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const broadcastResponse = await this.youtube.liveBroadcasts.insert({
        part: ['snippet', 'status', 'contentDetails'],
        requestBody: {
          snippet: {
            title,
            description,
            scheduledStartTime: scheduledStartTime.toISOString(),
          },
          status: {
            privacyStatus: 'public',
            selfDeclaredMadeForKids: false,
          },
          contentDetails: {
            enableAutoStart: true,
            enableAutoStop: true,
            recordFromStart: true,
            enableDvr: true,
            enableEmbed: true,
          },
        },
      });

      const broadcast = broadcastResponse.data;

      if (!broadcast.id || !broadcast.snippet || !broadcast.status) {
        throw new Error('Invalid broadcast response from YouTube');
      }

      const streamResponse = await this.youtube.liveStreams.insert({
        part: ['snippet', 'cdn'],
        requestBody: {
          snippet: {
            title: `${title} - Stream`,
          },
          cdn: {
            frameRate: '30fps',
            ingestionType: 'rtmp',
            resolution: '1080p',
          },
        },
      });

      const stream = streamResponse.data;

      if (!stream.id || !stream.cdn?.ingestionInfo) {
        throw new Error('Invalid stream response from YouTube');
      }

      await this.youtube.liveBroadcasts.bind({
        id: broadcast.id,
        streamId: stream.id,
        part: ['id', 'contentDetails'],
      } as any);

      return {
        id: broadcast.id,
        title: broadcast.snippet.title || '',
        description: broadcast.snippet.description || '',
        scheduledStartTime: broadcast.snippet.scheduledStartTime || new Date().toISOString(),
        rtmpUrl: stream.cdn.ingestionInfo.ingestionAddress || '',
        streamKey: stream.cdn.ingestionInfo.streamName || '',
        status: broadcast.status.lifeCycleStatus || 'created',
      };
    } catch (error) {
      this.logger.error(`Failed to create YouTube live broadcast: ${error.message}`, error.stack);
      throw new Error(`Failed to create YouTube live broadcast: ${error.message}`);
    }
  }

  async listLiveBroadcasts(accessToken: string): Promise<YouTubeLiveBroadcast[]> {
    if (!this.oauth2Client) {
      throw new Error('YouTube OAuth not configured');
    }

    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const response = await this.youtube.liveBroadcasts.list({
        part: ['snippet', 'status', 'contentDetails'],
        broadcastStatus: 'all',
        maxResults: 50,
      });

      return response.data.items?.filter((broadcast) =>
        broadcast.id && broadcast.snippet && broadcast.status
      ).map((broadcast) => ({
        id: broadcast.id!,
        title: broadcast.snippet!.title || '',
        description: broadcast.snippet!.description || '',
        scheduledStartTime: broadcast.snippet!.scheduledStartTime || new Date().toISOString(),
        rtmpUrl: '',
        streamKey: '',
        status: broadcast.status!.lifeCycleStatus || 'unknown',
      })) || [];
    } catch (error) {
      this.logger.error(`Failed to list YouTube broadcasts: ${error.message}`, error.stack);
      throw new Error(`Failed to list YouTube broadcasts: ${error.message}`);
    }
  }

  async deleteLiveBroadcast(accessToken: string, broadcastId: string): Promise<void> {
    if (!this.oauth2Client) {
      throw new Error('YouTube OAuth not configured');
    }

    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      await this.youtube.liveBroadcasts.delete({
        id: broadcastId,
      });
    } catch (error) {
      this.logger.error(`Failed to delete YouTube broadcast: ${error.message}`, error.stack);
      throw new Error(`Failed to delete YouTube broadcast: ${error.message}`);
    }
  }

  async transitionBroadcast(
    accessToken: string,
    broadcastId: string,
    status: 'testing' | 'live' | 'complete',
  ): Promise<void> {
    if (!this.oauth2Client) {
      throw new Error('YouTube OAuth not configured');
    }

    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      await this.youtube.liveBroadcasts.transition({
        part: ['status'],
        id: broadcastId,
        broadcastStatus: status,
      });
    } catch (error) {
      this.logger.error(`Failed to transition YouTube broadcast: ${error.message}`, error.stack);
      throw new Error(`Failed to transition YouTube broadcast: ${error.message}`);
    }
  }
}
