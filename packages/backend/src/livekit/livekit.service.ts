import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

@Injectable()
export class LiveKitService {
  private roomClient: RoomServiceClient;
  private livekitUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(private configService: ConfigService) {
    this.livekitUrl = this.configService.get('LIVEKIT_URL') || 'ws://localhost:7880';
    this.apiKey = this.configService.get('LIVEKIT_API_KEY') || 'devkey';
    this.apiSecret = this.configService.get('LIVEKIT_API_SECRET') || 'devsecret';

    this.roomClient = new RoomServiceClient(
      this.livekitUrl.replace('ws://', 'http://').replace('wss://', 'https://'),
      this.apiKey,
      this.apiSecret,
    );
  }

  async createRoom(roomName: string, emptyTimeout: number = 300): Promise<any> {
    return this.roomClient.createRoom({
      name: roomName,
      emptyTimeout,
      maxParticipants: 10,
    });
  }

  async deleteRoom(roomName: string): Promise<void> {
    await this.roomClient.deleteRoom(roomName);
  }

  async listRooms(): Promise<any[]> {
    const rooms = await this.roomClient.listRooms();
    return rooms;
  }

  async generateToken(
    roomName: string,
    participantIdentity: string,
    participantName?: string,
    metadata?: string,
  ): Promise<string> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantIdentity,
      name: participantName || participantIdentity,
      metadata: metadata,
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return at.toJwt();
  }

  async generateGuestToken(
    roomName: string,
    guestIdentity: string,
    guestName: string,
  ): Promise<string> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: guestIdentity,
      name: guestName,
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return at.toJwt();
  }
}
