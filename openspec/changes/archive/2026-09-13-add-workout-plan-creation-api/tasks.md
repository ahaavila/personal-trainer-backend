## 1. Database Schema & Migration

- [x] 1.1 Update `prisma/schema.prisma` to enhance `FichaDeTreino`, `Treino`, and `TreinoExercicio` models with prescription fields (`notes`, `startDate`, `endDate`, `order`, `restInterval`, `targetLoad`, `reps` as string) and cascade relationships.
- [x] 1.2 Generate and run the Prisma migration or update client via `npx prisma generate` and verify Prisma Client types are updated.

## 2. DTOs and Validation

- [x] 2.1 Create `src/fichas/dto/create-ficha.dto.ts` with nested validation for `divisions` and `exercises` using `class-validator` and `class-transformer`.
- [x] 2.2 Add unit tests for `CreateFichaDto` validating required student ID, non-empty plan title, positive sets, and non-empty repetition strings.

## 3. Service Layer and Business Logic

- [x] 3.1 Implement `FichasService.create` with ownership checks (verifying the student belongs to the requesting personal and all exercises are created/accessible by the personal).
- [x] 3.2 Implement atomic transaction creation (`prisma.$transaction`) inserting the training plan, divisions, and exercise prescription rows.
- [x] 3.3 Add unit tests for `FichasService` verifying successful creation and error cases (`ForbiddenException` for foreign student/exercise, `BadRequestException` for empty divisions).

## 4. Controller, Routing & E2E Tests

- [x] 4.1 Create `FichasController` exposing `POST /api/fichas-de-treino` with `@UseGuards(RolesGuard)` ensuring only authenticated personal trainers can access.
- [x] 4.2 Register `FichasModule` in `AppModule`.
- [x] 4.3 Add end-to-end integration tests verifying `POST /api/fichas-de-treino` returns 201 Created with full payload on success, 403 on role/ownership mismatch, and 400 on invalid payload.
