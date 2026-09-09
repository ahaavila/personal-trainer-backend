# student-creation-data Specification

## Purpose

Provides a secure personal-only API that creates aluno accounts and automatically assigns them to the authenticated personal.

## Requirements

### Requirement: Personal can create an assigned aluno
The system SHALL provide an authenticated personal-only endpoint that creates an aluno with name, email, temporary password, objective, and level, assigning the aluno to the requesting personal.

#### Scenario: Successful creation
- **WHEN** an authenticated personal submits valid aluno details
- **THEN** the API creates an active aluno with the aluno role, a hashed password, and ownership linked to that personal, then returns a safe created aluno representation

#### Scenario: Aluno attempts creation
- **WHEN** an authenticated aluno calls the aluno creation endpoint
- **THEN** the API responds with a forbidden status and creates no account

### Requirement: Creation input is validated
The system SHALL reject missing or invalid creation inputs and duplicate email addresses without creating an account.

#### Scenario: Duplicate email
- **WHEN** the submitted email already belongs to a user
- **THEN** the API responds with a conflict status and does not alter the existing account

#### Scenario: Invalid creation request
- **WHEN** the submitted name, email, password, objective, or level is missing or invalid
- **THEN** the API responds with a validation error and creates no account

### Requirement: Passwords remain protected
The system SHALL hash the temporary password before storing it and SHALL not return it or its hash in the response.

#### Scenario: Inspecting creation response
- **WHEN** aluno creation succeeds
- **THEN** the response contains no plaintext password, password hash, JWT, or session cookie value