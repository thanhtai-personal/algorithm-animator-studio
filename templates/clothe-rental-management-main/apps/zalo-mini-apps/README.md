# Zalo Mini Apps Quality Gates

## Long-file guard

Each mini app has two long-file commands:

- `npm run lint:long-files`: fail when any `src` source file exceeds 500 lines.
- `npm run lint:long-files:warn`: report the same violations without failing.

During the compatibility window, `npm run lint` uses warning mode before ESLint so existing long files stay visible without blocking unrelated lint checks. New cleanup work should run the fail-mode command directly before closing a long-file refactor task.
