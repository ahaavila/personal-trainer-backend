## Context

`AuthService.login()` validates credentials then issues a JWT; `getAuthenticatedUser()` validates a token and is used by `/api/auth/me` and `SessionAuthGuard`. The existing `User` model already includes `role` and optional aluno `status`.

## Goals / Non-Goals

**Goals:**
- Reject non-active aluno logins before a JWT is signed or a cookie is issued.
- Re-read account status during token resolution so an already-issued aluno token loses access immediately after deactivation.
- Use a single consistent `UnauthorizedException` message for inactive aluno access.

**Non-Goals:**
- Delete tokens from storage, change JWT claims, or require a database migration.
- Restrict personal users based on the aluno-specific status field.

## Decisions

- Include `status` in the user queries performed by `login()` and `getAuthenticatedUser()`.
- Apply the predicate only for `role === 'aluno'`: `status !== 'ativo'` returns `UnauthorizedException('Student account is inactive')`.
- Enforce in `getAuthenticatedUser()` rather than only in controller endpoints, because it centralizes the rule for `/api/auth/me` and every route using `SessionAuthGuard`.

## Risks / Trade-offs

- [Risk] A DB lookup already occurs per authenticated request and will now select one extra field -> Mitigation: status is indexed within the existing row lookup and avoids token-revocation infrastructure.
