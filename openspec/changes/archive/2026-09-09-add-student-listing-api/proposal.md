## Why

The personal frontend needs to list its assigned alunos with the objective, level, latest workout, and active status shown in the supplied design. The existing schema knows the personal-aluno relationship but lacks the profile and activity data required for those columns and filters, and the API has no list endpoint.

## What Changes

- Add profile data needed by the aluno listing: objective, level, and active/inactive status for aluno users.
- Add workout scheduling/completion metadata sufficient to identify an aluno's latest workout.
- Add an authenticated, personal-only `GET /api/alunos` endpoint returning only alunos assigned to the requesting personal, including table-ready profile and latest-workout data.
- Support optional query filters for case-insensitive name/email search, aluno status, and objective.
- Return an empty list successfully when a personal has no matching alunos.
- Use "aluno" as the user-facing/API terminology for this capability; do not introduce "cliente" names.
- User creation remains out of scope; this endpoint is read-only.

## Capabilities

### New Capabilities
- `student-listing-data`: Personal-scoped aluno profile and listing API data.

### Modified Capabilities
- `training-domain`: Extend aluno and workout records with the data required to display/filter objective, level, status, and latest workout.

## Impact

- Affected code: Prisma schema/migration, seed data, a new NestJS alunos module/controller/service, authorization guards and API tests.
- Existing authentication/session behavior is reused; no change to login contract.
- The frontend counterpart is `add-student-listing` in `personal-trainer-web` and calls `GET /api/alunos` over HTTP.
