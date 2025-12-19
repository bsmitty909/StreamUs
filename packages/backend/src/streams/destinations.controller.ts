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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DestinationsService } from './destinations.service';
import type { CreateDestinationDto } from '@streamus/shared';

@Controller('streams/:streamId/destinations')
@UseGuards(JwtAuthGuard)
export class DestinationsController {
  constructor(private destinationsService: DestinationsService) {}

  @Post()
  async create(
    @Param('streamId') streamId: string,
    @Body() createDestinationDto: CreateDestinationDto,
    @Request() req: any,
  ) {
    return this.destinationsService.create(
      streamId,
      req.user.userId,
      createDestinationDto,
    );
  }

  @Get()
  async findAll(
    @Param('streamId') streamId: string,
    @Request() req: any,
  ) {
    return this.destinationsService.findByStream(streamId, req.user.userId);
  }

  @Get(':id')
  async findOne(
    @Param('streamId') streamId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.destinationsService.findOne(id, streamId, req.user.userId);
  }

  @Delete(':id')
  async remove(
    @Param('streamId') streamId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.destinationsService.remove(id, streamId, req.user.userId);
  }

  @Post(':id/start')
  async startStreaming(
    @Param('streamId') streamId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.destinationsService.startStreaming(id, streamId, req.user.userId);
  }

  @Post(':id/stop')
  async stopStreaming(
    @Param('streamId') streamId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.destinationsService.stopStreaming(id, streamId, req.user.userId);
  }
}
