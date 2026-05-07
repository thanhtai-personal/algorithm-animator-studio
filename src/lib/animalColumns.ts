import { Sprite, SpriteAction } from "@/lib/sprites/Sprite";

export type ColumnVisualMode = "bar" | "animal";

export type AnimalColumnSettings = {
  mode: ColumnVisualMode;
  spriteScale: number;
  jumpIntensity: number;
  highlightJump: boolean;
};

export type AnimalSpriteEntry = {
  id: string;
  label: string;
  src: string;
  heightWeight: number;
  actions: Record<"idle" | "jump", SpriteAction>;
  widthScale?: number;
  baselineOffset?: number;
};

const spriteModules = import.meta.glob("@/assets/sprites/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

const SHEET_W = 1448;
const SHEET_H = 1086;
const TOP_ROW_H = SHEET_H / 2;
const IDLE_FRAME_W = SHEET_W / 4;
const JUMP_FRAME_W = SHEET_W / 6;

export const ANIMAL_SPRITES: AnimalSpriteEntry[] = Object.entries(spriteModules)
  .map(([path, src]) => {
    const fileName = path.split("/").pop() ?? "";
    const match = fileName.match(/^(\d+)_?(.+)?\.png$/);
    const heightWeight = match ? Number(match[1]) : 0;
    const label = toLabel(match?.[2] ?? `Animal ${heightWeight}`);
    return {
      id: String(heightWeight),
      label,
      src: String(src),
      heightWeight,
      actions: createDefaultActions(),
      widthScale: 1,
      baselineOffset: 0,
    };
  })
  .filter((entry) => entry.heightWeight >= 1 && entry.heightWeight <= 20)
  .sort((a, b) => a.heightWeight - b.heightWeight);

const imageCache = new Map<string, HTMLImageElement>();
const spriteCache = new Map<string, Sprite>();

export function spriteForWeight(weight: number): AnimalSpriteEntry | null {
  if (ANIMAL_SPRITES.length === 0) return null;
  return ANIMAL_SPRITES.reduce((best, entry) =>
    Math.abs(entry.heightWeight - weight) < Math.abs(best.heightWeight - weight) ? entry : best,
  );
}

export function weightForValue(value: number, values: number[]): number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 10;
  const normalized = (value - min) / (max - min);
  return Math.max(1, Math.min(20, Math.round(1 + normalized * 19)));
}

export function getSprite(entry: AnimalSpriteEntry): Sprite | null {
  const cached = spriteCache.get(entry.id);
  if (cached) return cached;

  const image = getImage(entry.src);
  if (!image) return null;
  const sprite = new Sprite({ image, actions: entry.actions, defaultAction: "idle" });
  spriteCache.set(entry.id, sprite);
  return sprite;
}

export function preloadAnimalSprites() {
  ANIMAL_SPRITES.forEach((entry) => getImage(entry.src));
}

function getImage(src: string): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  const cached = imageCache.get(src);
  if (cached) return cached;

  const image = new Image();
  image.src = src;
  imageCache.set(src, image);
  return image;
}

function createDefaultActions(): Record<"idle" | "jump", SpriteAction> {
  return {
    idle: {
      frames: [
        { x: 0, y: 0, w: IDLE_FRAME_W, h: TOP_ROW_H },
        { x: IDLE_FRAME_W * 2, y: 0, w: IDLE_FRAME_W, h: TOP_ROW_H },
      ],
      frameDurationMs: 500,
    },
    jump: {
      frames: Array.from({ length: 6 }, (_, index) => ({
        x: JUMP_FRAME_W * index,
        y: TOP_ROW_H,
        w: JUMP_FRAME_W,
        h: TOP_ROW_H,
      })),
      frameDurationMs: 90,
    },
  };
}

function toLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}
