import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { AuthService } from '../src/auth/auth.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Auth Password Recovery (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;

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
    authService = app.get(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/forgot-password', () => {
    it('returns 200 and generic message for existing email, and creates reset token in database', async () => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: 'personal@fitforge.app' },
      });

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      const response = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'personal@fitforge.app' })
        .expect(200);

      expect(response.body).toEqual({
        message:
          'Se o e-mail estiver registado, enviámos instruções para redefinir a sua senha.',
      });

      const tokenRecord = await prisma.passwordResetToken.findFirst({
        where: { userId: user.id, usedAt: null },
      });
      expect(tokenRecord).toBeDefined();
      expect(tokenRecord!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('returns 200 and same generic message for non-existing email without creating token', async () => {
      const countBefore = await prisma.passwordResetToken.count();

      const response = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent-user@fitforge.app' })
        .expect(200);

      expect(response.body).toEqual({
        message:
          'Se o e-mail estiver registado, enviámos instruções para redefinir a sua senha.',
      });

      const countAfter = await prisma.passwordResetToken.count();
      expect(countAfter).toBe(countBefore);
    });

    it('returns 400 Bad Request when email is invalid or empty', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'not-a-valid-email' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: '' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('successfully resets password with valid token and allows login with new password', async () => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: 'personal@fitforge.app' },
      });

      const { rawToken } = await authService.createPasswordResetToken(user.id);

      const response = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: rawToken,
          password: 'newPassword123',
        })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Senha redefinida com sucesso.',
      });

      // Verify login succeeds with new password
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'personal@fitforge.app',
          password: 'newPassword123',
        })
        .expect(200);

      // Revert password back for other tests
      const { rawToken: revertToken } = await authService.createPasswordResetToken(user.id);
      await authService.resetPassword(revertToken, 'personal123');
    });

    it('rejects an invalid or non-existent token with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-non-existent-token',
          password: 'newPassword123',
        })
        .expect(400);
    });

    it('rejects an expired token with 400', async () => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: 'personal@fitforge.app' },
      });

      const rawToken = 'expired-test-token-value';
      const tokenHash = authService.hashToken(rawToken);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() - 1000), // expired in past
        },
      });

      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: rawToken,
          password: 'newPassword123',
        })
        .expect(400);
    });

    it('rejects reusing an already consumed token with 400', async () => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: 'personal@fitforge.app' },
      });

      const { rawToken } = await authService.createPasswordResetToken(user.id);

      // Consume the token first time
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: rawToken,
          password: 'newPassword123',
        })
        .expect(200);

      // Try consuming the same token second time
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: rawToken,
          password: 'anotherPassword123',
        })
        .expect(400);

      // Revert password
      const { rawToken: revertToken } = await authService.createPasswordResetToken(user.id);
      await authService.resetPassword(revertToken, 'personal123');
    });

    it('rejects short passwords (fewer than 6 characters) with 400', async () => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: 'personal@fitforge.app' },
      });

      const { rawToken } = await authService.createPasswordResetToken(user.id);

      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: rawToken,
          password: '12345',
        })
        .expect(400);
    });
  });
});
