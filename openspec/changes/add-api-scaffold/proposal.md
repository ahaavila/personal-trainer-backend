## Why

The backend repository currently has no application code - only OpenSpec scaffolding. Before any real feature (auth, alunos, treinos, financeiro) can be built, the project needs a base NestJS API scaffolded with Prisma/PostgreSQL and Docker, mirroring the base scaffold already done for the frontend (`personal-trainer-web`'s `app-scaffold` capability).

## What Changes

- Scaffold a new NestJS (TypeScript) application at the repository root.
- Add Prisma as the ORM, configured against PostgreSQL, with a minimal placeholder schema and initial migration.
- Add a `GET /health` endpoint returning a simple status payload, so the API's liveness can be checked without depending on any real feature/database write path.
- Add a `Dockerfile` (and `docker-compose.yml` for local development with a Postgres container) so the API can be containerized identically in local dev and in any future hosting target.
- Add standard npm scripts (`start:dev`, `build`, `start:prod`, `lint`, `test`) and a `.env.example` documenting required environment variables (database connection string, port).
- Document how to install dependencies, run Postgres locally via Docker, run migrations, and start the dev server (README).

## Capabilities

### New Capabilities
- `api-scaffold`: Base NestJS project structure, Prisma/PostgreSQL wiring, Docker setup, and a health-check endpoint that all future backend features build on.

### Modified Capabilities
<!-- none -->

## Impact

- Affected code: entire repository root (new `src/`, `prisma/`, `Dockerfile`, `docker-compose.yml`, `package.json`, `tsconfig*.json`, Nest CLI config, ESLint config).
- Affected dependencies: adds Node.js/npm-based toolchain (`@nestjs/*`, `prisma`, `@prisma/client`), plus Docker/Docker Compose for local Postgres and containerized runs.
- No existing specs are modified since none currently exist in this repository. This change is independent of the frontend repository (`personal-trainer-web`) - they only communicate over HTTP, no shared code.
