## 1. Database Model & Email Setup

- [x] 1.1 Add `PasswordResetToken` model to `prisma/schema.prisma` and generate Prisma Client; verify schema validity with `npx prisma validate`
- [x] 1.2 Install `resend` package and implement `EmailService` with password reset email template, verifying graceful fallback when API key is missing
- [x] 1.3 Create `ForgotPasswordDto` and `ResetPasswordDto` with validation rules in `src/auth/` (email validation, minimum password length 6 chars); verify compilation with `npm run build`

## 2. Service & Controller Implementation

- [x] 2.1 Implement token generation (random bytes + SHA-256 hash), storage, and email dispatch in `AuthService`; verify with unit tests in `src/auth/auth.service.spec.ts`
- [x] 2.2 Implement password update logic with bcrypt hashing and token invalidation in `AuthService`; verify with unit tests
- [x] 2.3 Expose `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` endpoints on `AuthController`; verify route mappings and status codes (200 OK generic response on forgot-password, 400 Bad Request on invalid tokens)

## 3. Automated Tests & Verification

- [x] 3.1 Write integration/e2e tests in `test/auth.e2e-spec.ts` covering forgot-password flow (existing email, non-existing email) and reset-password flow (valid token, expired token, reused token, short password); verify all tests pass with `npm test`
