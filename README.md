# Personal Trainer Backend

NestJS API scaffold for the Personal Trainer application. It uses PostgreSQL
through Prisma and includes Docker configuration for local development and
production builds.

## Prerequisites

- Node.js 22+
- Docker Desktop with Docker Compose

## Local Setup

Install dependencies and create your local environment file:

```bash
npm install
cp .env.example .env
```

Start PostgreSQL:

```bash
docker compose up -d postgres
```

The local database is available at:

```text
postgresql://personal_trainer:personal_trainer@localhost:5432/personal_trainer?schema=public
```

Apply database migrations and start the API with reload enabled:

```bash
npm run prisma:migrate:dev
npm run prisma:seed
npm run start:dev
```

Verify the API is running:

```bash
curl http://localhost:3000/health
```

The endpoint responds with:

```json
{"status":"ok","service":"personal-trainer-backend"}
```

## Authentication

Configure these values in `.env` before deploying:

```dotenv
JWT_SECRET="use-a-unique-secret-in-production"
JWT_EXPIRES_IN="1h"
CORS_ORIGIN="http://localhost:5173"
```

`CORS_ORIGIN` accepts a comma-separated list of permitted frontend origins. The
development default is Vite's `http://localhost:5173` origin.

Run `npm run prisma:seed` to reset the development users to the two test-only
accounts below. Do not use these credentials outside local development.

| Role | Email | Password |
| --- | --- | --- |
| Personal | `personal@fitforge.app` | `personal123` |
| Aluno | `aluno@fitforge.app` | `aluno123` |

Log in by sending `POST /api/auth/login` with JSON containing `email` and
`password`. A successful response includes `token`, `role`, and `name`.

## Scripts

```bash
npm run build                 # Compile the production build
npm run start:prod            # Serve the compiled application
npm run lint                  # Lint source and test files
npm run test                  # Run unit tests
npm run prisma:generate       # Generate Prisma Client
npm run prisma:migrate:dev    # Create and apply a development migration
npm run prisma:migrate:deploy # Apply committed migrations
npm run prisma:seed           # Reset the two local test users
```

## Docker

Build and run the complete local stack:

```bash
docker compose up --build
```

This starts PostgreSQL and the API at `http://localhost:3000`. To apply
migrations after the stack is up, run from the host:

```bash
npm run prisma:migrate:deploy
```

Stop local services with:

```bash
docker compose down
```