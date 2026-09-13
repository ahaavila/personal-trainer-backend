## 1. DTOs & Service Methods

- [x] 1.1 Add `UpdateExercicioDto` and implement `findOne`, `update`, and `remove` methods in `ExerciciosService`.
- [x] 1.2 Implement cascading cleanup for associated media records upon exercise removal.

## 2. Controller Endpoints & Security

- [x] 2.1 Add `GET /api/exercicios/:id`, `PUT /api/exercicios/:id`, and `DELETE /api/exercicios/:id` to `ExerciciosController` with `@UseGuards(SessionAuthGuard, RolesGuard)` and `@Roles('personal')`.
- [x] 2.2 Verify ownership checks return 404 for unowned exercise IDs.

## 3. Verification

- [x] 3.1 Run backend tests for single retrieval, update, and delete endpoints.
- [x] 3.2 Verify compilation and type safety with `npm run build`.
