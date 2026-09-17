## Why

When users log in with the "Lembrar de mim" option enabled, their session should persist across browser restarts for an extended period (e.g. 30 days) rather than expiring quickly. Currently, the backend issues tokens and cookies with a fixed expiration regardless of user intent.

## What Changes

- Update `LoginDto` in `src/auth/login.dto.ts` to accept optional `rememberMe?: boolean`.
- Update `AuthService.login()` to accept `rememberMe` and configure token lifetime: 30 days (`30d`) when `rememberMe: true`, and standard 1 day (`1d`) otherwise.
- In `AuthController.login()`, set the `session` cookie `maxAge` / `expires` to match the token lifetime (30 days vs 1 day).
- Add tests verifying the extended token and cookie expiration.

## Capabilities

### New Capabilities
<!-- No new capabilities -->

### Modified Capabilities
- `auth`: The authentication endpoint supports the `rememberMe` parameter to grant extended session duration.

## Impact

- Backend: `src/auth/login.dto.ts`, `src/auth/auth.service.ts`, `src/auth/auth.controller.ts`, and test suites.
- Database: No schema changes required.
