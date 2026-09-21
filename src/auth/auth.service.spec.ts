import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';
import { comparePassword, hashPassword } from './password.js';

describe('AuthService', () => {
  let service: AuthService;
  let passwordHash: string;
  let tokens: Array<{
    id: number;
    userId: number;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
  }>;
  let users: Array<{
    id: number;
    email: string;
    passwordHash: string;
    name: string;
    role: 'personal' | 'aluno';
    plan?: any;
    personalId?: number;
    brandLogoUrl?: string | null;
    brandPrimaryColor?: string | null;
    brandBackgroundColor?: string | null;
    objective?: any;
    level?: any;
    status: any;
  }>;

  beforeAll(async () => {
    passwordHash = await hashPassword('secret123');
  });

  const createMockPrismaService = () => ({
    user: {
      findUnique: (args: { where: { email?: string; id?: number } }) => {
        const user = users.find((u) =>
          args.where.email ? u.email === args.where.email : u.id === args.where.id,
        );
        return Promise.resolve(user ? { ...user } : null);
      },
      update: (args: { where: { id: number }; data: any }) => {
        const user = users.find((u) => u.id === args.where.id);
        if (user) {
          Object.assign(user, args.data);
        }
        return Promise.resolve(user);
      },
    },
    passwordResetToken: {
      create: (args: {
        data: { userId: number; tokenHash: string; expiresAt: Date };
      }) => {
        const item = {
          id: tokens.length + 1,
          userId: args.data.userId,
          tokenHash: args.data.tokenHash,
          expiresAt: args.data.expiresAt,
          usedAt: null,
        };
        tokens.push(item);
        return Promise.resolve(item);
      },
      updateMany: (args: {
        where: { userId: number; usedAt?: null };
        data: { usedAt: Date };
      }) => {
        let count = 0;
        for (const token of tokens) {
          if (
            token.userId === args.where.userId &&
            (args.where.usedAt === undefined || token.usedAt === null)
          ) {
            token.usedAt = args.data.usedAt;
            count++;
          }
        }
        return Promise.resolve({ count });
      },
      findUnique: (args: {
        where: { tokenHash: string };
        include?: { user?: boolean };
      }) => {
        const item = tokens.find((t) => t.tokenHash === args.where.tokenHash);
        if (!item) return Promise.resolve(null);
        const user = users.find((u) => u.id === item.userId);
        return Promise.resolve({
          ...item,
          user: user ? { ...user } : undefined,
        });
      },
    },
    $transaction: (actions: Promise<unknown>[]) => Promise.all(actions),
  });

  beforeEach(async () => {
    tokens = [];
    users = [
      {
        id: 1,
        email: 'user@fitforge.app',
        passwordHash,
        name: 'User FitForge',
        role: 'personal',
        status: null,
      },
    ];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
        {
          provide: JwtService,
          useValue: new JwtService({ secret: 'test-secret' }),
        },
        {
          provide: EmailService,
          useValue: {
            sendPasswordResetEmail: async () => Promise.resolve(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login with rememberMe', () => {
    it('issues a token with 1-day expiration when rememberMe is false or omitted', async () => {
      const result = await service.login('user@fitforge.app', 'secret123', false);
      const expiration = service.getTokenExpiration(result.token);

      expect(expiration).toBeDefined();
      const diffHours = (expiration!.getTime() - Date.now()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThan(23);
      expect(diffHours).toBeLessThan(25);
    });

    it('issues a token with 30-day expiration when rememberMe is true', async () => {
      const result = await service.login('user@fitforge.app', 'secret123', true);
      const expiration = service.getTokenExpiration(result.token);

      expect(expiration).toBeDefined();
      const diffDays = (expiration!.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(29);
      expect(diffDays).toBeLessThan(31);
    });
  });

  describe('forgotPassword and token generation', () => {
    it('returns generic message without creating token for non-existing user', async () => {
      const result = await service.forgotPassword('unknown@fitforge.app');
      expect(result.message).toBe(
        'Se o e-mail estiver registado, enviámos instruções para redefinir a sua senha.',
      );
      expect(result.rawToken).toBeUndefined();
      expect(tokens).toHaveLength(0);
    });

    it('creates hashed reset token valid for 1 hour for existing user', async () => {
      const result = await service.forgotPassword('user@fitforge.app');
      expect(result.message).toBe(
        'Se o e-mail estiver registado, enviámos instruções para redefinir a sua senha.',
      );
      expect(result.rawToken).toBeDefined();
      expect(tokens).toHaveLength(1);

      const tokenRecord = tokens[0];
      expect(tokenRecord.tokenHash).toBe(service.hashToken(result.rawToken!));
      expect(tokenRecord.usedAt).toBeNull();
      const diffMinutes =
        (tokenRecord.expiresAt.getTime() - Date.now()) / (1000 * 60);
      expect(diffMinutes).toBeGreaterThan(58);
      expect(diffMinutes).toBeLessThan(62);
    });

    it('invalidates previous unused tokens when requesting a new one', async () => {
      const first = await service.forgotPassword('user@fitforge.app');
      expect(tokens[0].usedAt).toBeNull();

      const second = await service.forgotPassword('user@fitforge.app');
      expect(tokens[0].usedAt).not.toBeNull();
      expect(tokens[1].usedAt).toBeNull();
      expect(first.rawToken).not.toBe(second.rawToken);
    });
  });

  describe('verifyResetToken', () => {
    it('rejects an invalid token', async () => {
      await expect(service.verifyResetToken('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an already used token', async () => {
      const { rawToken } = await service.createPasswordResetToken(1);
      tokens[0].usedAt = new Date();

      await expect(service.verifyResetToken(rawToken)).rejects.toThrow(
        'Token de recuperação já utilizado.',
      );
    });

    it('rejects an expired token', async () => {
      const { rawToken } = await service.createPasswordResetToken(1);
      tokens[0].expiresAt = new Date(Date.now() - 1000);

      await expect(service.verifyResetToken(rawToken)).rejects.toThrow(
        'Token de recuperação expirado.',
      );
    });

    it('returns record for a valid token', async () => {
      const { rawToken } = await service.createPasswordResetToken(1);
      const record = await service.verifyResetToken(rawToken);
      expect(record).toBeDefined();
      expect(record.userId).toBe(1);
    });
  });

  describe('resetPassword', () => {
    it('rejects password with fewer than 6 characters', async () => {
      const { rawToken } = await service.createPasswordResetToken(1);
      await expect(service.resetPassword(rawToken, '12345')).rejects.toThrow(
        'A senha deve ter no mínimo 6 caracteres.',
      );
    });

    it('updates password and marks token used', async () => {
      const { rawToken } = await service.createPasswordResetToken(1);
      const res = await service.resetPassword(rawToken, 'newPassword123');

      expect(res.message).toBe('Senha redefinida com sucesso.');
      expect(tokens[0].usedAt).not.toBeNull();

      const updatedUser = users.find((u) => u.id === 1)!;
      await expect(
        comparePassword('newPassword123', updatedUser.passwordHash),
      ).resolves.toBe(true);

      // Subsequent attempt with same token fails
      await expect(service.resetPassword(rawToken, 'anotherPass123')).rejects.toThrow(
        'Token de recuperação já utilizado.',
      );
    });
  });

  describe('getProfile', () => {
    it('returns personal profile with id, name, email, and role', async () => {
      const profile = await service.getProfile(1);
      expect(profile).toEqual({
        id: 1,
        name: 'User FitForge',
        email: 'user@fitforge.app',
        role: 'personal',
        avatarUrl: null,
      });
    });

    it('returns student profile including objective, level, and status', async () => {
      users.push({
        id: 2,
        email: 'student@fitforge.app',
        passwordHash,
        name: 'Student FitForge',
        role: 'aluno',
        objective: 'hipertrofia',
        level: 'iniciante',
        status: 'ativo',
      });

      const profile = await service.getProfile(2);
      expect(profile).toEqual({
        id: 2,
        name: 'Student FitForge',
        email: 'student@fitforge.app',
        role: 'aluno',
        avatarUrl: null,
        objective: 'hipertrofia',
        level: 'iniciante',
        status: 'ativo',
      });
    });
  });

  describe('updateProfile', () => {
    it('updates name for personal trainer', async () => {
      const updated = await service.updateProfile(1, { name: 'Novo Nome Personal' });
      expect(updated.name).toBe('Novo Nome Personal');
    });

    it('updates name, objective, and level for student', async () => {
      users.push({
        id: 3,
        email: 'student2@fitforge.app',
        passwordHash,
        name: 'Student Two',
        role: 'aluno',
        objective: 'emagrecimento',
        level: 'iniciante',
        status: 'ativo',
      });

      const updated = await service.updateProfile(3, {
        name: 'Student Updated',
        objective: 'hipertrofia' as any,
        level: 'avancado' as any,
      });

      expect(updated).toMatchObject({
        id: 3,
        name: 'Student Updated',
        objective: 'hipertrofia',
        level: 'avancado',
      });
    });

    it('rejects update with name shorter than 2 characters', async () => {
      await expect(service.updateProfile(1, { name: 'A' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('changePassword', () => {
    it('successfully changes password when current password is correct', async () => {
      const res = await service.changePassword(1, 'secret123', 'newSecret456');
      expect(res.message).toBe('Senha alterada com sucesso.');

      const user = users.find((u) => u.id === 1)!;
      await expect(
        comparePassword('newSecret456', user.passwordHash),
      ).resolves.toBe(true);
    });

    it('rejects password change when current password is wrong', async () => {
      await expect(
        service.changePassword(1, 'wrongPassword', 'newSecret456'),
      ).rejects.toThrow('A senha atual está incorreta.');
    });

    it('rejects password change when new password is fewer than 6 characters', async () => {
      await expect(
        service.changePassword(1, 'secret123', '12345'),
      ).rejects.toThrow('A nova senha deve ter no mínimo 6 caracteres.');
    });
  });

  describe('branding', () => {
    it('returns custom branding for PRO trainer', async () => {
      users[0].plan = 'pro';
      users[0].brandLogoUrl = 'https://example.com/logo.png';
      users[0].brandPrimaryColor = '#e6b94e';
      users[0].brandBackgroundColor = '#0c0a08';

      const branding = await service.getBranding(1);
      expect(branding.brandLogoUrl).toBe('https://example.com/logo.png');
      expect(branding.brandPrimaryColor).toBe('#e6b94e');
      expect(branding.brandBackgroundColor).toBe('#0c0a08');
      expect(branding.logoUrl).toBe('https://example.com/logo.png');
    });

    it('returns default null branding for basic plan trainer', async () => {
      users[0].plan = 'basic';
      users[0].brandLogoUrl = 'https://example.com/logo.png';

      const branding = await service.getBranding(1);
      expect(branding.brandLogoUrl).toBeNull();
      expect(branding.brandPrimaryColor).toBeNull();
      expect(branding.brandBackgroundColor).toBeNull();
    });

    it('returns trainer branding for student whose trainer is on PRO', async () => {
      users[0].plan = 'pro';
      users[0].brandLogoUrl = 'https://example.com/trainer-logo.png';
      users[0].brandPrimaryColor = '#ff5500';
      users[0].brandBackgroundColor = '#111111';

      users.push({
        id: 2,
        email: 'student@fitforge.app',
        passwordHash,
        name: 'Student One',
        role: 'aluno',
        personalId: 1,
        status: 'ativo',
      });

      const branding = await service.getBranding(2);
      expect(branding.brandLogoUrl).toBe('https://example.com/trainer-logo.png');
      expect(branding.brandPrimaryColor).toBe('#ff5500');
      expect(branding.brandBackgroundColor).toBe('#111111');
    });

    it('returns default null branding for student whose trainer is on basic', async () => {
      users[0].plan = 'basic';
      users[0].brandLogoUrl = 'https://example.com/trainer-logo.png';

      users.push({
        id: 2,
        email: 'student@fitforge.app',
        passwordHash,
        name: 'Student One',
        role: 'aluno',
        personalId: 1,
        status: 'ativo',
      });

      const branding = await service.getBranding(2);
      expect(branding.brandLogoUrl).toBeNull();
      expect(branding.brandPrimaryColor).toBeNull();
      expect(branding.brandBackgroundColor).toBeNull();
    });

    it('allows PRO trainer to update branding', async () => {
      users[0].plan = 'pro';

      const updated = await service.updateBranding(1, {
        brandLogoUrl: 'https://example.com/new-logo.png',
        brandPrimaryColor: '#00ffcc',
        brandBackgroundColor: '#050505',
      });

      expect(updated.brandLogoUrl).toBe('https://example.com/new-logo.png');
      expect(updated.brandPrimaryColor).toBe('#00ffcc');
      expect(updated.brandBackgroundColor).toBe('#050505');
      expect(users[0].brandLogoUrl).toBe('https://example.com/new-logo.png');
    });

    it('rejects branding update if trainer is on basic plan', async () => {
      users[0].plan = 'basic';

      await expect(
        service.updateBranding(1, { brandPrimaryColor: '#00ffcc' }),
      ).rejects.toThrow('Personalização de marca é exclusiva do Plano PRO.');
    });

    it('rejects branding update if user is not personal trainer', async () => {
      users.push({
        id: 3,
        email: 'student3@fitforge.app',
        passwordHash,
        name: 'Student Three',
        role: 'aluno',
        status: 'ativo',
      });

      await expect(
        service.updateBranding(3, { brandPrimaryColor: '#00ffcc' }),
      ).rejects.toThrow('Apenas personal trainers podem personalizar a marca.');
    });
  });
});

