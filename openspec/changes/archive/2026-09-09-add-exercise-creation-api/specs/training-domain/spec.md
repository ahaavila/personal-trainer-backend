## MODIFIED Requirements

### Requirement: Exercise catalog is stored
The system SHALL store exercises, each with a name, a muscle group, optional equipment, description, default sets, default repetitions, level, a reference to the personal who created it, and optional execution media metadata.

#### Scenario: An exercise exists
- **WHEN** an exercise has been created by a personal
- **THEN** the system can retrieve its name, muscle group, optional equipment, description, default sets, default repetitions, level, creating personal, and optional media metadata from stored data
