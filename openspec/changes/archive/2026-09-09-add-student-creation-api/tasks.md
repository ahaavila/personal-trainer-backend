## 1. Creation Endpoint

- [x] 1.1 Define and validate a create-aluno DTO with name, email, password, objective, and level only; verify invalid/missing values receive a validation error
- [x] 1.2 Add `POST /api/alunos` to the existing alunos module with session and personal-role guards; verify unauthenticated requests return 401 and aluno requests return 403
- [x] 1.3 Create the aluno using a hashed password and server-derived `personalId`, `role: aluno`, and `status: ativo`; verify response excludes password/hash/session data
- [x] 1.4 Map duplicate email constraint errors to 409 Conflict; verify no duplicate or partial record is created

## 2. Integration & Tests

- [x] 2.1 Verify the created aluno appears only in the creator personal's GET `/api/alunos` response with expected objective, level, active status, and no latest workout
- [x] 2.2 Verify the new aluno can log in using the submitted temporary password and is identified as role aluno
- [x] 2.3 Add tests for successful creation, authorization, validation, duplicate email, list ownership, and safe response fields
- [x] 2.4 Run build, lint, full tests, Prisma validation, migration status, and repeatable seed; verify all pass

## 3. Documentation

- [x] 3.1 Document POST `/api/alunos`, request/response examples, temporary-password handling, ownership behavior, and error responses in README.md
