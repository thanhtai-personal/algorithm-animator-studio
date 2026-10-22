# Git refs / historical tree audit — 22 October 2026

**Execution:** GitHub private repository APIs, filename/tree metadata only. No credential contents were opened. This is NOT a complete secret-content audit or an examination of every historical commit object.

## Coverage actually examined

- GitHub `git/refs`: **59 refs**, including **28 branch refs** and **31 pull request refs**. No tag refs appeared in this API response.
- These refs yielded **37 distinct commit tip SHAs**. Each tip was inspected with recursive Git tree metadata, and **none** of those tree responses was marked truncated.
- Current OSS audit branch tip contains **none** of the old sprite/audio/demo media identified for removal, none of the searched model-weight extensions and none of the searched suspect credential-file paths.
- Several old tip trees contain as many as **43** legacy media paths and **14** model-weight/voice-checkpoint paths (classification by extension/path alone). They remain reachable through historical refs even though newer branches delete them.
- Two very early PR tips (`refs/pull/1/head`, `refs/pull/2/head`) contain two `credentials.json` paths and two `.npmrc` paths under a bundled clothing-rental template. **These are unverified potential-sensitive paths, not confirmed exposed secrets.** Do not paste their contents into a PR, issue, log or public report.

## Historical paths requiring private review

The two early PR tips contain:
- `templates/clothe-rental-management-main/apps/mobile/credentials.json`
- `templates/clothe-rental-management-main/templates/my-money-cloud-main/Native-cli-remake/credentials.json`
- `templates/clothe-rental-management-main/apps/web/.npmrc`
- `templates/clothe-rental-management-main/templates/my-money-cloud-main/Next-cli/.npmrc`

Both `credentials.json` files are 277 bytes each according to GitHub tree metadata. This may be harmless build metadata or live credentials; classification requires an authorized review of the actual contents **without disclosure here**. If any value is live, rotate/revoke it before publishing anything. Do not assume that deleting Git refs makes previously disclosed keys safe.

## Full-history scanner provided but **not executed**

The API inspection covered *ref tips* only. It cannot attest to every intervening commit, unreachable object, GitHub Actions artifact, release asset, caches or private collaborator copies. The repository now includes `scripts/audit-oss-history.mjs` which can enumerate paths in all reachable objects of an authorized **complete clone** and call Gitleaks for a private content scan.

```bash
git clone <YOUR-AUTHORIZED-PRIVATE-REPO-URL> algorithm-animator-history-audit
cd algorithm-animator-history-audit
git fetch --all --tags
# Fetch PR HEAD refs into LOCAL audit refs; does not modify GitHub:
git fetch origin '+refs/pull/*/head:refs/audit/pull/*'
git rev-parse --is-shallow-repository  # must print false
npm run audit:oss:history
```

Detailed reports, including any scanner match values, are stored under the locally ignored `artifacts/oss-history-audit/`; never commit or share those reports. The script reports aggregated counts on stdout and intentionally exits nonzero until risk categories/scan status are reviewed. Gitleaks must be installed separately from its official release source; absence of Gitleaks is not a passing result.

**Next gate:** perform the real complete-clone scan, examine historical rights/provenance (not only sensitive strings), review old PR/release/workflow artifacts, rotate any genuine exposed secrets, and get explicit owner approval for a **fresh public repository with a vetted initial snapshot**. Rewriting/removing refs is destructive and was not performed.
