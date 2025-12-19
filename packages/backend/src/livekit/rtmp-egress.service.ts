import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EgressClient, StreamProtocol, StreamOutput } from 'livekit-server-sdk';

export interface RtmpEgressOptions {
  roomName: string;
  rtmpUrl: string;
  streamKey: string;
  layout?: string;
  audioOnly?: boolean;
  videoOnly?: boolean;
}

export interface EgressInfo {
  egressId: string;
  roomName: string;
  status: string;
  startedAt?: bigint;
  endedAt?: bigint;
  error?: string;
}

@Injectable()
export class RtmpEgressService {
  private readonly logger = new Logger(RtmpEgressService.name);
  private egressClient: EgressClient;
  private livekitUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(private configService: ConfigService) {
    this.livekitUrl = this.configService.get('LIVEKIT_URL') || 'ws://localhost:7880';
    this.apiKey = this.configService.get('LIVEKIT_API_KEY') || 'devkey';
    this.apiSecret = this.configService.get('LIVEKIT_API_SECRET') || 'devsecret';

    const httpUrl = this.livekitUrl
      .replace('ws://', 'http://')
      .replace('wss://', 'https://');

    this.egressClient = new EgressClient(httpUrl, this.apiKey, this.apiSecret);
  }

  async startRoomCompositeEgress(options: RtmpEgressOptions): Promise<EgressInfo> {
    try {
      const streamUrl = new URL(options.rtmpUrl);
      streamUrl.pathname = streamUrl.pathname || '/live';
      const fullRtmpUrl = `${streamUrl.protocol}//${streamUrl.host}${streamUrl.pathname}/${options.streamKey}`;

      const streamOutput = new StreamOutput({
        protocol: StreamProtocol.RTMP,
        urls: [fullRtmpUrl],
      });

      this.logger.log(`Starting RTMP egress for room: ${options.roomName}`);
      const info = await this.egressClient.startRoomCompositeEgress(
        options.roomName,
        streamOutput,
        {
          layout: options.layout || 'grid-light',
          audioOnly: options.audioOnly,
          videoOnly: options.videoOnly,
        },
      );

      return {
        egressId: info.egressId,
        roomName: info.roomName,
        status: info.status.toString(),
        startedAt: info.startedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to start RTMP egress: ${error.message}`, error.stack);
      throw new Error(`Failed to start RTMP egress: ${error.message}`);
    }
  }

  async stopEgress(egressId: string): Promise<EgressInfo> {
    try {
      this.logger.log(`Stopping egress: ${egressId}`);
      const info = await this.egressClient.stopEgress(egressId);

      return {
        egressId: info.egressId,
        roomName: info.roomName,
        status: info.status.toString(),
        startedAt: info.startedAt,
        endedAt: info.endedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to stop egress: ${error.message}`, error.stack);
      throw new Error(`Failed to stop egress: ${error.message}`);
    }
  }

  async listEgress(roomName?: string): Promise<EgressInfo[]> {
    try {
      const egresses = await this.egressClient.listEgress({ roomName });
      
      return egresses.map((info) => ({
        egressId: info.egressId,
        roomName: info.roomName,
        status: info.status.toString(),
        startedAt: info.startedAt,
        endedAt: info.endedAt,
        error: info.error,
      }));
    } catch (error) {
      this.logger.error(`Failed to list egress: ${error.message}`, error.stack);
      throw new Error(`Failed to list egress: ${error.message}`);
    }
  }

  async getEgressInfo(egressId: string): Promise<EgressInfo> {
    try {
      const egresses = await this.egressClient.listEgress({});
      const info = egresses.find((e) => e.egressId === egressId);

      if (!info) {
        throw new Error(`Egress not found: ${egressId}`);
      }

      return {
        egressId: info.egressId,
        roomName: info.roomName,
        status: info.status.toString(),
        startedAt: info.startedAt,
        endedAt: info.endedAt,
        error: info.error,
      };
    } catch (error) {
      this.logger.error(`Failed to get egress info: ${error.message}`, error.stack);
      throw new Error(`Failed to get egress info: ${error.message}`);
    }
  }
}
