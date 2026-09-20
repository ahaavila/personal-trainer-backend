## MODIFIED Requirements

### Requirement: Personal can create an assigned aluno
The system SHALL provide an authenticated personal-only endpoint that creates an aluno with name, email, objective, and level without requiring a temporary password, assigns the aluno to the requesting personal, generates a secure password setup token, and dispatches an invitation email to the aluno.

#### Scenario: Successful creation
- **WHEN** an authenticated personal submits valid aluno details (name, email, objective, and level)
- **THEN** the API creates an active aluno with the aluno role, an unguessable password hash, ownership linked to that personal, generates a password setup token, dispatches an invitation email via the email service, and returns a safe created aluno representation

#### Scenario: Aluno attempts creation
- **WHEN** an authenticated aluno calls the aluno creation endpoint
- **THEN** the API responds with a forbidden status and creates no account

### Requirement: Creation input is validated
The system SHALL reject missing or invalid creation inputs and duplicate email addresses without creating an account. The system SHALL NOT require or accept a password field in the creation request.

#### Scenario: Duplicate email
- **WHEN** the submitted email already belongs to a user
- **THEN** the API responds with a conflict status and does not alter the existing account

#### Scenario: Invalid creation request
- **WHEN** the submitted name, email, objective, or level is missing or invalid
- **THEN** the API responds with a validation error and creates no account
