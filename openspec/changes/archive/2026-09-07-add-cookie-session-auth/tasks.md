## 1. Cookie Infrastructure

- [x] 1.1 Add `cookie-parser` (or equivalent) and wire it into the Nest app, and verify incoming request cookies are parsed and accessible
- [x] 1.2 Update CORS configuration in `src/main.ts` to set `credentials: true`, and verify a credentialed cross-origin request succeeds

## 2. Login: Issue Session Cookie

- [x] 2.1 Update `POST /api/auth/login` to set the JWT as an `HttpOnly`, `Secure`, `SameSite=Lax` cookie on success instead of returning it in the JSON body, and verify the response's `Set-Cookie` header has these attributes
- [x] 2.2 Verify the login response body still contains `role` and `name` (no token) on success
- [x] 2.3 Verify a failed login (wrong credentials) does not set a session cookie and still returns 401 with a message

## 3. Session Check & Logout

- [x] 3.1 Implement `GET /api/auth/me` reading the session cookie, validating the JWT, and returning `{ role, name }` on success, and verify it manually with a valid cookie from a prior login
- [x] 3.2 Verify `GET /api/auth/me` returns 401 when called with no cookie or an invalid/expired one
- [x] 3.3 Implement `POST /api/auth/logout` clearing the session cookie, and verify a subsequent call to `/me` returns 401 after logout

## 4. Documentation

- [x] 4.1 Update `README.md` describing the cookie-based session flow (login sets cookie, `/me` checks session, `/logout` clears it) and the `credentials: 'include'` requirement for clients, and verify the documented flow matches the implementation
