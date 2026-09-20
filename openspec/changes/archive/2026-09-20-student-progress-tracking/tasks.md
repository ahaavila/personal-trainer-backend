## 1. Database Schema & Migration

- [x] 1.1 Add `TreinoExecucao` and `ExercicioExecucaoLog` models to `prisma/schema.prisma` and run `npx prisma validate`
- [x] 1.2 Generate Prisma Client with `npx prisma generate` and verify schema compilation

## 2. DTOs & Service Implementation

- [x] 2.1 Define progress response DTOs (`StudentProgressDto`, `WorkoutSessionLogDto`, `ExerciseProgressSeriesDto`) in `src/progresso/progresso.dto.ts`
- [x] 2.2 Implement `ProgressoService` querying executed workouts and aggregating exercise overload series for assigned students with authorization check (`aluno.personalId === trainerId`); verify with unit tests in `src/progresso/progresso.service.spec.ts`
- [x] 2.3 Expose `GET /api/alunos/:id/progresso` on `ProgressoController` protected by `SessionAuthGuard` and `Roles('personal')`; verify route mappings and permissions

## 3. Module Wiring & Verification

- [x] 3.1 Register `ProgressoModule` in `src/app.module.ts` and verify build with `npm run build`
- [x] 3.2 Write and execute automated tests in `test/` verifying ownership authorization, session timeline output, and exercise progression calculation, running `npm test`
