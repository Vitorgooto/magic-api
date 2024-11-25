import { Colors } from "../deck.schema";

export class createDeckDto {
  readonly deckId: string; 
  readonly name: string;
  readonly commanderName: string;
  readonly cards: string[];
  readonly colors: Colors[];
}
