import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Deck as DeckSchema } from './deck.schema';
import * as mongoose from 'mongoose';

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
    private deckModel: mongoose.Model<DeckSchema>
  ) {}

  // Create a new deck
  createDeck(name: string): string {
    if (!this.decks[name]) {
      this.decks[name] = new Deck(name);
      return `Deck '${name}' created successfully.`;
    } else {
      return `Deck '${name}' already exists.`;
    }
  }

  // Get a specific deck
  getDeck(name: string): Deck | undefined {
    return this.decks[name];
  }

  // List all decks
  listDecks(): string[] {
    return Object.keys(this.decks);
  }

  // Add a card to a deck
  addCardToDeck(deckName: string, card: Card): string {
    const deck = this.getDeck(deckName);
    if (deck) {
      deck.cards.push(card);
      return `Card '${card.name}' added to deck '${deckName}'.`;
    } else {
      return `Deck '${deckName}' not found.`;
    }
  }

  // Fetch commander from Scryfall API
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

  // Fetch cards by colors from Scryfall API
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

  // Create a deck with a commander
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
      cards: cards
    });
    
    return deck.save();
  }

  // Find all decks
  async findAll(): Promise<DeckSchema[]> {
    return this.deckModel.find();
  }

  // Create a deck entry in the database
  async create(deck: DeckSchema): Promise<DeckSchema> {
    return this.deckModel.create(deck);
  }

  // Find a deck by ID
  async findById(id: string): Promise<DeckSchema> {
    const deck = await this.deckModel.findById(id);
    if (!deck) {
      throw new NotFoundException('The deck was not found');
    }
    return deck;
  }

  // Update a deck by ID
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

  // Delete a deck by ID
  async deleteById(id: string): Promise<DeckSchema> {
    const deletedDeck = await this.deckModel.findByIdAndDelete(id);
    if (!deletedDeck) {
      throw new NotFoundException('The deck was not found for deletion');
    }
    return deletedDeck;
  }
}
