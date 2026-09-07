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

## Scripts

```bash
npm run build                 # Compile the production build
npm run start:prod            # Serve the compiled application
npm run lint                  # Lint source and test files
npm run test                  # Run unit tests
npm run prisma:generate       # Generate Prisma Client
npm run prisma:migrate:dev    # Create and apply a development migration
npm run prisma:migrate:deploy # Apply committed migrations
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