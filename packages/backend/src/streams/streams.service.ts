import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StreamStatus } from '@streamus/shared';
import { Stream } from '../database/entities/stream.entity';
import { LiveKitService } from '../livekit/livekit.service';

@Injectable()
export class StreamsService {
  constructor(
    @InjectRepository(Stream)
    private streamRepository: Repository<Stream>,
    private livekitService: LiveKitService,
  ) {}

  async create(userId: string, title: string, description?: string): Promise<Stream> {
    const roomName = `stream-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    await this.livekitService.createRoom(roomName);

    const stream = this.streamRepository.create({
      userId,
      title,
      description,
      livekitRoomName: roomName,
      status: StreamStatus.DRAFT,
    });

    return this.streamRepository.save(stream);
  }

  async findByUser(userId: string): Promise<Stream[]> {
    return this.streamRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(streamId: string): Promise<Stream> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId },
    });

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    return stream;
  }

  async generateParticipantToken(
    streamId: string,
    participantId: string,
    participantName: string,
  ): Promise<string> {
    const stream = await this.findById(streamId);
    
    if (!stream.livekitRoomName) {
      throw new Error('Stream has no LiveKit room');
    }

    return this.livekitService.generateToken(
      stream.livekitRoomName,
      participantId,
      participantName,
    );
  }

  async delete(streamId: string, userId: string): Promise<void> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId, userId },
    });

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    if (stream.livekitRoomName) {
      try {
        await this.livekitService.deleteRoom(stream.livekitRoomName);
      } catch (error) {
        // Room might already be deleted
      }
    }

    await this.streamRepository.remove(stream);
  }
}
