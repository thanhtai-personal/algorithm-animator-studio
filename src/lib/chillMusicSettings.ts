export type ChillTrack = {
  id: string;
  title: string;
  embedCode: string;
};

type ChillEmbedOptions = {
  autoplay?: boolean;
  enableJsApi?: boolean;
};

const STORAGE_KEY = "kai-studio.chill-tracks";
const CHANGE_EVENT = "kai-studio:chill-tracks-change";

const DEFAULT_EMBED = `<iframe width="560" height="315" src="https://www.youtube.com/embed/S3jQYY-SDIg?si=WpNI2fDDSVPtVh44" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;

export const DEFAULT_CHILL_TRACKS: ChillTrack[] = [
  { id: "default-bigbang", title: "Big Bang Chill", embedCode: DEFAULT_EMBED },
];

export function readChillTracks(): ChillTrack[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CHILL_TRACKS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_CHILL_TRACKS;
    return parsed
      .map((item) => sanitizeTrack(item))
      .filter((item): item is ChillTrack => Boolean(item));
  } catch {
    return DEFAULT_CHILL_TRACKS;
  }
}

export function saveChillTracks(tracks: ChillTrack[]) {
  const sanitized = tracks
    .map((item) => sanitizeTrack(item))
    .filter((item): item is ChillTrack => Boolean(item));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  window.dispatchEvent(new CustomEvent<ChillTrack[]>(CHANGE_EVENT, { detail: sanitized }));
  return sanitized;
}

export function subscribeChillTracks(callback: (tracks: ChillTrack[]) => void) {
  const handleChange = (event: Event) => {
    callback((event as CustomEvent<ChillTrack[]>).detail || readChillTracks());
  };
  window.addEventListener(CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function getChillEmbedSrc(embedCode: string, options: ChillEmbedOptions = {}) {
  const value = embedCode.trim();
  const iframeMatch = value.match(/src=["']([^"']+)["']/i);
  const rawUrl = iframeMatch?.[1] || value;
  try {
    const url = new URL(rawUrl);
    const videoId = resolveYoutubeId(url);
    if (!videoId) return "";
    const next = new URL(`https://www.youtube.com/embed/${videoId}`);
    url.searchParams.forEach((paramValue, key) => {
      if (key !== "v" && key !== "si") next.searchParams.set(key, paramValue);
    });
    next.searchParams.set("autoplay", options.autoplay === false ? "0" : "1");
    next.searchParams.set("playsinline", "1");
    next.searchParams.set("disablekb", "1");
    if (options.enableJsApi) {
      next.searchParams.set("enablejsapi", "1");
      if (window.location.origin && window.location.origin !== "null") {
        next.searchParams.set("origin", window.location.origin);
      }
    }
    return next.toString();
  } catch {
    return "";
  }
}

function resolveYoutubeId(url: URL) {
  if (url.hostname.includes("youtu.be")) return url.pathname.split("/").filter(Boolean)[0] || "";
  if (url.pathname.startsWith("/embed/")) return url.pathname.split("/").filter(Boolean)[1] || "";
  if (url.hostname.includes("youtube.com")) return url.searchParams.get("v") || "";
  return "";
}

function sanitizeTrack(value: unknown): ChillTrack | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const embedCode = typeof item.embedCode === "string" ? item.embedCode.trim() : "";
  if (!embedCode || !getChillEmbedSrc(embedCode, { autoplay: false })) return null;
  return {
    id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : crypto.randomUUID(),
    title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : "Chill track",
    embedCode,
  };
}
