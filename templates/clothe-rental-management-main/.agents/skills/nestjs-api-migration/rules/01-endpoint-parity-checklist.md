# Endpoint Parity Checklist

- Match HTTP method and path semantics.
- Match auth requirements (anonymous/authenticated/service role).
- Match role/branch scope behavior.
- Match request payload validation behavior.
- Match response shape, including nullability and defaults.
- Match error code + status for known domain failures.
- Match pagination/filter/sort query semantics.
