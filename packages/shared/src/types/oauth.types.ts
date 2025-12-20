export enum OAuthProvider {
  YOUTUBE = 'youtube',
  TWITCH = 'twitch',
  FACEBOOK = 'facebook',
}

export interface OAuthConnection {
  id: string;
  userId: string;
  provider: OAuthProvider;
  providerUserId: string;
  displayName: string;
  profileImage?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OAuthCallbackQuery {
  code: string;
  state: string;
  error?: string;
  error_description?: string;
}

export interface YouTubeRtmpConfig {
  rtmpUrl: string;
  streamKey: string;
  broadcastId?: string;
  streamUrl?: string;
}

export interface TwitchRtmpConfig {
  rtmpUrl: string;
  streamKey: string;
}

export interface FacebookRtmpConfig {
  rtmpUrl: string;
  streamKey: string;
  videoId?: string;
}

export interface ConnectedAccount {
  provider: OAuthProvider;
  displayName: string;
  profileImage?: string;
  connected: boolean;
  canStream: boolean;
}
