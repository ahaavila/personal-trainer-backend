## 1. DTO & Authentication Service

- [x] 1.1 Update `LoginDto` in `src/auth/login.dto.ts` to include optional `rememberMe?: unknown`.
- [x] 1.2 Update `AuthService.login()` to accept `rememberMe` and issue JWT with 30-day lifetime when true vs 1-day lifetime when false.
- [x] 1.3 Forward `rememberMe` from `AuthController.login()` to `AuthService.login()` and ensure cookie expiration timestamp matches.

## 2. Testing & Verification

- [x] 2.1 Add unit and e2e tests verifying 30-day token/cookie expiration when `rememberMe: true` and 1-day expiration when `rememberMe: false`.
- [x] 2.2 Run backend test suites, lint, and build.
