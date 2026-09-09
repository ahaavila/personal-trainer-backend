## Context

The existing alunos module already provides personal-scoped `GET /api/alunos`; User already contains nullable objective/level/status and personalId. Authentication supplies an authenticated request user and existing password helpers provide bcrypt hashing.

## Goals / Non-Goals

**Goals:**
- Add a personal-only `POST /api/alunos` alongside the existing list endpoint.
- Validate a small DTO and create a safe, correctly owned aluno record.
- Preserve correct error status semantics for validation, role authorization, and duplicate email.

**Non-Goals:**
- No schema migration, emails, invite links, status choice, editing, or password reset.

## Decisions

- **Server-derived ownership/role/status**: the DTO never accepts personalId, role, or status. Service always sets `personalId` from `request.user.id`, role `aluno`, and status `ativo`.
- **DTO validation**: validate trimmed non-empty name, email format, password minimum eight characters, and allowed Prisma objective/level enums. Use Nest validation behavior already established in the project or explicit service validation consistently.
- **Conflict mapping**: Prisma unique email constraint maps to 409 Conflict with a client-safe message.
- **Response shape**: return list-safe aluno fields (name, email, objective, level, status, latestWorkout null) rather than internal User fields.
- **Reuse guards/hash**: controller composes existing session/role guards; service uses `hashPassword` and never logs DTO password.

## Risks / Trade-offs

- [Risk] Temporary password handoff is an external/manual process → Mitigation: no password ever appears in API responses/logs; invitation flow is future work.
- [Risk] No rate limiting is included for this internal MVP endpoint → Mitigation: add a global/per-endpoint throttling change before public production exposure.
