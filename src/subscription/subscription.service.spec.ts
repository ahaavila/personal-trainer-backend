import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubscriptionService } from './subscription.service.js';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let users: Array<any>;

  beforeEach(async () => {
    users = [
      {
        id: 1,
        name: 'Personal Trainer',
        email: 'trainer@fitforge.app',
        role: 'personal',
        plan: 'basic',
        subscriptionStatus: 'active',
        stripeCustomerId: 'cus_12345',
        stripeSubscriptionId: 'sub_12345',
        currentPeriodEnd: null,
      },
      {
        id: 2,
        name: 'Aluno Um',
        email: 'aluno1@fitforge.app',
        role: 'aluno',
        personalId: 1,
        status: 'ativo',
      },
      {
        id: 3,
        name: 'Aluno Dois',
        email: 'aluno2@fitforge.app',
        role: 'aluno',
        personalId: 1,
        status: 'inativo',
      },
    ];

    const mockPrismaService = {
      user: {
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
        updateMany: (args: any) => {
          let count = 0;
          for (const u of users) {
            if (args.where.stripeCustomerId && u.stripeCustomerId === args.where.stripeCustomerId) {
              Object.assign(u, args.data);
              count++;
            }
          }
          return Promise.resolve({ count });
        },
      },
    };

    const mockConfigService = {
      get: (key: string) => {
        if (key === 'FRONTEND_URL') return 'http://localhost:5173';
        if (key === 'STRIPE_SECRET_KEY') return undefined; // mock mode
        if (key === 'STRIPE_WEBHOOK_SECRET') return undefined;
        if (key === 'STRIPE_PRO_PRICE_ID') return undefined;
        return undefined;
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  describe('getStatus', () => {
    it('returns basic plan status with active student counts and 5 maxActiveStudents', async () => {
      const status = await service.getStatus(1);
      expect(status).toEqual({
        plan: 'basic',
        status: 'active',
        activeStudents: 1,
        maxActiveStudents: 5,
        isUnlimited: false,
        stripeCustomerId: 'cus_12345',
        currentPeriodEnd: null,
      });
    });

    it('returns pro plan status with maxActiveStudents null', async () => {
      users[0].plan = 'pro';
      const status = await service.getStatus(1);
      expect(status.plan).toBe('pro');
      expect(status.maxActiveStudents).toBeNull();
      expect(status.isUnlimited).toBe(true);
    });

    it('rejects access for student role with ForbiddenException', async () => {
      await expect(service.getStatus(2)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createCheckoutSession and portal', () => {
    it('returns checkout url in mock mode', async () => {
      const res = await service.createCheckoutSession(1);
      expect(res.url).toContain('/planos?upgraded=true');
    });

    it('returns customer portal url in mock mode', async () => {
      const res = await service.createPortalSession(1);
      expect(res.url).toContain('/planos');
    });
  });

  describe('handleWebhook', () => {
    it('handles checkout.session.completed and upgrades user to PRO', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_12345',
            subscription: 'sub_new_pro',
            metadata: { userId: '1' },
          },
        },
      };

      const raw = Buffer.from(JSON.stringify(event));
      const res = await service.handleWebhook(raw, 'sig');
      expect(res.received).toBe(true);

      expect(users[0].plan).toBe('pro');
      expect(users[0].subscriptionStatus).toBe('active');
      expect(users[0].stripeSubscriptionId).toBe('sub_new_pro');
    });

    it('handles customer.subscription.deleted and downgrades user to basic', async () => {
      users[0].plan = 'pro';
      users[0].subscriptionStatus = 'active';

      const event = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_12345',
          },
        },
      };

      const raw = Buffer.from(JSON.stringify(event));
      const res = await service.handleWebhook(raw, 'sig');
      expect(res.received).toBe(true);

      expect(users[0].plan).toBe('basic');
      expect(users[0].subscriptionStatus).toBe('canceled');
    });

    it('handles customer.subscription.updated with active and past_due statuses', async () => {
      users[0].plan = 'pro';

      const event = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_12345',
            customer: 'cus_12345',
            status: 'past_due',
            current_period_end: Math.floor(Date.now() / 1000) + 86400,
          },
        },
      };

      const raw = Buffer.from(JSON.stringify(event));
      await service.handleWebhook(raw, 'sig');

      expect(users[0].subscriptionStatus).toBe('past_due');
      expect(users[0].plan).toBe('basic'); // past_due is no longer considered pro
    });
  });
});
