# Public history exposure response — 22 October 2026

**Security state: OPEN / NOT CLEARED.** This repository was already Public when the 22 October verification took place. Changing the current source branch does **not** revoke historical access.

## Confirmed findings without disclosing credential values

- Two early pull-request tip trees still contain JSON Android signing configurations. Both files carry **nonempty keystore and key-password fields** that do not look like ordinary example placeholders. The two files have the same Git blob hash.
- No `.jks` or `.keystore` binary was found in the one inspected old PR tip tree. This reduces but does not eliminate the risk. We did **not** verify whether those values are live, shared elsewhere, or tied to a released Android application.
- Those old tips also have small npm configuration files; the specific versions inspected did not show an authentication-token field.
- Earlier ref-tip metadata also found legacy media, model weights and vendor code remaining available in history. No full-history Gitleaks/TruffleHog scan has passed.
- The repository's GitHub REST API does not expose the historical PR-ref removal/remote garbage collection controls required for a comprehensive fix. We did not force-push or delete refs.

## Immediate owner actions

1. **Treat Android signing credentials as potentially exposed.** Privately compare against any real Android/Expo/EAS builds without copying values into GitHub issues, PRs, or chats. If used, stop reuse, rotate associated credentials, and follow Google Play App Signing/Expo procedures for affected signing keys and uploads. A signing-password change alone may not revoke a leaked private keystore.
2. Review all API keys and old authentication config in a full local clone. Rotate/revoke any **verified live** key. Disable old deployments/integrations whose secrets cannot be trusted.
3. Inspect all old branches/tags/PR refs, not only `main`; old public clones/forks/caches may retain removed content.
4. Consider GitHub Support for sensitive-data removal from cached refs/PR data. History rewriting alone cannot recall data already downloaded. Prefer a **fresh repository built from a vetted source-only snapshot with a clean initial commit**, keeping the prior repository as an archive/private reference only after coordinating visibility and redirects.
5. Configure GitHub Security settings: secret scanning/push protection (where available), private vulnerability reporting, dependency alerts, branch protection and required CI checks.
6. Run `npm run audit:oss:history` and `npm run audit:oss:deps` in a complete authorized local clone. Audit reports must remain private; record only the reviewed signoff, tool versions and commit hash in release evidence.

## Current mitigation in the security hardening branch

- Remove the now-unneeded site verification token and unverified identity/placeholder image files from current HEAD.
- Ignore future signing metadata, passwords and keystore artifacts.
- Provide a reproducible source snapshot path without bundling Git history.
- Keep actual release tags/packages **blocked** until an owner-approved incident response, permission audit and runnable CI establish evidence.

**Status: not resolved merely by these source edits.** No claim of successful secret revocation, historical sanitization or licensing clearance is made.
