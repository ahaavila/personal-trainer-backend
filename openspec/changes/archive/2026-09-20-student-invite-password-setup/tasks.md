## 1. DTO & Email Service Updates

- [x] 1.1 Update `CreateAlunoDto` in `src/alunos/aluno-listing.dto.ts` to remove the `password` field and verify compilation via `npm run build`
- [x] 1.2 Add `sendStudentInviteEmail` method to `EmailService` in `src/email/email.service.ts` with dedicated invitation template and link to password setup

## 2. Service & Controller Integration

- [x] 2.1 Update `AlunosService.validateCreateInput` and `AlunosService.create` in `src/alunos/alunos.service.ts` to initialize user with unguessable random password hash, generate setup token via `AuthService.createPasswordResetToken`, and dispatch invitation email
- [x] 2.2 Inject `AuthService` and `EmailService` into `AlunosModule` / `AlunosService` and verify DI bindings compile with `npm run build`

## 3. Automated Tests & Verification

- [x] 3.1 Update unit tests in `src/alunos/alunos.service.spec.ts` to test student creation without password and verify invite email / token dispatch
- [x] 3.2 Update and execute unit tests covering `AlunosService` and `AuthService` to verify student creation without password, running `npm test`
