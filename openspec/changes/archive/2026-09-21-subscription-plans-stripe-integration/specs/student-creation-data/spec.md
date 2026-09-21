## MODIFIED Requirements

### Requirement: Personal can create an assigned aluno
The system SHALL provide an authenticated personal-only endpoint that creates an aluno with name, email, objective, and level without requiring a temporary password, assigns the aluno to the requesting personal, generates a secure password setup token, and dispatches an invitation email to the aluno. The system SHALL enforce active student quota limits according to the personal trainer's subscription plan.

#### Scenario: Successful creation
- **WHEN** an authenticated personal submits valid aluno details (name, email, objective, and level)
- **THEN** the API creates an active aluno with the aluno role, an unguessable password hash, ownership linked to that personal, generates a password setup token, dispatches an invitation email via the email service, and returns a safe created aluno representation

#### Scenario: Creation blocked by subscription limit
- **WHEN** an authenticated personal on Plano Básico who already has 5 active students attempts to create a new aluno
- **THEN** the API rejects the request with HTTP 403 Forbidden and an informative error message indicating the 5 active student limit for Plano Básico has been reached

#### Scenario: Aluno attempts creation
- **WHEN** an authenticated aluno calls the aluno creation endpoint
- **THEN** the API responds with a forbidden status and creates no account
