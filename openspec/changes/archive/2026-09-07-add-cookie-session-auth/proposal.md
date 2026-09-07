## Why

The login endpoint currently returns the JWT in the JSON response body, and the frontend only keeps the authenticated role in memory (lost on page refresh). To support a durable, more secure session across page reloads without exposing the token to JavaScript, authentication should move to an httpOnly cookie, with a session-check endpoint the frontend can call to recover the authenticated user after a reload.

## What Changes

- **BREAKING**: `POST /api/auth/login` no longer returns the JWT in the JSON response body. On success, it sets the token as an `httpOnly`, `Secure` cookie instead. The response body still includes `role` and `name`.
- Add `GET /api/auth/me`: reads the session cookie, validates the JWT, and returns the authenticated user's `role` and `name` (`200`), or `401` if the cookie is missing/invalid/expired.
- Add `POST /api/auth/logout`: clears the session cookie.
- Configure CORS to allow credentialed requests (cookies) from the frontend's origin(s).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `auth`: Login now issues a session cookie instead of a body token; adds a session-check endpoint (`/me`) and a logout endpoint.

## Impact

- Affected code: `src/auth/auth.controller.ts`, `src/auth/auth.service.ts` (cookie issuance, `/me`, `/logout`), `src/main.ts` (CORS `credentials: true`, cookie-parser middleware).
- Affected dependencies: adds a cookie-parsing library (e.g. `cookie-parser`) if not already available via NestJS/Express.
- Downstream: the frontend (`personal-trainer-web`) must be updated in a corresponding change to (a) send `credentials: 'include'` on requests, (b) call `/api/auth/me` on app load to recover the session instead of relying on in-memory-only state, and (c) stop storing/reading a token itself.
