## MODIFIED Requirements

### Requirement: Personal can retrieve own exercises
The system SHALL provide an authenticated personal-only exercise listing endpoint that returns only exercises created by the requesting personal.

#### Scenario: Personal requests exercises
- **WHEN** an authenticated personal requests the exercise listing
- **THEN** the API responds with only that personal's exercises, each including muscle group, name, description, default sets, default repetitions, and level

#### Scenario: Personal has no exercises
- **WHEN** an authenticated personal has no exercises
- **THEN** the API responds successfully with an empty list

#### Scenario: Newly created exercise appears in owner library
- **WHEN** a personal creates an exercise and requests the listing
- **THEN** the API includes the new exercise only in that personal's library
