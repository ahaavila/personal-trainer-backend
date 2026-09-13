## 1. Storage Service & Configuration

- [x] 1.1 Add `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` dependencies and configure `R2StorageService` in NestJS with environment variables (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENABLED`).
- [x] 1.2 Update `Exercicio` Prisma schema with optional photo and video storage key fields if not already present, running Prisma migration if needed.

## 2. API Endpoints & Authorization

- [x] 2.1 Add signed upload URL issuance endpoint (`POST /api/exercicios/:id/upload-url`) verifying session credentials, exercise ownership, content type, and file size limits (photo <= 10MB, video <= 100MB).
- [x] 2.2 Add upload confirmation endpoint (`POST /api/exercicios/:id/confirm-upload`) to persist storage references on the exercise record.
- [x] 2.3 Return 404 for unowned exercises or missing exercises, and return structured error when `R2_ENABLED=false`.

## 3. Verification

- [x] 3.1 Unit/integration tests for signed URL issuance, file size/type rejection, and ownership checks.
- [x] 3.2 Verify real backend server starts without errors and respects `R2_ENABLED` configuration.
