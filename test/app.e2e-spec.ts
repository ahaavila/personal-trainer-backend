import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Role } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { hashPassword } from './../src/auth/password.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('App API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.treinoExercicio.deleteMany();
    await prisma.treino.deleteMany();
    await prisma.fichaDeTreino.deleteMany();
    await prisma.exercicio.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'created-' } },
    });

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
        equipment: null,
        description: 'Empurrada horizontal com barra.',
        defaultSets: 3,
        defaultReps: '8 a 12',
        level: 'intermediario',
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
      data: { treinoId: workout.id, exercicioId: exercise.id, sets: 3, reps: '12' },
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
      update: { passwordHash, name: 'Aluno Sem Plano', role: Role.aluno, personalId: null, status: 'ativo' },
      create: {
        email: 'empty-aluno@fitforge.app',
        passwordHash,
        name: 'Aluno Sem Plano',
        role: Role.aluno,
        status: 'ativo',
      },
    });
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  function login(email: string, password: string, rememberMe?: boolean) {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password, ...(rememberMe !== undefined ? { rememberMe } : {}) });
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
    const setCookie = response.headers['set-cookie']?.[0];
    const expiresMatch = setCookie!.match(/Expires=([^;]+)/);
    expect(expiresMatch).toBeDefined();
    const expiresDate = new Date(expiresMatch![1]);
    const diffHours = (expiresDate.getTime() - Date.now()) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(23);
    expect(diffHours).toBeLessThan(25);
  });

  it('/api/auth/login (POST) sets an extended 30-day session cookie when rememberMe is true', async () => {
    const response = await login('personal@fitforge.app', 'personal123', true).expect(200);

    const setCookie = response.headers['set-cookie']?.[0];
    expect(setCookie).toBeDefined();
    const expiresMatch = setCookie!.match(/Expires=([^;]+)/);
    expect(expiresMatch).toBeDefined();
    const expiresDate = new Date(expiresMatch![1]);
    const diffDays = (expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(29);
    expect(diffDays).toBeLessThan(31);
  });

  it('/api/auth/login (POST) sets a standard 1-day session cookie when rememberMe is false', async () => {
    const response = await login('personal@fitforge.app', 'personal123', false).expect(200);

    const setCookie = response.headers['set-cookie']?.[0];
    expect(setCookie).toBeDefined();
    const expiresMatch = setCookie!.match(/Expires=([^;]+)/);
    expect(expiresMatch).toBeDefined();
    const expiresDate = new Date(expiresMatch![1]);
    const diffHours = (expiresDate.getTime() - Date.now()) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(23);
    expect(diffHours).toBeLessThan(25);
  });

  it('/api/auth/login (POST) logs in the seeded aluno user', async () => {
    const response = await login('aluno@fitforge.app', 'aluno123').expect(200);

    expect(response.body).toMatchObject({
      role: 'aluno',
      name: 'Aluno FitForge',
    });
    expect(response.body.token).toBeUndefined();
  });

  it('/api/auth/login (POST) rejects a non-active aluno before setting a session cookie', async () => {
    try {
      await prisma.user.update({
        where: { email: 'aluno@fitforge.app' },
        data: { status: 'inativo' },
      });

      const response = await login('aluno@fitforge.app', 'aluno123').expect(401);

      expect(response.body).toMatchObject({
        message: 'A sua conta de aluno está inativa. Contacte o seu personal trainer.',
      });
      expect(response.body.token).toBeUndefined();
      expect(response.headers['set-cookie']).toBeUndefined();
    } finally {
      await prisma.user.update({
        where: { email: 'aluno@fitforge.app' },
        data: { status: 'ativo' },
      });
    }
  });

  it('/api/auth/me (GET) rejects an aluno session after deactivation', async () => {
    try {
      await prisma.user.update({
        where: { email: 'aluno@fitforge.app' },
        data: { status: 'ativo' },
      });

      const loginResponse = await login('aluno@fitforge.app', 'aluno123').expect(200);

      await prisma.user.update({
        where: { email: 'aluno@fitforge.app' },
        data: { status: 'inativo' },
      });

      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', sessionCookie(loginResponse))
        .expect(401);

      expect(response.body).toMatchObject({
        message: 'A sua conta de aluno está inativa. Contacte o seu personal trainer.',
      });
    } finally {
      await prisma.user.update({
        where: { email: 'aluno@fitforge.app' },
        data: { status: 'ativo' },
      });
    }
  });

  it('/api/auth/login (POST) rejects incorrect credentials', async () => {
    const response = await login('personal@fitforge.app', 'incorrect').expect(
      401,
    );

    expect(response.body).toMatchObject({
      message: 'E-mail ou senha inválidos.',
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
          status: 'ativo',
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

  it('/api/exercicios (GET) returns the personal library with card fields', async () => {
    const loginResponse = await login(
      'personal@fitforge.app',
      'personal123',
    ).expect(200);

    const response = await request(app.getHttpServer())
      .get('/api/exercicios')
      .set('Cookie', sessionCookie(loginResponse))
      .expect(200);

    expect(response.body).toEqual([
      {
        id: expect.any(Number),
        name: 'Supino reto',
        muscleGroup: 'Peito',
        equipment: null,
        description: 'Empurrada horizontal com barra.',
        defaultSets: 3,
        defaultReps: '8 a 12',
        level: 'intermediario',
        media: [],
      },
    ]);
  });

  it('/api/exercicios (GET) applies private filters and rejects invalid levels', async () => {
    const loginResponse = await login(
      'personal@fitforge.app',
      'personal123',
    ).expect(200);
    const cookie = sessionCookie(loginResponse);

    await request(app.getHttpServer())
      .get('/api/exercicios?search=supino&muscleGroup=peito&level=intermediario')
      .set('Cookie', cookie)
      .expect(200)
      .expect((response) => expect(response.body).toHaveLength(1));
    await request(app.getHttpServer())
      .get('/api/exercicios?level=unknown')
      .set('Cookie', cookie)
      .expect(400);
  });

  it('/api/exercicios (GET) enforces personal ownership and empty state', async () => {
    await request(app.getHttpServer()).get('/api/exercicios').expect(401);

    const alunoLogin = await login('aluno@fitforge.app', 'aluno123').expect(200);
    await request(app.getHttpServer())
      .get('/api/exercicios')
      .set('Cookie', sessionCookie(alunoLogin))
      .expect(403);

    const otherPersonalLogin = await login(
      'other-personal@fitforge.app',
      'personal123',
    ).expect(200);
    const otherResponse = await request(app.getHttpServer())
      .get('/api/exercicios')
      .set('Cookie', sessionCookie(otherPersonalLogin))
      .expect(200);
    expect(otherResponse.body).toEqual([]);
  });

  it('/api/exercicios/:id (GET/PUT/DELETE) manages an owned exercise safely', async () => {
    const personalLogin = await login('personal@fitforge.app', 'personal123').expect(200);
    const personalCookie = sessionCookie(personalLogin);
    const created = await request(app.getHttpServer())
      .post('/api/exercicios')
      .set('Cookie', personalCookie)
      .send({ name: 'Exercise lifecycle', muscleGroup: 'Peito', level: 'iniciante', description: 'Lifecycle test', defaultSets: 3, defaultReps: '10' })
      .expect(201);

    const detail = await request(app.getHttpServer())
      .get(`/api/exercicios/${created.body.id}`)
      .set('Cookie', personalCookie)
      .expect(200);
    expect(detail.body).toMatchObject({ id: created.body.id, name: 'Exercise lifecycle', media: [] });

    await request(app.getHttpServer())
      .put(`/api/exercicios/${created.body.id}`)
      .set('Cookie', personalCookie)
      .send({ name: 'Updated lifecycle', muscleGroup: 'Costas', equipment: 'Cabo', level: 'intermediario', description: 'Updated description', defaultSets: 4, defaultReps: '8 a 10' })
      .expect(200)
      .expect((response) => expect(response.body).toMatchObject({ name: 'Updated lifecycle', muscleGroup: 'Costas', equipment: 'Cabo', level: 'intermediario', defaultSets: 4, defaultReps: '8 a 10' }));

    await request(app.getHttpServer())
      .put(`/api/exercicios/${created.body.id}`)
      .set('Cookie', personalCookie)
      .send({ name: 'Invalid update' })
      .expect(400);

    const otherLogin = await login('other-personal@fitforge.app', 'personal123').expect(200);
    await request(app.getHttpServer())
      .get(`/api/exercicios/${created.body.id}`)
      .set('Cookie', sessionCookie(otherLogin))
      .expect(404);

    await prisma.exerciseMedia.create({ data: { exercicioId: created.body.id, kind: 'photo', objectKey: `exercises/test/${created.body.id}/photo`, contentType: 'image/jpeg', byteSize: 100 } });
    await request(app.getHttpServer())
      .delete(`/api/exercicios/${created.body.id}`)
      .set('Cookie', personalCookie)
      .expect(200);
    await expect(prisma.exercicio.findUnique({ where: { id: created.body.id } })).resolves.toBeNull();
    await expect(prisma.exerciseMedia.findMany({ where: { exercicioId: created.body.id } })).resolves.toEqual([]);
  });

  it('/api/exercicios (POST) creates a safe owned exercise', async () => {
    const loginResponse = await login('personal@fitforge.app', 'personal123').expect(200);
    const response = await request(app.getHttpServer())
      .post('/api/exercicios')
      .set('Cookie', sessionCookie(loginResponse))
      .send({ name: 'Levantamento terra', muscleGroup: 'Costas', equipment: 'Barra', level: 'avancado', description: 'Movimento composto.', defaultSets: 4, defaultReps: '5 a 8' })
      .expect(201);

    expect(response.body).toMatchObject({ name: 'Levantamento terra', muscleGroup: 'Costas', equipment: 'Barra', level: 'avancado', defaultSets: 4, defaultReps: '5 a 8', media: [] });
    expect(JSON.stringify(response.body)).not.toMatch(/password|hash|token|session/i);
  });

  it('/api/exercicios (POST) rejects invalid/unauthorized creation and disabled media', async () => {
    await request(app.getHttpServer()).post('/api/exercicios').send({ name: 'No session' }).expect(401);
    const alunoLogin = await login('aluno@fitforge.app', 'aluno123').expect(200);
    await request(app.getHttpServer()).post('/api/exercicios').set('Cookie', sessionCookie(alunoLogin)).send({ name: 'Forbidden' }).expect(403);

    const personalLogin = await login('personal@fitforge.app', 'personal123').expect(200);
    const cookie = sessionCookie(personalLogin);
    await request(app.getHttpServer()).post('/api/exercicios').set('Cookie', cookie).send({ name: 'X', muscleGroup: 'Peito', level: 'unknown', description: '', defaultSets: 0, defaultReps: '' }).expect(400);
    const otherPersonalLogin = await login('other-personal@fitforge.app', 'personal123').expect(200);
    const otherLibrary = await request(app.getHttpServer()).get('/api/exercicios').set('Cookie', sessionCookie(otherPersonalLogin)).expect(200);
    const created = await request(app.getHttpServer()).post('/api/exercicios').set('Cookie', cookie).send({ name: 'Media exercise', muscleGroup: 'Peito', level: 'iniciante', description: 'Media', defaultSets: 3, defaultReps: '10' }).expect(201);
    expect(otherLibrary.body).toEqual([]);
    await request(app.getHttpServer()).post(`/api/exercicios/${created.body.id}/upload-url`).set('Cookie', sessionCookie(otherPersonalLogin)).send({ kind: 'photo', contentType: 'image/jpeg', byteSize: 100 }).expect(404);
    const uploadResponse = await request(app.getHttpServer()).post(`/api/exercicios/${created.body.id}/upload-url`).set('Cookie', cookie).send({ kind: 'photo', contentType: 'image/jpeg', byteSize: 100 }).expect(201);
    expect(uploadResponse.body).toMatchObject({ kind: 'photo', contentType: 'image/jpeg', byteSize: 100, expiresIn: 300 });
  });

  it('/api/fichas-de-treino (POST) creates a valid plan for an assigned student', async () => {
    const personalLogin = await login(
      'personal@fitforge.app',
      'personal123',
    ).expect(200);
    const cookie = sessionCookie(personalLogin);
    const exercise = await prisma.exercicio.create({
      data: {
        name: 'Rosca direta',
        muscleGroup: 'Biceps',
        description: 'Flexão de cotovelo com barra.',
        defaultSets: 3,
        defaultReps: '8 a 12',
        level: 'iniciante',
        createdByPersonalId: (await prisma.user.findUniqueOrThrow({ where: { email: 'personal@fitforge.app' } })).id,
      },
    });

    const response = await request(app.getHttpServer())
      .post('/api/fichas-de-treino')
      .set('Cookie', cookie)
      .send({
        alunoId: (await prisma.user.findUniqueOrThrow({ where: { email: 'aluno@fitforge.app' } })).id,
        title: 'Plano de hipertrofia',
        notes: 'Foco em evolução de força',
        startDate: '2026-09-20',
        endDate: '2026-10-20',
        divisions: [
          {
            name: 'Treino A',
            order: 1,
            exercises: [
              {
                exercicioId: exercise.id,
                order: 1,
                sets: 4,
                reps: '8 a 10',
                restInterval: '90s',
                targetLoad: '70%',
                notes: 'Ponto de tensão',
              },
            ],
          },
        ],
      })
      .expect(201);

    expect(response.body).toMatchObject({
      alunoId: expect.any(Number),
      personalId: expect.any(Number),
      title: 'Plano de hipertrofia',
      treinos: [
        {
          name: 'Treino A',
          order: 1,
          treinoExercicios: [
            {
              exercicioId: exercise.id,
              order: 1,
              sets: 4,
              reps: '8 a 10',
            },
          ],
        },
      ],
    });
  });

  it('/api/fichas-de-treino (POST) rejects invalid payloads and unauthorized ownership', async () => {
    const personalLogin = await login(
      'personal@fitforge.app',
      'personal123',
    ).expect(200);
    const cookie = sessionCookie(personalLogin);

    await request(app.getHttpServer())
      .post('/api/fichas-de-treino')
      .set('Cookie', cookie)
      .send({ alunoId: 999, title: '', divisions: [] })
      .expect(400);

    const alunoLogin = await login('aluno@fitforge.app', 'aluno123').expect(200);
    await request(app.getHttpServer())
      .post('/api/fichas-de-treino')
      .set('Cookie', sessionCookie(alunoLogin))
      .send({ alunoId: 1, title: 'Plano inválido', divisions: [{ name: 'Treino A', order: 1, exercises: [{ exercicioId: 1, order: 1, sets: 3, reps: '10' }] }] })
      .expect(403);

    const otherPersonalLogin = await login(
      'other-personal@fitforge.app',
      'personal123',
    ).expect(200);
    await request(app.getHttpServer())
      .post('/api/fichas-de-treino')
      .set('Cookie', sessionCookie(otherPersonalLogin))
      .send({ alunoId: (await prisma.user.findUniqueOrThrow({ where: { email: 'aluno@fitforge.app' } })).id, title: 'Plano indevido', divisions: [{ name: 'Treino A', order: 1, exercises: [{ exercicioId: 1, order: 1, sets: 3, reps: '10' }] }] })
      .expect(403);
  });

  it('/api/fichas-de-treino (GET) lists owned plans with nested details', async () => {
    const personalLogin = await login('personal@fitforge.app', 'personal123').expect(200);
    const cookie = sessionCookie(personalLogin);

    const response = await request(app.getHttpServer())
      .get('/api/fichas-de-treino?search=Ficha%20de%20hipertrofia')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body).toEqual([
      expect.objectContaining({
        id: expect.any(Number),
        title: 'Ficha de hipertrofia',
        studentId: expect.any(Number),
        studentEmail: 'aluno@fitforge.app',
        studentName: 'Aluno FitForge',
        divisionsCount: 1,
        exercisesCount: 1,
        divisions: [
          expect.objectContaining({
            name: 'Treino A',
            exercises: [
              expect.objectContaining({
                exerciseName: 'Supino reto',
                muscleGroup: 'Peito',
                sets: 3,
                reps: '12',
              }),
            ],
          }),
        ],
      }),
    ]);
  });

  it('/api/fichas-de-treino (GET) applies alunoId and search filters', async () => {
    const personalLogin = await login('personal@fitforge.app', 'personal123').expect(200);
    const cookie = sessionCookie(personalLogin);
    const aluno = await prisma.user.findUniqueOrThrow({ where: { email: 'aluno@fitforge.app' } });

    await request(app.getHttpServer())
      .get(`/api/fichas-de-treino?alunoId=${aluno.id}`)
      .set('Cookie', cookie)
      .expect(200)
      .expect((response) => expect(response.body.length).toBeGreaterThanOrEqual(1));

    await request(app.getHttpServer())
      .get('/api/fichas-de-treino?search=does-not-exist')
      .set('Cookie', cookie)
      .expect(200)
      .expect([]);
  });

  it('/api/fichas-de-treino/:id (GET) returns a plan and enforces ownership and role', async () => {
    const plan = await prisma.fichaDeTreino.findFirstOrThrow({
      where: { title: 'Ficha de hipertrofia' },
    });
    const personalLogin = await login('personal@fitforge.app', 'personal123').expect(200);

    const response = await request(app.getHttpServer())
      .get(`/api/fichas-de-treino/${plan.id}`)
      .set('Cookie', sessionCookie(personalLogin))
      .expect(200);

    expect(response.body).toMatchObject({ id: plan.id, title: 'Ficha de hipertrofia' });

    await request(app.getHttpServer())
      .get(`/api/fichas-de-treino/${plan.id}`)
      .expect(401);

    const alunoLogin = await login('aluno@fitforge.app', 'aluno123').expect(200);
    await request(app.getHttpServer())
      .get('/api/fichas-de-treino')
      .set('Cookie', sessionCookie(alunoLogin))
      .expect(403);
  });

  it('/api/alunos (POST) creates a safe, owned aluno and allows the new login', async () => {
    const loginResponse = await login(
      'personal@fitforge.app',
      'personal123',
    ).expect(200);
    const cookie = sessionCookie(loginResponse);
    const email = `created-${Date.now()}@fitforge.app`;

    const response = await request(app.getHttpServer())
      .post('/api/alunos')
      .set('Cookie', cookie)
      .send({
        name: 'Novo Aluno',
        email,
        objective: 'hipertrofia',
        level: 'iniciante',
      })
      .expect(201);

    expect(response.body).toEqual({
      id: expect.any(Number),
      name: 'Novo Aluno',
      email,
      objective: 'hipertrofia',
      level: 'iniciante',
      status: 'ativo',
      latestWorkout: null,
    });
    expect(JSON.stringify(response.body)).not.toMatch(/password|hash|token|session/i);

    const listing = await request(app.getHttpServer())
      .get('/api/alunos?search=Novo%20Aluno')
      .set('Cookie', cookie)
      .expect(200);
    expect(listing.body).toEqual([response.body]);

    const createdUser = await prisma.user.findUnique({ where: { email } });
    expect(createdUser).toBeDefined();
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { userId: createdUser!.id, usedAt: null },
    });
    expect(tokenRecord).toBeDefined();
  });

  it('/api/alunos (POST) rejects unauthorized, invalid, and duplicate creation', async () => {
    await request(app.getHttpServer())
      .post('/api/alunos')
      .send({ name: 'No Session' })
      .expect(401);

    const alunoLogin = await login('aluno@fitforge.app', 'aluno123').expect(200);
    await request(app.getHttpServer())
      .post('/api/alunos')
      .set('Cookie', sessionCookie(alunoLogin))
      .send({
        name: 'Forbidden',
        email: 'forbidden@fitforge.app',
        objective: 'hipertrofia',
        level: 'iniciante',
      })
      .expect(403);

    const personalLogin = await login(
      'personal@fitforge.app',
      'personal123',
    ).expect(200);
    const cookie = sessionCookie(personalLogin);
    await request(app.getHttpServer())
      .post('/api/alunos')
      .set('Cookie', cookie)
      .send({ name: 'A', email: 'invalid' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/alunos')
      .set('Cookie', cookie)
      .send({
        name: 'With Password',
        email: `withpass-${Date.now()}@fitforge.app`,
        password: 'temporary123',
        objective: 'hipertrofia',
        level: 'iniciante',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/alunos')
      .set('Cookie', cookie)
      .send({
        name: 'Duplicate',
        email: 'aluno@fitforge.app',
        objective: 'hipertrofia',
        level: 'iniciante',
      })
      .expect(409);
  });

  afterAll(async () => {
    await app.close();
  });
});
