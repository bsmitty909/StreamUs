import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StreamDestination } from '../database/entities/stream-destination.entity';
import { Stream } from '../database/entities/stream.entity';
import { CreateDestinationDto, DestinationStatus } from '@streamus/shared';
import { RtmpEgressService } from '../livekit/rtmp-egress.service';

@Injectable()
export class DestinationsService {
  private egressMap: Map<string, string> = new Map();

  constructor(
    @InjectRepository(StreamDestination)
    private destinationRepository: Repository<StreamDestination>,
    @InjectRepository(Stream)
    private streamRepository: Repository<Stream>,
    private rtmpEgressService: RtmpEgressService,
  ) {}

  async create(
    streamId: string,
    userId: string,
    createDestinationDto: CreateDestinationDto,
  ): Promise<StreamDestination> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId, userId },
    });

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    const destination = this.destinationRepository.create({
      streamId,
      platform: createDestinationDto.platform,
      rtmpUrl: createDestinationDto.rtmpUrl,
      streamKey: createDestinationDto.streamKey,
      status: DestinationStatus.PENDING,
      metadata: createDestinationDto.metadata,
    });

    return this.destinationRepository.save(destination);
  }

  async findByStream(streamId: string, userId: string): Promise<StreamDestination[]> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId, userId },
    });

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    return this.destinationRepository.find({
      where: { streamId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, streamId: string, userId: string): Promise<StreamDestination> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId, userId },
    });

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    const destination = await this.destinationRepository.findOne({
      where: { id, streamId },
    });

    if (!destination) {
      throw new NotFoundException('Destination not found');
    }

    return destination;
  }

  async remove(id: string, streamId: string, userId: string): Promise<void> {
    const destination = await this.findOne(id, streamId, userId);

    if (this.egressMap.has(id)) {
      await this.stopStreaming(id, streamId, userId);
    }

    await this.destinationRepository.remove(destination);
  }

  async startStreaming(id: string, streamId: string, userId: string): Promise<StreamDestination> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId, userId },
    });

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    if (!stream.livekitRoomName) {
      throw new Error('Stream has no LiveKit room');
    }

    const destination = await this.findOne(id, streamId, userId);

    try {
      const egressInfo = await this.rtmpEgressService.startRoomCompositeEgress({
        roomName: stream.livekitRoomName,
        rtmpUrl: destination.rtmpUrl,
        streamKey: destination.streamKey,
      });

      this.egressMap.set(id, egressInfo.egressId);

      destination.status = DestinationStatus.CONNECTED;
      destination.metadata = {
        ...destination.metadata,
        egressId: egressInfo.egressId,
        startedAt: egressInfo.startedAt ? Number(egressInfo.startedAt) : Date.now(),
      };

      return this.destinationRepository.save(destination);
    } catch (error) {
      destination.status = DestinationStatus.ERROR;
      destination.metadata = {
        ...destination.metadata,
        error: error.message,
      };
      await this.destinationRepository.save(destination);
      throw error;
    }
  }

  async stopStreaming(id: string, streamId: string, userId: string): Promise<StreamDestination> {
    const destination = await this.findOne(id, streamId, userId);

    const egressId = this.egressMap.get(id) || destination.metadata?.egressId;

    if (!egressId) {
      throw new Error('No active egress found for this destination');
    }

    try {
      await this.rtmpEgressService.stopEgress(egressId);
      this.egressMap.delete(id);

      destination.status = DestinationStatus.DISCONNECTED;
      destination.metadata = {
        ...destination.metadata,
        stoppedAt: Date.now(),
      };

      return this.destinationRepository.save(destination);
    } catch (error) {
      destination.status = DestinationStatus.ERROR;
      destination.metadata = {
        ...destination.metadata,
        error: error.message,
      };
      await this.destinationRepository.save(destination);
      throw error;
    }
  }

  async getStreamHealth(id: string, streamId: string, userId: string): Promise<any> {
    const destination = await this.findOne(id, streamId, userId);
    const egressId = this.egressMap.get(id) || destination.metadata?.egressId;

    if (!egressId) {
      return { status: 'inactive' };
    }

    try {
      const egressInfo = await this.rtmpEgressService.getEgressInfo(egressId);
      return {
        status: egressInfo.status,
        startedAt: egressInfo.startedAt,
        endedAt: egressInfo.endedAt,
        error: egressInfo.error,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}
