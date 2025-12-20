import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentStatus } from '../database/entities/comment.entity';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
  namespace: '/comments',
})
export class CommentsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CommentsGateway.name);
  private streamConnections = new Map<string, Set<string>>();

  constructor(private readonly commentsService: CommentsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.streamConnections.forEach((clients, streamId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.streamConnections.delete(streamId);
      }
    });
  }

  @SubscribeMessage('joinStream')
  handleJoinStream(
    @MessageBody() data: { streamId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { streamId } = data;
    
    if (!this.streamConnections.has(streamId)) {
      this.streamConnections.set(streamId, new Set());
    }
    
    this.streamConnections.get(streamId)!.add(client.id);
    client.join(`stream:${streamId}`);
    
    this.logger.log(`Client ${client.id} joined stream ${streamId}`);
    return { success: true };
  }

  @SubscribeMessage('leaveStream')
  handleLeaveStream(
    @MessageBody() data: { streamId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { streamId } = data;
    
    const clients = this.streamConnections.get(streamId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.streamConnections.delete(streamId);
      }
    }
    
    client.leave(`stream:${streamId}`);
    this.logger.log(`Client ${client.id} left stream ${streamId}`);
    return { success: true };
  }

  @SubscribeMessage('moderateComment')
  async handleModerateComment(
    @MessageBody() data: { commentId: string; status: CommentStatus },
  ) {
    const { commentId, status } = data;
    const comment = await this.commentsService.updateCommentStatus(
      commentId,
      status,
    );
    
    this.server
      .to(`stream:${comment.streamId}`)
      .emit('commentModerated', comment);
    
    return { success: true };
  }

  async broadcastNewComment(streamId: string, comment: any) {
    this.server.to(`stream:${streamId}`).emit('newComment', comment);
  }

  async broadcastCommentUpdate(streamId: string, comment: any) {
    this.server.to(`stream:${streamId}`).emit('commentUpdated', comment);
  }

  async broadcastCommentDeleted(streamId: string, commentId: string) {
    this.server.to(`stream:${streamId}`).emit('commentDeleted', { commentId });
  }
}
