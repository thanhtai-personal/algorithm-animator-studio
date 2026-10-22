# Third-party TTS model and voice-asset audit

Updated: 2026-10-22

Scope: the OSS preparation branch only. This is a conservative engineering/provenance triage, not legal advice or a final license clearance.

## Decision

- Keep the six TTS provider integrations and their API/UI code.
- Do not bundle downloaded speech-model weights or voice preset assets in the repository unless their exact redistribution rights are documented.
- A model catalog/download button is not proof that a model is safe to redistribute. Users must review the upstream model card before using a model in a project or redistributing it.
- Removing files from the current tree does not erase older Git commits. Do not make the repository public until a separately approved history-cleanup strategy addresses the previous copies.

## Piper voice models

| Model currently supported by the installer | Upstream model-card evidence | Current disposition |
|---|---|---|
| `en_US-ryan-medium` | Its model card identifies the RyanSpeech dataset under CC BY-NC-SA 4.0. See https://huggingface.co/rhasspy/piper-voices/blob/v1.0.0/en/en_US/ryan/medium/MODEL_CARD | Not bundled. Non-commercial/share-alike terms are not appropriate to treat as a generally redistributable OSS default. |
| `en_US-lessac-medium` | Its model card delegates to the Lessac Blizzard 2013 dataset license: https://huggingface.co/rhasspy/piper-voices/blob/v1.0.0/en/en_US/lessac/medium/MODEL_CARD and https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html. The dataset terms could not be independently confirmed during this pass. | Unknown; not bundled pending confirmation. |
| `en_US-libritts_r-medium` | Its model card lists LibriTTS-R under CC BY 4.0 but also says it is fine-tuned from the Lessac medium model: https://huggingface.co/rhasspy/piper-voices/blob/v1.0.0/en/en_US/libritts_r/medium/MODEL_CARD | Not bundled pending review of the complete model/derivation license chain and attribution. |
| `vi_VN-vais1000-medium` | Its model card lists the VAIS-1000 dataset under CC BY 4.0 and says it is fine-tuned from the Lessac medium model: https://huggingface.co/rhasspy/piper-voices/blob/v1.0.0/vi/vi_VN/vais1000/medium/MODEL_CARD | Not bundled pending review of the complete model/derivation license chain and attribution. |

The Piper voice repository itself displays MIT metadata, but the official Piper documentation instructs users to check each voice's own model card because individual voice licenses can differ: https://tderflinger.github.io/piper-docs/about/voices/. The repository-level license is not treated as overriding a voice's model-card terms.

### Piper implementation impact

- Removed the four `.onnx` files and four matching `.onnx.json` files from the current source tree.
- Kept `server/config/piperModels.ts`, the official version-pinned model URLs, the runtime status endpoint, the install endpoint and the UI. The user can explicitly download a selected model into their local `MODEL_DIR`.
- Added ignore rules so local downloads are not accidentally recommitted.
- No claim is made that the current one-click catalog itself supplies legal clearance; model-level attribution/warnings and a final model selection policy remain follow-up work.

## VieNeu-TTS

- The current branch no longer vendors `libs/VieNeu-TTS`; its 94 tracked source, sample, and preset files are removed from the current tree. The provider adapter/API remains, and users may clone the upstream project separately into `../VieNeu-TTS`.
- The previously vendored `voices.json` declared `CC BY-NC 4.0`; sample `.wav`, `.txt` and `.pt` assets were also present. Removing them from the current tree avoids bundling them by default, but does not erase their earlier Git history.
- The upstream model repository metadata at https://huggingface.co/pnnbao-ump/VieNeu-TTS does not override licenses attached to preset voices or sample recordings. Review upstream source, model, and voice-asset terms before use; commercial use and redistribution are not assumed to be permitted.

## Next actions

1. Preserve Piper provider code and installer; test status/install behavior in a clean checkout once runnable CI/local execution is available.
2. Keep VieNeu as an optional adapter to an external checkout; test setup with the checkout absent and present, and prevent preset/sample assets from being reintroduced into the app tree.
3. Review the Git history. The model weights and VieNeu sample assets existed in earlier commits, so current-tree deletion alone is insufficient for public publication.
4. Add final third-party notices only after the full license/provenance chain has been verified.