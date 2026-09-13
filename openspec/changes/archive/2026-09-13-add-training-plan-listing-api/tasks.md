## 1. DTOs and Response Mapping

- [x] 1.1 Create `src/fichas/dto/list-fichas.dto.ts` with query parameters (`alunoId`, `search`) and output response interfaces, and verify compilation passes.
- [x] 1.2 Create `src/fichas/dto/update-ficha.dto.ts` supporting plan updates.

## 2. Service Layer Implementation

- [x] 2.1 Implement `FichasService.list(personalId, query)` with personal tenant isolation, relation joins (`aluno`, `treinos`, `treinoExercicios`, `exercicio`), and metric calculations (`divisionsCount`, `exercisesCount`).
- [x] 2.2 Implement `FichasService.findById(personalId, id)` returning complete plan details and throwing `NotFoundException` if the plan does not exist or belongs to another personal.
- [x] 2.3 Implement `FichasService.update(personalId, id, input)` and `FichasService.delete(personalId, id)` with ownership verification and transactional consistency.
- [x] 2.4 Add unit tests in `src/fichas/fichas.service.spec.ts` verifying `list`, `findById`, `update`, and `delete` logic, query filters, and isolation checks.

## 3. Controller Endpoints & E2E Tests

- [x] 3.1 Update `FichasController` to expose `GET /api/fichas-de-treino` and `GET /api/fichas-de-treino/:id` with `@UseGuards(SessionAuthGuard, RolesGuard)` and `@Roles('personal')`.
- [x] 3.2 Update `FichasController` to expose `PUT /api/fichas-de-treino/:id` and `DELETE /api/fichas-de-treino/:id` with `@UseGuards(SessionAuthGuard, RolesGuard)` and `@Roles('personal')`.
- [x] 3.3 Add end-to-end integration tests in `test/` verifying listing, detail inspection, updating, and deletion endpoints.
