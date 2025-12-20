import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { OAuthService } from './oauth.service';

@Injectable()
export class YouTubeOAuthService {
  private readonly logger = new Logger(YouTubeOAuthService.name);
  private oauth2Client;

  constructor(
    private configService: ConfigService,
    private oauthService: OAuthService,
  ) {
    const clientId = this.configService.get('YOUTUBE_CLIENT_ID');
    const clientSecret = this.configService.get('YOUTUBE_CLIENT_SECRET');
    const redirectUri = this.configService.get('YOUTUBE_REDIRECT_URI') || 'http://localhost:3000/oauth/youtube/callback';

    if (!clientId || !clientSecret) {
      this.logger.warn('YouTube OAuth credentials not configured');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
  }

  getAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/youtube.readonly',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId,
      prompt: 'consent',
    });
  }

  async handleCallback(code: string, userId: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    
    this.oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
    
    const channelResponse = await youtube.channels.list({
      part: ['snippet'],
      mine: true,
    });

    const channel = channelResponse.data.items?.[0];
    if (!channel) {
      throw new Error('No YouTube channel found');
    }

    const expiresAt = tokens.expiry_date 
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    await this.oauthService.saveConnection({
      userId,
      provider: 'youtube',
      providerUserId: channel.id || '',
      displayName: channel.snippet?.title || 'YouTube Channel',
      profileImage: channel.snippet?.thumbnails?.default?.url || undefined,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      metadata: {
        channelId: channel.id,
        customUrl: channel.snippet?.customUrl,
      },
    });

    return { success: true, channel: channel.snippet?.title };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    
    return {
      accessToken: credentials.access_token,
      expiresAt: credentials.expiry_date 
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000),
    };
  }

  async getRtmpConfig(userId: string) {
    const connection = await this.oauthService.findConnection(userId, 'youtube');
    if (!connection) {
      throw new Error('YouTube not connected');
    }

    const refreshedConnection = await this.oauthService.refreshTokenIfNeeded(
      connection,
      (refreshToken) => this.refreshAccessToken(refreshToken)
    );

    this.oauth2Client.setCredentials({ access_token: refreshedConnection.accessToken });
    const youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });

    const streamResponse = await youtube.liveStreams.list({
      part: ['cdn'],
      mine: true,
      maxResults: 1,
    });

    const stream = streamResponse.data.items?.[0];
    if (!stream?.cdn?.ingestionInfo) {
      throw new Error('No live stream configuration found. Please set up YouTube Live first.');
    }

    return {
      rtmpUrl: stream.cdn.ingestionInfo.ingestionAddress,
      streamKey: stream.cdn.ingestionInfo.streamName,
    };
  }
}
