import type { AssetSfxId, ProceduralSfxKind, SfxKind } from "./audio";
import type { Lang } from "./i18n";

const selectAudioModules = import.meta.glob<string>("@/assets/audios/select-audio/*", {
  query: "?url",
  import: "default",
});
const swapAudioModules = import.meta.glob<string>("@/assets/audios/swap-audio/*", {
  query: "?url",
  import: "default",
});

export type AssetSfxOption = {
  id: AssetSfxId;
  label: Record<Lang, string>;
  loadUrl: () => Promise<string>;
};

function titleFromPath(path: string) {
  const filename = path.split("/").pop() ?? path;
  return filename.replace(/\.[^.]+$/, "").trim();
}

function idFromPath(path: string): AssetSfxId {
  return `asset-sfx:${titleFromPath(path)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function optionsFromModules(modules: Record<string, () => Promise<string>>) {
  return Object.entries(modules)
    .map(([path, loader]) => {
      const title = titleFromPath(path);
      return {
        id: idFromPath(path),
        label: { en: title, vi: title },
        loadUrl: loader,
      };
    })
    .sort((a, b) => a.label.en.localeCompare(b.label.en));
}

export const SELECT_ASSET_SFX_OPTIONS: AssetSfxOption[] = optionsFromModules(selectAudioModules);
export const SWAP_ASSET_SFX_OPTIONS: AssetSfxOption[] = optionsFromModules(swapAudioModules);
export const ASSET_SFX_OPTIONS: AssetSfxOption[] = [
  ...SELECT_ASSET_SFX_OPTIONS,
  ...SWAP_ASSET_SFX_OPTIONS,
].sort((a, b) => a.label.en.localeCompare(b.label.en));

export function getAssetSfxOption(id: SfxKind) {
  return id.startsWith("asset-sfx:")
    ? ASSET_SFX_OPTIONS.find((option) => option.id === id)
    : undefined;
}

export function isProceduralSfxKind(id: SfxKind): id is ProceduralSfxKind {
  return !id.startsWith("asset-sfx:");
}
