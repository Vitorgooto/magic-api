import { Colors } from "../deck.schema";

export class updateDeckDto {
    readonly name: string;
    readonly commanderName: string;
    readonly cards: string[];
    readonly colors: Colors[];
}
