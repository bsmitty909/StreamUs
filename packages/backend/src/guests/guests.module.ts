import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestsController } from './guests.controller';
import { GuestsService } from './guests.service';
import { Guest } from '../database/entities/guest.entity';
import { Stream } from '../database/entities/stream.entity';
import { LiveKitModule } from '../livekit/livekit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guest, Stream]),
    LiveKitModule,
  ],
  controllers: [GuestsController],
  providers: [GuestsService],
  exports: [GuestsService],
})
export class GuestsModule {}
