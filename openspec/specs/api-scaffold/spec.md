# api-scaffold Specification

## Purpose

Provides the base NestJS API, including project structure, database connectivity via Prisma/PostgreSQL, Docker packaging, and a health-check endpoint that all future backend features build on.

## Requirements

### Requirement: API starts and runs via standard scripts
The system SHALL provide npm scripts to install, run in development mode with reload, build for production, and start the production build, using NestJS as the application framework.

#### Scenario: Starting the development server
- **WHEN** a developer runs the project's development script after installing dependencies
- **THEN** a local server starts and accepts HTTP requests, restarting automatically on source changes

#### Scenario: Producing a production build
- **WHEN** a developer runs the project's build script
- **THEN** a compiled production build is generated without errors, and the production start script serves it

### Requirement: Health check endpoint
The system SHALL expose a `GET /health` endpoint that reports the API is running, independent of database availability.

#### Scenario: Checking API liveness
- **WHEN** a client sends `GET /health`
- **THEN** the API responds with a `200` status and a body indicating the service is up

### Requirement: Database connectivity via Prisma
The system SHALL connect to a PostgreSQL database using Prisma, with a schema and migration mechanism that a developer can run to bring a fresh database up to date.

#### Scenario: Applying migrations to a fresh database
- **WHEN** a developer runs the project's migration command against an empty PostgreSQL database
- **THEN** the database schema is created to match the Prisma schema without errors

### Requirement: Containerized runtime
The system SHALL provide a Docker image definition that runs the production build, and a local development compose setup that provides a PostgreSQL instance for the API to connect to.

#### Scenario: Running the API in a container
- **WHEN** the Docker image is built and run with a valid database connection string
- **THEN** the containerized API responds successfully to `GET /health`

#### Scenario: Starting local dependencies for development
- **WHEN** a developer starts the local development compose setup
- **THEN** a PostgreSQL instance becomes available for the API to connect to using the documented local connection string