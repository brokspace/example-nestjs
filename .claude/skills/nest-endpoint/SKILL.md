---
name: nest-endpoint
description: "Add or change an HTTP endpoint in this NestJS API the way the project does it: DTO with class-validator, service rule, thin controller, unit and e2e test. Use when the user asks for a new route, a new field on a resource, or a change to request validation."
---

# Nest endpoint

Adds an endpoint (or a field) that looks like the rest of this API.

## Steps

1. Find the closest existing endpoint: `brok search "<resource> controller"`
   and read its controller, service and DTOs (`src/<module>/`).
2. Request shape: a DTO class in `src/<module>/dto/` with class-validator
   decorators on every field (`@IsOptional()` for optional ones). Unknown
   fields are rejected globally, so every accepted field must be declared.
   A new field usually needs both the create and the update DTO.
3. Rules go in the service, not the controller: ownership checks
   (`canAccess`), allowed state changes (`STATUS_TRANSITIONS`), defaults.
   Throw Nest exceptions (`NotFoundException`, `ForbiddenException`,
   `BadRequestException`) with a short lowercase message.
4. The controller only maps HTTP to the service: `@CurrentUser()` for the
   caller, `ParseUUIDPipe` for ids, `@HttpCode` for 204s. Routes need a
   token unless marked `@Public()`; restrict with `@Roles('admin')`.
5. Types used in decorated signatures are imported with `import type`.
6. Tests: a unit test on the service rule (`*.service.spec.ts`) and one e2e
   case in `test/app.e2e-spec.ts`. Run `pnpm test`, `pnpm test:e2e`,
   `pnpm lint` and `pnpm build`.

## Rules

- No new dependencies without asking.
- Keep responses as the entity itself; never return `passwordHash`
  (use `toPublicUser`).
