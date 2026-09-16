## MODIFIED Requirements

### Requirement: Login with email and password
The system SHALL provide a login endpoint that accepts an email and password, and SHALL authenticate the request against stored user credentials. A user with role `aluno` SHALL be authenticated only when their stored status is `ativo`; a personal user is not subject to aluno-status validation.

#### Scenario: Successful login
- **WHEN** a client submits a login request with an email and password matching a stored personal user or an active aluno user's credentials
- **THEN** the system sets a session cookie identifying the authenticated user and responds with a success status containing the user's role and name

#### Scenario: Non-active aluno login is denied
- **WHEN** a client submits correct credentials for a user with role `aluno` whose status is not `ativo`
- **THEN** the system responds with an unauthorized status and a consistent access-denied message, and does not set a session cookie

#### Scenario: Failed login with wrong credentials
- **WHEN** a client submits a login request with an email and password that do not match any stored user
- **THEN** the system responds with an unauthorized status and an error message, and does not set a session cookie

#### Scenario: Failed login with missing fields
- **WHEN** a client submits a login request missing the email or the password
- **THEN** the system responds with an error status and does not attempt authentication

### Requirement: Session check endpoint
The system SHALL provide an endpoint that reports whether the current request carries a valid session, and if so, the authenticated user's role and name. A session for an aluno whose stored status is not `ativo` SHALL not be considered valid.

#### Scenario: Checking an active session
- **WHEN** a client calls the session-check endpoint with a valid session cookie for a personal or active aluno
- **THEN** the system responds with a success status containing the authenticated user's role and name

#### Scenario: Checking a session after aluno deactivation
- **WHEN** a client calls the session-check endpoint with a valid token for an aluno whose stored status has changed to a value other than `ativo`
- **THEN** the system responds with an unauthorized status and does not return user data

#### Scenario: Checking with no or invalid session
- **WHEN** a client calls the session-check endpoint without a valid session cookie
- **THEN** the system responds with an unauthorized status
