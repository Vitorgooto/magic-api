import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { DeckService } from './deck.service';
import { Deck as DeckSchema } from './deck.schema';
import { createDeckDto } from './dto/create-deck.dto';
import { updateDeckDto } from './dto/update-deck.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/role.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { NotificationsGateway } from '../notifications/notifications.gateway';

class Card {
    constructor(public name: string, public type: string, public manaCost: string) {}
}

@Controller('decks')
export class DecksController {
    constructor(
        private readonly deckService: DeckService,
        private readonly notificationsGateway: NotificationsGateway,
    ) {}

    @Get('commander')
    async getCommander(@Query('name') name: string): Promise<any> {
        if (!name) {
            throw new Error('Missing "name" query parameter');
        }
        return this.deckService.fetchCommander(name);
    }

    @Get('my-decks')
    @UseGuards(AuthGuard('jwt'))
    async getMyDecks(@Request() req): Promise<any> {
        const userId = req.user.id;
        return this.deckService.findDecksByUser(userId);
    }

    @Post('newDeckWithCommander')
    @UseGuards(AuthGuard())
    async createDeckWithCommander(
        @Query('commanderName') commanderName: string,
        @Query('deckName') deckName: string,
    ): Promise<DeckSchema> {
        return this.deckService.createDeckWithCommander(commanderName, deckName);
    }

    @Get('allDecks')
    @UseGuards(AuthGuard(), RolesGuard)
    async getAllDecks(): Promise<DeckSchema[]> {
        return this.deckService.findAll();
    }

    @Post('newDeckManual')
    @UseGuards(AuthGuard())
    async createDeck(@Body() deck: createDeckDto): Promise<DeckSchema> {
        return this.deckService.create(deck);
    }

    @Get(':id')
    async getById(@Param('id') id: string): Promise<DeckSchema> {
        return this.deckService.findById(id);
    }

    @Put('/updateDeck/:id')
    @UseGuards(AuthGuard())
    async updateDeck(
        @Param('id') id: string,
        @Body() deck: updateDeckDto,
    ): Promise<DeckSchema> {
        return this.deckService.updateById(id, deck);
    }

    @Delete('/deleteDeck/:id')
    @UseGuards(AuthGuard())
    async deleteById(@Param('id') id: string): Promise<DeckSchema> {
        return this.deckService.deleteById(id);
    }

    
    @Post('createDeck')
    createDeck(@Body('name') name: string): string {
        return this.deckService.createDeck(name);
    }

    @Get('listDecks')
    @UseInterceptors(CacheInterceptor) 
    listDecks(): string[] {
      return this.deckService.listDecks();
    }

    @Post(':deckName/cards')
    addCard(@Param('deckName') deckName: string, @Body() cardData: { name: string; type: string; manaCost: string }): string {
        const card = new Card(cardData.name, cardData.type, cardData.manaCost);
        return this.deckService.addCardToDeck(deckName, card);
    }

    @Post('importDeck')
    @UseGuards(AuthGuard()) 
    async importDeck(@Body() deckData: createDeckDto): Promise<any> {
        const deck = await this.deckService.importDeck(deckData);
        this.notificationsGateway.sendDeckImportStatus(deck.id, 'Import started');
        return { message: 'Deck import initiated', deckId: deck.id };
    }
}
