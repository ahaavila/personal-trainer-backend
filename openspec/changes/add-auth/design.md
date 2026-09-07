## Context

See proposal.md - Why. The `api-scaffold` change (already implemented) provides the NestJS project, Prisma/PostgreSQL wiring, and Docker setup, but only a placeholder `ApplicationMetadata` model - no users, auth, or CORS configuration exist yet. The frontend's `add-login-screen` change (already implemented, mocked via MSW) defines the exact request/response contract this backend needs to fulfill: `POST /api/auth/login` with `{ email, password }`, returning `{ role, name }` (+ now a token) on success or `{ message }` with 401 on failure.

## Goals / Non-Goals

**Goals:**
- Real `User` model in Prisma with hashed passwords and a `role` enum (`personal` | `aluno`).
- `POST /api/auth/login` issuing a JWT on success, matching the existing response shape plus a token field.
- A seed script creating exactly the two test users the frontend already hardcodes, so the existing frontend flow keeps working unchanged once pointed at this API.
- CORS enabled for the frontend's origin(s).

**Non-Goals:**
- No user registration/creation endpoint - only the two seeded users exist. A future change will add personal-creates-aluno account flows.
- No route protection/guards on other endpoints yet - there are no other real endpoints besides `/health` and `/api/auth/login` at this point. Applying the JWT as a guard on protected routes is future work once those routes exist.
- No refresh tokens, logout endpoint, or token revocation - a single access token with an expiration is sufficient for this stage.
- No password reset flow (matches the frontend's `add-login-screen` Non-Goal for "Esqueci minha senha").

## Decisions

- **JWT via `@nestjs/jwt`**: Standard, well-supported Nest integration for signing/verifying tokens. Alternative considered: session-based auth with server-side session storage - rejected because it adds a stateful session store requirement that isn't needed yet, and JWT keeps the API stateless, which fits the free-tier hosting plan (no sticky sessions needed across instances).
- **Password hashing via `bcrypt`**: Industry-standard, well-tested library for password hashing in Node. Alternative considered: `argon2` - a reasonable alternative, but `bcrypt` has broader ecosystem familiarity and is sufficient for this stage; can be revisited later without changing the spec (hashing is an implementation detail).
- **`User` model with a `role` enum column** rather than separate `Personal`/`Aluno` tables: A single table is simpler while the two roles don't yet have meaningfully different stored attributes. If personal-specific or aluno-specific fields emerge later (e.g. a personal's specialties, an aluno's linked personal), those can be added as related tables referencing `User` without breaking this login contract.
- **JWT secret from environment configuration** (`.env`, following the `.env.example` pattern from `api-scaffold`): keeps the secret out of source control, consistent with the existing `DATABASE_URL` handling.
- **Seed script matches the frontend's hardcoded test credentials exactly** (`personal@fitforge.app` / `personal123`, `aluno@fitforge.app` / `aluno123`): this means the frontend's `add-login-screen` mock and this real backend are drop-in compatible for manual testing - no frontend changes needed to test against the real API using the same credentials.
- **CORS**: allow the frontend's dev origin (`http://localhost:5173`, Vite's default) via NestJS's built-in CORS support (`app.enableCors(...)`), configurable via environment so a future production frontend origin can be added without code changes.

## Risks / Trade-offs

- [Risk] Hardcoded seed credentials in a public repo could be mistaken for real production credentials → Mitigation: document clearly in README that these are test-only accounts, consistent with how the frontend already documents them.
- [Risk] No endpoints are protected by the JWT yet, so issuing a token doesn't yet restrict access to anything → Mitigation: acceptable for this stage since no other real endpoints exist; explicitly called out as a Non-Goal so it isn't mistaken for an oversight.
- [Risk] A stateless JWT can't be revoked before it expires → Mitigation: use a short-to-moderate expiration (defined at implementation time) and accept this trade-off for now; revocation/refresh tokens are out of scope.
