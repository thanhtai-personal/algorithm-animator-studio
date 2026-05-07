# Rule: Load Authority Sources First

Before implementation decisions, load architecture authority docs in this exact order:

1. `.mcp.full.md`
2. `docs/architecture/000_architecture_index.md`
3. Referenced docs from the architecture index
4. `docs/architecture/010_optimized_target_architecture.md`
5. `docs/architecture/011_task_architecture_compliance_standard.md`

If a conflict is found, `.mcp.full.md` is the final authority.

Do not rely on stale or copied summaries when these docs are available.
