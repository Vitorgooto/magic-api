import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DeckModule } from './deck/deck.module';
import { UserModule } from './user/user.module';
import { AppService } from './app.service';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/magic-api'), // Conexão com MongoDB
    AuthModule, // Módulo de autenticação
    DeckModule, // Módulo de decks
    UserModule, // Módulo de usuários
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
