## Context

See proposal.md - Why. The current schema (`prisma/schema.prisma`) only has `ApplicationMetadata` (placeholder from `api-scaffold`) and `User` (with a `role` enum `personal`/`aluno`, from `add-auth`). There is no relationship between a personal and their alunos, and no exercise/training-plan/workout models yet.

## Goals / Non-Goals

**Goals:**
- Add a self-relation on `User` so a personal's alunos ("clientes") are queryable directly.
- Add `Exercicio`, `FichaDeTreino`, `Treino`, and a join model linking `Treino` to `Exercicio` with prescribed sets/reps.
- Ship only the Prisma schema and migration - no controllers, services, or endpoints.

**Non-Goals:**
- No endpoints, DTOs, or authorization logic for these models - that's follow-up work, one change per real frontend page (Clientes, Exercícios, Nova Ficha de Treino, Treinos).
- No seed data for these new models (the existing seed only covers the two test `User` rows).
- No support for a personal having a "global" exercise catalog shared across personals vs. a private one - exercises are simply attributed to their creating personal; sharing/visibility rules are a future decision once the real endpoints are designed.

## Decisions

- **`User` self-relation for personal-aluno**: add a nullable `personalId` FK on `User` referencing `User.id`, with a named Prisma relation (e.g. `PersonalAlunos`) so `personal.alunos` and `aluno.personal` are both queryable. Alternative considered: a separate `PersonalAluno` join table - rejected for now since the relationship is one-to-many (one personal, many alunos) and each `User` row already carries a `role`; a self-relation is simpler and sufficient unless a many-to-many need emerges later (e.g. an aluno training with multiple personals), which is out of scope today.
- **`Exercicio` attributed to a creating personal**: `createdByPersonalId` FK (non-nullable) on `Exercicio` referencing `User.id`. Keeps ownership explicit from the start even though sharing/visibility rules aren't decided yet.
- **`FichaDeTreino` references both aluno and personal directly**: rather than deriving the personal from the aluno's `personalId` at query time, `FichaDeTreino` stores both `alunoId` and `personalId` FKs. This keeps a historical record correct even if an aluno's assigned personal changes later - the plan stays attributed to whoever authored it.
- **`Treino` belongs to a `FichaDeTreino`, not directly to an aluno**: a workout only makes sense in the context of a training plan, matching the aluno-facing menu item "Ficha de Treino Atual" (the plan) containing "Treinos" (its workouts).
- **`TreinoExercicio` join model carries `sets` and `reps`**: a plain many-to-many `Treino`-`Exercicio` relation can't carry per-prescription data (how many sets/reps for that exercise in that workout), so an explicit join model is used instead of an implicit Prisma many-to-many.

## Risks / Trade-offs

- [Risk] Modeling `FichaDeTreino.personalId` separately from `User.personalId` could let them disagree (e.g. a plan authored by a personal who is no longer the aluno's assigned personal) → Mitigation: acceptable and intentional per the decision above (historical accuracy over derived consistency); future endpoint-level validation can decide whether to allow or restrict this.
- [Risk] Adding several models in one migration with no endpoints yet means the schema could need adjustment once real endpoint requirements surface → Mitigation: acceptable since this change is explicitly scoped as foundational schema work; Prisma migrations can evolve the schema further in later changes.
