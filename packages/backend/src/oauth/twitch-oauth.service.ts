import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { OAuthService } from './oauth.service';

@Injectable()
export class TwitchOAuthService {
  private readonly logger = new Logger(TwitchOAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private configService: ConfigService,
    private oauthService: OAuthService,
  ) {
    this.clientId = this.configService.get('TWITCH_CLIENT_ID') || '';
    this.clientSecret = this.configService.get('TWITCH_CLIENT_SECRET') || '';
    this.redirectUri = this.configService.get('TWITCH_REDIRECT_URI') || 'http://localhost:3000/oauth/twitch/callback';

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('Twitch OAuth credentials not configured');
    }
  }

  getAuthUrl(userId: string): string {
    const scopes = ['channel:read:stream_key', 'channel:manage:broadcast'];
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state: userId,
    });

    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, userId: string) {
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      },
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Client-Id': this.clientId,
      },
    });

    const user = userResponse.data.data[0];
    if (!user) {
      throw new Error('Failed to get Twitch user info');
    }

    await this.oauthService.saveConnection({
      userId,
      provider: 'twitch',
      providerUserId: user.id,
      displayName: user.display_name,
      profileImage: user.profile_image_url,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
      metadata: {
        login: user.login,
        broadcasterType: user.broadcaster_type,
      },
    });

    return { success: true, channel: user.display_name };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
    });

    const { access_token, expires_in } = response.data;

    return {
      accessToken: access_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }

  async getRtmpConfig(userId: string) {
    const connection = await this.oauthService.findConnection(userId, 'twitch');
    if (!connection) {
      throw new Error('Twitch not connected');
    }

    const refreshedConnection = await this.oauthService.refreshTokenIfNeeded(
      connection,
      (refreshToken) => this.refreshAccessToken(refreshToken)
    );

    const response = await axios.get('https://api.twitch.tv/helix/streams/key', {
      headers: {
        'Authorization': `Bearer ${refreshedConnection.accessToken}`,
        'Client-Id': this.clientId,
      },
    });

    const streamKey = response.data.data[0]?.stream_key;
    if (!streamKey) {
      throw new Error('Failed to get Twitch stream key');
    }

    return {
      rtmpUrl: 'rtmp://live.twitch.tv/app',
      streamKey,
    };
  }
}
