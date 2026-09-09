## MODIFIED Requirements

### Requirement: Personal can retrieve assigned alunos
The system SHALL provide an authenticated, personal-only aluno listing endpoint that returns only alunos assigned to the requesting personal.

#### Scenario: Personal requests assigned alunos
- **WHEN** an authenticated personal requests the aluno listing
- **THEN** the API responds successfully with only that personal's assigned alunos, including name, email, objective, level, status, and latest workout data

#### Scenario: Personal has no assigned alunos
- **WHEN** an authenticated personal has no assigned alunos
- **THEN** the API responds successfully with an empty list

#### Scenario: Newly created aluno appears in owner listing
- **WHEN** a personal creates an aluno and requests the aluno listing
- **THEN** the API includes the new aluno only in that personal's listing
