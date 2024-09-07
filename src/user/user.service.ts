import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deck } from './deck.schema';
import axios from 'axios';

@Injectable()
export class DeckService {
  constructor(@InjectModel(Deck.name) private deckModel: Model<Deck>) {}

  async createDeck(owner: string, commander: string, colors: string[]): Promise<Deck> {
    const cards = await this.getCommanderDeck(commander, colors);
    const newDeck = new this.deckModel({ owner, commander, cards, colors });
    return newDeck.save();
  }

  async getCommanderDeck(commander: string, colors: string[]): Promise<string[]> {
    const response = await axios.get(`https://api.scryfall.com/cards/search?q=type%3Acommander`);
    const cards = response.data.data.filter(card => {
      return colors.includes(card.colors.join('')) && card.legalities.commander === 'legal';
    });
    return cards.slice(0, 99).map(card => card.name);
  }

  async findAllByUser(userId: string): Promise<Deck[]> {
    return this.deckModel.find({ owner: userId }).exec();
  }
}
