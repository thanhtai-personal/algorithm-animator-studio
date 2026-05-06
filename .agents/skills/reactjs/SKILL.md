---
name: reactjs
description: Use this skill when modifying ReactJS or TypeScript frontend code in this Vite React app, including components, hooks, routing, Tailwind/shadcn UI, browser APIs, analytics, video export, build fixes, or frontend refactors.
---

# ReactJS Skill

## Repo Context

This app is a Vite React 18 TypeScript project using:

- `react-router-dom` for routing.
- Tailwind CSS and shadcn/Radix UI components under `src/components/ui`.
- `lucide-react` for icons.
- `sonner` for toast notifications.
- Canvas and `MediaRecorder` for video export.

## Workflow

1. Read the existing component/hook before editing.
2. Keep changes scoped to the requested behavior.
3. Prefer local patterns over new abstractions.
4. Split UI, hooks, and constants into separate files when a file approaches 400 lines.
5. Run `npm run build` after implementation.

## File Size Rule

New or touched source files should stay at or below 400 lines. Treat this as an agent coding rule during implementation and review.

If a file must exceed 400 lines, document why no practical split exists. Prefer splitting by route shell, hook, panel/component, helper, or constants before allowing an exception.

## Component Guidance

- Keep route/page files as composition shells when possible.
- Put stateful page logic in hooks, such as `useSomething`.
- Put repeated or large UI regions in focused components.
- Avoid adding UI cards inside other UI cards.
- Use existing shadcn UI components and `lucide-react` icons.
- Use controlled form state consistently with the surrounding code.

## Export And Browser APIs

- Check browser support before using APIs such as `MediaRecorder`, canvas capture streams, `sendBeacon`, and format-specific MIME types.
- When adding export formats, choose MIME candidates explicitly and show a toast if unsupported.
- Do not fake file extensions if the recorded container is not actually supported by the browser.

## Validation

Use these commands:

```bash
npm run build
```

`npm run lint` may report pre-existing generated UI/config issues. Treat lint findings in untouched shadcn UI files as unrelated unless the current task specifically targets them.
