import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GuestsService } from './guests.service';

@Controller('streams/:streamId/guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post('invite')
  @UseGuards(AuthGuard('jwt'))
  async createGuestInvite(
    @Param('streamId') streamId: string,
    @Body() body: { displayName?: string; expiresIn?: number },
  ): Promise<{ guestToken: string; joinUrl: string }> {
    const guest = await this.guestsService.createInvite(
      streamId,
      body.displayName || 'Guest',
      body.expiresIn,
    );

    const joinUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/guest/${guest.joinToken}`;

    return {
      guestToken: guest.joinToken,
      joinUrl,
    };
  }
}
