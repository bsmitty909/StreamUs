import { LayoutType } from './layout.types';

export enum StreamStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
}

export enum DestinationPlatform {
  YOUTUBE = 'youtube',
  FACEBOOK = 'facebook',
  TWITCH = 'twitch',
  CUSTOM = 'custom',
}

export enum DestinationStatus {
  PENDING = 'pending',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

export enum GuestRole {
  HOST = 'host',
  GUEST = 'guest',
  MODERATOR = 'moderator',
}

export interface Stream {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: StreamStatus;
  livekitRoomName?: string;
  settings: StreamSettings;
  scheduledStart?: Date;
  actualStart?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamSettings {
  layout?: LayoutType;
  bitrate?: number;
  resolution?: string;
  branding?: BrandingSettings;
  recordingEnabled?: boolean;
  recordingQuality?: string;
}

export interface BrandingSettings {
  logoUrl?: string;
  backgroundUrl?: string;
  overlayUrl?: string;
  colorScheme?: {
    primary?: string;
    secondary?: string;
  };
}

export interface StreamDestination {
  id: string;
  streamId: string;
  platform: DestinationPlatform;
  rtmpUrl: string;
  streamKey: string;
  status: DestinationStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Guest {
  id: string;
  streamId: string;
  userId?: string;
  displayName: string;
  joinToken: string;
  role: GuestRole;
  permissions: GuestPermissions;
  tokenExpiresAt?: Date;
  joinedAt?: Date;
  leftAt?: Date;
  createdAt: Date;
}

export interface GuestPermissions {
  audio: boolean;
  video: boolean;
  screenShare: boolean;
}

export interface Recording {
  id: string;
  streamId: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize?: number;
  duration?: number;
  resolution?: string;
  format?: string;
  status: RecordingStatus;
  createdAt: Date;
}

export enum RecordingStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  ERROR = 'error',
}

export interface CreateStreamDto {
  title: string;
  description?: string;
  settings?: Partial<StreamSettings>;
  scheduledStart?: Date;
}

export interface UpdateStreamDto {
  title?: string;
  description?: string;
  settings?: Partial<StreamSettings>;
  status?: StreamStatus;
}

export interface CreateDestinationDto {
  platform: DestinationPlatform;
  rtmpUrl: string;
  streamKey: string;
  metadata?: Record<string, any>;
}

export interface InviteGuestDto {
  displayName?: string;
  role?: GuestRole;
  permissions?: Partial<GuestPermissions>;
  expiresIn?: number;
}
