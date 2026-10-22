# Security policy

## Supported versions

This repository is **Public**, but there is **no official supported release** yet. Development source is experimental. Historical signing-config review is ongoing; see [the response record](docs/oss/PUBLIC_HISTORY_RESPONSE_20261022.md). Do not deploy it as an exposed service.

Once releases exist, this table must be updated with the supported version range and security update policy.

## Reporting a vulnerability

**Do not post working exploits, access tokens, private URLs, model/audio samples or credential data in a public issue.**

If GitHub's **Private Vulnerability Reporting** is enabled, open the repository's **Security → Report a vulnerability** flow. Otherwise contact the maintainer using the non-public contact mechanism on the [GitHub repository owner profile](https://github.com/thanhtai-personal) to coordinate a confidential report. There is **no dedicated project security mailbox advertised at present**; do not assume an address.

Include impact, affected commit/version, reproducible steps, a proof of concept stripped of secrets, and a suggested remediation. Do not probe any deployment you do not own or have permission to test.

The maintainer will triage reports and coordinate a fix/disclosure when a supported version exists; **no response or resolution SLA is currently promised**.

## In-scope areas

Consider local API exposure, provider API keys, unsafe file/path handling, command execution via FFmpeg/Python/TTS startup, Electron privilege boundaries, arbitrary media uploads and downloads, third-party model supply chains and OAuth/legacy credential residue in Git history.

Secrets discovered in Git history need **rotation** even if a later commit removes the file. Removing current files is not history sanitization.

For routine non-sensitive bugs, use an ordinary GitHub issue; never publish suspected secrets or exploit payloads.
