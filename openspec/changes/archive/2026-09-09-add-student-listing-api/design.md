## Context

The existing `User.personalId` relation already scopes alunos to a personal but has no displayable objective, level, or status. `Treino` has no activity timestamp. Dashboard auth guards can be reused to authorize a new read-only alunos module.

## Goals / Non-Goals

**Goals:**
- Add typed Prisma enums/fields for aluno objective, level, and status, plus workout activity timestamp.
- Expose a minimal personal-only `GET /api/alunos` list with optional query filters.
- Seed representative alunos and training records so local development renders the supplied design without manual database preparation.

**Non-Goals:**
- No creation, update, deletion, or aluno detail endpoints.
- No pagination or sorting parameters yet.
- No client-facing use of the legacy word "cliente".

## Decisions

- **Enums for objective/level/status**: constrain listing/filter values and avoid free-text inconsistencies. Initial values: objectives `hipertrofia`, `emagrecimento`, `condicionamento`; levels `iniciante`, `intermediario`, `avancado`; statuses `ativo`, `inativo`.
- **Nullable aluno profile fields**: existing seeded/aluno users remain compatible; list DTO renders a neutral fallback when data was not entered yet. New seed users populate all fields.
- **`Treino.completedAt` timestamp**: latest workout is derived by descending completed timestamp scoped through the aluno's fichas. Null represents no completed workout.
- **Controller guard composition**: reuse session authentication followed by the existing role guard/decorator so data is never exposed based only on a request parameter.
- **Query validation**: accept optional `search`, `status`, and `objective`; reject invalid enum filter values with a validation error instead of silently ignoring them.

## Risks / Trade-offs

- [Risk] Nullable profile data requires API fallbacks → Mitigation: response contract always supplies display strings/status values.
- [Risk] Latest workout derives from `completedAt`, which is only a basic activity signal → Mitigation: use it solely for list display; detailed training progress stays out of scope.
