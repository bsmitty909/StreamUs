import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthConnection } from '../database/entities/oauth-connection.entity';

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(OAuthConnection)
    private oauthConnectionRepository: Repository<OAuthConnection>,
  ) {}

  async findConnection(userId: string, provider: string): Promise<OAuthConnection | null> {
    return this.oauthConnectionRepository.findOne({
      where: { userId, provider },
    });
  }

  async findAllUserConnections(userId: string): Promise<OAuthConnection[]> {
    return this.oauthConnectionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async saveConnection(data: Partial<OAuthConnection>): Promise<OAuthConnection> {
    if (!data.userId || !data.provider) {
      throw new Error('userId and provider are required');
    }
    
    const existing = await this.findConnection(data.userId, data.provider);
    
    if (existing) {
      Object.assign(existing, data, { updatedAt: new Date() });
      return this.oauthConnectionRepository.save(existing);
    }
    
    const connection = this.oauthConnectionRepository.create(data);
    return this.oauthConnectionRepository.save(connection);
  }

  async deleteConnection(userId: string, provider: string): Promise<void> {
    await this.oauthConnectionRepository.delete({ userId, provider });
  }

  async refreshTokenIfNeeded(connection: OAuthConnection, refreshFn: (refreshToken: string) => Promise<{ accessToken: string; expiresAt: Date }>): Promise<OAuthConnection> {
    const now = new Date();
    const expiresAt = connection.expiresAt;
    
    if (!expiresAt || expiresAt > now) {
      return connection;
    }
    
    if (!connection.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const { accessToken, expiresAt: newExpiresAt } = await refreshFn(connection.refreshToken);
    
    connection.accessToken = accessToken;
    connection.expiresAt = newExpiresAt;
    
    return this.oauthConnectionRepository.save(connection);
  }
}
