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
