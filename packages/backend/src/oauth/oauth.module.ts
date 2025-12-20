import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OAuthConnection } from '../database/entities/oauth-connection.entity';
import { OAuthService } from './oauth.service';
import { YouTubeOAuthService } from './youtube-oauth.service';
import { TwitchOAuthService } from './twitch-oauth.service';
import { FacebookOAuthService } from './facebook-oauth.service';
import { OAuthController } from './oauth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([OAuthConnection]),
    ConfigModule,
  ],
  controllers: [OAuthController],
  providers: [
    OAuthService,
    YouTubeOAuthService,
    TwitchOAuthService,
    FacebookOAuthService,
  ],
  exports: [
    OAuthService,
    YouTubeOAuthService,
    TwitchOAuthService,
    FacebookOAuthService,
  ],
})
export class OAuthModule {}
