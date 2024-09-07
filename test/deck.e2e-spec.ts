import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('DeckController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/deck (POST)', () => {
    return request(app.getHttpServer())
      .post('/deck')
      .send({ commander: 'Gisa, Ressuscitadora Gloriosa', colors: ['B'] })
      .expect(201);
  });

  it('/deck (GET)', () => {
    return request(app.getHttpServer())
      .get('/deck')
      .expect(200)
      .expect([]);
  });
});
