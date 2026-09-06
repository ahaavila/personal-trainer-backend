## Context

The repository currently has no application code (only OpenSpec scaffolding). See proposal.md - Why for motivation. This design covers scaffolding the initial NestJS + Prisma + PostgreSQL project, containerized with Docker, mirroring the frontend's `app-scaffold` change in spirit (base project only, no real business features yet).

## Goals / Non-Goals

**Goals:**
- Stand up a working NestJS + TypeScript project at the repo root using the official Nest CLI scaffold.
- Wire Prisma to PostgreSQL with a minimal placeholder schema and a working migration flow.
- Provide a `Dockerfile` for the API and a `docker-compose.yml` for local development (API + Postgres), so local dev and future hosting both run the same containerized artifact.
- Provide a `GET /health` endpoint as the first real route, proving the server, routing, and (optionally) container setup work end-to-end.

**Non-Goals:**
- No real domain entities (Personal, Aluno, Treino, Financeiro) or business logic yet - this change only scaffolds the base project.
- No authentication/authorization implementation yet - the frontend's mocked personal/aluno roles are noted here as context for future design, not implemented in this change.
- No CI/CD pipeline or actual deployment to a hosting provider (Render/Railway/Neon) - this change only prepares the app to be deployable via Docker.

## Decisions

- **Use the Nest CLI (`nest new`) for scaffolding**: Generates the official, actively maintained NestJS project structure (modules, controllers, services, testing setup) rather than hand-rolling config, keeping upgrade paths standard. Alternative considered: a minimal hand-written Express-style entrypoint with Nest installed as a library - rejected because it discards the CLI's conventions (module structure, `main.ts`, testing scaffolding) that later features will rely on.
- **Prisma over TypeORM**: Prisma's schema-first workflow and generated, fully-typed client reduce the amount of ORM-specific knowledge needed and give compile-time safety on queries, which matters given the team is newer to backend work. Alternative considered: TypeORM (Nest's more "native" integration via `@nestjs/typeorm`) - rejected due to heavier decorator-based modeling and a comparatively less consistent maintenance history.
- **PostgreSQL over MySQL/SQLite/MongoDB**: The domain (personal -> alunos -> treinos -> financeiro) is inherently relational; Postgres has strong free-tier hosting options (e.g. Neon) that fit the "start free, migrate later" hosting plan. Alternative considered: MongoDB - rejected because the relational structure would need to be modeled as duplicated/denormalized documents, adding complexity without benefit here.
- **Docker from day one**: A `Dockerfile` plus a `docker-compose.yml` (API + Postgres) for local dev means the same containerized artifact can later be redeployed to any hosting provider (free-tier now, paid later) without re-deriving a deployment setup at migration time. Alternative considered: no containerization now, add it later - rejected per the proposal's explicit hosting-migration goal, since retrofitting Docker later would require re-verifying the whole app runs correctly in a container anyway.
- **`GET /health` as the first endpoint**: A dependency-free liveness check is the simplest possible slice that proves the server starts, routes correctly, and (via the compose setup) runs in a container - without needing any real domain model yet.

## Risks / Trade-offs

- [Risk] Prisma requires a running PostgreSQL instance even for a first migration, which adds setup steps for anyone opening the repo → Mitigation: `docker-compose.yml` provides a one-command local Postgres, and the README documents the exact sequence (compose up → migrate → dev server).
- [Risk] Free-tier hosting (Render/Railway) may have cold starts or connection limits that don't appear at this scaffolding stage → Mitigation: out of scope for this change (no real hosting deploy yet); noted here so it isn't forgotten when an actual deploy change is proposed later.
- [Risk] Without any auth in this change, the `/health` endpoint and any other route are fully open → Mitigation: acceptable for a scaffold with no sensitive data yet; authentication/authorization is explicitly a Non-Goal here and will be its own change once frontend/backend auth are designed together.
