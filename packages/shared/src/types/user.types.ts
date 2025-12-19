export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  username: string;
  subscriptionTier: SubscriptionTier;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  avatar?: string;
  displayName?: string;
}

export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
}

export interface UpdateUserDto {
  username?: string;
  displayName?: string;
  avatar?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}
