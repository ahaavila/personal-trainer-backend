import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Stripe } from 'stripe';
import { PrismaService } from '../prisma/prisma.service.js';
import { BASIC_PLAN_MAX_ACTIVE_STUDENTS } from '../alunos/alunos.service.js';
import type {
  CheckoutSessionResponseDto,
  CustomerPortalResponseDto,
  SubscriptionStatusDto,
} from './subscription.dto.js';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly stripe: Stripe | null = null;
  private readonly frontendUrl: string;
  private readonly webhookSecret: string | undefined;
  private readonly proPriceId: string | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    this.proPriceId = this.configService.get<string>('STRIPE_PRO_PRICE_ID');
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173';

    if (apiKey) {
      this.stripe = new Stripe(apiKey);
    } else {
      this.logger.warn(
        'STRIPE_SECRET_KEY not configured. Running in mock/simulation mode.',
      );
    }
  }

  async getStatus(trainerId: number): Promise<SubscriptionStatusDto> {
    const trainer = await this.prisma.user.findUnique({
      where: { id: trainerId },
      select: {
        id: true,
        role: true,
        plan: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        currentPeriodEnd: true,
      },
    });

    if (!trainer || trainer.role !== 'personal') {
      throw new ForbiddenException('Apenas personal trainers têm acesso à subscrição.');
    }

    // Fallback sync: if trainer has a stripeCustomerId and is still 'basic', check directly with Stripe
    // in case webhook was delayed or tunnel was down
    if (this.stripe && trainer.stripeCustomerId && trainer.plan === 'basic') {
      try {
        const subs = await this.stripe.subscriptions.list({
          customer: trainer.stripeCustomerId,
          status: 'active',
          limit: 1,
        });

        if (subs.data.length > 0) {
          const activeSub = subs.data[0] as any;
          await this.prisma.user.update({
            where: { id: trainer.id },
            data: {
              plan: 'pro',
              subscriptionStatus: 'active',
              stripeSubscriptionId: activeSub.id,
              currentPeriodEnd: activeSub.current_period_end
                ? new Date(activeSub.current_period_end * 1000)
                : null,
            },
          });
          trainer.plan = 'pro';
          trainer.subscriptionStatus = 'active';
          this.logger.log(`Auto-synced active Stripe subscription for user ${trainer.id}`);
        }
      } catch (err) {
        this.logger.warn(`Failed to auto-sync Stripe subscription for user ${trainer.id}: ${err}`);
      }
    }

    const activeStudents = await this.prisma.user.count({
      where: { personalId: trainerId, role: 'aluno', status: 'ativo' },
    });

    const isPro = trainer.plan === 'pro';

    return {
      plan: trainer.plan,
      status: trainer.subscriptionStatus,
      activeStudents,
      maxActiveStudents: isPro ? null : BASIC_PLAN_MAX_ACTIVE_STUDENTS,
      isUnlimited: isPro,
      stripeCustomerId: trainer.stripeCustomerId,
      currentPeriodEnd: trainer.currentPeriodEnd
        ? trainer.currentPeriodEnd.toISOString()
        : null,
    };
  }

  async createCheckoutSession(
    trainerId: number,
  ): Promise<CheckoutSessionResponseDto> {
    const trainer = await this.prisma.user.findUnique({
      where: { id: trainerId },
      select: { id: true, email: true, name: true, role: true, stripeCustomerId: true },
    });

    if (!trainer || trainer.role !== 'personal') {
      throw new ForbiddenException('Apenas personal trainers podem assinar o Plano PRO.');
    }

    const successUrl = `${this.frontendUrl.replace(/\/$/, '')}/planos?upgraded=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${this.frontendUrl.replace(/\/$/, '')}/planos?canceled=true`;

    if (!this.stripe || !this.proPriceId) {
      this.logger.log(`[MOCK STRIPE] Checkout requested for trainer ${trainer.email}`);
      // In development/simulation without Stripe credentials, upgrade trainer plan to PRO
      await this.prisma.user.update({
        where: { id: trainer.id },
        data: {
          plan: 'pro',
          subscriptionStatus: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      return { url: `${successUrl}&mock=true` };
    }

    let customerId = trainer.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: trainer.email,
        name: trainer.name,
        metadata: { userId: String(trainer.id) },
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: trainer.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: this.proPriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: String(trainer.id),
      },
    });

    if (!session.url) {
      throw new BadRequestException('Não foi possível gerar a sessão de checkout do Stripe.');
    }

    return { url: session.url };
  }

  async createPortalSession(
    trainerId: number,
  ): Promise<CustomerPortalResponseDto> {
    const trainer = await this.prisma.user.findUnique({
      where: { id: trainerId },
      select: { id: true, email: true, role: true, stripeCustomerId: true },
    });

    if (!trainer || trainer.role !== 'personal') {
      throw new ForbiddenException('Acesso restrito a personal trainers.');
    }

    const returnUrl = `${this.frontendUrl.replace(/\/$/, '')}/planos`;

    if (!trainer.stripeCustomerId) {
      if (!this.stripe) {
        return { url: `${returnUrl}?portal=mock` };
      }
      throw new BadRequestException('Nenhum perfil de faturação ativo no Stripe.');
    }

    if (!this.stripe) {
      return { url: `${returnUrl}?portal=mock` };
    }

    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: trainer.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: portalSession.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
    let event: Stripe.Event;

    if (this.stripe && this.webhookSecret) {
      try {
        event = this.stripe.webhooks.constructEvent(
          rawBody,
          signature,
          this.webhookSecret,
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid signature';
        this.logger.error(`Webhook signature verification failed: ${message}`);
        throw new BadRequestException(`Webhook Error: ${message}`);
      }
    } else {
      // Development or test fallback
      try {
        event = JSON.parse(rawBody.toString('utf8')) as Stripe.Event;
      } catch {
        throw new BadRequestException('Invalid payload');
      }
    }

    this.logger.log(`Processing Stripe webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;
        const userId = session.metadata?.userId ? parseInt(session.metadata.userId, 10) : null;

        if (userId) {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              plan: 'pro',
              subscriptionStatus: 'active',
              ...(customerId ? { stripeCustomerId: customerId } : {}),
              ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
            },
          });
          this.logger.log(`User ${userId} upgraded to PRO via checkout session`);
        } else if (customerId) {
          await this.prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              plan: 'pro',
              subscriptionStatus: 'active',
              ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id;
        const status = subscription.status; // active, past_due, canceled, etc.
        const currentPeriodEnd =
          typeof subscription.current_period_end === 'number'
            ? new Date(subscription.current_period_end * 1000)
            : null;

        const mappedStatus =
          status === 'active'
            ? 'active'
            : status === 'past_due'
              ? 'past_due'
              : status === 'canceled'
                ? 'canceled'
                : status === 'trialing'
                  ? 'trialing'
                  : 'unpaid';

        const isStillPro = ['active', 'trialing'].includes(status);

        if (customerId) {
          await this.prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              plan: isStillPro ? 'pro' : 'basic',
              subscriptionStatus: mappedStatus,
              currentPeriodEnd,
              stripeSubscriptionId: subscription.id,
            },
          });
          this.logger.log(`Updated subscription for customer ${customerId}: ${status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id;

        if (customerId) {
          await this.prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              plan: 'basic',
              subscriptionStatus: 'canceled',
            },
          });
          this.logger.log(`Downgraded user with customer ${customerId} to basic plan`);
        }
        break;
      }

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}
