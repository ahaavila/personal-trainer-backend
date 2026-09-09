## Context

`Exercicio` already has `createdByPersonalId`, but no description/default prescription/level fields and no endpoint. Existing session and role guards already support personal-only endpoints. The current schema makes ownership explicit, so no shared/global exercise behavior is needed.

## Goals / Non-Goals

**Goals:**
- Add default display/prescription fields to Exercicio with a Prisma migration.
- Add a personal-only read endpoint with search/group/level filters and strict query scoping.
- Seed sample private exercises for local development.

**Non-Goals:**
- No create/edit/delete endpoints, shared catalog, aluno access, media uploads, or migration of defaults into existing workout prescription rows.

## Decisions

- **Personal ownership is query invariant**: every query includes `createdByPersonalId` from the verified session; no owner ID query/body parameter exists.
- **Schema fields**: `description` string, `defaultSets` integer, `defaultReps` string (supports ranges like `8 a 10`), and level enum (`iniciante`, `intermediario`, `avancado`).
- **Read-only module**: a dedicated exercicios module reuses session + role guards and returns a small DTO, never raw Prisma models.
- **Filters**: optional validated `search`, `muscleGroup`, and `level`, combined with AND semantics after ownership scoping.
- **Seed isolation**: sample exercises are created only for the seeded personal; a second personal in tests verifies they are invisible to the first.

## Risks / Trade-offs

- [Risk] free-text muscle groups can vary in spelling → Mitigation: begin with strings matching the UI filter values; introduce a controlled enum only if catalog consistency becomes an issue.
- [Risk] exercise default sets/reps may differ from a workout prescription → Mitigation: defaults remain library metadata; `TreinoExercicio` continues to own per-workout values.
