## Why

Personal trainers currently have to define temporary passwords when creating new student accounts. This creates friction, potential security vulnerabilities (weak or shared passwords), and unnecessary administrative effort. By removing the password field from the aluno creation endpoint and automatically dispatching an invitation email with an activation token via Resend, students can establish their own passwords securely during first access.

## What Changes

- Update `POST /api/alunos` endpoint payload: remove the `password` field from `CreateAlunoDto` and validation logic.
- When creating an aluno, initialize the account with an unguessable random password hash so it cannot be accessed until the student defines a password.
- Generate a secure, time-limited activation token for the created student (reusing the `PasswordResetToken` infrastructure).
- Send an invitation/welcome email to the student's email address via `EmailService` (Resend) with a direct link to `${FRONTEND_URL}/redefinir-senha?token=...`.
- Update tests and validation rules across the backend.

## Capabilities

### New Capabilities
<!-- None; existing student-creation-data capability is updated -->

### Modified Capabilities
- `student-creation-data`: Updates requirements so the endpoint accepts `name`, `email`, `objective`, and `level` without requiring or accepting a temporary password, and dispatches an activation email.

## Impact

- **DTO & Controller**: `CreateAlunoDto` in `src/alunos/aluno-listing.dto.ts` removes `password`.
- **Service Layer**: `AlunosService.create()` in `src/alunos/alunos.service.ts` coordinates user creation, activation token generation via `AuthService`, and email dispatch via `EmailService`.
- **Tests**: Updates unit and e2e tests in `src/alunos/alunos.service.spec.ts` and `test/` to reflect student creation without passwords.
