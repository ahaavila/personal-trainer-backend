## 1. DTOs & Service Methods

- [x] 1.1 Implement `UpdateProfileDto` and `ChangePasswordDto` in `src/auth/` and verify compilation with `npm run build`
- [x] 1.2 Implement `getProfile`, `updateProfile`, and `changePassword` methods in `AuthService` with current password verification and password hashing; verify with unit tests in `src/auth/auth.service.spec.ts`

## 2. Controller Endpoints

- [x] 2.1 Expose `GET /api/auth/profile`, `PATCH /api/auth/profile`, and `POST /api/auth/change-password` in `AuthController` protected by `SessionAuthGuard`; verify route handlers compile with `npm run build`

## 3. Automated Tests & Verification

- [x] 3.1 Write automated tests in `test/` verifying profile retrieval, profile updates, and password changes (including rejection of incorrect current passwords); verify tests pass with `npm test`
