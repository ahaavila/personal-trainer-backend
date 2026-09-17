import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashPassword } from './password.js';

describe('AuthService', () => {
  let service: AuthService;
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hashPassword('secret123');
  });

  const createMockPrismaService = () => ({
    user: {
      findUnique: (args: { where: { email?: string; id?: number } }) => {
        if (args.where.email === 'user@fitforge.app' || args.where.id === 1) {
          return Promise.resolve({
            id: 1,
            email: 'user@fitforge.app',
            passwordHash,
            name: 'User FitForge',
            role: 'personal',
            status: null,
          });
        }
        return Promise.resolve(null);
      },
    },
  });

  beforeEach(async () => {
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
});
