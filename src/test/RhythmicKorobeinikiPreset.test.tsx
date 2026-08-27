import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  BUILTIN_MELODIES,
  DEFAULT_SETTINGS,
  KOROBEINIKI_MELODY_NAME,
} from "../features/rhythmic-studio/defaults";
import { useRhythmicPresetActions } from "../features/rhythmic-studio/hooks/useRhythmicPresetActions";
import { buildMarbleCourse } from "../features/rhythmic-studio/lib/marbleCourse";
import { instrumentBodyColorAtTime } from "../features/rhythmic-studio/lib/instrumentLifecycle";
import {
  buildKorobeinikiReferenceCourse,
  korobeinikiBridgeAfterIndices,
  korobeinikiColorForMidi,
  korobeinikiReferenceDecorForScene,
  korobeinikiReferenceLabelForScene,
  korobeinikiReferenceTubeDepth,
  KOROBEINIKI_REFERENCE_SCENE_STARTS,
  korobeinikiSceneForIndex,
} from "../features/rhythmic-studio/lib/korobeinikiReferenceLayout";
import { referenceEventsForImportedAudio } from "../features/rhythmic-studio/lib/referenceAudio";
import { REFERENCE_CLIP_PRESET_MAP } from "../features/rhythmic-studio/lib/referenceVideoPresets";
import { presetById } from "../features/rhythmic-studio/lib/studioPresets";
import { buildRhythmicTimeline } from "../features/rhythmic-studio/lib/timeline";
import { RhythmicStudioStore } from "../features/rhythmic-studio/store/RhythmicStudioStore";
import { instrumentPlayingSurface3D } from "../features/rhythmic-studio/components/instrumentPlayingSurface3D";
import { wallBoomwhackerGeometry } from "../features/rhythmic-studio/components/wallBoomwhackerGeometry3D";
import { crossedRhythmicHit } from "../features/rhythmic-studio/components/rhythmicSceneMath3D";
import { referenceStripedMarbleBandAtUv } from "../features/rhythmic-studio/components/RhythmicMarble3D";

const PRESET_ID = "reference-korobeiniki-tubes" as const;

describe("Korobeiniki wall-tube reference preset", () => {
  it("transcribes all 39 impacts from the supplied 14.86 second audio", () => {
    const events = BUILTIN_MELODIES[KOROBEINIKI_MELODY_NAME];

    expect(events).toHaveLength(39);
    expect(events.map((event) => event.midi)).toEqual([
      76, 71, 72, 74, 76, 74, 72, 71, 69, 69,
      72, 76, 74, 72, 71, 72, 74, 76, 72, 69, 69,
      74, 77, 81, 79, 77, 76, 72, 76, 74, 72, 71,
      71, 72, 74, 76, 72, 69, 69,
    ]);
    expect(events.slice(0, 10).map((event) => event.timeMs)).toEqual([
      600, 1065, 1295, 1525, 1755, 1870, 1990, 2220, 2450, 2915,
    ]);
    expect(events.at(-1)?.timeMs).toBe(14_480);
    expect(events.at(-1)!.timeMs + events.at(-1)!.durationMs).toBe(14_861);
  });

  it("captures the gray wall, purple striped marble and restrained tube installation", () => {
    expect(REFERENCE_CLIP_PRESET_MAP.tXxHSu15xU8_002).toBe(PRESET_ID);
    const preset = presetById(PRESET_ID);

    expect(preset.builtinMelody).toBe(KOROBEINIKI_MELODY_NAME);
    expect(preset.settings).toMatchObject({
      titleText: "Korobeiniki",
      backgroundPreset: "spotlight",
      colorPaletteMode: "key-rainbow",
      ballStyle: "striped",
      instrumentFamily: "boomwhacker",
      instrumentLayout: "wall-score",
      platformPrimaryStyle: "wall-boomwhacker-tube",
      synthPreset: "boomwhacker",
      showcaseRails: true,
      impactRipple: false,
      particleCount: 0,
      backgroundColor: "#8e8b9a",
      cameraAnchor: 0.24,
      cameraDistance: 0.94,
    });
  });

  it("keeps every visible strike in the selected boomwhacker family", () => {
    const preset = presetById(PRESET_ID);
    const settings = { ...DEFAULT_SETTINGS, ...preset.settings };
    const events = buildRhythmicTimeline(BUILTIN_MELODIES[KOROBEINIKI_MELODY_NAME], settings);
    const platforms = buildMarbleCourse(events, settings, 720);
    const visible = platforms.filter((platform) => !platform.visualHidden);

    expect(platforms).toHaveLength(events.length);
    expect(visible.length).toBeGreaterThan(30);
    expect(visible.every((platform) => platform.visualStyle === "wall-boomwhacker-tube")).toBe(true);
  }, 30_000);

  it("uses open tube mouths facing the marble instead of horizontal bars", () => {
    const geometry = wallBoomwhackerGeometry(1.4, 0.3, 4.05, false);
    const surface = instrumentPlayingSurface3D(
      "wall-boomwhacker-tube",
      1.4,
      0.3,
      geometry.length,
      0.18,
    );

    expect(geometry.length).toBeGreaterThan(geometry.radius * 10);
    expect(geometry.mouthZ).toBeCloseTo(geometry.length / 2, 6);
    expect(geometry.backZ).toBeCloseTo(-geometry.length / 2, 6);
    expect(surface.faceKind).toBe("front");
    expect(surface.normalZ).toBeGreaterThan(0.98);
    expect(surface.marbleContactZ).toBeCloseTo(0.18, 4);
    expect(surface.contactCorrection).toBeTypeOf("number");
    expect(Number.isFinite(surface.contactCorrection)).toBe(true);
    expect(wallBoomwhackerGeometry(1.4, 0.3, 4.08, false).length).toBe(4.08);
    expect(korobeinikiReferenceTubeDepth(0)).toBe(4.08);
    expect(korobeinikiReferenceTubeDepth(3)).toBeCloseTo(4.245, 6);
  });

  it("splits the installation at the three long rests and bridges only those gaps", () => {
    const events = BUILTIN_MELODIES[KOROBEINIKI_MELODY_NAME];

    expect(korobeinikiBridgeAfterIndices(events)).toEqual([14, 20, 26]);
    expect([0, 14, 15, 20, 21, 26, 27, 38].map(korobeinikiSceneForIndex)).toEqual([
      { sceneIndex: 0, sceneStart: false },
      { sceneIndex: 0, sceneStart: false },
      { sceneIndex: 1, sceneStart: true },
      { sceneIndex: 1, sceneStart: false },
      { sceneIndex: 2, sceneStart: true },
      { sceneIndex: 2, sceneStart: false },
      { sceneIndex: 3, sceneStart: true },
      { sceneIndex: 3, sceneStart: false },
    ]);
  });

  it("uses the measured pastel pitch lights from the supplied reference", () => {
    expect([76, 71, 72, 74, 77, 79, 81].map(korobeinikiColorForMidi)).toEqual([
      "#5ffbf8",
      "#e29de1",
      "#f5a6bf",
      "#f2d18f",
      "#72a2e3",
      "#aaf0e7",
      "#93d395",
    ]);
  });

  it("repeats the five measured entry tubes at the start of every wall cluster", () => {
    const decor = korobeinikiReferenceDecorForScene(0);

    expect(decor.map(({ x, y, color }) => [x, y, color])).toEqual([
      [166, -90, "#f5a6bf"],
      [153, 10, "#72a2e3"],
      [26, 45, "#e29de1"],
      [112, 108, "#93d395"],
      [165, 140, "#b6b0ef"],
    ]);
    expect(korobeinikiReferenceLabelForScene(0)).toEqual({ x: 288, y: 146 });
    expect(korobeinikiReferenceDecorForScene(1)[0].y).toBeGreaterThan(1_000);
  });

  it("places each phrase in a measured wall cluster instead of a continuous generated fall", () => {
    const events = BUILTIN_MELODIES[KOROBEINIKI_MELODY_NAME];
    const settings = { ...DEFAULT_SETTINGS, ...presetById(PRESET_ID).settings };
    const platforms = buildKorobeinikiReferenceCourse(events, settings, 720);

    expect(platforms).toHaveLength(39);
    expect(platforms.slice(0, 5).map(({ visualX, visualY }) => [visualX, visualY])).toEqual([
      [326, 220],
      [455, 266],
      [292, 318],
      [455, 372],
      [286, 430],
    ]);
    expect([platforms[0].hitX, platforms[0].hitY]).toEqual([368, 150]);
    expect(KOROBEINIKI_REFERENCE_SCENE_STARTS).toEqual([0, 15, 21, 27]);
    expect(platforms[15].hitY - platforms[14].hitY).toBeGreaterThan(260);
    expect(platforms[21].hitY - platforms[20].hitY).toBeGreaterThan(260);
    expect(platforms[27].hitY - platforms[26].hitY).toBeGreaterThan(260);
    expect(platforms.every((platform) => platform.visualStyle === "wall-boomwhacker-tube")).toBe(true);
  });

  it("keeps unplayed reference tubes black, then lights and retains the struck color", () => {
    expect(instrumentBodyColorAtTime("boomwhacker-tube", "#8ee6cf", 1_000, 900)).toBe("#8ee6cf");
    expect(instrumentBodyColorAtTime("boomwhacker-tube", "#8ee6cf", 1_000, 1_500)).toBe("#18191d");
    expect(instrumentBodyColorAtTime("wall-boomwhacker-tube", "#83e7df", 1_000, 900)).toBe("#18191d");
    expect(instrumentBodyColorAtTime("wall-boomwhacker-tube", "#83e7df", 1_000, 1_000)).toBe("#83e7df");
    expect(instrumentBodyColorAtTime("wall-boomwhacker-tube", "#83e7df", 1_000, 8_000)).toBe("#83e7df");
    expect(instrumentBodyColorAtTime("marimba-bar", "#8ee6cf", 1_000, 1_500)).toBe("#8ee6cf");
  });

  it("invalidates the wall tubes when playback crosses even the first hit", () => {
    expect(crossedRhythmicHit(580, 610, 600)).toBe(true);
    expect(crossedRhythmicHit(600, 610, 600)).toBe(false);
    expect(crossedRhythmicHit(610, 580, 600)).toBe(false);
  });

  it("uses one narrow pink band on the reference marble", () => {
    expect(referenceStripedMarbleBandAtUv(0.25, 0.5)).toBe(true);
    expect(referenceStripedMarbleBandAtUv(0.25, 0.2)).toBe(false);
    expect(referenceStripedMarbleBandAtUv(0.75, 0.8)).toBe(false);
  });

  it("uses the exact 39-note reference timeline when the supplied MP3 is imported", () => {
    const matched = referenceEventsForImportedAudio({
      activePresetId: PRESET_ID,
      fileName: "YTDown.com_Shorts_Do-you-know-this-song-relaxing-music-sat_Media_tXxHSu15xU8_009_128k.mp3",
      durationMs: 14_889.796,
    });

    expect(matched).toEqual(BUILTIN_MELODIES[KOROBEINIKI_MELODY_NAME]);
    expect(referenceEventsForImportedAudio({
      activePresetId: PRESET_ID,
      fileName: "different-song.mp3",
      durationMs: 31_000,
    })).toBeNull();
  });

  it("loads the matched melody and reference background with one preset click", () => {
    const store = new RhythmicStudioStore();
    store.patch("backgroundPreset", "deep-space");
    store.patch("backgroundColor", "#010105");
    store.setBackground("blob:custom-background", "custom.png");
    const loadBuiltin = vi.fn();
    const { result } = renderHook(() => useRhythmicPresetActions(store, loadBuiltin));

    act(() => result.current.applyQuickPreset(PRESET_ID));

    expect(loadBuiltin).toHaveBeenCalledOnce();
    expect(loadBuiltin).toHaveBeenCalledWith(KOROBEINIKI_MELODY_NAME);
    expect(store.settings.backgroundPreset).toBe("spotlight");
    expect(store.settings.backgroundColor).not.toBe("#010105");
    expect(store.backgroundUrl).toBeNull();
    expect(store.backgroundName).toBeNull();
    expect(store.activePresetId).toBe(PRESET_ID);
  });

  it("retains the supplied MP3 when the matching reference preset is selected after import", () => {
    const store = new RhythmicStudioStore();
    const audioUrl = "blob:reference-song";
    store.setSource(
      [{ id: "detected", timeMs: 610, midi: 60, velocity: 0.8, durationMs: 160 }],
      {
        type: "audio",
        name: "YTDown.com_Shorts_Do-you-know-this-song-relaxing-music-sat_Media_tXxHSu15xU8_009_128k.mp3",
        durationMs: 14_889.796,
        eventCount: 1,
      },
      { key: "info.audio", values: { name: "reference.mp3", size: "285 KB", count: 1 } },
      audioUrl,
    );
    const loadBuiltin = vi.fn();
    const { result } = renderHook(() => useRhythmicPresetActions(store, loadBuiltin));

    act(() => result.current.applyQuickPreset(PRESET_ID));

    expect(loadBuiltin).toHaveBeenCalledWith(KOROBEINIKI_MELODY_NAME, { preserveAudio: true });
    expect(store.audioUrl).toBe(audioUrl);
  });
});
