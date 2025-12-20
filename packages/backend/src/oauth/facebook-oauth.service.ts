import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { OAuthService } from './oauth.service';

@Injectable()
export class FacebookOAuthService {
  private readonly logger = new Logger(FacebookOAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private configService: ConfigService,
    private oauthService: OAuthService,
  ) {
    this.clientId = this.configService.get('FACEBOOK_APP_ID') || '';
    this.clientSecret = this.configService.get('FACEBOOK_APP_SECRET') || '';
    this.redirectUri = this.configService.get('FACEBOOK_REDIRECT_URI') || 'http://localhost:3000/oauth/facebook/callback';

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('Facebook OAuth credentials not configured');
    }
  }

  getAuthUrl(userId: string): string {
    const scopes = ['pages_read_engagement', 'pages_manage_posts', 'publish_video'];
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(','),
      state: userId,
      response_type: 'code',
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  async handleCallback(code: string, userId: string) {
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code,
      },
    });

    const { access_token, expires_in } = tokenResponse.data;

    const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        fields: 'id,name,picture',
        access_token,
      },
    });

    const user = userResponse.data;

    await this.oauthService.saveConnection({
      userId,
      provider: 'facebook',
      providerUserId: user.id,
      displayName: user.name,
      profileImage: user.picture?.data?.url,
      accessToken: access_token,
      expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : undefined,
      metadata: {
        facebookUserId: user.id,
      },
    });

    return { success: true, channel: user.name };
  }

  async refreshAccessToken(oldToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
    const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        fb_exchange_token: oldToken,
      },
    });

    const { access_token, expires_in } = response.data;

    return {
      accessToken: access_token,
      expiresAt: new Date(Date.now() + (expires_in || 5184000) * 1000),
    };
  }

  async getRtmpConfig(userId: string) {
    const connection = await this.oauthService.findConnection(userId, 'facebook');
    if (!connection) {
      throw new Error('Facebook not connected');
    }

    const refreshedConnection = await this.oauthService.refreshTokenIfNeeded(
      connection,
      (token) => this.refreshAccessToken(token)
    );

    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: refreshedConnection.accessToken,
      },
    });

    const page = pagesResponse.data.data[0];
    if (!page) {
      throw new Error('No Facebook page found. Please create a Facebook page to stream.');
    }

    const liveVideoResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${page.id}/live_videos`,
      null,
      {
        params: {
          access_token: page.access_token,
          status: 'LIVE_NOW',
        },
      }
    );

    const streamUrl = liveVideoResponse.data.stream_url;
    const secureStreamUrl = liveVideoResponse.data.secure_stream_url;

    return {
      rtmpUrl: secureStreamUrl || streamUrl,
      streamKey: '',
    };
  }
}
