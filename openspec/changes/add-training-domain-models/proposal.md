## Why

The frontend is introducing role-based navigation for pages like Clientes, Exercícios, Fichas de Treino, and Treinos (see the corresponding `add-app-navigation` change in `personal-trainer-web`). Those pages are placeholders for now, but the backend needs the underlying data model in place so future changes can build real endpoints against a stable schema instead of retrofitting relations later.

## What Changes

- Add a self-relation on `User` linking each `aluno` to the `personal` who manages them (their "cliente" relationship), so a personal's list of alunos can be queried directly.
- Add an `Exercicio` model (exercise catalog): name, muscle group, and which personal created it.
- Add a `FichaDeTreino` model (training plan): belongs to one aluno, authored by one personal.
- Add a `Treino` model (a workout/session within a Ficha de Treino) and a join model linking a `Treino` to the `Exercicio`s it prescribes (with sets/reps).
- No new HTTP endpoints, controllers, or services in this change - only the Prisma schema and a migration. Endpoints for each entity are follow-up work, one per real frontend page.

## Capabilities

### New Capabilities
- `training-domain`: The data model for personal-aluno relationships, exercises, training plans (fichas), and workouts (treinos) that future features will read and write.

### Modified Capabilities
<!-- none -->

## Impact

- Affected code: `prisma/schema.prisma` (new models/relations), a new migration.
- No new runtime dependencies.
- No breaking change to existing endpoints (`/health`, `/api/auth/*`) - purely additive schema.
- Downstream: future changes will add real endpoints (e.g. `GET /api/clientes`, `POST /api/exercicios`, `POST /api/fichas-de-treino`) backed by these models, and the frontend's placeholder pages will be replaced with real ones one at a time.
