## 1. Schema: Personal-Aluno Relationship

- [ ] 1.1 Add a nullable `personalId` self-relation FK on `User` (named relation, e.g. `PersonalAlunos`), and verify `prisma validate` passes and the relation is queryable both directions (`personal.alunos`, `aluno.personal`)

## 2. Schema: Exercise Catalog

- [ ] 2.1 Add the `Exercicio` model (`name`, `muscleGroup`, `createdByPersonalId` FK to `User`), and verify `prisma validate` passes

## 3. Schema: Training Plans & Workouts

- [ ] 3.1 Add the `FichaDeTreino` model (`alunoId` FK, `personalId` FK, `title`, timestamps), and verify `prisma validate` passes
- [ ] 3.2 Add the `Treino` model belonging to a `FichaDeTreino` (`fichaId` FK, `name`, `order`), and verify `prisma validate` passes
- [ ] 3.3 Add the `TreinoExercicio` join model linking `Treino` and `Exercicio` with `sets` and `reps`, and verify `prisma validate` passes

## 4. Migration

- [ ] 4.1 Generate a migration for all new models/relations and apply it against the local database, and verify the resulting schema matches `prisma/schema.prisma` (`prisma migrate status` reports no pending migrations)
- [ ] 4.2 Verify the existing seed script and test suite still run successfully against the migrated schema
