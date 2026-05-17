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
- Do not duplicate the same scene information in two panels. If there is no chart, let the text/content panel use the full available width.
- When a chart becomes necessary, animate it into the layout: the chart should expand into view while the text panel narrows. When the chart is no longer needed, animate the chart closed and let the text panel expand again.
- Keep chart open/close transitions short. Do not tie them to a large percentage of long scenes, because that makes the chart feel late and out of sync with the speaker.
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

## Slide Design

- Design each scene like a professional teaching slide: one primary idea, one visual hierarchy, and no decorative content that competes with the explanation.
- Concept slides should feel like focused lecture slides, not generic hero pages. Use a strong title, short subtitle, and compact bullets or diagram labels.
- Keep text panels scannable: prefer short technical bullets over transcript-like paragraphs. The narration carries nuance; the slide carries structure.
- If no chart is needed, let the content panel use the available width. Avoid keeping an empty chart frame open just to balance the layout.
- If a chart is needed, make the chart and text complementary: the text names the rule/invariant, while the chart demonstrates the current operation.
- Avoid duplicating the same information in title, subtitle, bullets, callout, and frame label. Each text surface should add a distinct job.
- Preserve reading comfort on 16:9 exports: stable margins, predictable alignment, high contrast, and no text overlapping pointer/callout elements.
- Use slide transitions to support comprehension: reveal the chart when the explanation reaches the example, and close it when the lesson returns to concept/evaluation.

## Motion Quality

- Prefer smooth interpolation between algorithm frames instead of jumping directly from one discrete frame to the next.
- When rendering a step, pass the previous frame and an eased `transitionProgress` so swaps, highlights, and pointer/callouts have visible continuity.
- Chart open/close should be time-based and short, around `0.7s`, rather than tied to a large percentage of scene duration. Long scenes should not make the chart feel late.
- Use easing for panel layout changes and per-frame animation. Hard jumps make the video feel like a debug preview instead of a finished presentation.
- Keep motion synchronized with narration. If voice explains a comparison or swap, the visual focus should arrive before or during that sentence, not after it.
- Remove idle motion that does not teach anything. A smooth animation is only useful when it clarifies a state change, decision, or invariant.

## Voice-Animation Step Sync

- Do not map a whole operation-heavy scene linearly from `progress 0..1` to all algorithm frames. Linear mapping can make the chart advance to the next compare/swap while narration is still explaining the previous one.
- For scenes that describe concrete operations, build or infer cue points for each spoken action: compare, decision, swap, write/update, pass end, sorted/locked region, and early stop.
- Hold the current algorithm frame while the matching sentence is being spoken. Move to the next frame only near the end of that cue, using a short eased transition.
- A later pass or loop must not begin visually until the narration has finished the current pass's compare/swap explanation. Prefer a deliberate hold over premature motion.
- If exact per-cue audio timings are unavailable, use a cue map with conservative holds. Treat the first cue in each operation as explanation time and the final part of the cue interval as transition time.
- When generated TTS can return segment durations, split narration at the same semantic boundaries used by the chart cues. Scene-level duration sync is acceptable for concept scenes, but operation scenes need cue-level sync.
- For Bubble Sort step-by-step examples, keep pass 1 compare/swap cues together before advancing to pass 2. The sorted tail should lock only after the voice has explained why the pass is complete.

## Voice Timing

- Never switch scene before the voice for that scene has finished.
- Estimate duration from narration and add a small tail, but do not create large silent buffers.
- Do not keep original scene durations as hard minimums after narration is known. Let voice length drive scene duration so the step changes soon after the explanation ends.
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
