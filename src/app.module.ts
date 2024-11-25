import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DeckModule } from './deck/deck.module';
import { DecksModule } from './deck/deck.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    AuthModule,
    DeckModule,
    DecksModule,  
    MongooseModule.forRoot('mongodb://localhost:27017/magic'), 
    CacheModule.register({
      ttl: 300, 
      max: 100, 
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
