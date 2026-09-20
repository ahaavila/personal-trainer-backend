## Purpose

Provides authenticated endpoints to view and update user profile details and change account passwords.

## ADDED Requirements

### Requirement: Get current user profile
The system SHALL provide an authenticated endpoint at `GET /api/auth/profile` that returns the authenticated user's ID, name, email, role, and student fitness attributes (objective, level, status) if applicable.

#### Scenario: Personal retrieves own profile
- **WHEN** an authenticated personal calls `GET /api/auth/profile`
- **THEN** the API returns 200 OK with their ID, name, email, and role

#### Scenario: Student retrieves own profile
- **WHEN** an authenticated student calls `GET /api/auth/profile`
- **THEN** the API returns 200 OK with their ID, name, email, role, objective, level, and status

### Requirement: Update user profile
The system SHALL provide an authenticated endpoint at `PATCH /api/auth/profile` allowing users to update their profile information. Personal trainers can update their name; students can update their name, objective, and level.

#### Scenario: Successfully updating name
- **WHEN** an authenticated user submits an updated name
- **THEN** the API updates the user in the database and returns the updated profile

#### Scenario: Student updates fitness attributes
- **WHEN** an authenticated student submits updated objective or level
- **THEN** the API updates the student attributes and returns the updated profile

#### Scenario: Rejecting invalid update input
- **WHEN** a user submits an empty name or invalid objective/level
- **THEN** the API rejects the request with a 400 Bad Request error

### Requirement: Change account password
The system SHALL provide an authenticated endpoint at `POST /api/auth/change-password` that accepts `currentPassword` and `newPassword`, verifies the current password hash, hashes the new password, and updates the user record.

#### Scenario: Successfully changing password
- **WHEN** an authenticated user submits their correct current password and a valid new password (at least 6 characters)
- **THEN** the API updates the user's password hash in the database and responds with 200 OK

#### Scenario: Incorrect current password
- **WHEN** an authenticated user submits an incorrect current password
- **THEN** the API rejects the request with a 400 Bad Request error indicating the current password is wrong

#### Scenario: Short new password
- **WHEN** an authenticated user submits a new password with fewer than 6 characters
- **THEN** the API rejects the request with a 400 Bad Request error
