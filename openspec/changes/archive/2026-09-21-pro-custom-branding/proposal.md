## Why

To support the white-label custom branding feature for personal trainers on Plano PRO, the backend must store and expose branding configuration (custom logo URL, primary accent color, and background color), enforce that only PRO trainers can update their branding, and provide an endpoint so both personal trainers and their assigned students can retrieve the active branding.

## What Changes

- Add custom branding fields to `User` in Prisma:
  - `brandLogoUrl`: String (optional).
  - `brandPrimaryColor`: String (optional, e.g. `#e6b94e`).
  - `brandBackgroundColor`: String (optional, e.g. `#0c0a08`).
- Update `GET /api/auth/profile` and add/extend branding endpoints:
  - Return `branding: { logoUrl, primaryColor, backgroundColor }` in profile responses.
  - Allow PRO personal trainers to update branding via `PATCH /api/auth/branding` or in profile update.
  - Deny branding customization with `403 Forbidden` if trainer is on Plano Básico.
  - Allow authenticated students to retrieve their assigned personal trainer's branding via `GET /api/auth/branding` (if the trainer is on Plano PRO).

## Capabilities

### Modified Capabilities
- `user-profile-api`: Extends profile data and adds branding configuration endpoints restricted to PRO personal trainers, plus student branding retrieval.

## Impact

- Prisma schema migration: Add `brandLogoUrl`, `brandPrimaryColor`, `brandBackgroundColor` to `User`.
- `AuthModule` / `UsersController`: Update profile and branding retrieval/update methods.
