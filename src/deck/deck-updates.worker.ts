import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { DeckService } from './deck.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Processor('deck-import')
export class DeckImportWorker {
  constructor(
    private readonly deckService: DeckService,
    @InjectQueue('deck-updates') private readonly deckUpdatesQueue: Queue,
  ) {}

  @Process('import')
  async handleImport(job: Job<any>) {
    console.log(`Processing task with priority: ${job.opts.priority}`); // Log de prioridade
    const deckData = job.data;

    try {
      const deck = await this.deckService.findById(deckData.deckId);

      await this.deckService.updateById(deckData.deckId, deckData);

      await this.deckUpdatesQueue.add('notify', {
        deckId: deckData.deckId,
        action: 'import_completed',
      });

      console.log(`Successfully processed deck ${deckData.deckId} with priority ${job.opts.priority}`);
    } catch (error) {
      console.error(`Error processing deck: ${error.message}`);
    }
  }
}
