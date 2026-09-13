## Context

The frontend exercise creation form collects optional photo/video media and needs to upload directly to Cloudflare R2 using pre-signed S3 URLs. The NestJS backend handles session authentication, database persistence via Prisma, and S3-compatible R2 signing via AWS SDK v3 (`@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`).

## Goals / Non-Goals

**Goals:**
- Provide `POST /api/exercicios/:id/upload-url` (or dedicated endpoint) to validate file type/size and issue a signed PUT URL.
- Provide `POST /api/exercicios/:id/confirm-upload` to attach the object key to the `Exercicio` Prisma model.
- Keep R2 credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, etc.) strictly on the server side.
- Support `R2_ENABLED=false` gracefully.

**Non-Goals:**
- No server-side file proxying (binary file data does not flow through NestJS).
- No image processing, video transcoding, or automatic thumbnail creation.
- No public bucket policies; objects remain private or served via signed/scoped paths.

## Decisions

- **AWS SDK v3 S3 Client**: Cloudflare R2 provides a fully S3-compatible API. Using `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` is standard, robust, and lightweight.
- **Signed URL Flow**:
  1. `POST /api/exercicios` creates the exercise record (returns exercise ID).
  2. `POST /api/exercicios/:id/upload-url` validates requested contentType/contentLength and returns `{ uploadUrl, key }`.
  3. Client performs `PUT uploadUrl` with raw file bytes.
  4. `POST /api/exercicios/:id/confirm-upload` saves `photoKey` or `videoKey` to database.
- **Ownership Verification**: Before issuing a signed URL or updating media keys, NestJS checks `exercise.personalId === currentUser.id`. If not matching, returns 404.
- **Environment config**: R2 configuration is loaded into NestJS ConfigService. If `R2_ENABLED !== 'true'`, endpoints immediately return 503/400 Media Upload Unavailable.

## Risks / Trade-offs

- [Risk] Orphaned R2 objects if client uploads to signed URL but fails to call confirm-upload → Mitigation: key structure includes exercise ID and timestamp; object lifecycle rules can clean unattached keys if needed in the future.
- [Risk] Clock skew between server and R2 causing expired signatures → Mitigation: short-lived URLs (e.g. 15 minutes) generated with current UTC timestamps.

## Migration Plan

1. Install S3 client dependencies in NestJS if not present (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`).
2. Add `photoUrl` / `videoUrl` or `photoKey` / `videoKey` fields to `Exercicio` in `prisma/schema.prisma` if needed.
3. Implement `R2StorageService` and endpoints in `ExerciciosModule`.
4. Validate with unit/integration tests and verify against real R2 credentials or `R2_ENABLED=false`.

## Open Questions

- None. The architecture and endpoint contract are straightforward.
