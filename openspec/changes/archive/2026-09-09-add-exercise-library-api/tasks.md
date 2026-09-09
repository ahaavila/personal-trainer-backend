## 1. Schema & Seed

- [x] 1.1 Add Exercicio description, default sets, default repetitions, and level fields/enums; verify Prisma schema validation passes
- [x] 1.2 Generate/apply migration and verify migration status is clean
- [x] 1.3 Extend seed with sample exercises owned by the seeded personal, and verify repeatable seed succeeds

## 2. Private Exercise Endpoint

- [x] 2.1 Add exercicios module/controller/service and register it; verify application boots
- [x] 2.2 Implement personal-only session/role guard for `GET /api/exercicios`; verify 401 unauthenticated and 403 aluno responses
- [x] 2.3 Query/return only authenticated personal exercises with all card DTO fields, verifying another personal's exercises are excluded
- [x] 2.4 Add validated optional search, muscleGroup and level filters with combined AND behavior; verify valid and invalid filters
- [x] 2.5 Return successful empty list for a personal without exercises

## 3. Tests & Documentation

- [x] 3.1 Add tests for authorization, ownership isolation, fields, filters and empty data
- [x] 3.2 Document endpoint and filters in README with curl example
- [x] 3.3 Run build, lint, tests, Prisma validation/migration status and seed; verify all pass
