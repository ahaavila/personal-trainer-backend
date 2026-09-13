## MODIFIED Requirements

### Requirement: Workouts within a training plan are stored
The system SHALL store workouts ("treinos") that each belong to exactly one training plan, and SHALL store which exercises each workout prescribes, including sets, repetitions, optional rest interval, optional target load, technical notes, and sequence order. The system SHALL record enough workout activity metadata to identify an aluno's latest workout.

#### Scenario: A workout with prescribed exercises exists
- **WHEN** a workout has been created within a training plan and exercises have been prescribed to it with sets, reps, optional rest interval, target load, and notes
- **THEN** the system can retrieve the workout's training plan, its prescribed exercises, each exercise's sets, reps, rest interval, target load, notes, and its activity timestamp from stored data
