## Purpose

Enables personal trainers to create, validate, and atomically persist customized workout plans (fichas de treino) with multi-division workouts and detailed exercise prescriptions for their students.

## ADDED Requirements

### Requirement: Personal-only training plan creation endpoint
The system SHALL expose an authenticated endpoint `POST /api/fichas-de-treino` (or `/api/fichas`) accessible exclusively to users with the `personal` role.

#### Scenario: Personal user creates a valid training plan
- **WHEN** an authenticated personal sends a `POST /api/fichas-de-treino` request with a valid student ID, title, workout divisions, and exercise prescriptions
- **THEN** the system persists the plan, divisions, and exercises atomically and returns HTTP 201 Created with the created plan details

#### Scenario: Non-personal user attempts to create a training plan
- **WHEN** an unauthenticated user or an authenticated user with role `aluno` sends a request to `POST /api/fichas-de-treino`
- **THEN** the system rejects the request with HTTP 401 Unauthorized or HTTP 403 Forbidden

### Requirement: Multi-tenant ownership and relationship authorization
The system SHALL verify that the target student is assigned to the authenticated personal, and that all referenced exercises were created by or are accessible to the authenticated personal.

#### Scenario: Personal attempts to assign plan to another trainer's student
- **WHEN** an authenticated personal submits a plan referencing a student ID that does not belong to the personal's roster
- **THEN** the system rejects the request with HTTP 403 Forbidden without modifying the database

#### Scenario: Personal attempts to reference an inaccessible exercise
- **WHEN** an authenticated personal submits a plan referencing an exercise ID that belongs to another personal
- **THEN** the system rejects the request with HTTP 403 Forbidden or HTTP 400 Bad Request

### Requirement: Payload validation and atomic transactional persistence
The system SHALL validate that the plan contains a non-empty title, at least one workout division, and that each division contains at least one exercise prescription with valid positive sets and non-empty repetition specifications.

#### Scenario: Submitting invalid or incomplete plan payload
- **WHEN** a personal submits a plan missing a title or containing an empty division
- **THEN** the system returns HTTP 400 Bad Request with descriptive validation error messages and does not persist partial records

#### Scenario: Successful atomic persistence
- **WHEN** all validation and authorization checks pass
- **THEN** the system inserts the training plan, workout divisions, and workout exercise prescriptions inside a database transaction, ensuring no orphan records exist on failure
