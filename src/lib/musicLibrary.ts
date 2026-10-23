import { buildRuntimeSettingsHeaders, getRuntimeSettingsToken } from "./runtimeSettings";
import { buildApiUrl, parseApiResponse } from "./runtimeApi";
import type { LibraryMusicId } from "./backgroundMusic";

export type MusicLibraryTrack = {
  id: LibraryMusicId;
  title: string;
  folderName: string;
  fileName: string;
  audioUrl: string;
  licenseText?: string;
};

type ApiTrack = Omit<MusicLibraryTrack, "id"> & { id: string };

export async function getMusicLibraryTracks() {
  const data = await parseApiResponse<{ tracks: ApiTrack[] }>(await fetch(buildApiUrl("/api/music-library"), {
    headers: buildRuntimeSettingsHeaders(),
  }));
  const settingsToken = getRuntimeSettingsToken();
  return data.tracks.map((track) => ({
    ...track,
    id: `library:${track.id}` as LibraryMusicId,
    audioUrl: settingsToken ? `${track.audioUrl}?settings=${encodeURIComponent(settingsToken)}` : track.audioUrl,
  }));
}

export function getMusicLibraryTrackKey(id: LibraryMusicId) {
  return id.replace(/^library:/, "");
}
