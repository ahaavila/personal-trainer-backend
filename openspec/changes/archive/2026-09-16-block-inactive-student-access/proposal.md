## Why

Setting an aluno status to inactive currently does not invalidate their ability to log in or continue using an existing cookie session. Personal trainers must be able to revoke an aluno's application access by setting any status other than `ativo`.

## What Changes

- Enforce that users with role `aluno` may authenticate only when their stored status is `ativo`.
- Reject login for non-active alunos without issuing a session cookie.
- Re-check the aluno status whenever an existing session is resolved, thereby blocking protected API access and `/api/auth/me` after a status change.
- Preserve personal access regardless of aluno status fields and preserve access for active alunos.
- Return a consistent unauthorized error message suitable for the frontend login screen.

## Capabilities

### New Capabilities
<!-- No new capabilities. -->

### Modified Capabilities
- `auth`: Session authentication and recovery must deny alunos whose stored status is not `ativo`.

## Impact

- Backend: `AuthService`, session guard behavior, auth controller responses, and automated authentication tests.
- Database: uses the existing `User.role` and `User.status` fields; no migration is required.
- Frontend: receives 401 responses from login/session recovery and must clear client authentication state.
