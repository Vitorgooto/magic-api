import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { DeckService } from './deck.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('deck')
export class DeckController {
  constructor(private readonly deckService: DeckService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createDeck(@Request() req, @Body() body: any) {
    const { commander, colors } = body;
    return this.deckService.createDeck(req.user.userId, commander, colors);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserDecks(@Request() req) {
    return this.deckService.findAllByUser(req.user.userId);
  }
}
