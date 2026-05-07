---
name: nestjs-api-migration
description: Migrate API endpoints from legacy server frameworks (for example Next.js route handlers or Express handlers) to NestJS with contract parity, consumer cutover, and safe deprecation/removal of legacy APIs. Use for endpoint-by-endpoint migration planning and execution in TypeScript/NestJS projects.
---

# NestJS API Migration

Use this skill when moving APIs from legacy handlers to NestJS while preserving behavior.

## When to use

- Migrating endpoint groups from legacy route handlers to Nest controllers
- Building parity checks between legacy and new endpoints
- Updating client service callers to a new API base URL
- Planning compatibility windows, deprecation, and removal of old routes

## When not to use

- Pure frontend UI tasks with no API changes
- New greenfield APIs that do not depend on legacy route behavior
- Database schema design unrelated to API migration

## Inputs you need

- Source endpoint root (example: `<legacy-api-root>`)
- Legacy business/data-access layers (example: `<legacy-service-paths>`)
- Target Nest module root (example: `<nestjs-root>`)
- Consumer caller locations (example: `<client-service-paths>`)
- API base URL strategy and env key used by clients

## Workflow

1. Inventory + mapping
   - Build `source -> target -> consumers -> status` mapping.
   - Confirm method, auth mode, role scope, request/response/error contract.
2. Implement Nest endpoint parity
   - Port logic into Nest module/controller/service.
   - Keep behavior and status codes compatible unless explicitly approved.
3. Add validation and error mapping
   - DTO + validation pipe compatibility.
   - Preserve known domain errors and HTTP code semantics.
4. Consumer cutover
   - Update client service callers to the new API base URL/env key.
   - Keep client architecture layering unchanged.
5. Compatibility and deprecation
   - During transition, keep a compatibility layer or forwarding policy.
   - Remove old web endpoints only after all callers are migrated.
6. Regression checks
   - Compare old/new payloads for representative use cases.
   - Validate auth, RBAC, pagination, and edge-case errors.

## Required outputs

- Endpoint mapping artifact (by module + migration status)
- Changed Nest modules/controllers/services/DTOs
- Caller update list (all affected clients)
- Deprecated/removed endpoint list
- Regression summary with known gaps

## Language/framework rules

- Maintain architecture boundaries:
  - Client: `Component -> Hook -> Query -> Service -> API`
  - Server: `Controller -> Service -> Data access`
- Do not silently change business rules while migrating transport.

## Rule references

- `rules/01-endpoint-parity-checklist.md`
- `rules/02-auth-rbac-and-session-parity.md`
- `rules/03-consumer-cutover-clients.md`
- `rules/04-deprecation-and-removal-policy.md`
- `rules/05-regression-and-release-gate.md`
