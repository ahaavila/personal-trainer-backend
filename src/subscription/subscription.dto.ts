import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

export interface SubscriptionStatusDto {
  plan: SubscriptionPlan;
  status: SubscriptionStatus | null;
  activeStudents: number;
  maxActiveStudents: number | null; // 5 for basic, null for unlimited
  isUnlimited: boolean;
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
}

export interface CheckoutSessionResponseDto {
  url: string;
}

export interface CustomerPortalResponseDto {
  url: string;
}
