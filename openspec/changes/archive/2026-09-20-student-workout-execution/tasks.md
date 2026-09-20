## 1. Controller & Service Authorization Refactoring

- [x] 1.1 Update `FichasController` to allow `@Roles('personal', 'aluno')` on `GET /api/fichas-de-treino` and `GET /api/fichas-de-treino/:id`, keeping mutations strictly personal-only; verify compilation with `npm run build`
- [x] 1.2 Update `FichasService.list` and `FichasService.findById` to accept authenticated user identity and filter plans by `alunoId` for students and `personalId` for trainers; verify with unit tests in `src/fichas/fichas.service.spec.ts`

## 2. Automated Tests & Verification

- [x] 2.1 Add unit tests in `src/fichas/fichas.service.spec.ts` covering student retrieval of assigned plans and prevention of cross-tenant plan access; verify tests pass with `npm test`
- [x] 2.2 Verify full backend test suite, linting, and build pass cleanly with `npm test`, `npm run lint`, and `npm run build`
