## Context

The existing private exercise library has `GET /api/exercicios` scoped by `createdByPersonalId`; Exercicio already has default description/sets/reps/level but no equipment, media relationship, creation endpoint, or object storage integration. The API already has session authentication and role guards.

## Goals / Non-Goals

**Goals:**
- Add personal-only exercise creation with server-derived ownership.
- Store optional equipment and media metadata in PostgreSQL.
- Use Cloudflare R2's S3-compatible API for browser-direct media uploads, enabled only with explicit environment configuration.
- Maintain strict resource privacy before every exercise/media action.

**Non-Goals:**
- No public bucket, public object URLs, media streaming/transcoding, thumbnails, deletion/editing, or media upload when R2 is disabled.
- No binary transfer through NestJS and no `createdByPersonalId` accepted from clients.

## Decisions

- **R2 SDK**: use the AWS SDK S3 client pointed at the configured Cloudflare R2 endpoint. Environment variables: `R2_ENABLED`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and optional `R2_PUBLIC_BASE_URL` only if a private CDN/signed delivery strategy is later selected.
- **Private object keys**: generate keys such as `exercises/<owner-id>/<exercise-id>/<uuid>-photo` or `...-video`, so objects remain partitioned operationally. Keys are never accepted from the client.
- **Two-phase attachment**: create a database exercise first; authorize a file only after fetching the exercise with both id and `createdByPersonalId`; upload direct to R2 with a short expiry; confirm upload through the API which persists metadata. A future cleanup job can remove unconfirmed objects.
- **Media model**: create an `ExerciseMedia` relation with kind (`photo`/`video`), object key, MIME type, bytes, and timestamps. Enforce at most one of each kind per exercise initially.
- **Disabled configuration**: `R2_ENABLED=false` is default. Capability endpoint/creation response exposes media availability, and signed-upload/confirm requests return a clear unavailable response when disabled.
- **Validation**: backend validates declared MIME/size before signing and confirms exact stored metadata. R2 signed PUT restricts content type; browser pre-validation remains UX only.
- **Privacy errors**: for any exercise/media identifier not owned by session personal, return 404 to avoid revealing existence; unauthenticated remains 401, aluno remains 403.

## Risks / Trade-offs

- [Risk] direct upload can leave an orphaned object after a failed confirmation → Mitigation: namespace keys by exercise and implement cleanup as a follow-up operational task before production volume grows.
- [Risk] browser playback of original videos can be bandwidth-heavy → Mitigation: limits keep MVP videos short/small; add Cloudflare Stream/transcoding only if real use demands it.
- [Risk] R2 credentials are sensitive → Mitigation: environment-only config, `.env.example` placeholders, least-privilege bucket token, no frontend secrets.
