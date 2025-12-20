import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { YouTubeOAuthService } from './youtube-oauth.service';
import { TwitchOAuthService } from './twitch-oauth.service';
import { FacebookOAuthService } from './facebook-oauth.service';
import { OAuthService } from './oauth.service';

@Controller('oauth')
export class OAuthController {
  constructor(
    private youtubeOAuthService: YouTubeOAuthService,
    private twitchOAuthService: TwitchOAuthService,
    private facebookOAuthService: FacebookOAuthService,
    private oauthService: OAuthService,
  ) {}

  @Get('youtube')
  @UseGuards(JwtAuthGuard)
  async connectYouTube(@Req() req, @Res() res: Response) {
    const userId = req.user.id;
    const authUrl = this.youtubeOAuthService.getAuthUrl(userId);
    return res.redirect(authUrl);
  }

  @Get('youtube/callback')
  async youtubeCallback(@Query('code') code: string, @Query('state') userId: string, @Res() res: Response) {
    try {
      await this.youtubeOAuthService.handleCallback(code, userId);
      return res.redirect('http://localhost:3001/settings/connections?success=youtube');
    } catch (error) {
      return res.redirect(`http://localhost:3001/settings/connections?error=${error.message}`);
    }
  }

  @Get('twitch')
  @UseGuards(JwtAuthGuard)
  async connectTwitch(@Req() req, @Res() res: Response) {
    const userId = req.user.id;
    const authUrl = this.twitchOAuthService.getAuthUrl(userId);
    return res.redirect(authUrl);
  }

  @Get('twitch/callback')
  async twitchCallback(@Query('code') code: string, @Query('state') userId: string, @Res() res: Response) {
    try {
      await this.twitchOAuthService.handleCallback(code, userId);
      return res.redirect('http://localhost:3001/settings/connections?success=twitch');
    } catch (error) {
      return res.redirect(`http://localhost:3001/settings/connections?error=${error.message}`);
    }
  }

  @Get('facebook')
  @UseGuards(JwtAuthGuard)
  async connectFacebook(@Req() req, @Res() res: Response) {
    const userId = req.user.id;
    const authUrl = this.facebookOAuthService.getAuthUrl(userId);
    return res.redirect(authUrl);
  }

  @Get('facebook/callback')
  async facebookCallback(@Query('code') code: string, @Query('state') userId: string, @Res() res: Response) {
    try {
      await this.facebookOAuthService.handleCallback(code, userId);
      return res.redirect('http://localhost:3001/settings/connections?success=facebook');
    } catch (error) {
      return res.redirect(`http://localhost:3001/settings/connections?error=${error.message}`);
    }
  }

  @Get('connections')
  @UseGuards(JwtAuthGuard)
  async getConnections(@Req() req) {
    const userId = req.user.id;
    const connections = await this.oauthService.findAllUserConnections(userId);
    
    return connections.map(conn => ({
      provider: conn.provider,
      displayName: conn.displayName,
      profileImage: conn.profileImage,
      connected: true,
      connectedAt: conn.createdAt,
    }));
  }

  @Get('disconnect/:provider')
  @UseGuards(JwtAuthGuard)
  async disconnect(@Req() req, @Query('provider') provider: string) {
    const userId = req.user.id;
    await this.oauthService.deleteConnection(userId, provider);
    return { success: true };
  }
}
