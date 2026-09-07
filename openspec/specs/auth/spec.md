# auth Specification

## Purpose

Provides real authentication for the API: validating a user's email and password against stored credentials and issuing a JWT that identifies the authenticated user and their role.

## Requirements

### Requirement: Login with email and password
The system SHALL provide a login endpoint that accepts an email and password, and SHALL authenticate the request against stored user credentials.

#### Scenario: Successful login
- **WHEN** a client submits a login request with an email and password matching a stored user's credentials
- **THEN** the system sets a session cookie identifying the authenticated user and responds with a success status containing the user's role and name

#### Scenario: Failed login with wrong credentials
- **WHEN** a client submits a login request with an email and password that do not match any stored user
- **THEN** the system responds with an unauthorized status and an error message, and does not set a session cookie

#### Scenario: Failed login with missing fields
- **WHEN** a client submits a login request missing the email or the password
- **THEN** the system responds with an error status and does not attempt authentication

### Requirement: Password storage
The system SHALL store user passwords only in hashed form, and SHALL NOT store or log plaintext passwords.

#### Scenario: Verifying a login attempt
- **WHEN** the system checks a submitted password against a stored user
- **THEN** it compares against the stored password hash rather than a plaintext value

### Requirement: Access token identifies role
The system SHALL issue access tokens that identify the authenticated user and their role (`personal` or `aluno`), so that future authorization checks can distinguish between the two.

#### Scenario: Token carries the user's role
- **WHEN** a user successfully logs in
- **THEN** the issued token, when decoded, identifies that user's role

### Requirement: Seeded test users
The system SHALL provide exactly two pre-existing users usable for login without any registration step: one with the `personal` role and one with the `aluno` role.

#### Scenario: Logging in as the seeded personal user
- **WHEN** a client logs in with the seeded personal user's credentials
- **THEN** the login succeeds and the response identifies the role as `personal`

#### Scenario: Logging in as the seeded aluno user
- **WHEN** a client logs in with the seeded aluno user's credentials
- **THEN** the login succeeds and the response identifies the role as `aluno`

### Requirement: Cross-origin access from the frontend
The system SHALL accept requests from the frontend application's origin(s), so that the browser does not block the login request.

#### Scenario: Login request from the frontend's origin
- **WHEN** the frontend application calls the login endpoint from its configured origin
- **THEN** the browser allows the request and response to complete

### Requirement: Session cookie is not accessible to JavaScript
The system SHALL set the session cookie as HTTP-only and marked Secure, so that client-side scripts cannot read the session token and it is only transmitted over HTTPS in production.

#### Scenario: Cookie attributes on login
- **WHEN** a login succeeds
- **THEN** the session cookie set by the response is marked HTTP-only and Secure

### Requirement: Session check endpoint
The system SHALL provide an endpoint that reports whether the current request carries a valid session, and if so, the authenticated user's role and name.

#### Scenario: Checking an active session
- **WHEN** a client calls the session-check endpoint with a valid session cookie
- **THEN** the system responds with a success status containing the authenticated user's role and name

#### Scenario: Checking with no or invalid session
- **WHEN** a client calls the session-check endpoint without a valid session cookie
- **THEN** the system responds with an unauthorized status

### Requirement: Logout ends the session
The system SHALL provide a logout endpoint that invalidates the current session cookie.

#### Scenario: Logging out
- **WHEN** a client calls the logout endpoint with a valid session cookie
- **THEN** the system clears the session cookie, and a subsequent session check reports no valid session

### Requirement: Credentialed cross-origin requests are supported
The system SHALL accept cross-origin requests from the frontend's configured origin(s) with credentials (cookies) included, so the browser sends and receives the session cookie correctly.

#### Scenario: Login request from the frontend with credentials
- **WHEN** the frontend calls the login or session-check endpoint from its configured origin with credentials included
- **THEN** the browser allows the request and the session cookie is set or sent as expected