## Why

The existing Exercicio model records its creating personal but lacks the default prescription fields needed for a usable library, and no endpoint exposes it. Personal trainers need a private catalog that never reveals one personal's exercises to another.

## What Changes

- Extend Exercicio with description, default sets, default repetitions, and level.
- Add authenticated personal-only `GET /api/exercicios`, returning only exercises created by the requesting personal.
- Support optional search, muscle-group, and level filters.
- Return an empty list successfully for a personal without exercises.
- Seed exercises for the existing test personal to support local development.
- No creation/update/delete endpoint in this change.

## Capabilities

### New Capabilities
- `exercise-library-data`: Private personal-scoped exercise library API.

### Modified Capabilities
- `training-domain`: Exercicio gains default prescription and level/description fields.

## Impact

- Affected code: Prisma schema/migration/seed; new exercicios Nest module/controller/service/DTOs/tests.
- Existing workout-to-exercise relations remain compatible; defaults are library values that future training plans can override.
- No cross-personal visibility or aluno access is allowed.
