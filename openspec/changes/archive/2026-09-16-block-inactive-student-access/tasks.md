## 1. Status-Aware Authentication

- [x] 1.1 Update `AuthService.login()` to deny authentication for an aluno with any status other than `ativo` before signing a JWT, and verify no cookie is set for the denied request.
- [x] 1.2 Update `AuthService.getAuthenticatedUser()` to include the aluno status and deny non-active aluno sessions used by `/api/auth/me` and `SessionAuthGuard`.

## 2. Verification

- [x] 2.1 Add authentication tests covering active aluno login/session success, non-active aluno login denial, and invalidation of an existing aluno session after deactivation.
- [x] 2.2 Run backend tests, lint, and production build to verify personal and active aluno authentication remain functional.
