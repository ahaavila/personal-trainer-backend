## Why

The frontend (`personal-trainer-web`) already has a login screen wired against a mocked `POST /api/auth/login` contract (via MSW), with two fixed test credentials for the `personal` and `aluno` roles. The backend scaffold (`api-scaffold`) has no real users, auth, or database models yet. To let the real backend replace the mock, it needs to fulfill the same contract with real authentication.

## What Changes

- Add a `User` data model in Prisma with `email`, a hashed password, `name`, and a `role` (`personal` | `aluno`).
- Add an auth module exposing `POST /api/auth/login` that validates `email`/`password` against the database and returns a JWT plus the user's `role` and `name` on success, or a `401` with an error message on failure - matching the response shape the frontend already expects.
- Add JWT issuing/verification (signed with a server-side secret from environment configuration, with an expiration).
- Add a seed script that creates exactly the two test users the frontend already hardcodes (`personal@fitforge.app` / `personal123` as `personal`, `aluno@fitforge.app` / `aluno123` as `aluno`), so today's mocked frontend flow keeps working once pointed at the real API.
- Enable CORS for the frontend's origin(s).
- User creation/registration (e.g. a personal creating aluno accounts) is explicitly out of scope for this change - only the two seeded test users exist for now.

## Capabilities

### New Capabilities
- `auth`: Real authentication (login, password hashing, JWT issuance) and the `User` data model backing it.

### Modified Capabilities
<!-- none -->

## Impact

- Affected code: `prisma/schema.prisma` (new `User` model + migration), new `src/auth/` module (controller, service, JWT strategy/guard), new seed script, `src/main.ts` (CORS).
- Affected dependencies: adds a JWT library (e.g. `@nestjs/jwt`) and a password hashing library (e.g. `bcrypt`).
- Downstream: once this is implemented and deployed, the frontend's `add-login-screen` MSW mock can be pointed at the real API and eventually removed (tracked as a separate change in the frontend repo, not part of this change).
