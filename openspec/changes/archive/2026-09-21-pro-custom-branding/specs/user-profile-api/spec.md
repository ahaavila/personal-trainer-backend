## ADDED Requirements

### Requirement: Personal trainer custom branding configuration
The system SHALL provide an authenticated endpoint `PATCH /api/auth/branding` allowing personal trainers on Plano PRO to configure their custom brand logo URL, primary accent color, and dark background color. The system SHALL reject branding updates from trainers on Plano Básico with a 403 Forbidden status.

#### Scenario: PRO trainer updates custom branding
- **WHEN** an authenticated personal trainer on Plano PRO submits custom branding attributes (`brandLogoUrl`, `brandPrimaryColor`, `brandBackgroundColor`)
- **THEN** the API persists the branding values and returns the updated branding configuration

#### Scenario: Basic plan trainer attempts branding update
- **WHEN** an authenticated personal trainer on Plano Básico attempts to update branding attributes
- **THEN** the API rejects the request with HTTP 403 Forbidden indicating custom branding is a PRO-only feature

### Requirement: Retrieve active branding for personal trainers and students
The system SHALL provide an authenticated endpoint `GET /api/auth/branding` returning the active branding configuration. For personal trainers, it returns their own branding. For students, it returns their assigned personal trainer's branding if that trainer is subscribed to Plano PRO, or defaults if the trainer is on Plano Básico.

#### Scenario: PRO trainer retrieves own branding
- **WHEN** an authenticated personal trainer calls `GET /api/auth/branding`
- **THEN** the API returns their configured custom branding settings

#### Scenario: Student retrieves assigned PRO trainer branding
- **WHEN** an authenticated student whose personal trainer is on Plano PRO calls `GET /api/auth/branding`
- **THEN** the API returns the personal trainer's custom brand logo and colors

#### Scenario: Student whose trainer is on Plano Básico
- **WHEN** an authenticated student whose personal trainer is on Plano Básico calls `GET /api/auth/branding`
- **THEN** the API returns null or empty branding indicating default platform branding should be used
