## Why

Students currently lack API access to retrieve their assigned training plans (fichas de treino) and workout divisions, preventing them from viewing their training program and executing workouts.

## What Changes

- Update `GET /api/fichas-de-treino` and `GET /api/fichas-de-treino/:id` to allow access for both `aluno` and `personal` roles.
- For `personal`, the endpoints return plans authored by that personal trainer (`personalId = user.id`).
- For `aluno`, the endpoints return only plans assigned to that student (`alunoId = user.id`).
- Ensure students cannot access or query plans assigned to other students.
- Verify `POST /api/treinos/execucoes` persists executed sets, reps, duration, and peak load for the executing student.

## Capabilities

### New Capabilities
<!-- None; modified capabilities handles the authorization extension -->

### Modified Capabilities
- `training-plan-listing-api`: Updates `Requirement: Personal-only training plans listing endpoint` to `Requirement: Role-aware training plans retrieval` so that authenticated students can retrieve their assigned training plans while maintaining tenant isolation.

## Impact

- **Controllers**: Updates `@Roles('personal', 'aluno')` on read endpoints in `FichasController`.
- **Services**: Adapts `FichasService.list` and `FichasService.findById` to branch based on the user's role (`personalId` vs `alunoId`).
- **Tests**: Adds unit and e2e tests covering student plan retrieval and cross-tenant access rejection.
