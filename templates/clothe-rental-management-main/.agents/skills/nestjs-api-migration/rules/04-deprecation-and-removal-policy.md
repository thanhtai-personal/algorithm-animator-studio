# Deprecation and Removal Policy

- Keep compatibility layer during rollout window.
- Remove legacy APIs only after all known callers are migrated.
- Track removed endpoints in a migration log.
- If rollback is needed, retain a fast path to restore forwarding behavior.
