import { useMemo, useState } from "react";
import { toast } from "sonner";

export type VideoBackgroundItem = {
  id: string;
  label: string;
  src: string;
  durationSec: number | null;
  image: HTMLImageElement | null;
};

export function useVideoBackgroundImages(totalDuration: number) {
  const [items, setItems] = useState<VideoBackgroundItem[]>([]);

  const segments = useMemo(() => buildSegments(items, totalDuration), [items, totalDuration]);

  function addBackgroundUrl(value: string) {
    const src = value.trim();
    if (!src) return;
    const label = src.split("/").pop()?.split("?")[0] || "Linked image";
    addItem(label, src);
  }

  function uploadBackgroundFiles(files: FileList | null) {
    Array.from(files ?? []).forEach((file) => addItem(file.name, URL.createObjectURL(file)));
  }

  function addItem(label: string, src: string) {
    const image = new Image();
    image.crossOrigin = "anonymous";
    const item: VideoBackgroundItem = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, label, src, durationSec: null, image };
    image.onload = () => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, image } : entry));
    image.onerror = () => toast.error(`Không tải được ảnh nền: ${label}`);
    image.src = src;
    setItems((current) => [...current, item]);
  }

  function updateBackgroundDuration(id: string, value: string) {
    const next = value.trim() ? Math.max(0.1, Number(value)) : null;
    setItems((current) => current.map((item) => item.id === id ? { ...item, durationSec: Number.isFinite(next) ? next : null } : item));
  }

  function removeBackground(id: string) {
    setItems((current) => current.filter((item) => {
      if (item.id === id && item.src.startsWith("blob:")) URL.revokeObjectURL(item.src);
      return item.id !== id;
    }));
  }

  function getBackgroundImageAt(timeSec: number) {
    if (!segments.length) return null;
    const safeTime = Math.max(0, Math.min(totalDuration, timeSec));
    return segments.find((segment) => safeTime >= segment.start && safeTime < segment.end)?.item.image
      ?? segments[segments.length - 1]?.item.image
      ?? null;
  }

  return { backgroundImages: items, backgroundSegments: segments, addBackgroundUrl, uploadBackgroundFiles, updateBackgroundDuration, removeBackground, getBackgroundImageAt };
}

function buildSegments(items: VideoBackgroundItem[], totalDuration: number) {
  if (!items.length) return [];
  const safeTotal = Math.max(1, totalDuration);
  const fixed = items.reduce((sum, item) => sum + (item.durationSec ?? 0), 0);
  const flexible = items.filter((item) => !item.durationSec).length;
  const fallback = flexible ? Math.max(0.1, (safeTotal - fixed) / flexible) : 0;
  let cursor = 0;
  return items.map((item, index) => {
    const duration = item.durationSec ?? fallback;
    const start = cursor;
    const end = index === items.length - 1 ? safeTotal : Math.min(safeTotal, cursor + duration);
    cursor = end;
    return { item, start, end };
  });
}
