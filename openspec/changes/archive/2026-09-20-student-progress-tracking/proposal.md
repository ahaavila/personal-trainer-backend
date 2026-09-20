## Why

Personal trainers need to inspect student progress over time, including historical workout sessions, exercises performed, sets, repetitions, and load progression (overload tracking). Currently, the backend only provides basic student listing data and static training plan schemas without an endpoint or execution log model to record and retrieve completed workout executions and progression analytics.

## What Changes

- Add data models to record executed workout sessions and individual exercise set logs:
  - `TreinoExecucao`: represents a completed workout session (date/time, duration, notes, aluno, ficha/treino reference).
  - `ExercicioExecucaoLog`: represents performed exercise records within a session (sets, reps, weight in kg, completed order, notes).
- Provide endpoint `GET /api/alunos/:id/progresso` restricted to personal trainers owning the student, returning:
  - Aluno metadata and summary stats.
  - Workout session timeline (`workoutLogs`) with completed exercises, sets, reps, and loads.
  - Exercise progression series (`exerciseProgress`) grouped by exercise for tracking load and volume progression over time.
- Provide endpoint `POST /api/treinos/execucoes` (or endpoint to log workout completions) to persist executed workout sessions and update `latestWorkout`.
- Ensure role-based authorization: personal trainers can only access progress data for their assigned students.

## Capabilities

### New Capabilities
- `student-progress-tracking-api`: Exposes endpoints and queries to retrieve student workout logs and exercise progression metrics for personal trainers.

### Modified Capabilities
<!-- None; existing student-listing-data and training-plan APIs remain backwards compatible -->

## Impact

- **Database**: Adds Prisma models `TreinoExecucao` and `ExercicioExecucaoLog` in `prisma/schema.prisma` with migration.
- **API Module**: Creates `ProgressoModule` (or extends `AlunosModule` / `TreinosModule`) with controller and service.
- **DTOs**: Implements query parameters and response DTOs for progress metrics.
- **Tests**: Adds unit and e2e integration tests for the progress endpoints.
