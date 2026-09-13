## Why

The backend currently supports private exercise creation and exposes R2 status configuration, but it lacks the dedicated endpoints to issue Cloudflare R2 signed upload URLs, validate upload parameters server-side, and persist uploaded media metadata onto the exercise record. To enable real photo/video attachments without running binary uploads through NestJS, the backend needs a dedicated signed-upload API layer.

## What Changes

- Add backend endpoints to issue Cloudflare R2 signed upload URLs for photo (JPEG/PNG/WebP, max 10 MB) and video (MP4/WebM, max 100 MB) execution media.
- Add attachment confirmation endpoint/logic to associate uploaded R2 object keys with the exercise record.
- Enforce strict server-side validation and ownership checks: only the exercise creator can request signed upload URLs or confirm attachments for an exercise.
- Handle `R2_ENABLED=false` gracefully by returning a structured media-unavailable response instead of failing exercise creation or throwing configuration errors.
- Ensure no bucket credentials, secrets, or administrative parameters are exposed in API responses.

## Capabilities

### New Capabilities
- `exercise-media-upload-api`: Endpoints for issuing scoped Cloudflare R2 signed upload URLs, validating media constraints, confirming attachment metadata, and protecting private exercise media.

### Modified Capabilities
- None

## Impact

- NestJS API: new controller/service logic for R2 signed URL generation using `@aws-sdk/s3-request-presigner` / `@aws-sdk/client-s3` (S3-compatible R2 API).
- Prisma: `Exercicio` model updated to store optional photo/video storage keys or URLs.
- Auth/Security: credentialed session check + exercise ownership check for all media endpoints. Private mismatch returns 404.
- Environment: uses `R2_ENABLED`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`.
