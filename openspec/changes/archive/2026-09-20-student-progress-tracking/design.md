## Context

Personal trainers need full visibility into the training execution history and progressive overload of their students. See `proposal.md` for motivation and `specs/student-progress-tracking-api/spec.md` for requirements.

## Goals / Non-Goals

**Goals:**
- Provide `GET /api/alunos/:id/progresso` returning student workout execution timeline and aggregated exercise progression series (dates, max weight, reps).
- Introduce Prisma schema models for executed workouts (`TreinoExecucao`) and individual executed exercise sets (`ExercicioExecucaoLog`).
- Enforce strict ownership: a trainer can only query progress data for students where `aluno.personalId === currentUserId`.
- Provide endpoints/service methods to log workout session executions.

**Non-Goals:**
- Editing historical execution entries in this phase.
- Automatic wearable device sync (Apple Health, Garmin, etc.).

## Decisions

### 1. Database Model: `TreinoExecucao` and `ExercicioExecucaoLog`
- **Choice**:
  ```prisma
  model TreinoExecucao {
    id          Int                    @id @default(autoincrement())
    alunoId     Int
    treinoId    Int?
    title       String
    startedAt   DateTime
    completedAt DateTime
    durationMin Int?
    notes       String?
    aluno       User                   @relation(fields: [alunoId], references: [id], onDelete: Cascade)
    treino      Treino?                @relation(fields: [treinoId], references: [id], onDelete: SetNull)
    exercicios  ExercicioExecucaoLog[]
    createdAt   DateTime               @default(now())
  }

  model ExercicioExecucaoLog {
    id               Int            @id @default(autoincrement())
    treinoExecucaoId Int
    exercicioId      Int
    order            Int            @default(1)
    setsCompleted    Int
    repsCompleted    String         // e.g. "10, 10, 8, 8"
    maxWeightKg      Float          // peak load achieved in session
    notes            String?
    treinoExecucao   TreinoExecucao @relation(fields: [treinoExecucaoId], references: [id], onDelete: Cascade)
    exercicio        Exercicio      @relation(fields: [exercicioId], references: [id], onDelete: Cascade)
    createdAt        DateTime       @default(now())
  }
  ```
- **Rationale**: Isolates planned workouts (`FichaDeTreino` / `Treino` / `TreinoExercicio`) from actual performed sessions (`TreinoExecucao` / `ExercicioExecucaoLog`), allowing historical integrity even if the trainer later changes or archives the active training plan.

### 2. Aggregation & Progress Endpoint Structure
- **Choice**: `GET /api/alunos/:id/progresso` aggregates:
  - `aluno`: name, email, objective, level, totalWorkouts.
  - `workoutLogs`: array of completed sessions sorted by `completedAt DESC` with full exercise set breakdown.
  - `exerciseProgress`: dictionary/map keyed by `exercicioId` containing dates, `maxWeightKg`, `repsCompleted`, and relative progress metrics.
- **Rationale**: Allows the frontend to load both Tab 1 (timeline) and Tab 2 (exercise progression chart and table) in a single request.

## Risks / Trade-offs

- **[Risk: Heavy aggregation on large datasets]** → *Mitigation*: Index `TreinoExecucao.alunoId` and `ExercicioExecucaoLog.exercicioId`, and support date filtering (`limit`, `startDate`) if history grows substantially.
