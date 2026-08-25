import type { Lang } from "@/lib/i18n";
import { ANIMAL_SPRITES, type AnimalSpriteEntry } from "@/lib/animalColumns";
import type { MarbleAvatar } from "../types";

export const MARBLE_AVATARS: MarbleAvatar[] = [
  "ball",
  ...ANIMAL_SPRITES.map((entry) => `animal-${entry.id}` as MarbleAvatar),
];

const VIETNAMESE_ANIMALS = [
  "Chuột",
  "Chuột hamster",
  "Chồn đất",
  "Thỏ",
  "Chim cánh cụt",
  "Mèo",
  "Cáo",
  "Gấu trúc đỏ",
  "Gấu",
  "Hươu",
  "Dê",
  "Lạc đà Alpaca",
  "Kangaroo",
  "Sói",
  "Ngựa con",
  "Ngựa vằn",
  "Sư tử",
  "Hổ",
  "Bò",
  "Hươu cao cổ",
] as const;

export function marbleAvatarEntry(avatar: MarbleAvatar): AnimalSpriteEntry | null {
  if (avatar === "ball") return null;
  const id = avatar.match(/^animal-(\d+)$/)?.[1];
  return id ? ANIMAL_SPRITES.find((entry) => entry.id === id) ?? null : null;
}

export function marbleAvatarText(lang: Lang, avatar: MarbleAvatar) {
  if (avatar === "ball") return lang === "vi" ? "Bi" : "Marble";
  const entry = marbleAvatarEntry(avatar);
  if (!entry) return lang === "vi" ? "Nhân vật" : "Character";
  return lang === "vi" ? VIETNAMESE_ANIMALS[entry.heightWeight - 1] ?? entry.label : entry.label;
}
