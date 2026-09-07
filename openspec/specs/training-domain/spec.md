# training-domain Specification

## Purpose

Provides the underlying data model for the personal-aluno relationship, the exercise catalog, training plans (fichas de treino), and workouts (treinos), so future features can be built against a stable schema.

## Requirements

### Requirement: Personal-aluno relationship is stored
The system SHALL record which personal manages which alunos, so a personal's list of alunos ("clientes") can be determined directly from stored data.

#### Scenario: An aluno is linked to a personal
- **WHEN** an aluno user is associated with a personal user
- **THEN** the system can determine, from stored data, that the aluno belongs to that personal's list of alunos

### Requirement: Exercise catalog is stored
The system SHALL store exercises, each with a name, a muscle group, and a reference to the personal who created it.

#### Scenario: An exercise exists
- **WHEN** an exercise has been created by a personal
- **THEN** the system can retrieve its name, muscle group, and creating personal from stored data

### Requirement: Training plans are stored
The system SHALL store training plans ("fichas de treino"), each belonging to exactly one aluno and authored by exactly one personal.

#### Scenario: A training plan exists
- **WHEN** a training plan has been created for an aluno by a personal
- **THEN** the system can retrieve the plan, its aluno, and its authoring personal from stored data

### Requirement: Workouts within a training plan are stored
The system SHALL store workouts ("treinos") that each belong to exactly one training plan, and SHALL store which exercises each workout prescribes, including the sets and reps for each.

#### Scenario: A workout with prescribed exercises exists
- **WHEN** a workout has been created within a training plan and exercises have been prescribed to it with sets and reps
- **THEN** the system can retrieve the workout's training plan, its prescribed exercises, and each exercise's sets and reps