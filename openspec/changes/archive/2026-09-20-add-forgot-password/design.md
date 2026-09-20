## Context

The backend is built with NestJS, Prisma, and PostgreSQL. Authentication currently uses bcrypt/argon2 hashing (`src/auth/password.ts`) and JWT cookies (`src/auth/auth.service.ts`). There is currently no database model or service to support forgotten password recovery. See `proposal.md` for motivation and `specs/password-recovery/spec.md` for functional requirements.

## Goals / Non-Goals

**Goals:**
- Provide secure API endpoints `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`.
- Persist password reset tokens securely in the database using a new `PasswordResetToken` Prisma model.
- Hash reset tokens in the database (e.g. SHA-256) so a database leak does not expose valid reset tokens.
- Enforce token expiration (1 hour), single-use invalidation, and password hashing upon update.
- Implement anti-enumeration behavior: always return 200 OK on forgot-password requests regardless of whether the email is registered.
- Integrate Resend via an `EmailService` to dispatch real password recovery emails with a secure link to the frontend (`${FRONTEND_URL}/redefinir-senha?token=...`).

**Non-Goals:**
- Complex multi-factor authentication (MFA/SMS) or recovery questions.
- Frontend implementation (managed in companion repo `personal-trainer-web`).

## Decisions

### 1. Dedicated `PasswordResetToken` table in Prisma
- **Choice**:
  ```prisma
  model PasswordResetToken {
    id        Int      @id @default(autoincrement())
    userId    Int
    tokenHash String   @unique
    expiresAt DateTime
    usedAt    DateTime?
    createdAt DateTime @default(now())
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  }
  ```
- **Rationale**: Storing tokens in a separate relation with `expiresAt` and `usedAt` ensures clean auditability, allows revocation, and permits cascade deletion if a user is deleted.
- **Alternatives considered**: Storing a single `resetToken` string on the `User` model (less flexible, harder to keep audit trail or support multiple concurrent devices).

### 2. Token generation and hashing
- **Choice**: Generate 32 bytes of cryptographically secure random data (`crypto.randomBytes(32).toString('hex')`). The plaintext token is returned/emailed to the user, while the SHA-256 digest is stored in `PasswordResetToken.tokenHash`.
- **Rationale**: If the database is compromised, an attacker cannot immediately use raw tokens from the database to reset user accounts.
- **Alternatives considered**: Storing plaintext tokens (insecure).

### 3. Enumeration protection
- **Choice**: In `POST /api/auth/forgot-password`, if `User` with email is not found, do not create a token, but return `200 OK` with the exact same response body (`{ message: 'Se o e-mail estiver registado, enviámos instruções para redefinir a sua senha.' }`).
- **Rationale**: Standard OWASP recommendation to protect user privacy and prevent email scraping.

### 4. Password validation and hashing
- **Choice**: Enforce a minimum length of 6 characters in `ResetPasswordDto` using class-validator and hash the new password using the existing `hashPassword` function (`bcrypt`). Upon successful reset, mark `usedAt: new Date()` and invalidate any other pending tokens for that user.

### 5. Email delivery via Resend
- **Choice**: Create an `EmailService` using the official `resend` SDK. Read `RESEND_API_KEY`, `EMAIL_FROM`, and `FRONTEND_URL` from environment variables. If `RESEND_API_KEY` is not provided (e.g. in test environments), log a warning instead of failing.
- **Rationale**: High deliverability, modern TypeScript SDK, and simple integration.

## Risks / Trade-offs

- **[Risk: Stale unconsumed tokens accumulating in the database]** → *Mitigation*: Reset tokens have `expiresAt` and any existing unused tokens for that user are invalidated when a new one is created or when a reset succeeds. A lightweight cleanup can be added during token creation.
- **[Risk: Timing attacks distinguishing existing vs non-existing users]** → *Mitigation*: Perform dummy cryptographic hashing or keep execution time uniform across user existence checks.
