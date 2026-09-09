import { FIVE_PRAYERS_TRACK_1_LYRICS } from "./fivePrayersTrack1";
import { FIVE_PRAYERS_TRACK_2_LYRICS } from "./fivePrayersTrack2";
import { FIVE_PRAYERS_TRACK_3_LYRICS } from "./fivePrayersTrack3";
import { FIVE_PRAYERS_TRACK_4_LYRICS } from "./fivePrayersTrack4";
import { FIVE_PRAYERS_TRACK_5_LYRICS } from "./fivePrayersTrack5";
import { FIVE_PRAYERS_CUE_TIMINGS_BY_TRACK } from "./fivePrayersTimings";

export type FivePrayersArtwork = {
  imageUrl: string;
  sourceUrl: string;
  objectPosition: string;
};

export type FivePrayersTrack = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  start: number;
  end: number;
  theme: "spirit" | "faith" | "commandments" | "beatitudes" | "rosary";
  lyrics: string;
  artwork: FivePrayersArtwork;
};

export type FivePrayersLyricCue = {
  id: string;
  trackId: string;
  start: number;
  end: number;
  lines: readonly string[];
};

export type FivePrayersPrayerSection = {
  id: string;
  trackId: string;
  title: string;
  start: number;
  end: number;
};

type PrayerSectionSpec = {
  id: string;
  trackId: string;
  title: string;
  firstCueNumber: number;
};

export const FIVE_PRAYERS_AUDIO_ASSET = "preset-assets/five-prayers/five-prayers.mp3";
export const FIVE_PRAYERS_DURATION_SECONDS = 1221.072;

const FIVE_PRAYERS_ARTWORK = {
  spirit: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/94/Dove_of_the_Holy_Spirit.png",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Dove_of_the_Holy_Spirit.png",
    objectPosition: "50% 44%",
  },
  faith: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Sacred_Heart_of_Jesus_Christ.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sacred_Heart_of_Jesus_Christ.jpg",
    objectPosition: "50% 40%",
  },
  commandments: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Tissot_Moses_and_the_Ten_Commandments.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tissot_Moses_and_the_Ten_Commandments.jpg",
    objectPosition: "50% 40%",
  },
  beatitudes: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/21/The_sermon_on_the_mount.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:The_sermon_on_the_mount.jpg",
    objectPosition: "50% 44%",
  },
  rosary: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Virgin_Mary_and_Child_Jesus_with_a_Rosary_-_Artemisia_Gentileschi.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Virgin_Mary_and_Child_Jesus_with_a_Rosary_-_Artemisia_Gentileschi.jpg",
    objectPosition: "50% 42%",
  },
} as const satisfies Record<FivePrayersTrack["theme"], FivePrayersArtwork>;

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
    artwork: FIVE_PRAYERS_ARTWORK.spirit,
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
    artwork: FIVE_PRAYERS_ARTWORK.faith,
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
    artwork: FIVE_PRAYERS_ARTWORK.commandments,
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
    artwork: FIVE_PRAYERS_ARTWORK.beatitudes,
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
    artwork: FIVE_PRAYERS_ARTWORK.rosary,
  },
] as const;

const PRAYER_SECTION_SPECS: readonly PrayerSectionSpec[] = [
  { id: "sign-of-cross", trackId: "track-1", title: "Dấu Thánh Giá", firstCueNumber: 1 },
  { id: "holy-spirit", trackId: "track-1", title: "Kinh Đức Chúa Thánh Thần", firstCueNumber: 4 },
  { id: "our-father", trackId: "track-1", title: "Kinh Lạy Cha", firstCueNumber: 16 },
  { id: "hail-mary", trackId: "track-1", title: "Kinh Kính Mừng", firstCueNumber: 25 },
  { id: "glory-be", trackId: "track-1", title: "Kinh Sáng Danh", firstCueNumber: 31 },
  { id: "faith", trackId: "track-2", title: "Kinh Tin", firstCueNumber: 1 },
  { id: "hope", trackId: "track-2", title: "Kinh Cậy", firstCueNumber: 11 },
  { id: "love", trackId: "track-2", title: "Kinh Mến", firstCueNumber: 19 },
  { id: "contrition", trackId: "track-2", title: "Kinh Ăn Năn Tội", firstCueNumber: 25 },
  { id: "apostles-creed", trackId: "track-2", title: "Kinh Tin Kính", firstCueNumber: 35 },
  { id: "confiteor", trackId: "track-3", title: "Kinh Cáo Mình", firstCueNumber: 1 },
  { id: "ten-commandments", trackId: "track-3", title: "Mười Điều Răn", firstCueNumber: 14 },
  { id: "church-commandments", trackId: "track-3", title: "Sáu Điều Răn Hội Thánh", firstCueNumber: 31 },
  { id: "seven-virtues", trackId: "track-3", title: "Cải Tội Bảy Mối Có Bảy Đức", firstCueNumber: 44 },
  { id: "beatitudes", trackId: "track-4", title: "Phúc Thật Tám Mối", firstCueNumber: 1 },
  { id: "thanksgiving", trackId: "track-4", title: "Kinh Cám Ơn", firstCueNumber: 23 },
  { id: "trust-in-mary", trackId: "track-5", title: "Kinh Trông Cậy", firstCueNumber: 1 },
  { id: "sacred-heart", trackId: "track-5", title: "Trái Tim Đức Chúa Giêsu", firstCueNumber: 7 },
  { id: "immaculate-heart", trackId: "track-5", title: "Trái Tim Đức Bà Maria", firstCueNumber: 9 },
  { id: "saint-joseph", trackId: "track-5", title: "Kinh Thánh Giuse", firstCueNumber: 12 },
  { id: "joyful-mysteries", trackId: "track-5", title: "Năm Sự Vui", firstCueNumber: 15 },
  { id: "sorrowful-mysteries", trackId: "track-5", title: "Năm Sự Thương", firstCueNumber: 31 },
  { id: "glorious-mysteries", trackId: "track-5", title: "Năm Sự Mừng", firstCueNumber: 49 },
];

export const FIVE_PRAYERS_PREVIEW_SECTIONS = FIVE_PRAYERS_TRACKS.map((track) => ({
  id: track.id,
  label: `Video ${String(track.number).padStart(2, "0")}`,
  title: `${track.title} · ${track.subtitle}`,
  startSeconds: track.start,
  endSeconds: track.end,
}));

export const FIVE_PRAYERS_LYRIC_CUES: readonly FivePrayersLyricCue[] =
  FIVE_PRAYERS_TRACKS.flatMap(createTrackCues);

export const FIVE_PRAYERS_PRAYER_SECTIONS: readonly FivePrayersPrayerSection[] =
  PRAYER_SECTION_SPECS.map((spec, index) => {
    const track = FIVE_PRAYERS_TRACKS.find((candidate) => candidate.id === spec.trackId);
    if (!track) throw new Error(`Five Prayers section "${spec.id}" points to missing track "${spec.trackId}".`);

    const firstCue = findTrackCue(track.number, spec.firstCueNumber);
    const previousSpec = PRAYER_SECTION_SPECS[index - 1];
    const nextSpec = PRAYER_SECTION_SPECS[index + 1];
    const isFirstSectionInTrack = previousSpec?.trackId !== spec.trackId;
    const nextStart = nextSpec?.trackId === spec.trackId
      ? findTrackCue(track.number, nextSpec.firstCueNumber).start
      : track.end;

    return {
      id: spec.id,
      trackId: spec.trackId,
      title: spec.title,
      start: isFirstSectionInTrack ? track.start : firstCue.start,
      end: nextStart,
    };
  });

export function getFivePrayersTrack(timeSeconds: number) {
  return FIVE_PRAYERS_TRACKS.find((track) => timeSeconds >= track.start && timeSeconds < track.end)
    ?? FIVE_PRAYERS_TRACKS[FIVE_PRAYERS_TRACKS.length - 1];
}

export function getFivePrayersPrayerSection(timeSeconds: number) {
  return FIVE_PRAYERS_PRAYER_SECTIONS.find(
    (section) => timeSeconds >= section.start && timeSeconds < section.end,
  ) ?? FIVE_PRAYERS_PRAYER_SECTIONS[FIVE_PRAYERS_PRAYER_SECTIONS.length - 1];
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
      id: cueId(track.number, index + 1),
      trackId: track.id,
      start,
      end,
      lines,
    };
  });
}

function findTrackCue(trackNumber: number, cueNumber: number) {
  const cue = FIVE_PRAYERS_LYRIC_CUES.find((candidate) => candidate.id === cueId(trackNumber, cueNumber));
  if (!cue) throw new Error(`Five Prayers cue ${trackNumber}.${cueNumber} is missing.`);
  return cue;
}

function cueId(trackNumber: number, cueNumber: number) {
  return `prayer-${trackNumber}-${String(cueNumber).padStart(3, "0")}`;
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
