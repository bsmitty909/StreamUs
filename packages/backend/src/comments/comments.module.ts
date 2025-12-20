import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentsGateway } from './comments.gateway';
import { YoutubeCommentsService } from './youtube-comments.service';
import { TwitchCommentsService } from './twitch-comments.service';
import { FacebookCommentsService } from './facebook-comments.service';
import { Comment } from '../database/entities/comment.entity';
import { OAuthModule } from '../oauth/oauth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), OAuthModule],
  providers: [
    CommentsService,
    CommentsGateway,
    YoutubeCommentsService,
    TwitchCommentsService,
    FacebookCommentsService,
  ],
  controllers: [CommentsController],
  exports: [CommentsService, CommentsGateway],
})
export class CommentsModule {}
