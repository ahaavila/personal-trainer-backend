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

## Alunos

`GET /api/alunos` is available only to authenticated `personal` users. It
returns only alunos assigned to the personal in the session cookie. Unauthenticated
requests return `401`; authenticated alunos receive `403`.

Optional filters can be combined:

- `search`: case-insensitive match against name or email
- `status`: `ativo` or `inativo`
- `objective`: `hipertrofia`, `emagrecimento`, or `condicionamento`

Invalid enum filters return `400`. An account with no matching alunos receives
`200` and an empty array.

```bash
curl -b cookies.txt 'http://localhost:3000/api/alunos?status=ativo'
curl -b cookies.txt 'http://localhost:3000/api/alunos?search=mariana&objective=emagrecimento'
```

Create an aluno from a personal session with `POST /api/alunos`. The server
derives the owner, role, and active status; `personalId`, `role`, and `status`
are never accepted from the client:

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/alunos \
	-H 'Content-Type: application/json' \
	-d '{"name":"Novo Aluno","email":"novo@fitforge.app","password":"temporary123","objective":"hipertrofia","level":"iniciante"}'
```

The response contains only safe listing fields and never contains the temporary
password, password hash, JWT, or session value. The temporary password must be
delivered to the aluno through the appropriate trusted process; it is not
logged or returned by the API. Email addresses must be unique, and duplicate
emails return `409`. Missing or invalid fields return `400`.

The response is table-ready and excludes passwords and session tokens:

```json
[
	{
		"name": "Mariana Costa",
		"email": "mariana@fitforge.app",
		"objective": "emagrecimento",
		"level": "iniciante",
		"status": "ativo",
		"latestWorkout": null
	}
]
```

## Exercicios

`GET /api/exercicios` is available only to authenticated `personal` users and
returns exercises created by that personal. It never exposes another
personal's library or allows aluno access.

Optional filters can be combined with AND semantics:

- `search`: case-insensitive match against exercise name
- `muscleGroup`: case-insensitive muscle-group match
- `level`: `iniciante`, `intermediario`, or `avancado`

```bash
curl -b cookies.txt 'http://localhost:3000/api/exercicios?search=supino&muscleGroup=peito&level=intermediario'
```

Each result includes `name`, `muscleGroup`, `description`, `defaultSets`,
`defaultReps`, and `level`. An owner with no exercises receives `200` and an
empty array; invalid level filters return `400`.

Create exercises with `POST /api/exercicios`. The owner is derived from the
session and media is optional:

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/exercicios \
	-H 'Content-Type: application/json' \
	-d '{"name":"Levantamento terra","muscleGroup":"Costas","equipment":"Barra","level":"avancado","description":"Movimento composto.","defaultSets":4,"defaultReps":"5 a 8"}'
```

## Exercise Media / R2

R2 media is disabled by default. Exercise creation works locally without media.
To enable direct browser uploads, configure `R2_ENABLED=true` plus
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and
`R2_BUCKET_NAME` in `.env`.

The media flow is: create the exercise, call
`POST /api/exercicios/:id/upload-url` with `kind` (`photo` or `video`),
`contentType`, and `byteSize`, upload the returned signed URL directly to R2,
then call `POST /api/exercicios/:id/confirm-upload` with the returned object key
and the same metadata. Photos are limited to 5 MB and videos to 50 MB. A
different personal receives `404`, and disabled R2 returns `503` without
persisting media metadata.

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