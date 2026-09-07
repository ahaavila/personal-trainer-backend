## 1. Data Model

- [ ] 1.1 Add a `User` model to `prisma/schema.prisma` with `email` (unique), `passwordHash`, `name`, and a `role` enum (`personal` | `aluno`), and verify the schema is valid via `prisma validate`
- [ ] 1.2 Generate and apply a migration for the new `User` model, and verify the table exists in the database afterwards

## 2. Password Hashing & Seed Script

- [ ] 2.1 Add `bcrypt` and a helper to hash/compare passwords, and verify with a quick script or test that hashing then comparing the same password succeeds while comparing a wrong password fails
- [ ] 2.2 Add a seed script creating exactly two users - `personal@fitforge.app` / `personal123` with role `personal`, and `aluno@fitforge.app` / `aluno123` with role `aluno` - storing hashed passwords, and verify running the seed populates both users in the database

## 3. Auth Module

- [ ] 3.1 Add `@nestjs/jwt` and configure a JWT secret and expiration from environment variables (documented in `.env.example`), and verify the app still boots with the new configuration
- [ ] 3.2 Implement `POST /api/auth/login` validating email/password against the `User` table, and verify a request with the seeded personal credentials returns 200 with a token, `role: "personal"`, and the user's name
- [ ] 3.3 Verify a request with the seeded aluno credentials returns 200 with a token, `role: "aluno"`, and the user's name
- [ ] 3.4 Verify a request with a non-matching email/password returns 401 with an error message and no token
- [ ] 3.5 Verify a request missing email or password returns an error response without attempting authentication
- [ ] 3.6 Verify the issued token, when decoded, contains the authenticated user's role

## 4. CORS

- [ ] 4.1 Enable CORS in `src/main.ts` for the frontend's configured origin(s) (via an environment variable, defaulting to the Vite dev server origin), and verify a request from that origin succeeds while an unlisted origin is rejected by the browser

## 5. Documentation

- [ ] 5.1 Document in `README.md` the new environment variables (JWT secret/expiration, CORS origin), how to run the seed script, and the two test credentials, and verify the documented steps work as written
