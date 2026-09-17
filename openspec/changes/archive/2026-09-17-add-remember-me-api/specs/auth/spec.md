## MODIFIED Requirements

### Requirement: Login with email and password
The system SHALL provide a login endpoint that accepts an email, password, and optional rememberMe flag, and SHALL authenticate the request against stored user credentials. A user with role `aluno` SHALL be authenticated only when their stored status is `ativo`; a personal user is not subject to aluno-status validation. When rememberMe is true, the system SHALL issue an extended session token and cookie (30 days); otherwise it SHALL issue a standard 1-day session.

#### Scenario: Successful login
- **WHEN** a client submits a login request with an email and password matching a stored personal user or an active aluno user's credentials
- **THEN** the system sets a session cookie identifying the authenticated user and responds with a success status containing the user's role and name

#### Scenario: Successful login with rememberMe enabled
- **WHEN** a client submits a login request with valid credentials and `rememberMe: true`
- **THEN** the system issues a session cookie with an extended 30-day expiration

#### Scenario: Non-active aluno login is denied
- **WHEN** a client submits correct credentials for a user with role `aluno` whose status is not `ativo`
- **THEN** the system responds with an unauthorized status and a consistent access-denied message, and does not set a session cookie

#### Scenario: Failed login with wrong credentials
- **WHEN** a client submits a login request with an email and password that do not match any stored user
- **THEN** the system responds with an unauthorized status and an error message, and does not set a session cookie

#### Scenario: Failed login with missing fields
- **WHEN** a client submits a login request missing the email or the password
- **THEN** the system responds with an error status and does not attempt authentication
