---
name: architecture-compliance-guard
description: Enforce implementation and task changes against the current architecture source-of-truth in .mcp.full.md and docs/architecture. Use for any code/task change that can affect layering, ownership boundaries, API placement, or migration behavior. This skill stays aligned by reading the architecture index and referenced docs at runtime instead of duplicating static rules.
---

# Architecture Compliance Guard

Use this skill to prevent architecture violations while coding, reviewing, and writing tasks.

## When to use

- Any code change in `apps/**`.
- Any task doc update in `docs/tasks/**`.
- Any API migration, refactor, or boundary/ownership change.
- Any change that may touch client-server contracts, layering, auth/RBAC boundaries, or migration paths.

## When not to use

- Purely cosmetic content updates with no technical impact.
- Non-technical documentation that does not affect architecture, implementation, or task planning.

## Required source-of-truth loading

Always load architecture docs in this order before deciding implementation:

1. `.mcp.full.md` (constitution; highest priority)
2. `docs/architecture/000_architecture_index.md` (entrypoint)
3. Architecture docs referenced by `000_architecture_index.md`
4. `docs/architecture/010_optimized_target_architecture.md`
5. `docs/architecture/011_task_architecture_compliance_standard.md`

If conflicts exist, `.mcp.full.md` wins.

## Workflow

1. Identify change scope
   - Map touched files to runtime/layer/domain (`apps/web`, `apps/server`, `apps/mobile`, `apps/zalo-mini-apps`, `docs/tasks`).
2. Load active architecture constraints
   - Read the authority docs listed above.
   - Do not rely on stale copied rules from memory.
3. Run boundary checks
   - Validate layering and ownership for each touched file.
   - Validate migration rules for web API vs Nest API responsibilities.
4. Apply compliant implementation
   - Prefer fixing root boundary issues over local workarounds.
   - Avoid introducing duplicate business logic across runtimes.
5. Validate task compliance (if task docs touched)
   - Ensure required sections/checklists from doc 011 are present.
6. Report compliance explicitly
   - Output pass/fail by rule group and list any known gaps.

## Required outputs

- Architecture compliance summary with:
  - Source docs loaded
  - Boundaries checked
  - Violations found/fixed
  - Remaining risk/gaps

## Rule references

- `rules/01-load-authority-sources.md`
- `rules/02-layer-boundary-and-ownership-checklist.md`
- `rules/03-task-compliance-checklist.md`
- `rules/04-review-output-template.md`
