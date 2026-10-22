# Git history and repository publication playbook

**Do not run any history rewrite automatically.** An audit and explicit owner decision are required first.

## Why HEAD cleanup is not enough

The draft PR removes many items from the latest tree: Piper ONNX weights, vendored VieNeu voice samples, story/news/social code, demo media and historical notes. An ordinary `git rm` commit **does not erase those objects from earlier commits, refs, pull requests or developer clones**. Once a repository is Public, someone may retrieve historical objects that remain reachable. Any committed real credential must be rotated regardless of sanitization.

## Pre-publication inventory

1. From a complete authorized clone, enumerate all branches, tags and commits: `git branch -a`, `git tag -l`, `git log --all --oneline`.
2. Inventory tracked files at every relevant historical ref; look for private recordings, personal notes, model weights, reference voices, third-party binary packs, `.env` files and documents containing credentials.
3. Scan history for secrets with a dedicated secret scanner (for example Gitleaks or TruffleHog) and manually validate plausible findings **without copying token values into a public issue**. Rotate exposed credentials through their providers.
4. Confirm actual ownership/licensing of retained source and clear unverified artwork/recordings as described in `ASSET_PROVENANCE.md`.
5. Review old PR refs, release assets, workflow artifacts, links, caches and collaborator clones separately. Deleting the default branch history is not a universal guarantee of remote object deletion.

## Publication strategies (owner decision)

| Option | Pros | Risks / action |
|---|---|---|
| **Fresh public repo with a clean initial commit** (preferred when old history contains sensitive or uncleared files) | Clean disclosure boundary; original project can remain a private backup | New URL/repo identity unless separately coordinated; GitHub stars/issues/PR continuity may not transfer; maintainer must approve and verify exported file set |
| Existing repository, new orphan history + careful refs cleanup | Preserve GitHub repo URL | Requires irreversible branch/tag/PR/ref operations, collaborator coordination and cannot guarantee caches/old public clones are purged; obtain owner approval first |
| Rewrite history in place (e.g. git-filter-repo) | Can preserve some commit relationships | High-risk force-push, backups/PR breakage and hidden refs; only with owner approval and external audit |

**Do not change visibility to Public on the existing repository just because the current branch no longer contains a file.** Do not force-push, delete refs or replace the GitHub repository without explicit owner signoff.

## Safe rehearsal (offline; no remote writes)

An authorized maintainer may prepare a **new empty destination** from a clean, reviewed snapshot. Inspect the snapshot before any publish:

```bash
# Use a fresh temporary directory, not the private repo working tree:
mkdir algorithm-animator-oss-candidate
# Copy only reviewed files from the candidate checkout into this directory.
# DO NOT copy .git, .env, runtime/model caches, binaries or unchecked media.
cd algorithm-animator-oss-candidate
git init
git add .
git status --short
git commit -m "Initial reviewed Algorithm Animator Studio OSS snapshot"
git log --all --oneline
```

This is a **procedure**; the repository has not yet been cloned, scanned or transformed in this session. Validate real builds, legal clearance and the resulting clean tree before pushing to a public destination. Do not include raw proprietary source in public release notes.

## Signoff record

Owner and copyright reviewer: **PENDING**  
Rights/provenance reviewer: **PENDING**  
Secrets audit date and tool/output location: **PENDING**  
Selected publication strategy: **PENDING**  
Approved release tree hash: **PENDING**  
Visibility/change approval: **PENDING**
