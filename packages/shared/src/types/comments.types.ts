export enum CommentSource {
  YOUTUBE = 'youtube',
  TWITCH = 'twitch',
  FACEBOOK = 'facebook',
}

export enum CommentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

export interface StreamComment {
  id: string;
  streamId: string;
  source: CommentSource;
  externalId: string;
  authorName: string;
  authorImage?: string;
  text: string;
  status: CommentStatus;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface CommentOverlaySettings {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  maxVisible: number;
  displayDuration: number;
  animation: 'fade' | 'slide' | 'none';
  showAuthorImage: boolean;
  showSource: boolean;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
}

export interface ModerationSettings {
  autoApprove: boolean;
  profanityFilter: boolean;
  requireManualApproval: boolean;
  bannedWords: string[];
  moderators: string[];
}

export const DEFAULT_COMMENT_OVERLAY_SETTINGS: CommentOverlaySettings = {
  enabled: true,
  position: 'bottom-left',
  maxVisible: 3,
  displayDuration: 5000,
  animation: 'slide',
  showAuthorImage: true,
  showSource: true,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  textColor: '#ffffff',
  fontSize: 16,
};

export const DEFAULT_MODERATION_SETTINGS: ModerationSettings = {
  autoApprove: false,
  profanityFilter: true,
  requireManualApproval: true,
  bannedWords: [],
  moderators: [],
};
