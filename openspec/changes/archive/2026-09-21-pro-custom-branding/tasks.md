## 1. Database Model & Migration

- [x] 1.1 Add `brandLogoUrl`, `brandPrimaryColor`, and `brandBackgroundColor` fields to the `User` model in `prisma/schema.prisma`
- [x] 1.2 Generate and apply Prisma migration and generate Prisma client

## 2. Branding API Implementation

- [x] 2.1 Create DTOs with hex color validation for branding updates
- [x] 2.2 Implement `GET /api/auth/branding` in `AuthService` and `AuthController` returning branding for PRO trainers and their assigned students
- [x] 2.3 Implement `PATCH /api/auth/branding` in `AuthService` and `AuthController` with PRO plan authorization check

## 3. Testing and Verification

- [x] 3.1 Write unit tests for branding endpoints and plan-gating checks
- [x] 3.2 Run `npm run build` and `npm test` to ensure zero regressions
