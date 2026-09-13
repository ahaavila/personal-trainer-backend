## Context

The backend project provides REST endpoints for the Personal Trainer platform. Currently, personal trainers can manage alunos and their exercise library, but there is no endpoint to create training plans (`fichas de treino`) with structured divisions (`treinos`) and exercises (`treinoExercicios`).

## Goals / Non-Goals

**Goals:**
- Implement `POST /api/fichas-de-treino` in a new or extended `FichasModule` / `TreinosModule`.
- Enhance the Prisma schema for `FichaDeTreino`, `Treino`, and `TreinoExercicio` to support extra prescription attributes (`reps` as string, `restInterval`, `targetLoad`, `notes`, `order`).
- Provide strong validation using NestJS DTOs with `class-validator` and `class-transformer`.
- Ensure multi-tenant security: only authenticated personals can create plans, only for their own alunos, and using accessible exercises.
- Execute all database inserts within an atomic Prisma transaction (`prisma.$transaction`).

**Non-Goals:**
- Aluno workout log execution or check-in timer tracking (handled in subsequent changes).
- PDF/Excel export of training plans.
- Updating or deleting existing plans (will be addressed in a follow-up change).

## Decisions

### 1. Prisma Schema Evolution

Refine the existing models in `prisma/schema.prisma`:

```prisma
model FichaDeTreino {
  id          Int       @id @default(autoincrement())
  alunoId     Int
  personalId  Int
  title       String
  notes       String?
  startDate   DateTime?
  endDate     DateTime?
  aluno       User      @relation("AlunoFichas", fields: [alunoId], references: [id])
  personal    User      @relation("AuthoredFichas", fields: [personalId], references: [id])
  treinos     Treino[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Treino {
  id                 Int                @id @default(autoincrement())
  fichaId            Int
  name               String
  order              Int
  notes              String?
  completedAt        DateTime?
  ficha              FichaDeTreino      @relation(fields: [fichaId], references: [id], onDelete: Cascade)
  treinoExercicios   TreinoExercicio[]

  @@unique([fichaId, order])
}

model TreinoExercicio {
  id           Int       @id @default(autoincrement())
  treinoId     Int
  exercicioId  Int
  order        Int       @default(1)
  sets         Int
  reps         String
  restInterval String?
  targetLoad   String?
  notes        String?
  treino       Treino    @relation(fields: [treinoId], references: [id], onDelete: Cascade)
  exercicio    Exercicio @relation(fields: [exercicioId], references: [id])

  @@unique([treinoId, order])
}
```

*Rationale*:
- `reps` changed to `String` (e.g. "8 a 10", "12", "Falha") to match the realistic format used in `Exercicio.defaultReps`.
- `TreinoExercicio` gains dedicated fields (`restInterval`, `targetLoad`, `notes`, `order`) and an autoincrement ID with unique composite on `[treinoId, order]`.
- Cascade delete configured on `FichaDeTreino -> Treino` and `Treino -> TreinoExercicio`.

---

### 2. NestJS Architecture & DTOs

- **Module**: `FichasModule` (registering `FichasController`, `FichasService`).
- **DTOs**:
  - `CreateFichaDto`:
    - `alunoId`: `number` (required, integer)
    - `title`: `string` (required, non-empty)
    - `notes`: `string` (optional)
    - `startDate`: `string` (optional, ISO date)
    - `endDate`: `string` (optional, ISO date)
    - `divisions`: array of `CreateTreinoDivisionDto` (min 1 division)
  - `CreateTreinoDivisionDto`:
    - `name`: `string` (required, non-empty, e.g. "Treino A - Peito")
    - `notes`: `string` (optional)
    - `order`: `number` (required, integer)
    - `exercises`: array of `CreateTreinoExercicioDto` (min 1 exercise)
  - `CreateTreinoExercicioDto`:
    - `exercicioId`: `number` (required, integer)
    - `order`: `number` (required, integer)
    - `sets`: `number` (required, positive integer)
    - `reps`: `string` (required, non-empty)
    - `restInterval`: `string` (optional)
    - `targetLoad`: `string` (optional)
    - `notes`: `string` (optional)

---

### 3. Service Layer and Authorization Flow

1. **Authentication / Role Check**: Handled by `@Roles('personal')` guard and session extractor.
2. **Student Verification**: Query `User` where `id = dto.alunoId` and `personalId = currentPersonal.id`. If not found, throw `ForbiddenException` or `NotFoundException`.
3. **Exercise Verification**: Extract all distinct `exercicioId` from divisions and query `Exercicio` where `id IN (...)` and `createdByPersonalId = currentPersonal.id`. If any exercise is missing or belongs to another personal, reject with `ForbiddenException`.
4. **Transaction**:
   ```ts
   await prisma.$transaction(async (tx) => {
     const ficha = await tx.fichaDeTreino.create({
       data: {
         personalId: currentPersonal.id,
         alunoId: dto.alunoId,
         title: dto.title,
         notes: dto.notes,
         startDate: dto.startDate ? new Date(dto.startDate) : null,
         endDate: dto.endDate ? new Date(dto.endDate) : null,
         treinos: {
           create: dto.divisions.map((div) => ({
             name: div.name,
             order: div.order,
             notes: div.notes,
             treinoExercicios: {
               create: div.exercises.map((ex) => ({
                 exercicioId: ex.exercicioId,
                 order: ex.order,
                 sets: ex.sets,
                 reps: ex.reps,
                 restInterval: ex.restInterval,
                 targetLoad: ex.targetLoad,
                 notes: ex.notes,
               })),
             },
           })),
         },
       },
       include: {
         treinos: {
           include: { treinoExercicios: true },
         },
       },
     });
     return ficha;
   });
   ```

## Risks / Trade-offs

- **[Risk] Schema migration on existing `TreinoExercicio` table**
  -> *Mitigation*: Create a clean Prisma migration that alters column types with appropriate default mappings and nullability.
- **[Risk] N+1 or high payload validation cost**
  -> *Mitigation*: Fetch all referenced exercise IDs in a single `findMany({ where: { id: { in: exerciseIds } } })` check before the transaction.
