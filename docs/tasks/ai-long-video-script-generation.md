# AI Long Video Script Generation Task

## Goal

Bổ sung tính năng cho phép người dùng nhập AI API key trong Settings, sau đó ở màn Long Content có thể gọi AI để tạo kịch bản video cho nội dung bất kỳ. AI phải trả về dữ liệu có cấu trúc để app map trực tiếp vào timeline script editor, voice generation và video export flow hiện có.

Nguyên tắc quan trọng:

- App không tạo video ngay khi gọi AI.
- AI chỉ tạo kịch bản có cấu trúc.
- Người dùng có thể review và sửa kịch bản sau khi AI trả về.
- Voice được tạo từ text kịch bản sau khi user chọn voice/provider.
- Video chỉ được tạo khi user bấm export.

## Current App Context

Long Content hiện có pipeline:

- User chọn thuật toán/nội dung trong màn Long Content.
- App build danh sách `LongContentScene[]`.
- Mỗi scene có:
  - `id`
  - `kind`
  - `kindLabel`
  - `title`
  - `subtitle`
  - `bullets`
  - `narration`
  - `durationSec`
  - `animation`
- Preview render canvas bằng `renderLongContentFrame`.
- Voice-over dùng `narrationScript = scenes.map(scene => scene.narration).join("\n\n")`.
- Voice provider hiện có:
  - Browser TTS
  - Piper local
  - ElevenLabs
- Export dùng canvas + MediaRecorder, nhúng voice/music theo provider hiện tại.
- Script editor cho phép user sửa title/subtitle/bullets/narration trước khi tạo voice/export.

AI generation phải đi vào pipeline này bằng cách tạo hoặc thay thế `scenes`, không bypass export flow.

## Settings Requirements

Add AI config to Settings.

Fields:

- `AI_PROVIDER`
  - values: `openai`, `openrouter`, `custom`
  - default: empty or `openai`
- `AI_API_KEY`
  - password input
  - stored using existing local runtime settings pattern if this is local-only
  - should not be exposed in generated video/client logs
- `AI_MODEL`
  - text input or select
  - examples:
    - `gpt-4.1-mini`
    - `gpt-4.1`
    - custom provider model id
- `AI_BASE_URL`
  - only required for `custom` or OpenAI-compatible providers

Backend/server should own API calls when possible so API key is not sent to third-party APIs directly from browser code.

## Long Content UI Requirements

Add an AI script generation panel in Long Content.

Controls:

- Topic input:
  - Example: `Giải thích thuật toán Bubble Sort cho người mới`
  - Example: `Tạo video về Binary Search trong thực tế`
  - Example: `So sánh Bubble Sort và Insertion Sort`
- Audience input:
  - Example: `người mới học lập trình`
  - Example: `developer junior`
- Tone select:
  - `educational`
  - `practical`
  - `storytelling`
  - `short and direct`
- Target duration:
  - number in minutes
  - default: current long video duration or 8 minutes
- Language:
  - default to current system language
- Button:
  - `Tạo kịch bản bằng AI`
- State:
  - loading
  - error
  - success

After AI returns:

- Populate the script editor with AI scenes.
- Reset current playback to `0`.
- Invalidate existing generated voice because narration changed.
- Let user review/edit text.
- User then chooses voice and generates voice-over.
- User then previews and exports.

## System Prompt Requirements

When calling AI, app must automatically inject app context into the system/developer prompt. User should not need to know the internal schema.

Required context to include:

- This app creates algorithm/video education content as 16:9 long-form videos.
- The app renders timeline scenes on a canvas.
- The app can create voice-over from scene narration using Browser TTS, Piper, or ElevenLabs.
- The app lets users edit script text before voice generation and export.
- The app needs structured JSON only, no Markdown prose outside JSON.
- The AI must return scene data that can be mapped into `LongContentScene[]`.
- Each scene should be concise enough to fit on video panels.
- `narration` should be natural spoken text, not bullet fragments.
- `bullets` should be short visual panel bullets.
- `durationSec` should be realistic for the amount of narration.
- If the topic is an algorithm, include:
  - mental model
  - step-by-step explanation
  - example data
  - complexity
  - best/average/worst cases where relevant
  - when to use
  - when not to use
  - recap

## User Prompt Requirements

The user prompt should include:

- Topic
- Audience
- Tone
- Target duration
- Language
- Selected algorithm if any
- Current app capabilities:
  - animation scene can be marked with `animation: true`
  - non-animation scenes show title/subtitle/bullets and narration
- Any current user edits if regenerating from existing script

## AI Response Schema

AI must return JSON matching this shape:

```json
{
  "version": 1,
  "title": "string",
  "description": "string",
  "language": "vi",
  "targetDurationSec": 480,
  "scenes": [
    {
      "id": "stable-kebab-case",
      "kind": "intro",
      "title": "string",
      "subtitle": "string",
      "bullets": ["string"],
      "narration": "string",
      "durationSec": 20,
      "animation": false,
      "visualNotes": "string",
      "dataSet": [5, 1, 4, 2, 8],
      "complexity": {
        "best": "O(n)",
        "average": "O(n²)",
        "worst": "O(n²)",
        "space": "O(1)"
      }
    }
  ]
}
```

Validation rules:

- `version` must be `1`.
- `language` must match current app language unless user explicitly asks otherwise.
- `scenes` must contain at least 5 scenes and at most 14 scenes.
- `id` must be unique.
- `kind` must be one of:
  - `intro`
  - `hook`
  - `mental`
  - `steps`
  - `animation`
  - `complexity`
  - `use-case`
  - `avoid`
  - `recap`
  - `custom`
- `title`, `subtitle`, `narration` are required.
- `bullets` should be 0-5 items.
- `durationSec` should be between 5 and 90.
- At least one scene should have `animation: true` when topic is algorithmic.
- `visualNotes`, `dataSet`, and `complexity` are optional metadata for future rendering improvements.

Mapping rules:

- Map response scenes to app `LongContentScene[]`.
- `kindLabel` is derived locally from `kind` and language, not trusted from AI.
- If `kind` is unknown, map to `custom`.
- If `durationSec` is invalid, clamp to safe range.
- If `bullets` is missing, use `[]`.
- If `animation` is missing, default to `false`.

## Backend/API Tasks

1. Add AI config model
   - Extend runtime settings/env service with AI fields.
   - Do not log API key.
   - Add health/status endpoint that reports only whether AI key exists.

2. Add AI generation endpoint
   - Example: `POST /api/ai/long-script`
   - Request:
     - topic
     - audience
     - tone
     - targetDurationSec
     - language
     - selectedAlgorithmId
     - currentScenes optional
   - Response:
     - validated structured script JSON

3. Provider implementation
   - Start with OpenAI-compatible chat/completions or responses adapter.
   - Keep provider adapter isolated so OpenRouter/custom base URL can be added without touching UI.
   - Server should parse JSON robustly and return validation errors clearly.

4. Error handling
   - Missing API key: return actionable error.
   - Invalid model/base URL: return provider error.
   - Invalid AI JSON: return validation error and raw-safe summary, not API key.

## Frontend Tasks

1. Settings UI
   - Add AI provider/model/base URL/API key inputs.
   - Add "Kiểm tra AI config" button.

2. Long Content AI panel
   - Add topic/audience/tone/duration inputs.
   - Add generate button.
   - Show loading and errors.

3. Scene replacement flow
   - On success, replace editable scenes with AI response.
   - Reset timeline to 0.
   - Stop playback.
   - Clear existing voice URL and voice script key.
   - Show toast: script generated, review before voice/export.

4. Script editor compatibility
   - AI-generated scenes must be editable with the existing script editor.
   - Reset scene should restore AI-generated baseline for that scene.
   - Reset all should restore the current baseline script, not necessarily built-in default.

## Security Notes

- Never include `AI_API_KEY` in client logs, toast messages, generated script, or video metadata.
- Prefer server-side AI calls.
- If local-only browser storage is used initially, document that it is local development only and not suitable for hosted public apps.
- Avoid sending secrets from `.env` to the browser.

## Acceptance Criteria

- User can enter AI API key/model/provider in Settings.
- Long Content screen has an AI panel to generate script from arbitrary topic.
- App sends app context and required response schema automatically.
- AI response is validated before applying.
- AI-generated script appears in the existing script editor.
- User can edit AI-generated title/subtitle/bullets/narration.
- Voice generation uses the edited narration text.
- Export uses the edited scenes and generated voice.
- Existing Bubble Sort built-in script still works when user does not call AI.
- No video file is generated until user explicitly exports.
