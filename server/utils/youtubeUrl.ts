const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"]);

export function normalizeYoutubeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Chưa nhập link YouTube.");

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Link YouTube không hợp lệ.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!["http:", "https:"].includes(parsed.protocol) || !YOUTUBE_HOSTS.has(hostname)) {
    throw new Error("Chỉ hỗ trợ link YouTube/youtu.be.");
  }
  return parsed.toString();
}
