## Context

Currently, the backend exposes `GET /api/auth/me` returning basic identity data, but has no dedicated endpoints for authenticated users to update their profile information or change their account password. See `proposal.md` for motivation and `specs/user-profile-api/spec.md` for requirements.

## Goals / Non-Goals

**Goals:**
- Provide `GET /api/auth/profile` to return full account details for the authenticated user.
- Provide `PATCH /api/auth/profile` to update name, and for students to update `objective` and `level`.
- Provide `POST /api/auth/change-password` with current password verification, 6+ character new password validation, and bcrypt hashing.
- Protect all profile routes using `SessionAuthGuard`.

**Non-Goals:**
- Allowing users to change their account email address (email is primary identifier).
- Uploading custom avatar images in this phase.

## Decisions

### 1. Endpoint locations on `AuthController` / `AuthService`
- **Choice**: Co-locate profile and password change endpoints in `AuthController` and `AuthService` under `api/auth/profile` and `api/auth/change-password`.
- **Rationale**: User identity, credential verification, and account attributes already reside in `AuthModule` and `User` model.

### 2. Password Change Security
- **Choice**: Require `currentPassword` in the request body. Retrieve user's stored `passwordHash` and verify with `comparePassword(currentPassword, user.passwordHash)`. If mismatch, return `400 Bad Request` with "A senha atual está incorreta."
- **Rationale**: Prevents session hijacking from changing account credentials without knowing the existing password.

## Risks / Trade-offs

- **[Risk: Stale session cookies upon password change]** → *Mitigation*: Session cookie remains valid for the active session, but all future logins require the updated password.
