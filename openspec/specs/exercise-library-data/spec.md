# exercise-library-data Specification

## Purpose

Provides a private, personal-scoped exercise library API with default prescription data for use in future training plans.

## Requirements

### Requirement: Personal can retrieve own exercises
The system SHALL provide an authenticated personal-only exercise listing endpoint that returns only exercises created by the requesting personal.

#### Scenario: Personal requests exercises
- **WHEN** an authenticated personal requests the exercise listing
- **THEN** the API responds with only that personal's exercises, each including muscle group, name, description, default sets, default repetitions, and level

#### Scenario: Personal has no exercises
- **WHEN** an authenticated personal has no exercises
- **THEN** the API responds successfully with an empty list

### Requirement: Exercise list supports filters
The endpoint SHALL accept optional name search, muscle-group, and level filters and apply all supplied filters to the requesting personal's exercises.

#### Scenario: Filtered request
- **WHEN** a personal requests the listing with supported filters
- **THEN** only that personal's matching exercises are returned

### Requirement: Library access is isolated
The system SHALL reject unauthenticated and aluno requests, and SHALL never return one personal's exercise to a different personal.

#### Scenario: Aluno requests library
- **WHEN** an authenticated aluno requests the exercise listing
- **THEN** the API responds with a forbidden status

#### Scenario: Another personal requests library
- **WHEN** an authenticated personal requests the exercise listing
- **THEN** the response excludes exercises created by every other personal