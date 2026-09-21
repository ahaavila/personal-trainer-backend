## MODIFIED Requirements

### Requirement: Personal can retrieve assigned alunos
The system SHALL provide an authenticated, personal-only aluno listing endpoint that returns only alunos assigned to the requesting personal, and SHALL provide a mechanism to update an aluno's status between `ativo` and `inativo`.

#### Scenario: Personal requests assigned alunos
- **WHEN** an authenticated personal requests the aluno listing
- **THEN** the API responds successfully with only that personal's assigned alunos, including name, email, objective, level, status, and latest workout data

#### Scenario: Personal has no assigned alunos
- **WHEN** an authenticated personal has no assigned alunos
- **THEN** the API responds successfully with an empty list

#### Scenario: Newly created aluno appears in owner listing
- **WHEN** a personal creates an aluno and requests the aluno listing
- **THEN** the API includes the new aluno only in that personal's listing

#### Scenario: Personal toggles aluno status to inativo
- **WHEN** a personal requests to set an aluno's status to `inativo`
- **THEN** the system updates the aluno status to `inativo`, freeing up an active student slot under Plano Básico

#### Scenario: Personal reactivates an inativo aluno with available quota
- **WHEN** a personal requests to set an aluno's status back to `ativo` and has fewer than 5 active students (or is on Plano PRO)
- **THEN** the system updates the aluno status to `ativo`

#### Scenario: Personal reactivates an inativo aluno without available quota
- **WHEN** a personal on Plano Básico who already has 5 active students attempts to reactivate an aluno to `ativo`
- **THEN** the system rejects the request with HTTP 403 Forbidden indicating quota limit exceeded
