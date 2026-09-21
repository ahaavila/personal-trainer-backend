## Context

See `proposal.md` for problem background and objectives.
Currently, `User` contains personal/aluno roles, but no tier attributes or billing identifiers.
We need to introduce plan enforcement and Stripe subscription handling.

## Goals / Non-Goals

**Goals:**
- Add subscription fields to the `User` model in Prisma (`plan`, `subscriptionStatus`, `stripeCustomerId`, `stripeSubscriptionId`, `currentPeriodEnd`).
- Guard aluno creation and status reactivation in `AlunosService`: enforce limit of 5 active students for users on `plan = 'basic'`.
- Implement `SubscriptionService` and `SubscriptionController` using the official `stripe` Node.js SDK.
- Support both live/test Stripe modes and local simulation/fallback if Stripe keys are not yet present in `.env`.
- Implement webhook endpoint with raw body parser for signature verification (`stripe.webhooks.constructEvent`).

**Non-Goals:**
- Custom invoice generator (invoices are handled directly by Stripe).
- Usage-based/metered billing (flat monthly recurring fee for Plano PRO).

## Decisions

1. **Schema Definition**:
   - Add enum `SubscriptionPlan` (`basic`, `pro`).
   - Add enum `SubscriptionStatus` (`active`, `past_due`, `canceled`, `trialing`, `unpaid`).
   - Add `stripeCustomerId` and `stripeSubscriptionId` as indexed strings on `User`.

2. **Concurrency Safe Quota Enforcement**:
   - In `AlunosService.create` and `AlunosService.updateStatus`, wrap the check and write in a database transaction (`prisma.$transaction`).
   - Query `prisma.user.count({ where: { personalId, status: 'ativo' } })`.
   - If `trainer.plan === 'basic'` and `activeCount >= 5`, throw `ForbiddenException('Atingiu o limite de 5 alunos ativos do Plano Básico. Faça o upgrade para o Plano PRO.')`.

3. **Stripe Raw Body Handling**:
   - In NestJS / Express, Stripe webhooks require the raw unparsed request buffer to verify HMAC signatures.
   - Configure NestJS express middleware or custom body-parser for `/api/subscription/webhook`.

## Risks / Trade-offs

- [Risk] Missing Stripe API keys during local development or unit testing.  
  → Mitigation: In development mode when keys are absent, mock session creation and provide simulated success callbacks so developers can test the full flow without a Stripe account.
