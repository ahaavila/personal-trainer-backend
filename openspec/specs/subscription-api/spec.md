# subscription-api Specification

## Purpose

Provides subscription status retrieval, Stripe Checkout session generation, Stripe Customer Portal session generation, and Stripe webhook handling for personal trainer subscription tiers.

## Requirements

### Requirement: Personal can retrieve subscription status
The system SHALL provide an authenticated personal-only endpoint `GET /api/subscription/status` that returns the trainer's current subscription plan (`basic` or `pro`), subscription status, the number of currently active students, and the maximum allowed active students (5 for Basic, null for PRO).

#### Scenario: Basic plan status retrieval
- **WHEN** an authenticated personal on Plano Básico requests their subscription status
- **THEN** the system returns plan `basic`, active students count, and `maxActiveStudents: 5`

#### Scenario: PRO plan status retrieval
- **WHEN** an authenticated personal on Plano PRO requests their subscription status
- **THEN** the system returns plan `pro`, active students count, and `maxActiveStudents: null` (unlimited)

### Requirement: Personal can create Stripe Checkout session for Plano PRO
The system SHALL provide an authenticated personal-only endpoint `POST /api/subscription/checkout` that creates a Stripe Checkout Session for recurring monthly billing and returns the checkout URL.

#### Scenario: Successfully creating a checkout session
- **WHEN** an authenticated personal requests a checkout session
- **THEN** the API invokes Stripe with the configured price ID, customer ID or email, success and cancel URLs, and returns `{ url: string }`

### Requirement: Personal can create Stripe Customer Portal session
The system SHALL provide an authenticated personal-only endpoint `POST /api/subscription/portal` that generates a Stripe Customer Portal session for trainers who have a registered Stripe customer ID.

#### Scenario: Successfully creating portal session
- **WHEN** an authenticated personal with a Stripe customer ID requests the portal URL
- **THEN** the API generates a customer portal session and returns `{ url: string }`

#### Scenario: Portal requested without existing customer ID
- **WHEN** a personal without a Stripe customer ID attempts to open the portal
- **THEN** the API responds with a bad request status indicating no active billing profile exists

### Requirement: Stripe webhook processes subscription lifecycle events
The system SHALL provide a webhook endpoint `POST /api/subscription/webhook` that validates the `stripe-signature` header using the webhook secret, updating trainer subscription records on `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.

#### Scenario: Checkout completed webhook
- **WHEN** a valid `checkout.session.completed` event is received
- **THEN** the trainer's user record is updated with `plan = 'pro'`, `subscriptionStatus = 'active'`, and the assigned Stripe customer and subscription IDs

#### Scenario: Subscription canceled webhook
- **WHEN** a valid `customer.subscription.deleted` event is received
- **THEN** the trainer's user record is downgraded to `plan = 'basic'` and `subscriptionStatus = 'canceled'`

#### Scenario: Invalid webhook signature
- **WHEN** a webhook request arrives with an invalid or missing signature
- **THEN** the API rejects the request with HTTP 400 Bad Request
