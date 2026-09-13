## Why

The backend supports listing and creating exercises, but lacks endpoints to get a single exercise's details, update an existing exercise's fields/prescriptions, or delete an exercise from the database while enforcing strict personal-trainer ownership.

## What Changes

- Add `GET /api/exercicios/:id` to retrieve full details and media references for an exercise owned by the authenticated personal.
- Add `PUT /api/exercicios/:id` (or `PATCH /api/exercicios/:id`) to update exercise metadata, muscle group, prescription defaults, level, description, and equipment.
- Add `DELETE /api/exercicios/:id` to remove an exercise and its associated media/relations, rejecting deletions of unowned exercises with 404.
- Enforce strict authentication and personal role validation on all endpoints.

## Capabilities

### New Capabilities
- `exercise-management-api`: Dedicated endpoints for reading, updating, and deleting individual private exercises with strict owner verification.

### Modified Capabilities
- None

## Impact

- NestJS `ExerciciosController` & `ExerciciosService`: new methods for `findOne`, `update`, and `remove`.
- Prisma: delete queries that handle cascading relation cleanup (e.g. `ExerciseMedia`) and prevent deleting unowned records.
- Security: returns 404 for unowned exercise IDs (no authorization leaks).
