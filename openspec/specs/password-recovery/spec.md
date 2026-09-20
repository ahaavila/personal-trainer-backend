# password-recovery Specification

## Purpose

Provides secure password recovery capabilities, allowing users to request a password reset link and update their account credentials using a time-limited single-use token.

## Requirements

### Requirement: Request password reset link
The system SHALL provide an endpoint at `POST /api/auth/forgot-password` accepting an email address. If an account with the specified email exists, the system SHALL generate a cryptographically random, time-limited reset token, persist its hashed representation associated with the user, and prepare a recovery message containing the reset token.

#### Scenario: Requesting password reset for existing user
- **WHEN** a client submits a valid email for an existing registered user to `POST /api/auth/forgot-password`
- **THEN** the system generates a secure single-use reset token valid for 1 hour, stores its hash, and responds with status 200 OK and a generic confirmation message

#### Scenario: Requesting password reset for non-existing email
- **WHEN** a client submits an email that does not match any registered user to `POST /api/auth/forgot-password`
- **THEN** the system responds with status 200 OK and the same generic confirmation message without generating a token, preventing email enumeration

#### Scenario: Requesting password reset with empty or invalid email
- **WHEN** a client submits a request to `POST /api/auth/forgot-password` with an empty or malformed email
- **THEN** the system responds with status 400 Bad Request and does not attempt token generation

### Requirement: Reset password with token
The system SHALL provide an endpoint at `POST /api/auth/reset-password` that accepts a reset token and a new password. The system SHALL validate that the token exists, has not expired, and has not already been used. Upon validation, the system SHALL hash the new password, update the user record, and invalidate the token so it cannot be reused.

#### Scenario: Successfully resetting password with valid token
- **WHEN** a client submits a valid, non-expired, and unused reset token along with a new password conforming to length requirements (minimum 6 characters) to `POST /api/auth/reset-password`
- **THEN** the system updates the user's password hash in the database, marks the token as used, and responds with status 200 OK and a success message

#### Scenario: Resetting password with invalid or non-existent token
- **WHEN** a client submits a non-existent or malformed token to `POST /api/auth/reset-password`
- **THEN** the system responds with status 400 Bad Request indicating the reset token is invalid or expired

#### Scenario: Resetting password with expired token
- **WHEN** a client submits an expired reset token to `POST /api/auth/reset-password`
- **THEN** the system responds with status 400 Bad Request indicating the token has expired and does not update the password

#### Scenario: Attempting to reuse an already consumed token
- **WHEN** a client submits a reset token that has already been used in a previous reset operation
- **THEN** the system responds with status 400 Bad Request and rejects the password update

#### Scenario: Submitting short new password
- **WHEN** a client submits a new password with fewer than 6 characters
- **THEN** the system responds with status 400 Bad Request and does not update the password
