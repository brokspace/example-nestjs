# Authentication

The API uses short-lived **access tokens** (JWT, 15 minutes) and long-lived,
opaque **refresh tokens** (7 days).

## Flow

1. `POST /auth/login` with `{ email, password }` returns
   `{ accessToken, refreshToken, expiresIn }`.
2. Send `Authorization: Bearer <accessToken>` on every other request.
   `JwtAuthGuard` is registered globally; routes opt out with `@Public()`.
3. When the access token expires, `POST /auth/refresh` with
   `{ refreshToken }` returns a **new pair**. The old refresh token stops
   working immediately (rotation).
4. `POST /auth/logout` with `{ refreshToken }` ends the session.

## Refresh token rotation and reuse detection

Every login starts a token **family**. Each refresh revokes the presented
token and issues the next one in the same family
(`src/auth/refresh-token.store.ts`).

If a token that was already rotated is presented again, someone replayed it:
either an attacker who stole it, or a client bug. We cannot tell which, so
the whole family is revoked and the user has to log in again
(`AuthService.refresh` in `src/auth/auth.service.ts`).

Only a SHA-256 hash of each refresh token is stored.

## Roles

Users have the `admin` or `member` role, carried in the access token claims.
`@Roles('admin')` restricts a route; `RolesGuard` runs after `JwtAuthGuard`.
In the tasks module, members see their own tasks and admins see everyone's.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `JWT_ACCESS_SECRET` | a development value | Signing key for access tokens. **Set it** outside development. |
| `JWT_ACCESS_TTL_SECONDS` | `900` | Access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | `7` | Refresh token lifetime |
| `PORT` | `3000` | HTTP port |
