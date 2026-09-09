## MODIFIED Requirements

### Requirement: Personal-aluno relationship is stored
The system SHALL record which personal manages which alunos, so a personal's list of alunos can be determined directly from stored data. Each aluno SHALL also have an objective, level, and active/inactive status available for personal-facing listing.

#### Scenario: An aluno is linked to a personal
- **WHEN** an aluno user is associated with a personal user
- **THEN** the system can determine, from stored data, that the aluno belongs to that personal's list of alunos along with their objective, level, and status

### Requirement: Workouts within a training plan are stored
The system SHALL store workouts ("treinos") that each belong to exactly one training plan, and SHALL store which exercises each workout prescribes, including the sets and reps for each. The system SHALL record enough workout activity metadata to identify an aluno's latest workout.

#### Scenario: A workout with prescribed exercises exists
- **WHEN** a workout has been created within a training plan and exercises have been prescribed to it with sets and reps
- **THEN** the system can retrieve the workout's training plan, its prescribed exercises, each exercise's sets and reps, and its activity timestamp from stored data
