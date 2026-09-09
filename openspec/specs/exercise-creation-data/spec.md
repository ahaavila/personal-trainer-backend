# exercise-creation-data Specification

## Purpose

Provides secure personal-only creation of private exercises and optional R2-backed execution media uploads without exposing binary upload traffic through the API server.

## Requirements

### Requirement: Personal can create a private exercise
The system SHALL provide an authenticated personal-only endpoint that creates an exercise with name, muscle group, optional equipment, level, description, default sets, and default repetitions, assigning its owner from the authenticated session.

#### Scenario: Successful creation
- **WHEN** an authenticated personal submits valid exercise details
- **THEN** the API creates an exercise owned by that personal and returns a safe exercise representation

#### Scenario: Aluno attempts exercise creation
- **WHEN** an authenticated aluno calls the creation endpoint
- **THEN** the API responds with a forbidden status and creates no exercise

### Requirement: Exercise input is validated
The system SHALL reject missing or invalid required fields without creating an exercise.

#### Scenario: Invalid creation data
- **WHEN** a creation request has missing/invalid name, muscle group, level, description, default sets, or default repetitions
- **THEN** the API responds with a validation error and creates no exercise

### Requirement: Optional direct media upload is controlled
The system SHALL issue short-lived upload authorization only when R2 media storage is enabled and the requesting personal owns the target exercise.

#### Scenario: Authorized media upload request
- **WHEN** an exercise owner requests upload authorization for a supported photo/video within the allowed size
- **THEN** the API returns short-lived direct-upload authorization and records media metadata only after the upload is confirmed

#### Scenario: Media unavailable
- **WHEN** R2 storage is disabled
- **THEN** the API reports media upload unavailable and still permits exercise creation without media

### Requirement: Exercise media remains private
The system SHALL not reveal another personal's exercise or media metadata, issue upload authorization for it, or return access to its media.

#### Scenario: Different personal targets exercise media
- **WHEN** an authenticated personal requests media upload/access for an exercise owned by another personal
- **THEN** the API responds as though the private exercise does not exist