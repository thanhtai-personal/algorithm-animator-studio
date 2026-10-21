# Repository Agent Instructions

## ReactJS Skill

When working on React, TypeScript, Vite, UI components, hooks, routing, frontend build issues, or export/video behavior in this repository, use the local ReactJS skill:

` .agents/skills/reactjs/SKILL.md`

## Project Guardrails

- Keep new or touched source files at 400 lines or less unless there is no practical split.
- Run `npm run build` before finishing implementation work.
- This line-count rule is an agent coding rule, not a build-time script.
- Existing lint failures in generated UI files may be unrelated; do not refactor broad shadcn UI code just to satisfy unrelated lint warnings.
- Prefer existing stack and patterns: React 18, Vite, TypeScript, Tailwind, shadcn/Radix UI, lucide-react, sonner.
- If the user asks for or approves a decision that appears technically suboptimal, do not implement it immediately. First ask for confirmation, explain why it is suboptimal, and present the recommended alternative with the concrete tradeoffs.

## AI Context Index

- Before repository-wide exploration, read `docs/ai-context/README.md` and run `python3 scripts/context_index.py query "<task description>"`.
- Load the returned primary files first; use its test, documentation, and expansion globs selectively.
- Treat source code, tests, and types as authoritative when the curated index disagrees.
- Run `python3 scripts/context_index.py check` after changing indexed entrypoints or domain boundaries.
- Generated `.understand-anything/` snapshots are intentionally not tracked in the OSS branch. Only use a locally rebuilt graph if its `meta.json` matches the current source; refresh graph artifacts together and never fake freshness.
