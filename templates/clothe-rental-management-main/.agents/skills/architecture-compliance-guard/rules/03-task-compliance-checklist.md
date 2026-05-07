# Rule: Task Document Compliance (Architecture V2)

When touching `docs/tasks/**`, ensure task content follows:
- `docs/architecture/011_task_architecture_compliance_standard.md`

Mandatory task sections:

1. `Architecture Impact`
2. `Current State vs Target State`
3. `Boundary Rules`
4. `Compatibility & Migration Strategy` (if cutover exists)
5. `Done Criteria (Architecture)`
6. `Regression Scope`

Mandatory compliance checks:

- [ ] No new business endpoint in `apps/web/app/api` if domain is already on Nest.
- [ ] No cross-layer shortcut.
- [ ] No duplicate business rule across runtimes.
- [ ] Contract parity defined for migration tasks.
- [ ] Affected caller list and cutover status are documented.
