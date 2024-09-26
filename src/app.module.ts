import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DeckModule } from './deck/deck.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    AuthModule,
    DeckModule,
    MongooseModule.forRoot('mongodb://localhost:27017/magic'),  // Conexão com MongoDB
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
