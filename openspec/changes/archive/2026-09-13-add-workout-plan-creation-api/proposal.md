## Why

Personal trainers need an API endpoint to create, organize, and assign structured workout sheets (`fichas de treino`) with multiple workout divisions (`treinos`) and customized exercise prescriptions for their students. The existing database schema outlines basic models, but the system lacks the transactional creation endpoint, validation logic, and authorization guards.

## What Changes

- Add authenticated, personal-only `POST /api/fichas-de-treino` (or `/api/fichas`) accepting student ID, plan title, optional notes/validity, and nested workout divisions with exercise prescriptions.
- Enhance the Prisma schema for `FichaDeTreino`, `Treino`, and `TreinoExercicio` to support notes, order, rest intervals, target load, and technical instructions.
- Ensure strict ownership authorization: the personal trainer can only assign plans to their own registered students, and can only include exercises they created or that are accessible to them.
- Implement atomic database transactions with Prisma to ensure consistent creation of the training plan, all its divisions, and exercise prescription rows.
- Return structured validation errors (e.g. non-existent student, student not owned by personal, empty division, non-existent exercise).

## Capabilities

### New Capabilities
- `training-plan-creation-api`: Secure endpoint and transactional creation flow for personal trainers to create and assign workout plans with divisions and exercise prescriptions.

### Modified Capabilities
- `training-domain`: Enhanced workout and exercise prescription data models to support prescription parameters (rest interval, target load, notes, order).

## Impact

- Backend: NestJS module/controller/service (`fichas` / `treinos`), DTOs with `class-validator`, Prisma schema migration, automated unit and e2e tests.
- Database: Updates to `FichaDeTreino`, `Treino`, `TreinoExercicio` tables via Prisma migration.
- Security: Role guard (`personal` only) and multi-tenant resource ownership checks.
