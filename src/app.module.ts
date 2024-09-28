import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DeckModule } from './deck/deck.module';
import { DecksModule } from './decks/decks.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    AuthModule,
    DeckModule,
    DecksModule,  // Import the DecksModule
    MongooseModule.forRoot('mongodb://localhost:27017/magic'),  // Connection to MongoDB
    CacheModule.register({
      ttl: 300, // Tempo de vida do cache em segundos (aqui, 5 minutos)
      max: 100, // Máximo de itens no cache
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
