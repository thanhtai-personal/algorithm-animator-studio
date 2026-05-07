# Regression and Release Gate

- Compare old/new endpoint payloads on representative scenarios.
- Verify auth errors, permission errors, and invalid payload errors.
- Validate one full happy path per migrated module.
- Confirm all migrated caller apps work with the Nest endpoint.
- Document known gaps and rollback conditions before removal.
