import type { MusicLibraryTrack } from "@/lib/musicLibrary";
import type { PresetVideoMusicRecommendation } from "../types";

export function findRecommendedPresetMusic(
  tracks: readonly MusicLibraryTrack[],
  recommendation?: PresetVideoMusicRecommendation,
) {
  if (!recommendation || !tracks.length) return undefined;

  const keywords = recommendation.keywords
    .map(normalizeMusicText)
    .flatMap((value) => value.split(" "))
    .filter(Boolean);

  let bestTrack: MusicLibraryTrack | undefined;
  let bestScore = 0;

  for (const track of tracks) {
    const haystack = normalizeMusicText(`${track.title} ${track.folderName} ${track.fileName}`);
    const score = keywords.reduce((total, keyword) => (
      total + (keyword.length >= 3 && haystack.includes(keyword) ? keyword.length : 0)
    ), 0);

    if (score > bestScore) {
      bestScore = score;
      bestTrack = track;
    }
  }

  return bestScore > 0 ? bestTrack : undefined;
}

function normalizeMusicText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
