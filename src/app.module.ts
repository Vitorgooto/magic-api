import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DeckModule } from './deck/deck.module';
import { DecksModule } from './decks/decks.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    AuthModule,
    DeckModule,
    DecksModule,  // Import the DecksModule
    MongooseModule.forRoot('mongodb://localhost:27017/magic'),  // Connection to MongoDB
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
