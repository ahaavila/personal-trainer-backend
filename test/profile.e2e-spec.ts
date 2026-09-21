import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Auth Profile & Change Password (e2e)', () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  function login(email: string, password: string) {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password });
  }

  function sessionCookie(response: request.Response) {
    const raw = response.headers['set-cookie'];
    const cookies = Array.isArray(raw) ? raw : [raw];
    const session = cookies.find((cookie: string) =>
      cookie.startsWith('session='),
    );
    return session?.split(';')[0] ?? '';
  }

  describe('GET /api/auth/profile', () => {
    it('rejects unauthenticated request with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });

    it('returns personal profile with id, name, email, and role', async () => {
      const loginRes = await login('personal@fitforge.app', 'personal123').expect(200);
      const cookie = sessionCookie(loginRes);

      const res = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Cookie', cookie)
        .expect(200);

      expect(res.body).toEqual({
        id: expect.any(Number),
        name: 'Personal FitForge',
        email: 'personal@fitforge.app',
        role: 'personal',
        avatarUrl: null,
      });
    });

    it('returns student profile including fitness attributes', async () => {
      const loginRes = await login('mariana@fitforge.app', 'aluno123').expect(200);
      const cookie = sessionCookie(loginRes);

      const res = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Cookie', cookie)
        .expect(200);

      expect(res.body).toEqual({
        id: expect.any(Number),
        name: 'Mariana Costa',
        email: 'mariana@fitforge.app',
        role: 'aluno',
        avatarUrl: null,
        objective: 'emagrecimento',
        level: 'iniciante',
        status: 'ativo',
      });
    });
  });

  describe('PATCH /api/auth/profile', () => {
    it('rejects unauthenticated request with 401', async () => {
      await request(app.getHttpServer())
        .patch('/api/auth/profile')
        .send({ name: 'Novo Nome' })
        .expect(401);
    });

    it('updates name for personal trainer and returns updated profile', async () => {
      const loginRes = await login('personal@fitforge.app', 'personal123').expect(200);
      const cookie = sessionCookie(loginRes);

      const res = await request(app.getHttpServer())
        .patch('/api/auth/profile')
        .set('Cookie', cookie)
        .send({ name: 'Personal Atualizado' })
        .expect(200);

      expect(res.body.name).toBe('Personal Atualizado');

      // Revert name
      await request(app.getHttpServer())
        .patch('/api/auth/profile')
        .set('Cookie', cookie)
        .send({ name: 'Personal FitForge' })
        .expect(200);
    });

    it('updates name, objective, and level for student and returns updated profile', async () => {
      const loginRes = await login('mariana@fitforge.app', 'aluno123').expect(200);
      const cookie = sessionCookie(loginRes);

      const res = await request(app.getHttpServer())
        .patch('/api/auth/profile')
        .set('Cookie', cookie)
        .send({
          name: 'Mariana Silva',
          objective: 'hipertrofia',
          level: 'intermediario',
        })
        .expect(200);

      expect(res.body).toMatchObject({
        name: 'Mariana Silva',
        objective: 'hipertrofia',
        level: 'intermediario',
      });

      // Revert student attributes
      await request(app.getHttpServer())
        .patch('/api/auth/profile')
        .set('Cookie', cookie)
        .send({
          name: 'Mariana Costa',
          objective: 'emagrecimento',
          level: 'iniciante',
        })
        .expect(200);
    });

    it('rejects empty or invalid name with 400', async () => {
      const loginRes = await login('personal@fitforge.app', 'personal123').expect(200);
      const cookie = sessionCookie(loginRes);

      await request(app.getHttpServer())
        .patch('/api/auth/profile')
        .set('Cookie', cookie)
        .send({ name: 'A' })
        .expect(400);

      await request(app.getHttpServer())
        .patch('/api/auth/profile')
        .set('Cookie', cookie)
        .send({ name: '   ' })
        .expect(400);
    });

    it('rejects invalid objective with 400', async () => {
      const loginRes = await login('mariana@fitforge.app', 'aluno123').expect(200);
      const cookie = sessionCookie(loginRes);

      await request(app.getHttpServer())
        .patch('/api/auth/profile')
        .set('Cookie', cookie)
        .send({ objective: 'invalid_objective' })
        .expect(400);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('rejects unauthenticated request with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .send({ currentPassword: 'foo', newPassword: 'bar12345' })
        .expect(401);
    });

    it('rejects incorrect current password with 400', async () => {
      const loginRes = await login('personal@fitforge.app', 'personal123').expect(200);
      const cookie = sessionCookie(loginRes);

      const res = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Cookie', cookie)
        .send({
          currentPassword: 'wrongPassword123',
          newPassword: 'newValidPassword123',
        })
        .expect(400);

      expect(res.body.message).toContain('A senha atual está incorreta.');
    });

    it('rejects short new password (< 6 chars) with 400', async () => {
      const loginRes = await login('personal@fitforge.app', 'personal123').expect(200);
      const cookie = sessionCookie(loginRes);

      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Cookie', cookie)
        .send({
          currentPassword: 'personal123',
          newPassword: '12345',
        })
        .expect(400);
    });

    it('successfully changes password and allows login with new password', async () => {
      const loginRes = await login('personal@fitforge.app', 'personal123').expect(200);
      const cookie = sessionCookie(loginRes);

      const res = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Cookie', cookie)
        .send({
          currentPassword: 'personal123',
          newPassword: 'brandNewPassword123',
        })
        .expect(200);

      expect(res.body.message).toBe('Senha alterada com sucesso.');

      // Login with old password must fail
      await login('personal@fitforge.app', 'personal123').expect(401);

      // Login with new password must succeed
      const newLogin = await login('personal@fitforge.app', 'brandNewPassword123').expect(200);
      const newCookie = sessionCookie(newLogin);

      // Revert password back for other test suites
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Cookie', newCookie)
        .send({
          currentPassword: 'brandNewPassword123',
          newPassword: 'personal123',
        })
        .expect(200);
    });
  });

  describe('Branding API (e2e)', () => {
    it('returns default null branding for personal on basic plan and rejects updates with 403', async () => {
      const loginRes = await login('personal@fitforge.app', 'personal123').expect(200);
      const cookie = sessionCookie(loginRes);

      // Verify basic trainer returns null branding
      const res = await request(app.getHttpServer())
        .get('/api/auth/branding')
        .set('Cookie', cookie)
        .expect(200);

      expect(res.body.brandLogoUrl).toBeNull();
      expect(res.body.brandPrimaryColor).toBeNull();

      // Verify basic trainer cannot update branding
      await request(app.getHttpServer())
        .patch('/api/auth/branding')
        .set('Cookie', cookie)
        .send({ brandPrimaryColor: '#e6b94e' })
        .expect(403);
    });

    it('allows PRO personal trainer to update branding and reflects to assigned student', async () => {
      // Temporarily upgrade personal to PRO in db
      await prisma.user.update({
        where: { email: 'personal@fitforge.app' },
        data: { plan: 'pro' },
      });

      const personalLogin = await login('personal@fitforge.app', 'personal123').expect(200);
      const personalCookie = sessionCookie(personalLogin);

      // Test invalid hex color rejection
      await request(app.getHttpServer())
        .patch('/api/auth/branding')
        .set('Cookie', personalCookie)
        .send({ brandPrimaryColor: 'invalid-hex' })
        .expect(400);

      // Test valid branding update
      const updateRes = await request(app.getHttpServer())
        .patch('/api/auth/branding')
        .set('Cookie', personalCookie)
        .send({
          brandLogoUrl: 'https://example.com/logo.png',
          brandPrimaryColor: '#e6b94e',
          brandBackgroundColor: '#0c0a08',
        })
        .expect(200);

      expect(updateRes.body.brandLogoUrl).toBe('https://example.com/logo.png');
      expect(updateRes.body.brandPrimaryColor).toBe('#e6b94e');
      expect(updateRes.body.brandBackgroundColor).toBe('#0c0a08');

      // Test personal retrieves updated branding
      const getRes = await request(app.getHttpServer())
        .get('/api/auth/branding')
        .set('Cookie', personalCookie)
        .expect(200);

      expect(getRes.body.brandLogoUrl).toBe('https://example.com/logo.png');
      expect(getRes.body.brandPrimaryColor).toBe('#e6b94e');

      // Test assigned student (mariana) retrieves the trainer's branding
      const alunoLogin = await login('mariana@fitforge.app', 'aluno123').expect(200);
      const alunoCookie = sessionCookie(alunoLogin);

      const alunoBrandingRes = await request(app.getHttpServer())
        .get('/api/auth/branding')
        .set('Cookie', alunoCookie)
        .expect(200);

      expect(alunoBrandingRes.body.brandLogoUrl).toBe('https://example.com/logo.png');
      expect(alunoBrandingRes.body.brandPrimaryColor).toBe('#e6b94e');

      // Revert personal to basic and clear branding
      await prisma.user.update({
        where: { email: 'personal@fitforge.app' },
        data: {
          plan: 'basic',
          brandLogoUrl: null,
          brandPrimaryColor: null,
          brandBackgroundColor: null,
        },
      });
    });
  });
});
