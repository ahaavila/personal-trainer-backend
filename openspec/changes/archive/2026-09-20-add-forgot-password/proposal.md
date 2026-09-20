## Why

Users who forget their credentials currently have no self-service mechanism to recover access to the API and web platform. Providing secure password recovery endpoints (`POST /api/auth/forgot-password` and `POST /api/auth/reset-password`) allows users to request a time-limited reset token and update their hashed password in the database.

## What Changes

- Add a `PasswordResetToken` model in Prisma (or token management in PostgreSQL) to store secure, hashed, single-use, time-limited reset tokens tied to a `User`.
- Add `POST /api/auth/forgot-password` endpoint in `AuthController` that accepts an email, validates the user's existence, creates a cryptographically secure reset token with an expiration window (e.g. 1 hour), and dispatches/simulates the recovery email.
- Always return a generic success message from `POST /api/auth/forgot-password` to prevent user enumeration attacks.
- Add `POST /api/auth/reset-password` endpoint that accepts a reset token and a new password, validates token expiration and single-use status, hashes the new password with bcrypt/argon2, updates the user record, and invalidates the token.
- Provide service layer handling and unit/integration tests for token creation, expiration, invalidation, and password updates.

## Capabilities

### New Capabilities
- `password-recovery`: Covers issuing single-use, time-limited password reset tokens and updating user passwords upon token verification.

### Modified Capabilities
<!-- None: existing auth requirements (login, session, logout) remain unchanged -->

## Impact

- **Database**: Adds a new Prisma migration/model for password reset tokens (`PasswordResetToken`).
- **Auth Module**: Extends `AuthController` and `AuthService` with `forgotPassword` and `resetPassword` methods.
- **DTOs**: Introduces `ForgotPasswordDto` and `ResetPasswordDto` with class-validator annotations.
- **Security**: Cryptographically secure token generation (random bytes hashed in database), constant-time lookup, and rate limiting / single-use invalidation.
