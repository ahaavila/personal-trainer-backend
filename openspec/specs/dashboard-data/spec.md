# dashboard-data Specification

## Purpose

Provides role-specific dashboard summaries so the frontend can render a personal management overview and an aluno training overview with one focused request per role.

## Requirements

### Requirement: Personal dashboard endpoint
The system SHALL provide an authenticated `GET /api/dashboard/personal` endpoint returning client metrics, exercise and training-plan counts, upcoming trainings, and weekly evolution data for the authenticated personal.

#### Scenario: Personal requests dashboard data
- **WHEN** an authenticated personal requests the personal dashboard endpoint
- **THEN** the API responds with a successful payload containing summary metrics, upcoming trainings, and weekly evolution values scoped to that personal

#### Scenario: Personal has no dashboard data
- **WHEN** an authenticated personal has no clients, plans, or upcoming trainings
- **THEN** the API responds successfully with zero-valued metrics and empty collections rather than an error

### Requirement: Aluno dashboard endpoint
The system SHALL provide an authenticated `GET /api/dashboard/aluno` endpoint returning the authenticated aluno's current training plan, next workouts, progress metrics, and weekly activity data.

#### Scenario: Aluno requests dashboard data
- **WHEN** an authenticated aluno requests the aluno dashboard endpoint
- **THEN** the API responds with a successful payload containing that aluno's plan/progress data and never includes another user's private data

#### Scenario: Aluno has no active plan
- **WHEN** an authenticated aluno has no active training plan
- **THEN** the API responds successfully with a null/empty plan representation and empty workout/progress collections

### Requirement: Dashboard endpoints enforce roles
The system SHALL reject access when a valid authenticated user calls the dashboard endpoint for a different role.

#### Scenario: Aluno calls personal dashboard
- **WHEN** an authenticated aluno requests `GET /api/dashboard/personal`
- **THEN** the API responds with a forbidden status

#### Scenario: Personal calls aluno dashboard
- **WHEN** an authenticated personal requests `GET /api/dashboard/aluno`
- **THEN** the API responds with a forbidden status

#### Scenario: Unauthenticated dashboard request
- **WHEN** a request has no valid session
- **THEN** either dashboard endpoint responds with an unauthorized status