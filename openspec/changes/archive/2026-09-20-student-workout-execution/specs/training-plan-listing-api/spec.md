## MODIFIED Requirements

### Requirement: Personal-only training plans listing endpoint
The system SHALL expose an authenticated `GET /api/fichas-de-treino` endpoint accessible to both `personal` and `aluno` roles. When called by a personal trainer, it SHALL return plans authored by that personal trainer. When called by a student, it SHALL return only plans assigned to that student.

#### Scenario: Personal retrieves their training plans
- **WHEN** an authenticated personal trainer sends a `GET /api/fichas-de-treino` request
- **THEN** the system returns HTTP 200 OK with an array of training plans authored exclusively by that personal trainer, including student metadata, division counts, and exercise counts

#### Scenario: Non-personal user attempts to retrieve training plans
- **WHEN** an authenticated user with role `aluno` sends a `GET /api/fichas-de-treino` request
- **THEN** the system returns HTTP 200 OK with an array of training plans assigned exclusively to that student, and rejects unauthenticated requests with HTTP 401 Unauthorized

### Requirement: Single training plan detail retrieval
The system SHALL expose an authenticated `GET /api/fichas-de-treino/:id` endpoint returning the complete structure of a specific training plan, including all its workout divisions and exercise prescriptions, accessible to the authoring personal trainer or the assigned student.

#### Scenario: Personal retrieves plan details
- **WHEN** an authenticated personal requests a training plan by its ID that they authored
- **THEN** the system returns HTTP 200 OK with the full plan entity, including student details, divisions, and prescribed exercises

#### Scenario: Personal requests a plan owned by another trainer
- **WHEN** a personal attempts to retrieve a plan ID authored by another personal trainer, or a student attempts to retrieve a plan assigned to another student
- **THEN** the system returns HTTP 404 Not Found or HTTP 403 Forbidden
