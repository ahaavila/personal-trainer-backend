## Why

The frontend needs a real dashboard instead of the current placeholder, with different information for personal trainers and alunos. The backend already has the User, Exercicio, FichaDeTreino, and Treino models, so it can expose compact role-specific summaries without making the frontend assemble business data from many unrelated requests.

## What Changes

- Add an authenticated `GET /api/dashboard/personal` endpoint for the personal role, returning summary metrics, upcoming training appointments, and weekly attendance/evolution data.
- Add an authenticated `GET /api/dashboard/aluno` endpoint for the aluno role, returning the current training plan summary, next workouts, progress metrics, and weekly activity data.
- Enforce role authorization: the personal endpoint is not accessible to alunos and the aluno endpoint is not accessible to personals.
- Return empty collections and zero values for users without data instead of failing, so the frontend can render an intentional empty state.

## Capabilities

### New Capabilities
- `dashboard-data`: Role-specific dashboard summary APIs for personal trainers and alunos.

### Modified Capabilities
<!-- none -->

## Impact

- Affected code: new NestJS dashboard module/controller/service and Prisma queries over existing domain models.
- No schema migration is expected; this change reads the models created by `add-training-domain-models`.
- The endpoints depend on the existing JWT session and role claims from `add-cookie-session-auth`.
- The frontend counterpart lives in `personal-trainer-web` under the `add-role-dashboards` change and consumes these endpoints over HTTP.
