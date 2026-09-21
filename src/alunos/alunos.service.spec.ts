import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AlunosService } from './alunos.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from '../auth/auth.service.js';
import { EmailService } from '../email/email.service.js';

describe('AlunosService', () => {
  let service: AlunosService;
  let users: Array<any>;
  let createdTokens: Array<{ userId: number; rawToken: string }>;
  let sentInviteEmails: Array<{
    to: string;
    studentName: string;
    personalName: string;
    token: string;
  }>;

  beforeEach(async () => {
    users = [
      {
        id: 1,
        name: 'Personal Trainer',
        email: 'personal@fitforge.app',
        role: 'personal',
        plan: 'basic',
        status: 'ativo',
      },
    ];
    createdTokens = [];
    sentInviteEmails = [];

    const mockPrismaService = {
      user: {
        findMany: (args: any) => {
          return Promise.resolve(
            users
              .filter((u) => u.role === 'aluno' && u.personalId === args.where.personalId)
              .map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                objective: u.objective,
                level: u.level,
                status: u.status,
                assignedFichas: [],
              })),
          );
        },
        findFirst: (args: any) => {
          const user = users.find((u) => {
            if (args.where.id && u.id !== args.where.id) return false;
            if (args.where.personalId && u.personalId !== args.where.personalId) return false;
            if (args.where.role && u.role !== args.where.role) return false;
            return true;
          });
          return Promise.resolve(user ? { ...user, assignedFichas: [] } : null);
        },
        findUnique: (args: any) => {
          const user = users.find((u) => u.id === args.where.id);
          return Promise.resolve(user ? { ...user } : null);
        },
        count: (args: any) => {
          const count = users.filter((u) => {
            if (args.where.personalId && u.personalId !== args.where.personalId) return false;
            if (args.where.role && u.role !== args.where.role) return false;
            if (args.where.status && u.status !== args.where.status) return false;
            return true;
          }).length;
          return Promise.resolve(count);
        },
        update: (args: any) => {
          const user = users.find((u) => u.id === args.where.id);
          if (user) {
            Object.assign(user, args.data);
          }
          return Promise.resolve(user ? { ...user } : null);
        },
        create: (args: any) => {
          if (users.some((u) => u.email === args.data.email)) {
            const err = new Error('Unique constraint failed');
            (err as any).code = 'P2002';
            return Promise.reject(err);
          }
          const newUser = {
            id: users.length + 1,
            ...args.data,
          };
          users.push(newUser);
          return Promise.resolve({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            objective: newUser.objective,
            level: newUser.level,
            status: newUser.status,
          });
        },
      },
    };

    const mockAuthService = {
      createPasswordResetToken: (userId: number) => {
        const rawToken = `mock-token-${userId}-${Date.now()}`;
        createdTokens.push({ userId, rawToken });
        return Promise.resolve({ rawToken, expiresAt: new Date() });
      },
    };

    const mockEmailService = {
      sendStudentInviteEmail: (
        to: string,
        studentName: string,
        personalName: string,
        token: string,
      ) => {
        sentInviteEmails.push({ to, studentName, personalName, token });
        return Promise.resolve();
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlunosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AlunosService>(AlunosService);
  });

  describe('create', () => {
    it('creates aluno without password, generates setup token, and dispatches invite email', async () => {
      const personalId = 1;
      const input = {
        name: 'Carlos Aluno',
        email: 'carlos@fitforge.app',
        objective: 'hipertrofia',
        level: 'iniciante',
      };

      const result = await service.create(personalId, input, 'Personal Trainer');

      expect(result).toMatchObject({
        name: 'Carlos Aluno',
        email: 'carlos@fitforge.app',
        objective: 'hipertrofia',
        level: 'iniciante',
        status: 'ativo',
        latestWorkout: null,
      });

      // Verify user was stored in Prisma with aluno role and a non-empty passwordHash
      const createdUser = users.find((u) => u.email === 'carlos@fitforge.app');
      expect(createdUser).toBeDefined();
      expect(createdUser.role).toBe('aluno');
      expect(createdUser.passwordHash).toBeDefined();
      expect(createdUser.passwordHash.length).toBeGreaterThan(10);

      // Verify token creation
      expect(createdTokens).toHaveLength(1);
      expect(createdTokens[0].userId).toBe(createdUser.id);

      // Verify email dispatch
      expect(sentInviteEmails).toHaveLength(1);
      expect(sentInviteEmails[0]).toEqual({
        to: 'carlos@fitforge.app',
        studentName: 'Carlos Aluno',
        personalName: 'Personal Trainer',
        token: createdTokens[0].rawToken,
      });
    });

    it('rejects creation if password is provided', async () => {
      const personalId = 1;
      const input = {
        name: 'Carlos Aluno',
        email: 'carlos@fitforge.app',
        password: 'temporaryPassword123',
        objective: 'hipertrofia',
        level: 'iniciante',
      } as any;

      await expect(service.create(personalId, input)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects creation if required fields are missing or invalid', async () => {
      const personalId = 1;

      // Invalid name
      await expect(
        service.create(personalId, {
          name: 'A',
          email: 'valid@fitforge.app',
          objective: 'hipertrofia',
          level: 'iniciante',
        }),
      ).rejects.toThrow(BadRequestException);

      // Invalid email
      await expect(
        service.create(personalId, {
          name: 'Valid Name',
          email: 'invalid-email',
          objective: 'hipertrofia',
          level: 'iniciante',
        }),
      ).rejects.toThrow(BadRequestException);

      // Invalid objective
      await expect(
        service.create(personalId, {
          name: 'Valid Name',
          email: 'valid@fitforge.app',
          objective: 'invalid_objective',
          level: 'iniciante',
        }),
      ).rejects.toThrow(BadRequestException);

      // Invalid level
      await expect(
        service.create(personalId, {
          name: 'Valid Name',
          email: 'valid@fitforge.app',
          objective: 'hipertrofia',
          level: 'expert',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when email is already registered', async () => {
      const personalId = 1;
      users.push({
        id: 2,
        email: 'existing@fitforge.app',
        name: 'Existing User',
        role: 'aluno',
      });

      await expect(
        service.create(personalId, {
          name: 'New Student',
          email: 'existing@fitforge.app',
          objective: 'hipertrofia',
          level: 'iniciante',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects creation when personal on basic plan already has 5 active students', async () => {
      const personalId = 1;
      for (let i = 1; i <= 5; i++) {
        users.push({
          id: 10 + i,
          email: `active${i}@fitforge.app`,
          name: `Active ${i}`,
          role: 'aluno',
          personalId,
          status: 'ativo',
        });
      }

      await expect(
        service.create(personalId, {
          name: 'Student 6',
          email: 'student6@fitforge.app',
          objective: 'hipertrofia',
          level: 'iniciante',
        }),
      ).rejects.toThrow(
        'Atingiu o limite de 5 alunos ativos do Plano Básico. Faça o upgrade para o Plano PRO.',
      );
    });

    it('allows creation beyond 5 active students when personal is on pro plan', async () => {
      const personalId = 1;
      users[0].plan = 'pro';
      for (let i = 1; i <= 5; i++) {
        users.push({
          id: 10 + i,
          email: `active${i}@fitforge.app`,
          name: `Active ${i}`,
          role: 'aluno',
          personalId,
          status: 'ativo',
        });
      }

      const result = await service.create(personalId, {
        name: 'Student 6',
        email: 'student6@fitforge.app',
        objective: 'hipertrofia',
        level: 'iniciante',
      });

      expect(result.name).toBe('Student 6');
    });
  });

  describe('updateStatus', () => {
    it('successfully changes aluno status to inativo', async () => {
      users.push({
        id: 20,
        email: 'to-inactivate@fitforge.app',
        name: 'Student Inactivate',
        role: 'aluno',
        personalId: 1,
        status: 'ativo',
      });

      const updated = await service.updateStatus(1, 20, { status: 'inativo' });
      expect(updated.status).toBe('inativo');
    });

    it('rejects reactivating aluno to ativo when quota of 5 is exceeded on basic plan', async () => {
      users.push({
        id: 20,
        email: 'to-reactivate@fitforge.app',
        name: 'Student Reactivate',
        role: 'aluno',
        personalId: 1,
        status: 'inativo',
      });

      for (let i = 1; i <= 5; i++) {
        users.push({
          id: 30 + i,
          email: `active${i}@fitforge.app`,
          name: `Active ${i}`,
          role: 'aluno',
          personalId: 1,
          status: 'ativo',
        });
      }

      await expect(service.updateStatus(1, 20, { status: 'ativo' })).rejects.toThrow(
        'Atingiu o limite de 5 alunos ativos do Plano Básico. Faça o upgrade para o Plano PRO.',
      );
    });

    it('allows reactivating aluno to ativo when slots are available', async () => {
      users.push({
        id: 20,
        email: 'to-reactivate@fitforge.app',
        name: 'Student Reactivate',
        role: 'aluno',
        personalId: 1,
        status: 'inativo',
      });

      const updated = await service.updateStatus(1, 20, { status: 'ativo' });
      expect(updated.status).toBe('ativo');
    });
  });

  describe('list', () => {
    it('returns filtered students assigned to personal', async () => {
      users.push({
        id: 10,
        name: 'Aluno Um',
        email: 'um@fitforge.app',
        role: 'aluno',
        personalId: 1,
        objective: 'hipertrofia',
        level: 'iniciante',
        status: 'ativo',
      });

      const list = await service.list(1, {});
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('Aluno Um');
    });
  });
});
