import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { BullModule } from '@nestjs/bull';
import { DeckService } from './deck/deck.service';
import { DeckImportWorker } from './deck/deck-import.worker';
import { DeckUpdatesWorker } from './deck/deck-updates.worker';

@Module({
  imports: [
    PrometheusModule.register(),
    BullModule.forRoot({
      redis: { host: 'localhost', port: 6379 },
    }),
    BullModule.registerQueue(
      { name: 'deck-import', options: { redis: { host: 'localhost', port: 6379 } } },
      { name: 'deck-updates', options: { redis: { host: 'localhost', port: 6379 } } },
    ),
  ],
  providers: [DeckService, DeckImportWorker, DeckUpdatesWorker],
})
export class AppModule {}