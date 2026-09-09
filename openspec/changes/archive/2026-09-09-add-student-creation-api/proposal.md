## Why

The personal can list alunos but cannot create them, forcing all accounts to be seeded manually. The API needs a personal-only creation endpoint that securely hashes a temporary password and assigns the new aluno to the authenticated personal rather than trusting a client-supplied owner ID.

## What Changes

- Add authenticated, personal-only `POST /api/alunos`.
- Accept name, unique email, temporary password, objective, and level.
- Store the password exclusively as a hash, set role to `aluno`, status to `ativo`, and bind `personalId` from the authenticated session.
- Return a safe representation of the created aluno without password/hash/session data.
- Return validation errors for missing/invalid inputs and a conflict error for an already used email.

## Capabilities

### New Capabilities
- `student-creation-data`: Secure personal-scoped aluno account creation API.

### Modified Capabilities
- `student-listing-data`: Newly created alunos are retrievable by the owning personal's existing listing endpoint.

## Impact

- Affected code: alunos controller/service/DTOs/tests; existing password hashing and session role guards are reused.
- No schema migration expected because required aluno fields already exist.
- No email delivery, invite tokens, self-registration, or password-reset workflow.
