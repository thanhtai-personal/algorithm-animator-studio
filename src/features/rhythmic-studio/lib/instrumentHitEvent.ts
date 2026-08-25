import type { MarblePlatform } from "../engine/marblePhysicsTypes";
import type { CourseItemOverride, InstrumentHitEvent, StudioSettings } from "../types";
import { isPlatformCourseItem, overrideForNode } from "./courseItems";
import { noteColorForMidi } from "./noteColors";
import { resolvePlatformStyle } from "./platformStyles";

export function instrumentHitForPlatform(
  platformIndex: number,
  platforms: MarblePlatform[],
  settings: StudioSettings,
  overrides: CourseItemOverride[],
): InstrumentHitEvent {
  const platform = platforms[platformIndex];
  if (!platform) throw new Error(`Missing rhythmic platform at index ${platformIndex}`);
  const override = overrideForNode(platform.index, overrides);
  const platformStyle = platform.visualStyle
    ?? (override && isPlatformCourseItem(override.style) ? override.style : resolvePlatformStyle(platform.index, settings));
  const chordPlatforms = platform.chordClusterId === undefined
    ? [platform]
    : platforms.filter((candidate) => candidate.chordClusterId === platform.chordClusterId);

  return {
    event: platform.event,
    platformIndex: platform.index,
    platformStyle,
    noteColor: noteColorForMidi(platform.event.midi),
    chordEvents: chordPlatforms.map((candidate) => candidate.event),
    chordColors: chordPlatforms.map((candidate) => noteColorForMidi(candidate.event.midi)),
  };
}
