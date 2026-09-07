## 1. Scaffold NestJS Project

- [x] 1.1 Run the Nest CLI to scaffold a new TypeScript project at the repository root and verify `package.json`, `src/main.ts`, `src/app.module.ts`, and `tsconfig*.json` are created
- [x] 1.2 Run `npm install` and verify install completes without errors
- [x] 1.3 Add/confirm `.gitignore` covers `node_modules/`, `dist/`, and `.env`

## 2. Health Check Endpoint

- [x] 2.1 Add a `GET /health` route returning a `200` with a status payload, and verify it manually against the running dev server
- [x] 2.2 Confirm the health route has no dependency on the database (works before Prisma is wired up), and verify by requesting it before running any migration

## 3. Database: Prisma + PostgreSQL

- [x] 3.1 Add Prisma, initialize it with a PostgreSQL datasource, and add a minimal placeholder model, verifying `prisma/schema.prisma` is created
- [x] 3.2 Add `.env.example` documenting the required `DATABASE_URL` and port variables, and verify `.env` (gitignored) can be created from it
- [x] 3.3 Generate and apply an initial migration against a local PostgreSQL instance, and verify the database schema matches the Prisma schema afterwards

## 4. Docker & Local Development

- [x] 4.1 Add a `Dockerfile` that builds and runs the production build, and verify `docker build` succeeds
- [x] 4.2 Add a `docker-compose.yml` providing a local PostgreSQL instance (and optionally the API service), and verify `docker compose up` makes Postgres reachable at the documented connection string
- [x] 4.3 Verify the built Docker image, run with a valid `DATABASE_URL`, responds successfully to `GET /health`

## 5. Scripts & Documentation

- [x] 5.1 Verify standard npm scripts (`start:dev`, `build`, `start:prod`, `lint`, `test`) all run successfully
- [x] 5.2 Document in `README.md` how to install dependencies, start local Postgres via Docker Compose, run migrations, and start the dev server, and verify the documented steps work as written
