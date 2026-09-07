## Context

See proposal.md - Why. The `add-auth` change (already implemented and archived) issues a JWT returned in the login response body; the frontend currently only holds `role`/`name` in memory (lost on refresh) and never uses the token for anything, since no other endpoint is protected yet. This change moves the token into an httpOnly cookie and adds a way for the frontend to recover the session after a reload.

## Goals / Non-Goals

**Goals:**
- Move the JWT out of the JSON response body and into an httpOnly, Secure cookie set on login.
- Add `GET /api/auth/me` so the frontend can ask "am I logged in, and as whom?" on app load.
- Add `POST /api/auth/logout` to clear the cookie.
- Configure CORS to allow credentialed (cookie-carrying) requests from the frontend's origin.

**Non-Goals:**
- No route protection/guards on other endpoints yet - still no other real endpoints besides `/health` and the auth endpoints. Applying a cookie-based auth guard to future protected routes is follow-up work once those routes exist.
- No cross-domain production cookie strategy decided here (e.g. shared root domain vs. reverse proxy) - noted as an open question below, deferred until a hosting provider/domain is chosen.
- No refresh tokens - the session cookie carries a single JWT with the same expiration policy as before.

## Decisions

- **Cookie name and attributes**: a single cookie (name decided at implementation time, e.g. `session`) with `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, and the same expiration as the JWT's `JWT_EXPIRES_IN`. `SameSite=Lax` is sufficient for this app's flow (no cross-site form posts to protect against beyond what Lax already blocks) and works without extra CSRF tokens for now, since all state-changing requests originate from the app's own frontend.
- **`cookie-parser` middleware**: standard, minimal Express/Nest-compatible way to read the incoming cookie in `AuthService`/guards without hand-rolling cookie header parsing.
- **`GET /api/auth/me` returns the same shape as today's successful login body** (`{ role, name }`, minus the token) so the frontend can reuse its existing success-handling logic with minimal changes.
- **Login response body keeps `role` and `name`** (dropping only the token) so the frontend still gets an immediate answer on login without needing a second round-trip to `/me` right after logging in.
- **CORS**: `app.enableCors({ origin: corsOrigins, credentials: true })` - `credentials: true` is required for the browser to send/receive cookies on cross-origin requests; the frontend must correspondingly send `fetch(..., { credentials: 'include' })`.

## Risks / Trade-offs

- [Risk] `SameSite=Lax` still allows the cookie on top-level GET navigations from other sites, though not on cross-site POST/fetch - acceptable given there's no sensitive state-changing GET endpoint, but worth re-checking once more endpoints exist → Mitigation: revisit `SameSite` strictness (`Strict` vs `Lax`) once real protected routes are added.
- [Risk] Cross-origin cookies in production (frontend and backend on different domains) may be restricted by browser tracking-prevention features (e.g. Safari ITP) unless both are placed under a shared root domain or unified behind a reverse proxy → Mitigation: out of scope for this change; the proposal's Impact section flags this as a hosting/domain decision to make before a production deploy.
- [Risk] Removing the token from the login response body is a breaking change for the current frontend integration → Mitigation: the frontend has a corresponding change (tracked in the `personal-trainer-web` repo) to switch to `credentials: 'include'` and call `/me` on load; both changes should be deployed together in local/dev testing.

## Open Questions

- Exact production cookie domain/`SameSite` strategy depends on the hosting/domain decision (shared root domain vs. reverse proxy vs. cross-site `SameSite=None`), which hasn't been made yet. This doesn't change the requirements or task breakdown for local/dev behavior, so it's deferred rather than blocking this change.
