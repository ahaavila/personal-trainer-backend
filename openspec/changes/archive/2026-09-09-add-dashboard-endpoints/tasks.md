## 1. Dashboard Module & Authorization

- [x] 1.1 Create the NestJS dashboard module/controller/service structure and register it in `AppModule`, verifying the application boots
- [x] 1.2 Reuse the existing JWT session verification and add role checks for the two dashboard routes, verifying unauthenticated requests return 401 and wrong-role requests return 403

## 2. Personal Dashboard Endpoint

- [x] 2.1 Define the personal dashboard response DTO with metrics, upcoming trainings, and weekly evolution fields, verifying it contains no password/token fields
- [x] 2.2 Implement `GET /api/dashboard/personal` with Prisma counts and bounded upcoming-training queries scoped to the authenticated personal, verifying populated data for a personal with records
- [x] 2.3 Return stable zero values and empty arrays for a personal without domain data, verifying the endpoint still returns 200

## 3. Aluno Dashboard Endpoint

- [x] 3.1 Define the aluno dashboard response DTO with current plan, next workouts, progress, and weekly activity fields, verifying it contains only the authenticated aluno's data
- [x] 3.2 Implement `GET /api/dashboard/aluno` with Prisma queries scoped to the authenticated aluno, verifying populated data for an aluno with a plan
- [x] 3.3 Return a null/empty current plan and empty collections for an aluno without a plan, verifying the endpoint still returns 200

## 4. Weekly Data & Tests

- [x] 4.1 Provide a stable weekly series from available data, using zero values when attendance/progress tracking does not exist yet, and verify the response shape is consistent for both roles
- [x] 4.2 Add controller/service tests for both role success paths, wrong-role authorization, unauthenticated access, populated data, and empty data
- [x] 4.3 Run build, lint, and the full test suite, verifying all pass and no Prisma migration is required

## 5. Documentation

- [x] 5.1 Document both endpoint paths, auth requirements, response shapes, empty-state behavior, and local curl examples in README.md, and verify the examples match the implementation
