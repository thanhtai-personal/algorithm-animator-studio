# Rule: Layer Boundary and Ownership Checklist

Run this checklist for every touched module:

- [ ] Client flow remains `Component -> Hook -> Query -> Service -> API`.
- [ ] Component layer does not call service/data-access/network directly.
- [ ] Query/mutation owns remote request lifecycle.
- [ ] Service layer contains transport/integration details only.
- [ ] Server flow remains `Controller -> Application Service -> Data-access -> Supabase`.
- [ ] Controller does not hold business rules.
- [ ] Data-access is the only layer querying Supabase directly.
- [ ] No cross-layer reverse imports.
- [ ] No duplicate business logic across `apps/web` legacy API and `apps/server` target API.
- [ ] New business API endpoint is not introduced in web route layer when Nest ownership already exists.

If any item fails, fix boundary ownership before finalizing changes.
