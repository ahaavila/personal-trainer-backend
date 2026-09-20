## Context

Currently, `AlunosService.create()` in `src/alunos/alunos.service.ts` requires a temporary password (min 8 chars) provided by the personal trainer. See `proposal.md` for motivation and `specs/student-creation-data/spec.md` for modified requirements.

## Goals / Non-Goals

**Goals:**
- Remove the `password` field from `CreateAlunoDto` and its validation logic.
- Initialize the student account with a secure, unguessable password hash (`randomBytes(32)` hashed with bcrypt) so the account cannot be accessed until the student creates a password.
- Automatically generate a password setup token for the newly created student using `AuthService.createPasswordResetToken()`.
- Dispatch a student invitation email via `EmailService` (Resend) welcoming the student and directing them to define their initial password via `${FRONTEND_URL}/redefinir-senha?token=...`.
- Keep the creation response secure: return the safe created student representation without any sensitive token data.

**Non-Goals:**
- Creating a separate token database table (reuses the existing `PasswordResetToken` infrastructure).
- Changing student listing or profile management.

## Decisions

### 1. Reuse existing `PasswordResetToken` infrastructure
- **Choice**: Utilize `AuthService.createPasswordResetToken(aluno.id)` to generate the initial password setup token.
- **Rationale**: The token lifecycle (cryptographic generation, SHA-256 storage, 1-hour expiration, single-use invalidation) is identical to password recovery. The student lands on the existing `/redefinir-senha?token=...` page and submits to `POST /api/auth/reset-password`.
- **Alternatives considered**: Creating a distinct `StudentInviteToken` table (adds unnecessary duplication of identical token management logic).

### 2. Random cryptographic placeholder for `User.passwordHash`
- **Choice**: Generate a random 32-byte hex string and hash it with bcrypt for the initial `passwordHash`.
- **Rationale**: Prisma's `User` model requires a non-null `passwordHash`. Using a secure random hash guarantees that nobody (including the trainer) can guess or brute-force a password before the student sets it.

### 3. Dedicated student invite email template in `EmailService`
- **Choice**: Add `sendStudentInviteEmail(to, studentName, personalName, token)` to `EmailService`.
- **Rationale**: A tailored welcome email ("Bem-vindo ao FitForge! O seu Personal Trainer convidou-o...") provides a much better user experience than a generic "Recuperação de Senha" email.

## Risks / Trade-offs

- **[Risk: Email delivery failure blocks student creation]** → *Mitigation*: Wrap email dispatch in try/catch or async non-blocking execution so that student creation succeeds even if Resend encounters temporary network issues; if an email fails, the student can simply use "Esqueci minha senha" to receive a new link.
