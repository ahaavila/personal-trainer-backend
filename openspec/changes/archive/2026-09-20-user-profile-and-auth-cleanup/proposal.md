## Why

Authenticated users (both personal trainers and students) need to be able to retrieve and update their personal profile data (such as their full name and student fitness parameters) as well as change their account password directly from within their authenticated session.

## What Changes

- Add endpoint `GET /api/auth/profile` to return current authenticated user profile details (id, name, email, role, objective, level, status).
- Add endpoint `PATCH /api/auth/profile` allowing users to update their name, and allowing students to update their objective and level.
- Add endpoint `POST /api/auth/change-password` requiring current password verification, validating new password criteria (min 6 characters), hashing the new password, and updating the user record.
- Add unit and integration tests covering profile retrieval, update, password change, and wrong current password rejection.

## Capabilities

### New Capabilities
- `user-profile-api`: Exposes authenticated endpoints to query user profile details, update editable fields, and change account password.

### Modified Capabilities
<!-- None; existing auth login, session, and recovery endpoints remain unchanged -->

## Impact

- **Controllers & Services**: Extends `AuthController` and `AuthService` (or introduces `ProfileController`/`ProfileService`).
- **DTOs**: Adds `UpdateProfileDto` and `ChangePasswordDto` with class-validator validation rules.
- **Tests**: Adds unit and e2e test cases.
