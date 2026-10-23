import enAgentCatalog from "../locales/en/agent.json";
import enAuthCatalog from "../locales/en/auth.json";
import enCoreCatalog from "../locales/en/core.json";
import enMediaCatalog from "../locales/en/media.json";
import enNavigationCatalog from "../locales/en/navigation.json";
import enRuntimeCatalog from "../locales/en/runtime.json";
import enSettingsCatalog from "../locales/en/settings.json";
import enStudioCatalog from "../locales/en/studio.json";
import enVoiceCatalog from "../locales/en/voice.json";
import enYoutubeCatalog from "../locales/en/youtube.json";
import viAgentCatalog from "../locales/vi/agent.json";
import viAuthCatalog from "../locales/vi/auth.json";
import viCoreCatalog from "../locales/vi/core.json";
import viMediaCatalog from "../locales/vi/media.json";
import viNavigationCatalog from "../locales/vi/navigation.json";
import viRuntimeCatalog from "../locales/vi/runtime.json";
import viSettingsCatalog from "../locales/vi/settings.json";
import viStudioCatalog from "../locales/vi/studio.json";
import viVoiceCatalog from "../locales/vi/voice.json";
import viYoutubeCatalog from "../locales/vi/youtube.json";

export type Lang = "en" | "vi";
const enCatalog = {
  ...enCoreCatalog,
  ...enNavigationCatalog,
  ...enSettingsCatalog,
  ...enVoiceCatalog,
  ...enAgentCatalog,
  ...enMediaCatalog,
  ...enYoutubeCatalog,
  ...enRuntimeCatalog,
  ...enStudioCatalog,
  ...enAuthCatalog,
};
const viCatalog = {
  ...viCoreCatalog,
  ...viNavigationCatalog,
  ...viSettingsCatalog,
  ...viVoiceCatalog,
  ...viAgentCatalog,
  ...viMediaCatalog,
  ...viYoutubeCatalog,
  ...viRuntimeCatalog,
  ...viStudioCatalog,
  ...viAuthCatalog,
};

export type StringKey = keyof typeof enCatalog;

type LocaleCatalog = Record<StringKey, string>;
type LocalizedLabel = Record<Lang, string>;

export const SYSTEM_LANG_STORAGE_KEY = "algoshorts.systemLanguage";
export const SYSTEM_LANG_CHANGE_EVENT = "algoshorts:system-language-change";

const LOCALES: Record<Lang, LocaleCatalog> = {
  en: enCatalog,
  vi: viCatalog as LocaleCatalog,
};

export const STRINGS = Object.fromEntries(
  (Object.keys(enCatalog) as StringKey[]).map((key) => [key, { en: enCatalog[key], vi: LOCALES.vi[key] ?? enCatalog[key] }]),
) as Record<StringKey, LocalizedLabel>;

export function normalizeLang(value: unknown, fallback: Lang = "en"): Lang {
  return value === "vi" || value === "en" ? value : fallback;
}

export function readSystemLang(fallback: Lang = "en"): Lang {
  if (typeof window === "undefined") return fallback;
  return normalizeLang(window.localStorage.getItem(SYSTEM_LANG_STORAGE_KEY), fallback);
}

export function writeSystemLang(lang: Lang) {
  if (typeof window === "undefined") return;
  const nextLang = normalizeLang(lang);
  window.localStorage.setItem(SYSTEM_LANG_STORAGE_KEY, nextLang);
  window.dispatchEvent(new CustomEvent(SYSTEM_LANG_CHANGE_EVENT, { detail: nextLang }));
}

export function textByFlag(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}

export function uiText(viText: string, enText: string = viText) {
  return readSystemLang() === "vi" ? viText : enText;
}

export function subscribeSystemLang(listener: (lang: Lang) => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === SYSTEM_LANG_STORAGE_KEY) listener(normalizeLang(event.newValue));
  };
  const onCustom = (event: Event) => {
    listener(normalizeLang((event as CustomEvent<Lang>).detail));
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(SYSTEM_LANG_CHANGE_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SYSTEM_LANG_CHANGE_EVENT, onCustom);
  };
}

export const t = (lang: Lang, key: StringKey) => LOCALES[lang][key] ?? LOCALES.en[key] ?? key;

export function tf(lang: Lang, key: StringKey, values: Record<string, string | number>) {
  return t(lang, key).replace(/\{(\w+)\}/g, (match, valueKey) => String(values[valueKey] ?? match));
}

function localizedLabel(key: StringKey): LocalizedLabel {
  return { en: t("en", key), vi: t("vi", key) };
}

export const PLATFORMS = [
  { id: "tiktok", label: "TikTok 9:16 (1080×1920)", w: 1080, h: 1920 },
  { id: "reel", label: "Facebook Reel 9:16 (1080×1920)", w: 1080, h: 1920 },
  { id: "shorts", label: "YouTube Shorts 9:16 (1080×1920)", w: 1080, h: 1920 },
  { id: "square", label: "Square 1:1 (1080×1080)", w: 1080, h: 1080 },
  { id: "landscape", label: "Landscape 16:9 (1920×1080)", w: 1920, h: 1080 },
] as const;

export const SFX_OPTIONS = [
  { id: "off", label: localizedLabel("sfx.off") },
  { id: "pop", label: localizedLabel("sfx.pop") },
  { id: "click", label: localizedLabel("sfx.click") },
  { id: "beep", label: localizedLabel("sfx.beep") },
  { id: "marimba", label: localizedLabel("sfx.marimba") },
  { id: "piano", label: localizedLabel("sfx.piano") },
  { id: "key", label: localizedLabel("sfx.key") },
  { id: "retro", label: localizedLabel("sfx.retro") },
  { id: "blip", label: localizedLabel("sfx.blip") },
  { id: "swap-snap", label: localizedLabel("sfx.swap-snap") },
  { id: "swap-whoosh", label: localizedLabel("sfx.swap-whoosh") },
  { id: "swap-tick", label: localizedLabel("sfx.swap-tick") },
  { id: "swap-punch", label: localizedLabel("sfx.swap-punch") },
  { id: "swap-spark", label: localizedLabel("sfx.swap-spark") },
] as const;

export const MUSIC_PRESETS = [
  { id: "off", label: localizedLabel("music.off") },
  { id: "lofi", label: localizedLabel("music.lofi") },
  { id: "ambient", label: localizedLabel("music.ambient") },
  { id: "chill", label: localizedLabel("music.chill") },
  { id: "upbeat", label: localizedLabel("music.upbeat") },
  { id: "custom", label: localizedLabel("music.custom") },
] as const;
