import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LiveKitService } from './livekit.service';
import { RtmpEgressService } from './rtmp-egress.service';

@Module({
  imports: [ConfigModule],
  providers: [LiveKitService, RtmpEgressService],
  exports: [LiveKitService, RtmpEgressService],
})
export class LiveKitModule {}
