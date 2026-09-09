## 1. Schema & Seed Data

- [x] 1.1 Add objective, level, and status enums/profile fields for aluno users plus `Treino.completedAt`; verify `prisma validate` passes
- [x] 1.2 Generate/apply a Prisma migration and verify migration status is clean
- [x] 1.3 Extend the seed with representative personal-assigned alunos, exercises, plans, and completed workouts; verify the seed runs repeatedly without foreign-key failures

## 2. Aluno Listing Endpoint

- [x] 2.1 Create the alunos Nest module/controller/service and register it; verify application boot succeeds
- [x] 2.2 Implement session authentication and personal-only role authorization on `GET /api/alunos`; verify unauthenticated requests return 401 and aluno requests return 403
- [x] 2.3 Implement personal-scoped queries returning table DTOs (name, email, objective, level, status, latest workout); verify no records from another personal are returned
- [x] 2.4 Implement validated optional `search`, `status`, and `objective` filters; verify each filter and a combined filter return only matching alunos
- [x] 2.5 Return a successful empty list for no assigned/matching alunos; verify no-data behavior

## 3. Tests & Documentation

- [x] 3.1 Add tests for authorization, scope isolation, fields, filters, invalid filters, and empty results; verify test suite passes
- [x] 3.2 Document `GET /api/alunos`, filters, authentication requirements, and response examples in README.md; verify curl examples match implementation
- [x] 3.3 Run build, lint, tests, migration status, and seed; verify all pass
