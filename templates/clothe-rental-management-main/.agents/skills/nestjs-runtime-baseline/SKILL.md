---
name: nestjs-runtime-baseline
description: Build or harden a NestJS runtime baseline including global prefix/versioning, validation, exception mapping, security middleware, healthcheck, and environment configuration. Use for bootstrap/hardening phases, not for routine endpoint business-logic migration.
---

# NestJS Runtime Baseline

Use this skill to establish a consistent and production-safe Nest runtime.

## When to use

- Setting up a NestJS service for real API traffic
- Standardizing request validation and error response format
- Adding platform defaults before migrating endpoint modules
- Hardening runtime behavior (CORS, security headers, logging, healthcheck)

## When not to use

- Endpoint-only changes with no runtime concerns
- Frontend refactors unrelated to server runtime

## Inputs you need

- Nest bootstrap file (typically `src/main.ts`)
- Existing module structure in `src/**`
- Environment variable policy (dev/staging/prod)
- Deployment topology (host/base URL/load balancer behavior)

## Workflow

1. Bootstrap defaults in `main.ts`
   - Global prefix and versioning strategy.
   - Validation pipe with strict/explicit options.
2. Error handling baseline
   - Global exception filter for stable JSON error envelope.
   - Keep domain error to HTTP status mapping explicit.
3. Security and transport defaults
   - CORS allowlist strategy per environment.
   - Reasonable security middleware defaults.
4. Config and env validation
   - Centralized config module.
   - Fail fast for missing required variables.
5. Operational endpoints
   - Healthcheck for deploy and uptime probes.
6. Verification
   - Build/lint checks.
   - One smoke call per baseline endpoint.

## Required outputs

- Runtime baseline changes list
- Env contract list (`required` / `optional`)
- Default error envelope examples
- Healthcheck verification result

## Rule references

- `rules/01-main-bootstrap-defaults.md`
- `rules/02-validation-and-exception-contract.md`
- `rules/03-cors-security-and-config.md`
- `rules/04-operational-readiness-checklist.md`
