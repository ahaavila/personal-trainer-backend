## 1. Database Model & Migration

- [x] 1.1 Update `prisma/schema.prisma` with `SubscriptionPlan` and `SubscriptionStatus` enums and add fields (`plan`, `subscriptionStatus`, `stripeCustomerId`, `stripeSubscriptionId`, `currentPeriodEnd`) to the `User` model
- [x] 1.2 Create and deploy Prisma migration and verify Prisma Client types generate without errors

## 2. Quota Enforcement & Student Status API

- [x] 2.1 Enforce 5 active students limit in `AlunosService.create` for personal trainers on the Basic plan
- [x] 2.2 Add `PATCH /api/alunos/:id/status` endpoint to toggle aluno status between `ativo` and `inativo` with quota validation on reactivation

## 3. Stripe Subscription Module

- [x] 3.1 Install `stripe` package and configure Stripe client with environment variables (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`)
- [x] 3.2 Implement `GET /api/subscription/status` returning current plan, active student count, and quota limit
- [x] 3.3 Implement `POST /api/subscription/checkout` to generate Stripe Checkout sessions for Plano PRO
- [x] 3.4 Implement `POST /api/subscription/portal` to generate Stripe Customer Portal sessions
- [x] 3.5 Implement `POST /api/subscription/webhook` with raw body signature verification and handle subscription events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`)

## 4. Tests and Verification

- [x] 4.1 Write unit tests for quota enforcement in `AlunosService`
- [x] 4.2 Write unit tests for `SubscriptionService` checkout, portal, and webhook handling
- [x] 4.3 Run `npm run build` and `npm test` to verify zero compile or test regressions
