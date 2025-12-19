import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StreamsService } from './streams.service';
import { CreateStreamDto } from './dto/create-stream.dto';
import { Stream } from '../database/entities/stream.entity';

@Controller('streams')
@UseGuards(AuthGuard('jwt'))
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Post()
  async createStream(
    @Request() req,
    @Body() createStreamDto: CreateStreamDto,
  ): Promise<Stream> {
    return this.streamsService.create(
      req.user.userId,
      createStreamDto.title,
      createStreamDto.description,
    );
  }

  @Get()
  async getMyStreams(@Request() req): Promise<Stream[]> {
    return this.streamsService.findByUser(req.user.userId);
  }

  @Get(':id')
  async getStream(@Param('id') id: string): Promise<Stream> {
    return this.streamsService.findById(id);
  }

  @Post(':id/token')
  async getJoinToken(
    @Param('id') streamId: string,
    @Request() req,
  ): Promise<{ token: string }> {
    const token = await this.streamsService.generateParticipantToken(
      streamId,
      req.user.userId,
      req.user.email,
    );
    return { token };
  }

  @Delete(':id')
  async deleteStream(
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.streamsService.delete(id, req.user.userId);
    return { message: 'Stream deleted successfully' };
  }
}
