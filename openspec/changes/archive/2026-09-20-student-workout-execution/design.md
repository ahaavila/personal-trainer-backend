## Context

Currently, `FichasController` is restricted to the `personal` role (`@Roles('personal')`), which prevents students from reading their own assigned training plans. See `proposal.md` for motivation and `specs/training-plan-listing-api/spec.md` for requirements.

## Goals / Non-Goals

**Goals:**
- Allow authenticated students to query training plans assigned to them via `GET /api/fichas-de-treino` and `GET /api/fichas-de-treino/:id`.
- Ensure strict multi-tenant isolation: students can only access plans where `alunoId = currentUserId`; trainers only access plans where `personalId = currentUserId`.
- Keep modification endpoints (`POST`, `PUT`, `DELETE /api/fichas-de-treino`) restricted exclusively to personal trainers.

**Non-Goals:**
- Modifying the underlying `FichaDeTreino` database schema.
- Permitting students to edit or archive training plans.

## Decisions

### 1. Role-aware branching in `FichasService`
- **Choice**: Pass the authenticated user identity (`id` and `role`) from `FichasController` into `FichasService.list` and `FichasService.findById`.
- **Logic**:
  ```typescript
  const where: Prisma.FichaDeTreinoWhereInput = user.role === 'aluno'
    ? { alunoId: user.id }
    : { personalId: user.id };
  ```
- **Rationale**: Reuses the existing controller routes without introducing redundant endpoints or duplicating data mapping.

### 2. Controller-level Method Guards
- **Choice**: Move `@Roles('personal')` from the class level to individual mutation handlers (`create`, `update`, `remove`), while annotating read handlers (`list`, `findOne`) with `@Roles('personal', 'aluno')`.

## Risks / Trade-offs

- **[Risk: Accidental student write access]** → *Mitigation*: Unit and e2e tests explicitly assert that `POST`, `PUT`, and `DELETE` requests with an `aluno` session return `403 Forbidden`.
