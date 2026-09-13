## Context

`FichasController` and `FichasService` currently support creating training plans via `POST /api/fichas-de-treino`. Personal trainers need to view and query their list of created plans to power the frontend `/treinos` page.

## Goals / Non-Goals

**Goals:**
- Implement `FichasService.list(personalId, query)`, `FichasService.findById(personalId, id)`, `FichasService.update(personalId, id, dto)`, and `FichasService.delete(personalId, id)`.
- Expose `GET /api/fichas-de-treino`, `GET /api/fichas-de-treino/:id`, `PUT /api/fichas-de-treino/:id`, and `DELETE /api/fichas-de-treino/:id` in `FichasController`.
- Eagerly load and map related entities (`aluno`, `treinos`, `treinoExercicios`, and `exercicio`).
- Calculate aggregate metrics (`divisionsCount`, `exercisesCount`) in the returned DTOs.
- Maintain strict multi-tenant authorization so personals only access, update, or delete their own authored plans.

**Non-Goals:**
- Student workout logging/check-in execution (student dashboard reads assigned plan via separate student endpoint).

## Decisions

### 1. Controller Endpoints & DTOs

- **`GET /api/fichas-de-treino`**:
  - Query DTO: `ListFichasQueryDto` (`alunoId?: number`, `search?: string`).
  - Response: Array of `FichaListingDto`:
    ```json
    [
      {
        "id": 1,
        "title": "Hipertrofia A/B/C",
        "notes": "Foco em peito e pernas",
        "startDate": "2026-09-15T00:00:00.000Z",
        "endDate": "2026-11-15T00:00:00.000Z",
        "createdAt": "2026-09-13T10:00:00.000Z",
        "status": "active",
        "alunoId": 2,
        "studentId": 2,
        "studentEmail": "mariana.costa@email.com",
        "studentName": "Mariana Costa",
        "studentObjective": "hipertrofia",
        "divisionsCount": 2,
        "exercisesCount": 6,
        "divisions": [
          {
            "id": 1,
            "name": "Treino A",
            "order": 1,
            "notes": null,
            "exercises": [
              {
                "id": 1,
                "exercicioId": 2,
                "exerciseId": 2,
                "exerciseName": "Supino reto",
                "muscleGroup": "Peito",
                "equipment": "Banco",
                "order": 1,
                "sets": 4,
                "reps": "8 a 12",
                "restInterval": "60s",
                "targetLoad": "20kg",
                "notes": "Cadência 3010"
              }
            ]
          }
        ]
      }
    ]
    ```

- **`GET /api/fichas-de-treino/:id`**:
  - Validates `id` with `ParseIntPipe`.
  - Queries `fichaDeTreino` with `where: { id, personalId }`.
  - Returns 404 Not Found if not found or not owned by personal.

### 2. Service Layer Queries

```ts
const fichas = await this.prisma.fichaDeTreino.findMany({
  where: {
    personalId,
    ...(query.alunoId ? { alunoId: query.alunoId } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { aluno: { name: { contains: query.search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  },
  orderBy: { createdAt: 'desc' },
  include: {
    aluno: {
      select: { id: true, name: true, email: true, objective: true },
    },
    treinos: {
      orderBy: { order: 'asc' },
      include: {
        treinoExercicios: {
          orderBy: { order: 'asc' },
          include: {
            exercicio: {
              select: { id: true, name: true, muscleGroup: true, equipment: true },
            },
          },
        },
      },
    },
  },
});
```

## Risks / Trade-offs

- **[Risk] Nested object mapping performance**
  -> *Mitigation*: Single database query with Prisma `include` clauses and in-memory projection.
