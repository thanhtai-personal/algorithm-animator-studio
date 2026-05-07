export function toYouTubeEmbedUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  const urlValue =
    raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;

  try {
    const parsed = new URL(urlValue);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    let videoId: string | null = null;

    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtube-nocookie.com" ||
      host.endsWith(".youtube-nocookie.com")
    ) {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v");
      } else if (
        parsed.pathname.startsWith("/embed/") ||
        parsed.pathname.startsWith("/shorts/") ||
        parsed.pathname.startsWith("/live/")
      ) {
        videoId = parsed.pathname.split("/")[2] ?? null;
      }
    }

    const normalizedId = videoId?.trim() ?? "";
    if (!/^[A-Za-z0-9_-]{6,}$/.test(normalizedId)) {
      return null;
    }

    return `https://www.youtube.com/embed/${normalizedId}`;
  } catch {
    return null;
  }
}
