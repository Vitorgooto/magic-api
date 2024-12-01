import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { createDeckDto } from './dto/create-deck.dto';
import { Deck as DeckSchema } from './deck.schema';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PrometheusService } from '@willsoto/nestjs-prometheus';

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
  private readonly taskCounter;

  constructor(
    @InjectModel(DeckSchema.name)
    private readonly deckModel: mongoose.Model<DeckSchema>,
    @InjectQueue('deck-import') private readonly deckQueue: Queue,
    private readonly prometheusService: PrometheusService,
    private readonly amqpConnection: AmqpConnection,
  ) {
    // Configura o contador Prometheus
    this.taskCounter = this.prometheusService.getCounter({
      name: 'task_priority_count',
      help: 'Count of tasks processed by priority level',
      labelNames: ['priority'],
    });
  }

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

  async importDeckWithPriority(deckData: createDeckDto, isAdmin: boolean): Promise<DeckSchema> {
    const priority = isAdmin ? 1 : 5; // 1 = Alta prioridade, 5 = Baixa prioridade
    this.taskCounter.inc({ priority: priority.toString() }); // Incrementa métrica Prometheus

    const commander = await this.fetchCommander(deckData.commanderName);
    if (!commander) {
      throw new NotFoundException(`Commander '${deckData.commanderName}' not found.`);
    }

    const commanderColors = commander.colors || [];
    const isValidColors = deckData.colors.every(color => commanderColors.includes(color));
    if (!isValidColors) {
      throw new BadRequestException(`Invalid colors provided for commander '${deckData.commanderName}'.`);
    }

    const deck = new this.deckModel(deckData);
    await deck.save();

    const message = {
      deckId: deck.id,
      name: deck.name,
      cards: deckData.cards,
    };

    // Adicionando à fila com prioridade
    await this.deckQueue.add('import', message, { priority });

    return deck;
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

  async createDeckWith
