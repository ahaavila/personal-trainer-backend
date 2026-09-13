# exercise-media-upload-api Specification

## Purpose

Provides backend endpoints for issuing Cloudflare R2 signed upload URLs, validating media types and file sizes, confirming attached storage keys, and ensuring media upload permissions are restricted to the exercise's personal owner.

## Requirements

### Requirement: Signed upload URL issuance for exercise media
The system SHALL provide an authenticated endpoint for a personal to request a short-lived Cloudflare R2 signed upload URL for an exercise's photo or video.

#### Scenario: Issuing signed URL for valid photo
- **WHEN** an authenticated personal requests a signed upload URL for an exercise they own with a valid photo type (JPEG, PNG, WebP) and size <= 10 MB while `R2_ENABLED=true`
- **THEN** the API returns a short-lived PUT upload URL and target object key without exposing bucket secret keys

#### Scenario: Issuing signed URL for valid video
- **WHEN** an authenticated personal requests a signed upload URL for an exercise they own with a valid video type (MP4, WebM) and size <= 100 MB while `R2_ENABLED=true`
- **THEN** the API returns a short-lived PUT upload URL and target object key without exposing bucket secret keys

#### Scenario: Requesting upload when R2 is disabled
- **WHEN** a personal requests a signed upload URL while `R2_ENABLED=false`
- **THEN** the API returns a structured 400 or 503 response indicating media upload is unavailable in this environment

### Requirement: Server-side validation of media parameters
The system SHALL validate content type and content length before issuing a signed upload URL, rejecting invalid parameters without generating a URL.

#### Scenario: Invalid media content type
- **WHEN** a request specifies an unsupported media content type (e.g. application/pdf)
- **THEN** the API responds with 400 Bad Request and issues no signed upload URL

#### Scenario: Media file size exceeds threshold
- **WHEN** a request specifies a size greater than 10 MB for photo or 100 MB for video
- **THEN** the API responds with 400 Bad Request and issues no signed upload URL

### Requirement: Confirming uploaded media attachments
The system SHALL provide an endpoint to confirm an uploaded R2 media key and link it to the target exercise record.

#### Scenario: Confirming attachment for owned exercise
- **WHEN** the owner of an exercise submits a valid uploaded object key for that exercise
- **THEN** the API updates the exercise record with the stored media reference and returns the updated exercise representation

#### Scenario: Attempting confirmation on exercise owned by another personal
- **WHEN** a personal attempts to confirm a media attachment on an exercise owned by a different user
- **THEN** the API responds with 404 Not Found and makes no database changes

### Requirement: Private access and credential isolation
The system SHALL ensure that signed URLs and media metadata requests enforce exercise ownership and never return Cloudflare secret credentials or administrative tokens to the client.

#### Scenario: Requesting signed URL for non-existent or unowned exercise
- **WHEN** an authenticated user requests a signed upload URL for an exercise ID that does not exist or belongs to another personal
- **THEN** the API responds with 404 Not Found