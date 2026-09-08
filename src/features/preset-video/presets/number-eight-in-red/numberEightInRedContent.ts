export type NumberEightLyricCue = {
  id: string;
  start: number;
  end: number;
  lines: readonly string[];
};

export type NumberEightVisualSource = {
  id: "goals-100" | "assists-100" | "top-20-goals" | "player-cam";
  title: string;
  watchUrl: string;
  thumbnailUrl: string;
  clipStartSeconds: number;
  clipEndSeconds: number;
};

export type NumberEightSection = {
  id: string;
  label: string;
  start: number;
  end: number;
  sourceIds: readonly NumberEightVisualSource["id"][];
  holdSeconds: number;
  visualMode: "slow" | "drive" | "freeze" | "anthem";
};

export const NUMBER_EIGHT_DURATION_SECONDS = 228.4;
export const NUMBER_EIGHT_BPM = 136;
export const NUMBER_EIGHT_FIRST_BEAT_SECONDS = 1.486;
export const NUMBER_EIGHT_LYRIC_SYNC_OFFSET_SECONDS = 0.066;

export const NUMBER_EIGHT_VISUAL_SOURCES: readonly NumberEightVisualSource[] = [
  {
    id: "goals-100",
    title: "Bruno Fernandes: 100 Goals!",
    watchUrl: "https://www.youtube.com/watch?v=h2EwOys6evI",
    thumbnailUrl: "https://i.ytimg.com/vi/h2EwOys6evI/maxresdefault.jpg",
    clipStartSeconds: 20,
    clipEndSeconds: 32,
  },
  {
    id: "assists-100",
    title: "100 Bruno Fernandes United Assists",
    watchUrl: "https://www.youtube.com/watch?v=-BIriLyQXkw",
    thumbnailUrl: "https://i.ytimg.com/vi/-BIriLyQXkw/maxresdefault.jpg",
    clipStartSeconds: 28,
    clipEndSeconds: 40,
  },
  {
    id: "top-20-goals",
    title: "Bruno Fernandes: Top 20 Goals!",
    watchUrl: "https://www.youtube.com/watch?v=W5oMb2l-PZI",
    thumbnailUrl: "https://i.ytimg.com/vi/W5oMb2l-PZI/maxresdefault.jpg",
    clipStartSeconds: 36,
    clipEndSeconds: 48,
  },
  {
    id: "player-cam",
    title: "Player Cam | Bruno Fernandes",
    watchUrl: "https://www.youtube.com/watch?v=exzhSLlnWXk",
    thumbnailUrl: "https://i.ytimg.com/vi/exzhSLlnWXk/maxresdefault.jpg",
    clipStartSeconds: 24,
    clipEndSeconds: 36,
  },
] as const;

export const NUMBER_EIGHT_SECTIONS: readonly NumberEightSection[] = [
  {
    id: "opening",
    label: "NUMBER EIGHT",
    start: 0,
    end: 15.6,
    sourceIds: ["goals-100"],
    holdSeconds: 15.6,
    visualMode: "slow",
  },
  {
    id: "verse-1",
    label: "VISION",
    start: 15.6,
    end: 43.84,
    sourceIds: ["assists-100", "player-cam"],
    holdSeconds: 7.06,
    visualMode: "drive",
  },
  {
    id: "pre-1",
    label: "HEAD UP",
    start: 43.84,
    end: 57.96,
    sourceIds: ["player-cam"],
    holdSeconds: 14.12,
    visualMode: "freeze",
  },
  {
    id: "chorus-1",
    label: "BRUNO",
    start: 57.96,
    end: 100.31,
    sourceIds: ["goals-100", "top-20-goals", "assists-100"],
    holdSeconds: 7.06,
    visualMode: "anthem",
  },
  {
    id: "verse-2",
    label: "DRIVE",
    start: 100.31,
    end: 128.55,
    sourceIds: ["top-20-goals", "goals-100"],
    holdSeconds: 7.06,
    visualMode: "drive",
  },
  {
    id: "pre-2",
    label: "ONE TOUCH",
    start: 128.55,
    end: 142.66,
    sourceIds: ["player-cam"],
    holdSeconds: 14.11,
    visualMode: "freeze",
  },
  {
    id: "chorus-2",
    label: "RED TILL THE END",
    start: 142.66,
    end: 185.02,
    sourceIds: ["assists-100", "goals-100", "top-20-goals"],
    holdSeconds: 7.06,
    visualMode: "anthem",
  },
  {
    id: "bridge",
    label: "WHO DRIVES US ON?",
    start: 185.02,
    end: 199.13,
    sourceIds: ["player-cam"],
    holdSeconds: 14.11,
    visualMode: "freeze",
  },
  {
    id: "final",
    label: "UNITED",
    start: 199.13,
    end: 224.2,
    sourceIds: ["goals-100", "assists-100", "top-20-goals"],
    holdSeconds: 4.42,
    visualMode: "anthem",
  },
  {
    id: "outro",
    label: "NUMBER EIGHT IN RED",
    start: 224.2,
    end: NUMBER_EIGHT_DURATION_SECONDS,
    sourceIds: ["goals-100"],
    holdSeconds: 4.2,
    visualMode: "slow",
  },
] as const;

const BAR_SECONDS = 4 * 60 / NUMBER_EIGHT_BPM;

const lyricSections: readonly {
  id: string;
  start: number;
  end: number;
  groups: readonly (readonly string[])[];
  bars: readonly number[];
}[] = [
  {
    id: "opening",
    start: NUMBER_EIGHT_FIRST_BEAT_SECONDS,
    end: 15.6,
    groups: [
      ["Oh-oh-oh", "Oh-oh-oh"],
      ["Bruno! Bruno!", "Number eight in red"],
      ["Bruno! Bruno!", "One step ahead"],
    ],
    bars: [2, 3, 3],
  },
  {
    id: "verse-1",
    start: 15.6,
    end: 43.8,
    groups: [
      ["Give him the ball", "He lifts his head"],
      ["One man runs", "The ball is sent"],
      ["Over the line", "Into the space"],
      ["Red shirts go", "He sets the pace"],
    ],
    bars: [4, 4, 4, 4],
  },
  {
    id: "pre-1",
    start: 43.84,
    end: 57.9,
    groups: [
      ["Head up!", "Run now!"],
      ["He sees the way", "He plays it out"],
      ["One touch!", "Go on!"],
      ["Bruno sends them on"],
    ],
    bars: [2, 2, 2, 2],
  },
  {
    id: "chorus-1",
    start: 57.96,
    end: 100.25,
    groups: [
      ["Bruno! Bruno!", "Number eight in red"],
      ["Bruno! Bruno!", "One step ahead"],
      ["He lifts his head", "The red shirts run"],
      ["Bruno Fernandes", "Come on United!"],
      ["Bruno! Bruno!", "Hear us sing his name"],
      ["Bruno! Bruno!", "Do it all again"],
      ["One look", "One ball"],
      ["Straight through the line"],
      ["Bruno Fernandes", "Red till the end!"],
    ],
    bars: [3, 3, 3, 3, 3, 3, 2, 2, 2],
  },
  {
    id: "verse-2",
    start: 100.31,
    end: 128.5,
    groups: [
      ["He fights for the ball", "He drives them on"],
      ["Wins it back", "Then he is gone"],
      ["Space outside", "He takes the shot"],
      ["One clean hit", "The net goes off"],
      ["Ball on the spot", "The whole ground stops"],
      ["One little jump", "The keeper drops"],
      ["Bruno waits", "Then sends it wide"],
      ["Wrong way keeper", "Goal inside"],
    ],
    bars: [2, 2, 2, 2, 2, 2, 2, 2],
  },
  {
    id: "pre-2",
    start: 128.55,
    end: 142.6,
    groups: [
      ["Head up!", "Run now!"],
      ["He sees the way", "He plays it out"],
      ["One touch!", "Go on!"],
      ["Bruno sends them on"],
    ],
    bars: [2, 2, 2, 2],
  },
  {
    id: "chorus-2",
    start: 142.66,
    end: 184.96,
    groups: [
      ["Bruno! Bruno!", "Number eight in red"],
      ["Bruno! Bruno!", "One step ahead"],
      ["He lifts his head", "The red shirts run"],
      ["Bruno Fernandes", "Come on United!"],
      ["Bruno! Bruno!", "Hear us sing his name"],
      ["Bruno! Bruno!", "Do it all again"],
      ["One look", "One ball"],
      ["Straight through the line"],
      ["Bruno Fernandes", "Red till the end!"],
    ],
    bars: [3, 3, 3, 3, 3, 3, 2, 2, 2],
  },
  {
    id: "bridge",
    start: 185.02,
    end: 199.08,
    groups: [
      ["Who wants the ball?", "Bruno!"],
      ["Who makes the run?", "Bruno!"],
      ["Who plays it through?", "Bruno!"],
      ["Who drives us on?", "Bruno!"],
      ["One step", "One hop"],
      ["Keeper goes", "Bruno scores!"],
    ],
    bars: [1, 1, 1, 1, 2, 2],
  },
  {
    id: "final",
    start: 199.13,
    end: 224.15,
    groups: [
      ["Bruno! Bruno!", "Number eight in red"],
      ["Bruno! Bruno!", "One step ahead"],
      ["He lifts his head", "The red shirts run"],
      ["Bruno Fernandes", "Come on United!"],
      ["Bruno! Bruno!", "Sing it loud again"],
      ["Bruno! Bruno!", "From end to end"],
      ["One look", "One ball"],
      ["Straight through the line"],
      ["Bruno Fernandes", "United! United!"],
    ],
    bars: [2, 2, 2, 2, 1, 1, 1, 1, 2],
  },
  {
    id: "outro",
    start: 224.2,
    end: NUMBER_EIGHT_DURATION_SECONDS,
    groups: [
      ["Oh-oh-oh", "Oh-oh-oh"],
      ["Bruno Fernandes", "Number eight in red"],
    ],
    bars: [1, 1],
  },
] as const;

export const NUMBER_EIGHT_LYRIC_CUES: readonly NumberEightLyricCue[] =
  lyricSections.flatMap(({ id, start, end, groups, bars }) => createBarAlignedCues(id, start, end, groups, bars));

export function getNumberEightSection(timeSeconds: number) {
  return NUMBER_EIGHT_SECTIONS.find((section) => timeSeconds >= section.start && timeSeconds < section.end)
    ?? NUMBER_EIGHT_SECTIONS[NUMBER_EIGHT_SECTIONS.length - 1];
}

export function getNumberEightLyricCue(
  timeSeconds: number,
  timings: Record<string, { start: number; end: number }> = {},
) {
  return NUMBER_EIGHT_LYRIC_CUES
    .map((cue) => ({ ...cue, ...(timings[cue.id] || {}) }))
    .filter((cue) => cue.end > cue.start && timeSeconds >= cue.start && timeSeconds < cue.end)
    .sort((left, right) => right.start - left.start)[0];
}

export function getNumberEightSource(sourceId: NumberEightVisualSource["id"]) {
  return NUMBER_EIGHT_VISUAL_SOURCES.find((source) => source.id === sourceId)
    ?? NUMBER_EIGHT_VISUAL_SOURCES[0];
}

function createBarAlignedCues(
  sectionId: string,
  start: number,
  end: number,
  groups: readonly (readonly string[])[],
  bars: readonly number[],
): NumberEightLyricCue[] {
  if (groups.length !== bars.length) {
    throw new Error(`Lyric timing config mismatch for ${sectionId}.`);
  }

  let cursor = start;
  return groups.map((lines, index) => {
    const cueStart = cursor;
    cursor = index === groups.length - 1 ? end : Math.min(end, cursor + bars[index] * BAR_SECONDS);
    return {
      id: `${sectionId}-${index + 1}`,
      start: syncLyricTime(cueStart),
      end: syncLyricTime(cursor),
      lines,
    };
  });
}

function syncLyricTime(value: number) {
  return roundTime(Math.min(NUMBER_EIGHT_DURATION_SECONDS, value + NUMBER_EIGHT_LYRIC_SYNC_OFFSET_SECONDS));
}

function roundTime(value: number) {
  return Math.round(value * 1000) / 1000;
}
