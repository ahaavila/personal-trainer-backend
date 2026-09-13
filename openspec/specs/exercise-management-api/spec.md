# exercise-management-api Specification

## Purpose

Provides secure, personal-only endpoints to view full exercise details, update prescription parameters or metadata, and delete private exercises.

## Requirements

### Requirement: Personal can retrieve single exercise details
The system SHALL provide an authenticated endpoint `GET /api/exercicios/:id` that returns the exercise details and attached media only if owned by the requesting personal.

#### Scenario: Successful exercise retrieval
- **WHEN** an authenticated personal requests an exercise they created
- **THEN** the API returns the full exercise representation including name, muscle group, equipment, level, description, default sets, default repetitions, and attached media

#### Scenario: Accessing an exercise owned by another personal
- **WHEN** an authenticated personal requests an exercise ID belonging to another user
- **THEN** the API responds with 404 Not Found

### Requirement: Personal can update an exercise
The system SHALL provide an authenticated endpoint `PUT /api/exercicios/:id` to modify exercise details and prescriptions.

#### Scenario: Successful exercise update
- **WHEN** the owning personal submits valid updated details for their exercise
- **THEN** the API updates the database record and returns the updated exercise representation

#### Scenario: Updating with invalid data
- **WHEN** an update request contains missing or invalid required fields
- **THEN** the API responds with 400 Bad Request and does not modify the record

#### Scenario: Attempting to update another personal's exercise
- **WHEN** a user attempts to update an exercise owned by someone else
- **THEN** the API responds with 404 Not Found

### Requirement: Personal can delete an exercise
The system SHALL provide an authenticated endpoint `DELETE /api/exercicios/:id` to permanently remove an exercise and its associated media metadata.

#### Scenario: Successful exercise deletion
- **WHEN** the owning personal sends a delete request for their exercise
- **THEN** the API deletes the exercise and related media records, returning success status

#### Scenario: Attempting to delete another personal's exercise
- **WHEN** a user attempts to delete an exercise owned by someone else
- **THEN** the API responds with 404 Not Found and makes no database changes