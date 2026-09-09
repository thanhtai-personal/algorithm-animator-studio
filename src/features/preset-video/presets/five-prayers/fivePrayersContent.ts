import { FIVE_PRAYERS_TRACK_1_LYRICS } from "./fivePrayersTrack1";
import { FIVE_PRAYERS_TRACK_2_LYRICS } from "./fivePrayersTrack2";
import { FIVE_PRAYERS_TRACK_3_LYRICS } from "./fivePrayersTrack3";
import { FIVE_PRAYERS_TRACK_4_LYRICS } from "./fivePrayersTrack4";
import { FIVE_PRAYERS_TRACK_5_LYRICS } from "./fivePrayersTrack5";
import { FIVE_PRAYERS_CUE_TIMINGS_BY_TRACK } from "./fivePrayersTimings";

export type FivePrayersTrack = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  start: number;
  end: number;
  theme: "spirit" | "faith" | "commandments" | "beatitudes" | "rosary";
  lyrics: string;
};

export type FivePrayersLyricCue = {
  id: string;
  trackId: string;
  start: number;
  end: number;
  lines: readonly string[];
};

export const FIVE_PRAYERS_AUDIO_ASSET = "preset-assets/five-prayers/five-prayers.mp3";
export const FIVE_PRAYERS_DURATION_SECONDS = 1221.072;

export const FIVE_PRAYERS_TRACKS: readonly FivePrayersTrack[] = [
  {
    id: "track-1",
    number: 1,
    title: "Dấu Thánh Giá · Đức Chúa Thánh Thần",
    subtitle: "Kinh Lạy Cha · Kinh Kính Mừng · Kinh Sáng Danh",
    start: 0,
    end: 234.08,
    theme: "spirit",
    lyrics: FIVE_PRAYERS_TRACK_1_LYRICS,
  },
  {
    id: "track-2",
    number: 2,
    title: "Kinh Tin · Kinh Cậy · Kinh Mến",
    subtitle: "Kinh Ăn Năn Tội · Kinh Tin Kính",
    start: 234.08,
    end: 514,
    theme: "faith",
    lyrics: FIVE_PRAYERS_TRACK_2_LYRICS,
  },
  {
    id: "track-3",
    number: 3,
    title: "Kinh Cáo Mình · Mười Điều Răn",
    subtitle: "Sáu Điều Răn Hội Thánh · Cải Tội Bảy Mối",
    start: 514,
    end: 713.32,
    theme: "commandments",
    lyrics: FIVE_PRAYERS_TRACK_3_LYRICS,
  },
  {
    id: "track-4",
    number: 4,
    title: "Phúc Thật Tám Mối",
    subtitle: "Kinh Cám Ơn",
    start: 713.32,
    end: 947.52,
    theme: "beatitudes",
    lyrics: FIVE_PRAYERS_TRACK_4_LYRICS,
  },
  {
    id: "track-5",
    number: 5,
    title: "Kinh Trông Cậy",
    subtitle: "Năm Sự Vui · Năm Sự Thương · Năm Sự Mừng",
    start: 947.52,
    end: FIVE_PRAYERS_DURATION_SECONDS,
    theme: "rosary",
    lyrics: FIVE_PRAYERS_TRACK_5_LYRICS,
  },
] as const;

export const FIVE_PRAYERS_PREVIEW_SECTIONS = FIVE_PRAYERS_TRACKS.map((track) => ({
  id: track.id,
  label: `Video ${String(track.number).padStart(2, "0")}`,
  title: `${track.title} · ${track.subtitle}`,
  startSeconds: track.start,
  endSeconds: track.end,
}));

export const FIVE_PRAYERS_LYRIC_CUES: readonly FivePrayersLyricCue[] =
  FIVE_PRAYERS_TRACKS.flatMap(createTrackCues);

export function getFivePrayersTrack(timeSeconds: number) {
  return FIVE_PRAYERS_TRACKS.find((track) => timeSeconds >= track.start && timeSeconds < track.end)
    ?? FIVE_PRAYERS_TRACKS[FIVE_PRAYERS_TRACKS.length - 1];
}

export function getFivePrayersLyricCue(
  timeSeconds: number,
  timings: Record<string, { start: number; end: number }> = {},
) {
  return FIVE_PRAYERS_LYRIC_CUES
    .map((cue) => ({ ...cue, ...(timings[cue.id] || {}) }))
    .filter((cue) => cue.end > cue.start && timeSeconds >= cue.start && timeSeconds < cue.end)
    .sort((left, right) => right.start - left.start)[0];
}

function createTrackCues(track: FivePrayersTrack): FivePrayersLyricCue[] {
  const groups = splitCaptionGroups(track.lyrics);
  const timings = FIVE_PRAYERS_CUE_TIMINGS_BY_TRACK[track.number - 1];
  if (groups.length !== timings.length) {
    throw new Error(`Five Prayers track ${track.number} has ${groups.length} captions but ${timings.length} timings.`);
  }

  return groups.map((lines, index) => {
    const [start, end] = timings[index];
    return {
      id: `prayer-${track.number}-${String(index + 1).padStart(3, "0")}`,
      trackId: track.id,
      start,
      end,
      lines,
    };
  });
}

function splitCaptionGroups(text: string) {
  return text
    .trim()
    .split(/\n\s*\n/)
    .flatMap((block) => {
      const lines = block.split(/\n/).map((line) => line.trim()).filter(Boolean);
      const groups: string[][] = [];
      for (let index = 0; index < lines.length; index += 2) {
        groups.push(lines.slice(index, index + 2));
      }
      return groups;
    });
}

