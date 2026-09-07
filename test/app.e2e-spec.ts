import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('App API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/auth/login (POST) logs in the seeded personal user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'personal@fitforge.app', password: 'personal123' })
      .expect(200);

    expect(response.body).toMatchObject({
      role: 'personal',
      name: 'Personal FitForge',
    });
    expect(response.body.token).toEqual(expect.any(String));

    const payload = app.get(JwtService).decode(response.body.token) as {
      role: string;
    };
    expect(payload.role).toBe('personal');
  });

  it('/api/auth/login (POST) logs in the seeded aluno user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'aluno@fitforge.app', password: 'aluno123' })
      .expect(200);

    expect(response.body).toMatchObject({
      role: 'aluno',
      name: 'Aluno FitForge',
    });
    expect(response.body.token).toEqual(expect.any(String));
  });

  it('/api/auth/login (POST) rejects incorrect credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'personal@fitforge.app', password: 'incorrect' })
      .expect(401);

    expect(response.body).toMatchObject({
      message: 'Invalid email or password',
    });
    expect(response.body.token).toBeUndefined();
  });

  it('/api/auth/login (POST) rejects missing credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'personal@fitforge.app' })
      .expect(400);

    expect(response.body.token).toBeUndefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
