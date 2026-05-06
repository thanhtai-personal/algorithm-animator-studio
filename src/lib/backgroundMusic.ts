import type { MusicPreset } from "./audio";
import type { Lang } from "./i18n";

const bgAudioModules = import.meta.glob<string>("@/assets/audios/bg-audio/*", {
  query: "?url",
  import: "default",
});

export type AssetMusicId = `asset:${string}`;
export type BackgroundMusicId = MusicPreset | AssetMusicId;

export type AssetMusicOption = {
  id: AssetMusicId;
  label: Record<Lang, string>;
  loadUrl: () => Promise<string>;
};

function titleFromPath(path: string) {
  const filename = path.split("/").pop() ?? path;
  return filename.replace(/\.[^.]+$/, "");
}

function idFromPath(path: string): AssetMusicId {
  return `asset:${titleFromPath(path).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export const ASSET_MUSIC_OPTIONS: AssetMusicOption[] = Object.entries(bgAudioModules)
  .map(([path, loader]) => {
    const title = titleFromPath(path);
    return {
      id: idFromPath(path),
      label: { en: title, vi: title },
      loadUrl: loader,
    };
  })
  .sort((a, b) => a.label.en.localeCompare(b.label.en));

export function isAssetMusicId(id: BackgroundMusicId): id is AssetMusicId {
  return id.startsWith("asset:");
}

export function getAssetMusicOption(id: BackgroundMusicId) {
  return isAssetMusicId(id) ? ASSET_MUSIC_OPTIONS.find((option) => option.id === id) : undefined;
}

export function isProceduralMusicPreset(id: BackgroundMusicId): id is Exclude<MusicPreset, "custom"> {
  return id === "off" || id === "lofi" || id === "ambient" || id === "chill" || id === "upbeat";
}
