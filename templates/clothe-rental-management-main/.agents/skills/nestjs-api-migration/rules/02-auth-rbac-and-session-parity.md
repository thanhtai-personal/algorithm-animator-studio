# Auth, RBAC, and Session Parity

- Keep token extraction behavior consistent across old/new APIs.
- Preserve role checks and branch access checks.
- Preserve session expiry and invalid-token handling.
- Do not broaden permissions during migration.
- For non-browser clients, preserve custom headers and auth fallback logic.
