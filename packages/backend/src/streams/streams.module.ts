import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StreamsController } from './streams.controller';
import { StreamsService } from './streams.service';
import { DestinationsController } from './destinations.controller';
import { DestinationsService } from './destinations.service';
import { YouTubeService } from './youtube.service';
import { Stream } from '../database/entities/stream.entity';
import { StreamDestination } from '../database/entities/stream-destination.entity';
import { LiveKitModule } from '../livekit/livekit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stream, StreamDestination]),
    LiveKitModule,
    ConfigModule,
  ],
  controllers: [StreamsController, DestinationsController],
  providers: [StreamsService, DestinationsService, YouTubeService],
  exports: [StreamsService, DestinationsService, YouTubeService],
})
export class StreamsModule {}
