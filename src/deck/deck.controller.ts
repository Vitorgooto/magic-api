import { Controller, Get, Post, Body, Param, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { DeckService } from './deck.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/role.guard';


@Controller('deck')
export class DeckController {
  constructor(private readonly deckService: DeckService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['admin'])  // Apenas 'admin' pode acessar
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

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getDeckById(@Param('id') deckId: string) {
    return this.deckService.findDeckById(deckId);
  }
}
