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

Authentication uses a cookie-based session. Send login, session-check, and
logout requests with `credentials: 'include'` so the browser can receive and
send the HTTP-only session cookie:

```ts
await fetch('http://localhost:3000/api/auth/login', {
	method: 'POST',
	credentials: 'include',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ email, password }),
});
```

`POST /api/auth/login` sets the session cookie and returns `{ role, name }`.
`GET /api/auth/me` returns the current session's `{ role, name }`, or `401`
when no valid session exists. `POST /api/auth/logout` clears the session
cookie. The session token is not included in any JSON response and is not
accessible to client-side JavaScript.

## Dashboards

Both dashboard endpoints require the HTTP-only session cookie and return `401`
without a valid session. They also enforce the session role, returning `403` to
an authenticated user requesting the other role's dashboard.

`GET /api/dashboard/personal` is available to `personal` users and returns:

```json
{
	"metrics": { "clientsCount": 0, "exercisesCount": 0, "trainingPlansCount": 0 },
	"upcomingTrainings": [],
	"weeklyEvolution": [{ "day": "day-1", "value": 0 }]
}
```

`GET /api/dashboard/aluno` is available to `aluno` users and returns:

```json
{
	"currentPlan": null,
	"nextWorkouts": [],
	"progress": { "completedWorkouts": 0, "totalWorkouts": 0 },
	"weeklyActivity": [{ "day": "day-1", "value": 0 }]
}
```

Weekly arrays always contain seven zero-valued entries until attendance and
progress tracking is added. An account with no domain data receives the empty
shapes above with `200` rather than an error.

Log in and retain the session cookie before calling the endpoint appropriate to
the account's role:

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
	-H 'Content-Type: application/json' \
	-d '{"email":"personal@fitforge.app","password":"personal123"}'

curl -b cookies.txt http://localhost:3000/api/dashboard/personal
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