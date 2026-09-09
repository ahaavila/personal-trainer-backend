import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Role } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { hashPassword } from './../src/auth/password.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('App API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.treinoExercicio.deleteMany();
    await prisma.treino.deleteMany();
    await prisma.fichaDeTreino.deleteMany();
    await prisma.exercicio.deleteMany();

    const personal = await prisma.user.findUniqueOrThrow({
      where: { email: 'personal@fitforge.app' },
    });
    const aluno = await prisma.user.findUniqueOrThrow({
      where: { email: 'aluno@fitforge.app' },
    });
    const exercise = await prisma.exercicio.create({
      data: {
        name: 'Supino reto',
        muscleGroup: 'Peito',
        createdByPersonalId: personal.id,
      },
    });
    const plan = await prisma.fichaDeTreino.create({
      data: {
        alunoId: aluno.id,
        personalId: personal.id,
        title: 'Ficha de hipertrofia',
      },
    });
    const workout = await prisma.treino.create({
      data: {
        fichaId: plan.id,
        name: 'Treino A',
        order: 1,
        completedAt: new Date('2026-09-08T10:00:00.000Z'),
      },
    });
    await prisma.treinoExercicio.create({
      data: { treinoId: workout.id, exercicioId: exercise.id, sets: 3, reps: 12 },
    });

    const passwordHash = await hashPassword('empty123');
    await prisma.user.upsert({
      where: { email: 'empty-personal@fitforge.app' },
      update: { passwordHash, name: 'Personal Sem Dados', role: Role.personal, personalId: null },
      create: {
        email: 'empty-personal@fitforge.app',
        passwordHash,
        name: 'Personal Sem Dados',
        role: Role.personal,
      },
    });
    await prisma.user.upsert({
      where: { email: 'empty-aluno@fitforge.app' },
      update: { passwordHash, name: 'Aluno Sem Plano', role: Role.aluno, personalId: null },
      create: {
        email: 'empty-aluno@fitforge.app',
        passwordHash,
        name: 'Aluno Sem Plano',
        role: Role.aluno,
      },
    });
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

  it('/api/dashboard/personal (GET) returns populated data scoped to the personal', async () => {
    const loginResponse = await login(
      'personal@fitforge.app',
      'personal123',
    ).expect(200);

    const response = await request(app.getHttpServer())
      .get('/api/dashboard/personal')
      .set('Cookie', sessionCookie(loginResponse))
      .expect(200);

    expect(response.body).toEqual({
      metrics: { clientsCount: 3, exercisesCount: 1, trainingPlansCount: 1 },
      upcomingTrainings: [
        {
          id: expect.any(Number),
          name: 'Treino A',
          planTitle: 'Ficha de hipertrofia',
          alunoName: 'Aluno FitForge',
        },
      ],
      weeklyEvolution: expect.arrayContaining([
        { day: 'day-1', value: 0 },
        { day: 'day-7', value: 0 },
      ]),
    });
    expect(response.body.weeklyEvolution).toHaveLength(7);
  });

  it('/api/dashboard/aluno (GET) returns only the authenticated aluno plan', async () => {
    const loginResponse = await login('aluno@fitforge.app', 'aluno123').expect(
      200,
    );

    const response = await request(app.getHttpServer())
      .get('/api/dashboard/aluno')
      .set('Cookie', sessionCookie(loginResponse))
      .expect(200);

    expect(response.body).toEqual({
      currentPlan: {
        id: expect.any(Number),
        title: 'Ficha de hipertrofia',
        personalName: 'Personal FitForge',
      },
      nextWorkouts: [{ id: expect.any(Number), name: 'Treino A', order: 1 }],
      progress: { completedWorkouts: 0, totalWorkouts: 1 },
      weeklyActivity: expect.arrayContaining([
        { day: 'day-1', value: 0 },
        { day: 'day-7', value: 0 },
      ]),
    });
    expect(response.body.weeklyActivity).toHaveLength(7);
  });

  it('/api/dashboard endpoints (GET) return stable empty states', async () => {
    const personalLogin = await login(
      'empty-personal@fitforge.app',
      'empty123',
    ).expect(200);
    const alunoLogin = await login('empty-aluno@fitforge.app', 'empty123').expect(
      200,
    );

    const personalResponse = await request(app.getHttpServer())
      .get('/api/dashboard/personal')
      .set('Cookie', sessionCookie(personalLogin))
      .expect(200);
    const alunoResponse = await request(app.getHttpServer())
      .get('/api/dashboard/aluno')
      .set('Cookie', sessionCookie(alunoLogin))
      .expect(200);

    expect(personalResponse.body).toMatchObject({
      metrics: { clientsCount: 0, exercisesCount: 0, trainingPlansCount: 0 },
      upcomingTrainings: [],
      weeklyEvolution: expect.any(Array),
    });
    expect(alunoResponse.body).toMatchObject({
      currentPlan: null,
      nextWorkouts: [],
      progress: { completedWorkouts: 0, totalWorkouts: 0 },
      weeklyActivity: expect.any(Array),
    });
  });

  it('/api/dashboard endpoints (GET) enforce sessions and roles', async () => {
    await request(app.getHttpServer()).get('/api/dashboard/personal').expect(401);
    await request(app.getHttpServer()).get('/api/dashboard/aluno').expect(401);

    const personalLogin = await login(
      'personal@fitforge.app',
      'personal123',
    ).expect(200);
    const alunoLogin = await login('aluno@fitforge.app', 'aluno123').expect(200);

    await request(app.getHttpServer())
      .get('/api/dashboard/aluno')
      .set('Cookie', sessionCookie(personalLogin))
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/dashboard/personal')
      .set('Cookie', sessionCookie(alunoLogin))
      .expect(403);
  });

  it('/api/alunos (GET) returns only assigned alunos with listing fields', async () => {
    const loginResponse = await login(
      'personal@fitforge.app',
      'personal123',
    ).expect(200);

    const response = await request(app.getHttpServer())
      .get('/api/alunos')
      .set('Cookie', sessionCookie(loginResponse))
      .expect(200);

    expect(response.body).toHaveLength(3);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Mariana Costa',
          email: 'mariana@fitforge.app',
          objective: 'emagrecimento',
          level: 'iniciante',
          status: 'ativo',
        }),
        expect.objectContaining({
          name: 'Aluno FitForge',
          email: 'aluno@fitforge.app',
          objective: 'não informado',
          level: 'não informado',
          status: 'não informado',
          latestWorkout: {
            name: 'Treino A',
            completedAt: '2026-09-08T10:00:00.000Z',
          },
        }),
      ]),
    );
    expect(response.body.map((aluno: { email: string }) => aluno.email)).not.toContain(
      'other-aluno@fitforge.app',
    );
  });

  it('/api/alunos (GET) applies search, status, objective, and combined filters', async () => {
    const loginResponse = await login(
      'personal@fitforge.app',
      'personal123',
    ).expect(200);
    const cookie = sessionCookie(loginResponse);

    await request(app.getHttpServer())
      .get('/api/alunos?search=MARIANA')
      .set('Cookie', cookie)
      .expect(200)
      .expect((response) => expect(response.body.map((aluno: { email: string }) => aluno.email)).toEqual(['mariana@fitforge.app']));
    await request(app.getHttpServer())
      .get('/api/alunos?status=inativo')
      .set('Cookie', cookie)
      .expect(200)
      .expect((response) => expect(response.body.map((aluno: { email: string }) => aluno.email)).toEqual(['lucas@fitforge.app']));
    await request(app.getHttpServer())
      .get('/api/alunos?objective=emagrecimento')
      .set('Cookie', cookie)
      .expect(200)
      .expect((response) => expect(response.body.map((aluno: { email: string }) => aluno.email)).toEqual(['mariana@fitforge.app']));
    await request(app.getHttpServer())
      .get('/api/alunos?search=Mariana&status=ativo&objective=emagrecimento')
      .set('Cookie', cookie)
      .expect(200)
      .expect((response) => expect(response.body.map((aluno: { email: string }) => aluno.email)).toEqual(['mariana@fitforge.app']));
  });

  it('/api/alunos (GET) rejects invalid filters and unauthenticated/wrong-role access', async () => {
    await request(app.getHttpServer()).get('/api/alunos').expect(401);

    const alunoLogin = await login('aluno@fitforge.app', 'aluno123').expect(200);
    await request(app.getHttpServer())
      .get('/api/alunos')
      .set('Cookie', sessionCookie(alunoLogin))
      .expect(403);

    const personalLogin = await login(
      'personal@fitforge.app',
      'personal123',
    ).expect(200);
    await request(app.getHttpServer())
      .get('/api/alunos?status=unknown')
      .set('Cookie', sessionCookie(personalLogin))
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/alunos?objective=unknown')
      .set('Cookie', sessionCookie(personalLogin))
      .expect(400);
  });

  it('/api/alunos (GET) returns an empty list for a personal without assigned alunos', async () => {
    const loginResponse = await login(
      'empty-personal@fitforge.app',
      'empty123',
    ).expect(200);

    await request(app.getHttpServer())
      .get('/api/alunos')
      .set('Cookie', sessionCookie(loginResponse))
      .expect(200)
      .expect([]);
  });

  afterAll(async () => {
    await app.close();
  });
});
