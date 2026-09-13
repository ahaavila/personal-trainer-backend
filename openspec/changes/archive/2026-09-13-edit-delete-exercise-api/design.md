## Context

The backend already has `ExerciciosService` with `list`, `create`, `authorizeUpload`, `confirmUpload`, and `media`. It needs `findOne`, `update`, and `remove` methods to support the full exercise lifecycle.

## Goals / Non-Goals

**Goals:**
- Provide `GET /api/exercicios/:id`, `PUT /api/exercicios/:id`, and `DELETE /api/exercicios/:id`.
- Ensure personal ownership check on every operation using `ownedExercise(personalId, exerciseId)`.
- Cleanup associated `ExerciseMedia` records when an exercise is deleted.
- Use strict input validation DTOs (`UpdateExercicioDto`).

**Non-Goals:**
- No soft-delete flag in this MVP iteration (standard delete with foreign relation handling).
- No restoring deleted exercises.

## Decisions

- **Ownership verification**: Reuses the private helper `ownedExercise(personalId, exerciseId)` which throws `NotFoundException` if the exercise does not belong to the user.
- **Cascading deletion**: Prisma relations for `ExerciseMedia` and workout references should be handled cleanly (either cascade delete in Prisma or deleting dependent media before deleting the exercise).
- **Validation**: Reuses validation logic for name, muscle group, level, description, default sets, and default reps.

## Risks / Trade-offs

- [Risk] Deleting an exercise linked to a training plan (`TreinoExercicio`).
  → Mitigation: In Prisma/service, handle potential foreign key constraints or remove `TreinoExercicio` associations if allowed, or return a friendly 400 Conflict message.
