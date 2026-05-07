# Consumer Cutover (Clients)

- Use an environment-driven API base URL strategy for all clients.
- Do not call server endpoints directly from UI components.
- Update service-layer callers only (query/service boundary stays intact).
- Cut over every known caller app before removing legacy routes.
- Validate auth/session headers and error handling after cutover.
