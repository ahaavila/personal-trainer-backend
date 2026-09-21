## Context

See `proposal.md` for goals and motivations.
Personal trainers on Plano PRO can configure custom white-label branding (logo URL, primary color, background color).
Their assigned students should receive this branding when accessing the application.

## Goals / Non-Goals

**Goals:**
- Add `brandLogoUrl`, `brandPrimaryColor`, `brandBackgroundColor` to `User` in Prisma.
- Provide `GET /api/auth/branding` accessible to both `personal` and `aluno`:
  - For `personal`: if `plan === 'pro'`, return their custom branding; otherwise return default.
  - For `aluno`: lookup their `personalId`; if the assigned personal has `plan === 'pro'`, return the trainer's branding; otherwise return default.
- Provide `PATCH /api/auth/branding` accessible only to `personal`:
  - Validate that `trainer.plan === 'pro'`, else throw `ForbiddenException('Personalização de marca é exclusiva do Plano PRO.')`.
  - Validate color strings (valid hex colors, e.g. `#RRGGBB`).
- Migration and tests for branding endpoint logic and role/plan authorization.

**Non-Goals:**
- Custom domains/CNAME mapping in this version.

## Decisions

1. **Storage directly in User**:
   - Storing `brandLogoUrl`, `brandPrimaryColor`, `brandBackgroundColor` directly on `User` simplifies queries, avoids joining extra tables on session loads, and keeps data localized to the personal trainer.

2. **Student Resolution**:
   - An aluno has `user.personalId`. When an aluno requests `GET /api/auth/branding`, the backend fetches `personal.brandLogoUrl`, `personal.brandPrimaryColor`, `personal.brandBackgroundColor` only if `personal.plan === 'pro'`. If the trainer downgrades to `basic`, the student immediately falls back to default styling.

## Risks / Trade-offs

- [Risk] Malformed hex colors saved to database breaking frontend styles.  
  → Mitigation: Validate hex color format with regex (`^#(?:[0-9a-fA-F]{3}){1,2}$`) in DTO.
