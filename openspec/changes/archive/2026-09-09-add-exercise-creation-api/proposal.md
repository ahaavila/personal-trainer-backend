## Why

The API exposes a private exercise library but cannot add new records or store the execution photo/video required by the MVP. A personal-only creation flow must persist exercise defaults, derive ownership from the session, and safely support optional direct media uploads without routing large files through NestJS.

## What Changes

- Add authenticated, personal-only `POST /api/exercicios` accepting name, muscle group, optional equipment, level, description, default sets, and default repetitions.
- Add exercise media metadata (object key, content type, size, kind) associated with an exercise, stored without binary media in PostgreSQL.
- Integrate Cloudflare R2 behind `R2_ENABLED`; when enabled, issue short-lived signed upload URLs only for an exercise owned by the requesting personal.
- Validate photo/video MIME type and size limits before issuing upload URLs and record metadata only after a successful confirmed upload.
- When R2 is disabled, create exercises without media and report media uploads as unavailable without breaking creation.
- Preserve strict privacy: ownership is derived from session, and another personal cannot list, read metadata for, upload to, or access media belonging to an exercise they do not own.

## Capabilities

### New Capabilities
- `exercise-creation-data`: Secure creation and optional media-upload API for private personal exercises.

### Modified Capabilities
- `exercise-library-data`: Newly created exercises are returned only to their creator through the private listing endpoint.
- `training-domain`: Exercise data gains optional equipment and media metadata relationship.

## Impact

- Backend: Prisma migration, exercicios controller/service/DTOs, R2 client/config, env example, tests, README.
- Dependencies: AWS S3-compatible SDK configured for Cloudflare R2.
- No external upload occurs until the operator enables R2 with credentials; local development can continue with `R2_ENABLED=false`.
