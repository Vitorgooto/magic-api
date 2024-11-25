import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { createDeckDto } from './dto/create-deck.dto';
import { Deck as DeckSchema } from './deck.schema';

class Card {
  constructor(public name: string, public type: string, public manaCost: string) {}
}

class Deck {
  public cards: Card[];

  constructor(public name: string) {
    this.cards = [];
  }
}

@Injectable()
export class DeckService {
  private decks: Record<string, Deck> = {};

  constructor(
    @InjectModel(DeckSchema.name)
    private readonly deckModel: mongoose.Model<DeckSchema>,
    @InjectQueue('deck-import') private readonly deckQueue: Queue,
  ) {}

  async findDecksByUser(userId: string): Promise<DeckSchema[]> {
    return this.deckModel.find({ owner: userId }).exec();
  }


  createDeck(name: string): string {
    if (!this.decks[name]) {
      this.decks[name] = new Deck(name);
      return `Deck '${name}' created successfully.`;
    } else {
      return `Deck '${name}' already exists.`;
    }
  }


  getDeck(name: string): Deck | undefined {
    return this.decks[name];
  }

  listDecks(): string[] {
    return Object.keys(this.decks);
  }

  addCardToDeck(deckName: string, card: Card): string {
    const deck = this.getDeck(deckName);
    if (deck) {
      deck.cards.push(card);
      return `Card '${card.name}' added to deck '${deckName}'.`;
    } else {
      return `Deck '${deckName}' not found.`;
    }
  }

 
  async importDeck(deckData: createDeckDto): Promise<DeckSchema> {
    const commander = await this.fetchCommander(deckData.commanderName);
    if (!commander) {
      throw new NotFoundException(`Commander '${deckData.commanderName}' not found.`);
    }

 
    const commanderColors = commander.colors || [];
    const isValidColors = deckData.colors.every(color => commanderColors.includes(color));
    if (!isValidColors) {
      throw new BadRequestException(`Invalid colors provided for commander '${deckData.commanderName}'.`);
    }

  
    await this.deckQueue.add('import', deckData);
    return { message: 'Deck import initiated', deckId: deckData.deckId } as any;
  }


  async updateDeck(deckData: any) {
    await this.deckQueue.add('update', deckData);
    return { message: 'Deck update sent', deckId: deckData.deckId };
  }


  async fetchCommander(commanderName: string): Promise<any> {
    const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(commanderName)}`;
    console.log(`Fetching commander from URL: ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new InternalServerErrorException('Error fetching commander data');
      }
      const data = await response.json();
      console.log('Response from Scryfall API:', data);
      return data;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch commander', error);
    }
  }


  async fetchCardsByColors(colors: string[]): Promise<string[]> {
    const colorQuery = colors.join(',');
    const response = await fetch(`https://api.scryfall.com/cards/search?q=color%3D${colorQuery}&unique=cards&order=random`);
    const data = await response.json();

    const cards: string[] = [];

    for (const card of data.data) {
      if (card.type_line.includes('Basic Land')) {
        cards.push(card.name);
        if (cards.length === 99) break;
        continue;
      }

      const isRepeatable = card.oracle_text && card.oracle_text.includes('A deck can have any number of cards named');
      if (!isRepeatable && cards.includes(card.name)) continue;

      cards.push(card.name);
      if (cards.length === 99) break;
    }

    return cards;
  }

  async createDeckWithCommander(commanderName: string, deckName: string): Promise<DeckSchema> {
    const commander = await this.fetchCommander(commanderName);
    if (!commander) {
      throw new NotFoundException('Commander not found');
    }
    const commanderColors = commander.colors || [];
    const cards = await this.fetchCardsByColors(commanderColors);

    const deck = new this.deckModel({
      name: deckName,
      commanderName: commander.name,
      colors: commanderColors,
      cards: cards,
    });

    return deck.save();
  }

  
  async findAll(): Promise<DeckSchema[]> {
    return this.deckModel.find();
  }


  async create(deck: DeckSchema): Promise<DeckSchema> {
    return this.deckModel.create(deck);
  }

  async findById(id: string): Promise<DeckSchema> {
    const deck = await this.deckModel.findById(id);
    if (!deck) {
      throw new NotFoundException('The deck was not found');
    }
    return deck;
  }


  async updateById(id: string, deck: DeckSchema): Promise<DeckSchema> {
    const updatedDeck = await this.deckModel.findByIdAndUpdate(id, deck, {
      new: true,
      runValidators: true,
    });
    if (!updatedDeck) {
      throw new NotFoundException('The deck was not found for update');
    }
    return updatedDeck;
  }


  async deleteById(id: string): Promise<DeckSchema> {
    const deletedDeck = await this.deckModel.findByIdAndDelete(id);
    if (!deletedDeck) {
      throw new NotFoundException('The deck was not found for deletion');
    }
    return deletedDeck;
  }
}
