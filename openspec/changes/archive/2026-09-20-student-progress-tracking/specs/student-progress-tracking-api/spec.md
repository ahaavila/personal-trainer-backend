## Purpose

Provides personal-facing API endpoints to query student workout execution history and progressive overload metrics across completed training sessions.

## ADDED Requirements

### Requirement: Personal can retrieve student progress analytics
The system SHALL provide an authenticated endpoint at `GET /api/alunos/:id/progresso` accessible only to the personal trainer assigned to that student, returning the student's summary stats, chronological workout execution history, and exercise-level progression series.

#### Scenario: Personal retrieves progress for assigned student
- **WHEN** an authenticated personal calls `GET /api/alunos/:id/progresso` for an aluno assigned to them
- **THEN** the system responds with 200 OK containing student profile info, workout logs (with date, workout title, duration, exercises performed, sets, reps, and loads), and exercise progression data grouped by exercise

#### Scenario: Personal requests progress for unassigned student
- **WHEN** an authenticated personal calls `GET /api/alunos/:id/progresso` for an aluno assigned to another trainer or non-existing
- **THEN** the system responds with 404 Not Found or 403 Forbidden without exposing student data

#### Scenario: Aluno requests progress endpoint
- **WHEN** an authenticated aluno attempts to access `GET /api/alunos/:id/progresso`
- **THEN** the system responds with 403 Forbidden

### Requirement: Log workout session executions
The system SHALL provide an endpoint to record completed workout session executions with exercise performance details, persisting the date, duration, sets, reps, and weight in kilograms.

#### Scenario: Successfully logging an executed workout
- **WHEN** a valid workout execution payload is submitted containing session date, duration, and exercise set details (reps, weight)
- **THEN** the system creates execution records in the database, updates the student's latest workout timestamp, and returns the saved execution data

#### Scenario: Rejecting invalid execution payload
- **WHEN** an execution payload lacks required fields or references non-existent exercises
- **THEN** the system rejects the request with a 400 Bad Request error
