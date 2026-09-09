## Purpose

Provides a personal-scoped, filterable aluno listing API with the profile and activity data needed to render the student table.

## ADDED Requirements

### Requirement: Personal can retrieve assigned alunos
The system SHALL provide an authenticated, personal-only aluno listing endpoint that returns only alunos assigned to the requesting personal.

#### Scenario: Personal requests assigned alunos
- **WHEN** an authenticated personal requests the aluno listing
- **THEN** the API responds successfully with only that personal's assigned alunos, including name, email, objective, level, status, and latest workout data

#### Scenario: Personal has no assigned alunos
- **WHEN** an authenticated personal has no assigned alunos
- **THEN** the API responds successfully with an empty list

### Requirement: Aluno listing can be filtered
The aluno listing endpoint SHALL accept optional name/email search, status, and objective filters and apply all supplied filters to the requesting personal's assigned alunos.

#### Scenario: Filtered aluno request
- **WHEN** a personal requests the listing with one or more supported filters
- **THEN** the API responds successfully with only assigned alunos matching all supplied filters

### Requirement: Non-personal access is rejected
The system SHALL reject aluno listing requests from unauthenticated users and authenticated aluno users.

#### Scenario: Aluno requests the listing
- **WHEN** an authenticated aluno requests the aluno listing endpoint
- **THEN** the API responds with a forbidden status
