import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
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
    app.use(cookieParser());
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  function login(email: string, password: string) {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password });
  }

  function sessionCookie(response: request.Response) {
    const setCookie = response.headers['set-cookie']?.[0];

    expect(setCookie).toBeDefined();
    return setCookie!.split(';')[0];
  }

  it('/api/auth/login (POST) sets a session cookie for the seeded personal user', async () => {
    const response = await login('personal@fitforge.app', 'personal123').expect(
      200,
    );

    expect(response.body).toMatchObject({
      role: 'personal',
      name: 'Personal FitForge',
    });
    expect(response.body.token).toBeUndefined();
    expect(response.headers['set-cookie']?.[0]).toMatch(
      /session=.*HttpOnly.*Secure.*SameSite=Lax/,
    );
  });

  it('/api/auth/login (POST) logs in the seeded aluno user', async () => {
    const response = await login('aluno@fitforge.app', 'aluno123').expect(200);

    expect(response.body).toMatchObject({
      role: 'aluno',
      name: 'Aluno FitForge',
    });
    expect(response.body.token).toBeUndefined();
  });

  it('/api/auth/login (POST) rejects incorrect credentials', async () => {
    const response = await login('personal@fitforge.app', 'incorrect').expect(
      401,
    );

    expect(response.body).toMatchObject({
      message: 'Invalid email or password',
    });
    expect(response.body.token).toBeUndefined();
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('/api/auth/login (POST) rejects missing credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'personal@fitforge.app' })
      .expect(400);

    expect(response.body.token).toBeUndefined();
  });

  it('/api/auth/me (GET) returns the active session identity', async () => {
    const loginResponse = await login(
      'personal@fitforge.app',
      'personal123',
    ).expect(200);

    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', sessionCookie(loginResponse))
      .expect(200);

    expect(response.body).toEqual({
      role: 'personal',
      name: 'Personal FitForge',
    });
  });

  it('/api/auth/me (GET) rejects absent or invalid session cookies', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', 'session=invalid-token')
      .expect(401);
  });

  it('/api/auth/logout (POST) clears the session cookie', async () => {
    const loginResponse = await login(
      'personal@fitforge.app',
      'personal123',
    ).expect(200);

    const logoutResponse = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', sessionCookie(loginResponse))
      .expect(200);

    expect(logoutResponse.headers['set-cookie']?.[0]).toMatch(
      /session=;.*Expires=Thu, 01 Jan 1970.*HttpOnly.*Secure.*SameSite=Lax/,
    );
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
