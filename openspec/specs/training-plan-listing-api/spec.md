# training-plan-listing-api Specification

## Purpose

Provides secure REST endpoints for personal trainers to retrieve, search, and inspect their authored training plans (fichas de treino) along with student information, workout divisions, and exercise prescriptions.

## Requirements

### Requirement: Personal-only training plans listing endpoint
The system SHALL expose an authenticated `GET /api/fichas-de-treino` endpoint accessible exclusively to users with the `personal` role.

#### Scenario: Personal retrieves their training plans
- **WHEN** an authenticated personal trainer sends a `GET /api/fichas-de-treino` request
- **THEN** the system returns HTTP 200 OK with an array of training plans authored exclusively by that personal trainer, including student metadata, division counts, and exercise counts

#### Scenario: Non-personal user attempts to retrieve training plans
- **WHEN** an unauthenticated user or an authenticated user with role `aluno` sends a `GET /api/fichas-de-treino` request
- **THEN** the system rejects the request with HTTP 401 Unauthorized or HTTP 403 Forbidden

### Requirement: Multi-tenant plan isolation
The system SHALL ensure that personal trainers can only access training plans that they personally authored (`personalId = currentPersonal.id`).

#### Scenario: Personal list contains only own plans
- **WHEN** multiple personal trainers have created training plans in the database
- **THEN** each personal trainer only receives the training plans associated with their own `personalId`

### Requirement: Query filtering on training plans list
The system SHALL support optional query parameters (`alunoId`, `search`) on `GET /api/fichas-de-treino` to filter the returned list of plans.

#### Scenario: Filter by student ID
- **WHEN** a personal specifies `?alunoId=123`
- **THEN** the system returns only training plans authored by the personal for that specific student

#### Scenario: Filter by search term
- **WHEN** a personal specifies `?search=Hipertrofia`
- **THEN** the system returns plans whose title matches the search query

### Requirement: Single training plan detail retrieval
The system SHALL expose an authenticated `GET /api/fichas-de-treino/:id` endpoint returning the complete structure of a specific training plan, including all its workout divisions and exercise prescriptions.

#### Scenario: Personal retrieves plan details
- **WHEN** an authenticated personal requests a training plan by its ID that they authored
- **THEN** the system returns HTTP 200 OK with the full plan entity, including student details, divisions, and prescribed exercises

#### Scenario: Personal requests a plan owned by another trainer
- **WHEN** a personal attempts to retrieve a plan ID authored by another personal trainer
- **THEN** the system returns HTTP 404 Not Found or HTTP 403 Forbidden

### Requirement: Personal can update an existing training plan
The system SHALL expose an authenticated `PUT /api/fichas-de-treino/:id` endpoint allowing the authoring personal trainer to update the training plan, its divisions, and exercise prescriptions.

#### Scenario: Successful training plan update
- **WHEN** an authenticated personal submits a valid payload to `PUT /api/fichas-de-treino/:id` for a plan they authored
- **THEN** the system updates the plan and divisions/exercises inside a transaction and returns HTTP 200 OK with the updated plan

#### Scenario: Unauthorized update attempt
- **WHEN** a personal attempts to update a plan ID authored by another trainer or references foreign exercises/students
- **THEN** the system rejects the request with HTTP 403 Forbidden or HTTP 404 Not Found

### Requirement: Personal can delete a training plan
The system SHALL expose an authenticated `DELETE /api/fichas-de-treino/:id` endpoint allowing the authoring personal trainer to delete a training plan.

#### Scenario: Successful training plan deletion
- **WHEN** an authenticated personal sends a `DELETE /api/fichas-de-treino/:id` request for a plan they authored
- **THEN** the system deletes the plan and all its associated divisions and exercise prescriptions, returning HTTP 204 No Content

#### Scenario: Unauthorized deletion attempt
- **WHEN** a personal attempts to delete a plan authored by another personal trainer
- **THEN** the system rejects the request with HTTP 403 Forbidden or HTTP 404 Not Found
