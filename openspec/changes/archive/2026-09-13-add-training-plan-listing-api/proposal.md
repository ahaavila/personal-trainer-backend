## Why

Personal trainers need an API endpoint to list, search, and view all training plans (`fichas de treino`) they have created for their students. While the creation endpoint `POST /api/fichas-de-treino` exists, the backend lacks the corresponding retrieval endpoints (`GET /api/fichas-de-treino` and `GET /api/fichas-de-treino/:id`).

## What Changes

- Add authenticated, personal-only `GET /api/fichas-de-treino` endpoint returning all plans authored by the requesting personal trainer.
- Support optional query filters (`alunoId`, `status`, `search`).
- Include associated student details (`id`, `name`, `email`, `objective`), workout divisions, and exercise prescriptions in the response payload.
- Add authenticated `GET /api/fichas-de-treino/:id` endpoint for retrieving a single plan with complete details and ownership verification.
- Add authenticated `PUT /api/fichas-de-treino/:id` endpoint for editing an existing training plan, updating divisions and exercise prescriptions atomically.
- Add authenticated `DELETE /api/fichas-de-treino/:id` endpoint for deleting a training plan and cascading to its divisions and prescriptions.
- Enforce strict tenant isolation: personal trainers can only retrieve, update, or delete plans they authored.
- Add unit and end-to-end integration tests.

## Capabilities

### New Capabilities
- `training-plan-listing-api`: Personal-facing endpoint and service logic to list, inspect, update, and delete training plans with divisions and exercise prescriptions.

### Modified Capabilities
<!-- No requirement changes to existing capabilities -->

## Impact

- Backend: `FichasController` (`GET /`, `GET /:id`), `FichasService` (`list`, `findById`), response DTOs, unit and e2e tests.
- Security: Requires authenticated session with `role: personal` and filters by `personalId`.
