## MODIFIED Requirements

### Requirement: Exercise catalog is stored
The system SHALL store exercises, each with a name, a muscle group, description, default sets, default repetitions, level, and a reference to the personal who created it.

#### Scenario: An exercise exists
- **WHEN** an exercise has been created by a personal
- **THEN** the system can retrieve its name, muscle group, description, default sets, default repetitions, level, and creating personal from stored data
