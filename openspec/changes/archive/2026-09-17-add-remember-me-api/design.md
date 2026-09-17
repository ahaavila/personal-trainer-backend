## Context

Authentication issues a JWT token and a session cookie. Currently, tokens have a fixed default expiration regardless of whether the user requests to be remembered.

## Goals / Non-Goals

**Goals:**
- Accept optional `rememberMe?: boolean` in `LoginDto`.
- Support two session expiration tiers:
  - Standard session: 1 day (`1d`), cookie expires in 1 day.
  - Remember me session: 30 days (`30d`), cookie expires in 30 days.
- Ensure `AuthController.login` sets the `session` cookie's `expires` attribute matching the token's decoded expiration timestamp.

**Non-Goals:**
- Refresh token rotation (single JWT session cookie architecture is retained).
- Remembering emails on the backend (email remembering is handled client-side).

## Decisions

### 1. DTO and Controller Parsing
- `LoginDto`:
  ```ts
  export interface LoginDto {
    email?: unknown;
    password?: unknown;
    rememberMe?: unknown;
  }
  ```
- In `AuthController.login`, parse `rememberMe`:
  `const rememberMe = Boolean(credentials.rememberMe);`
- Pass `rememberMe` to `AuthService.login(email, password, rememberMe)`.

### 2. JWT and Cookie Expiration
- In `AuthService.login`:
  ```ts
  const expiresIn = rememberMe ? '30d' : '1d';
  const token = await this.jwtService.signAsync(
    { sub: user.id, role: user.role },
    { expiresIn },
  );
  ```
- `this.getTokenExpiration(token)` computes the date from the token's `exp` claim, which `AuthController.login` passes directly to `response.cookie(..., { expires: ... })`.

## Risks / Trade-offs

- **[Risk] Long-lived JWT tokens cannot be revoked before expiration without token blacklist**
  -> *Mitigation*: The backend already checks the user's role and active status directly on every request in `getAuthenticatedUser()`. Inactive or deleted accounts are blocked immediately even with a valid JWT.
