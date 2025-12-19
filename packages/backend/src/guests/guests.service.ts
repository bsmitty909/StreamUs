import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guest } from '../database/entities/guest.entity';
import { Stream } from '../database/entities/stream.entity';
import { GuestRole } from '@streamus/shared';
import { randomBytes } from 'crypto';

@Injectable()
export class GuestsService {
  constructor(
    @InjectRepository(Guest)
    private guestRepository: Repository<Guest>,
    @InjectRepository(Stream)
    private streamRepository: Repository<Stream>,
  ) {}

  async createInvite(
    streamId: string,
    displayName: string,
    expiresInHours: number = 24,
  ): Promise<Guest> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId },
    });

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    const joinToken = randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + expiresInHours);

    const guest = this.guestRepository.create({
      streamId,
      displayName,
      joinToken,
      role: GuestRole.GUEST,
      permissions: {
        audio: true,
        video: true,
        screenShare: true,
      },
      tokenExpiresAt,
    });

    return this.guestRepository.save(guest);
  }

  async findByToken(joinToken: string): Promise<Guest> {
    const guest = await this.guestRepository.findOne({
      where: { joinToken },
      relations: ['stream'],
    });

    if (!guest) {
      throw new NotFoundException('Invalid guest token');
    }

    if (guest.tokenExpiresAt && guest.tokenExpiresAt < new Date()) {
      throw new NotFoundException('Guest token expired');
    }

    return guest;
  }
}
