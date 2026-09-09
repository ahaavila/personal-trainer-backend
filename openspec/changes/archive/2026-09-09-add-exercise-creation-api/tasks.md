## 1. Exercise Schema & Creation

- [x] 1.1 Add optional equipment and ExerciseMedia metadata model with photo/video kind, object key, MIME type, byte size, and uniqueness per exercise/kind; validate Prisma schema
- [x] 1.2 Generate/apply migration and update seed safely; verify repeatable seed/migration status
- [x] 1.3 Add validated `POST /api/exercicios` with session/role guard and server-derived owner; verify only safe exercise fields return
- [x] 1.4 Verify invalid input, aluno call, and cross-personal creation/access attempts return correct validation/403/404 behavior

## 2. R2 Media Upload Architecture

- [x] 2.1 Add S3-compatible R2 client/config gated by `R2_ENABLED=false` default; document all placeholder env variables in `.env.example`
- [x] 2.2 Implement owner-scoped signed upload authorization with MIME/size checks and private generated object keys; verify disabled mode returns media unavailable
- [x] 2.3 Implement post-upload confirmation that persists ExerciseMedia metadata only for an owned exercise; verify max one photo and video per exercise
- [x] 2.4 Verify a different personal cannot obtain signed upload/access/metadata for another personal's exercise and receives 404

## 3. Tests & Documentation

- [x] 3.1 Add tests for creation, validation, ownership, media-disabled behavior, signed URL validation, confirmation, and privacy isolation
- [x] 3.2 Document R2 setup/free-tier test flow, required env vars, limits, endpoint sequence, and local media-disabled workflow in README
- [x] 3.3 Run build, lint, tests, Prisma validation/migration status, seed and R2-disabled checks; verify all pass
