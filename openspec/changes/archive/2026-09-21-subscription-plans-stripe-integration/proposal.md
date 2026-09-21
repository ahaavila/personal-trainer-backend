## Why

To support commercialization and monetization, the backend must enforce subscription tier limits: personal trainers on the free Plano Básico may only have up to 5 active students (`status = 'ativo'`), while personal trainers subscribed to Plano PRO have unlimited students. In addition, the backend must integrate directly with Stripe to generate checkout sessions for upgrading to PRO, create customer billing portal sessions, and process webhook events to automatically reconcile subscription lifecycles.

## What Changes

- Add subscription fields to the `User` model in Prisma:
  - `plan`: Enum `SubscriptionPlan` with values `basic` and `pro` (default: `basic`).
  - `subscriptionStatus`: Enum `SubscriptionStatus` (`active`, `past_due`, `canceled`, `unpaid`, etc.).
  - `stripeCustomerId`: String (optional, unique).
  - `stripeSubscriptionId`: String (optional).
  - `currentPeriodEnd`: DateTime (optional).
- Enforce the 5 active student quota in `AlunosService.create` and `AlunosService.updateStatus`:
  - Count currently active students (`where: { personalId, status: 'ativo' }`).
  - If `plan === 'basic'` and active count >= 5, throw `ForbiddenException` / `BadRequestException` indicating active quota is exceeded.
- Add an endpoint `PATCH /api/alunos/:id/status` to allow personal trainers to toggle an aluno's status between `ativo` and `inativo` to free up slots.
- Create `SubscriptionModule` with Stripe SDK integration:
  - `GET /api/subscription/status`: Returns current plan, status, active student count, and capacity limit.
  - `POST /api/subscription/checkout`: Creates a Stripe Checkout Session for the PRO plan recurring monthly subscription.
  - `POST /api/subscription/portal`: Creates a Stripe Customer Portal Session for billing management.
  - `POST /api/subscription/webhook`: Webhook listener using raw payload and Stripe signature verification to process `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.

## Capabilities

### New Capabilities
- `subscription-api`: Endpoints for plan status, Stripe Checkout sessions, Stripe Customer Portal sessions, and webhook reconciliation.

### Modified Capabilities
- `student-creation-data`: Enforces active student capacity limits (max 5 active students for Plano Básico) during aluno creation.
- `student-listing-data`: Includes student status toggling and active quota accounting in aluno listing.

## Impact

- Prisma schema migration: Add subscription fields and enums to `User`.
- New dependencies: `stripe` npm package.
- Controller and services in new `src/subscription/` module.
- `src/alunos/alunos.service.ts`: Active quota check and status change handler.
