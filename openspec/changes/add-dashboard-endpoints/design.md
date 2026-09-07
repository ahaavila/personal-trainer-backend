## Context

The backend already has JWT cookie authentication and Prisma models for User, Exercicio, FichaDeTreino, Treino, and TreinoExercicio. There are no dashboard endpoints yet. The frontend will call separate role-specific routes, so authorization must happen at the API boundary rather than relying on the sidebar's client-side visibility.

## Goals / Non-Goals

**Goals:**
- Add a NestJS dashboard module with two read-only endpoints: `/api/dashboard/personal` and `/api/dashboard/aluno`.
- Scope every query to the authenticated user from the verified session and enforce the required role.
- Return compact, frontend-oriented DTOs instead of exposing raw Prisma records or large nested graphs.
- Return stable zero/empty values for missing data.

**Non-Goals:**
- No dashboard mutations, CRUD endpoints, or new database migration.
- No realtime updates, caching, or analytics warehouse.
- No attempt to protect the frontend route itself; backend authorization is the authoritative boundary.

## Decisions

- **Separate endpoints per role**: follows the confirmed frontend contract and keeps each response purpose-built. Alternative considered: one `/api/dashboard` endpoint branching internally on role; rejected because the two payloads represent different user experiences and separate contracts are easier to evolve.
- **Controller-level role guard plus service-level scoping**: reject the wrong role before querying, then scope all Prisma reads by the authenticated user's id/relations. This prevents accidental cross-role data leakage even if the service is reused later.
- **Summary DTOs**: personal response contains `metrics`, `upcomingTrainings`, and `weeklyEvolution`; aluno response contains `currentPlan`, `nextWorkouts`, `progress`, and `weeklyActivity`. Exact field names and types should be finalized in the task implementation from the existing Prisma schema and frontend needs, without returning password or token data.
- **Read-only aggregation from current models**: derive counts and lists from User, Exercicio, FichaDeTreino, Treino, and TreinoExercicio. No new tables are needed for the first dashboard slice; attendance/evolution can use available workout/progress timestamps or return zero values until tracking data exists.
- **JWT cookie auth reuse**: use the existing session verification mechanism and request user context; do not add a second token or authentication path.

## Risks / Trade-offs

- [Risk] The current schema does not yet contain a dedicated attendance/progress event model → Mitigation: return a stable empty/zero weekly series initially, and create a separate tracking change when real attendance is recorded.
- [Risk] Aggregated dashboard queries may grow expensive as data increases → Mitigation: start with bounded lists and counts, select only required fields, and revisit indexes/caching after real usage data exists.
- [Risk] Separate payloads can drift apart in naming and conventions → Mitigation: document DTOs in tests and keep endpoint-specific response types close to each controller.
