---
name: algorithm-lecture-video
description: Create or improve lecture-style algorithm videos in this app, especially long-form algorithm explainers with script, narration, visual timing, pointer/callouts, voice-over, and export behavior. Use when the user asks to generate, refine, or evaluate an algorithm teaching video, script, timeline, voice narration, slide/video content, or algorithm animation pedagogy.
---

# Algorithm Lecture Video

## Core Standard

Create algorithm lessons as a guided presentation, not as a silent animation. The viewer should never have to self-evaluate what the chart means. Voice, visual focus, and on-screen content must cooperate at every step.

Use this skill together with the repo's ReactJS skill when editing the implementation.

## Presentation Rules

- Keep the voice active whenever an algorithm visual is moving. If the chart runs, the narration must explain what is being compared, why a swap/update happens, what changes after the operation, or what invariant has become true.
- Do not run a chart just to fill time. Only show a moving chart when there is a concrete example, a clear input, and narration that needs the movement.
- Use static concept visuals for intro, hook, use-case, avoid-case, recap, or high-level framing scenes. These scenes should communicate professional topic content, not decorative or unrelated animation.
- Avoid greetings, role assignment, production notes, or meta commentary on the visible video. These may be spoken if useful, but the video surface should show domain content.
- Do not say "look at this and it will become clear" or equivalent. Explain the reasoning. The presenter is responsible for interpretation.
- Prefer a tight, continuous lecture rhythm. Avoid long sentence gaps, blank pauses, or slow chart movement without explanation.
- The narration does not need to exactly match on-screen text. On-screen text should be concise and technical; voice should be warmer, more explanatory, and more engaging.

## Bubble Sort Baseline

Use Bubble Sort as the default quality reference:

- Intro: state the algorithm directly. Example tone: "Chào bạn, mình là trợ lý KATA. Vào thẳng Bubble Sort nhé..." For English use "KATA AI supporter."
- Core idea: explain adjacent comparison, local order, swap condition, left-to-right passes, and the sorted region.
- Example scene: use a concrete input such as `[5, 1, 4, 2, 8]`. Narrate actual decisions: compare `5` and `1`, swap because `5 > 1`, then keep carrying `5` until it meets `8`.
- Animation scene: track the pointer/callout with voice. Say what cyan means, what swap colors mean, why a pair changes, and what green locked positions mean.
- Early-stop scene: explain the swapped flag as evidence. If a full pass has no swap, every adjacent pair is ordered, so the algorithm can stop.
- Complexity scene: connect the visual behavior to cost. Reversed input causes many compare/swap operations; work grows roughly quadratically.
- Use-case and avoid-case scenes: do not run a chart unless comparing a specific input. Explain practical decisions instead.

## Scene Design

Before creating or editing a scene, classify it:

- **Concept scene**: intro, hook, mental model, use-case, avoid-case, recap. Use static visuals or focused text. Do not animate the chart.
- **Example scene**: has a named input. Animate only while voice explains the actual operations on that input.
- **Mechanics scene**: explains controls/signals such as colors, pointer, pass, compare, swap, sorted region, counters, early stop. Animate with explicit narration.
- **Evaluation scene**: complexity, trade-offs, when to use. Animate only if the motion demonstrates the cost being discussed.

Each scene should answer:

- What is the viewer supposed to learn here?
- Does this scene require motion, or is static explanation better?
- If there is motion, what exact sentence explains the current operation?
- What visible text is professional topic content rather than presenter/meta text?

## Voice Timing

- Never switch scene before the voice for that scene has finished.
- Estimate duration from narration and add a small tail, but do not create large silent buffers.
- Join narration with normal sentence spacing, not blank paragraphs that create unnatural pauses.
- Browser TTS is preview-only when it cannot be captured reliably for export; generated audio such as Piper/ElevenLabs should drive export timing.
- After script or timing changes, regenerate the voice-over so exported audio matches the timeline.

## Pointer And Focus

- Use a small focus pointer/callout to direct attention, not a large distracting cursor.
- The pointer must have a teaching purpose: indicate the pair being compared, the position being swapped, the sorted region, or the decision point.
- Callout labels should be technical and concise, for example: "5 > 1 nên đổi chỗ" or "So sánh 5 và 8: đúng thứ tự, giữ nguyên."
- Do not leave the viewer staring at a highlighted chart area without spoken explanation.

## Visual Text Policy

- On-screen text should be chuyên môn: title, core idea, input, compare/swap rules, invariants, complexity, practical guidance.
- Do not show greeting text, speaker identity, internal planning, or instructions like "watch the chart" as primary video content.
- Keep text compact and readable. Voice can carry nuance; the slide should not become a transcript.

## Export And Access Expectations

- Export video actions and YouTube/social publishing must require app login/admin access according to the repo's existing guard pattern.
- Export should not produce white flashes. Render a valid first frame before recording and avoid preview-canvas side effects when exporting.
- Long video export with voice should use capturable audio sources, not browser speech synthesis when the browser cannot expose the audio stream.
