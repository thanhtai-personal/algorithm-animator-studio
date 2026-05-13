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
  weightValue: number;
  actions: Record<"idle" | "jump", SpriteAction>;
  widthScale?: number;
  baselineOffset?: number;
};

const spriteModules = import.meta.glob("@/assets/sprites/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

const FRAME_RECTS = {
  idle: [
    { x: 70, y: 45, w: 340, h: 485 },
    { x: 350, y: 45, w: 390, h: 485 },
    { x: 700, y: 35, w: 400, h: 505 },
    { x: 1025, y: 45, w: 380, h: 485 },
  ],
  jump: [
    { x: 0, y: 600, w: 250, h: 430 },
    { x: 240, y: 555, w: 260, h: 455 },
    { x: 480, y: 520, w: 260, h: 455 },
    { x: 720, y: 505, w: 260, h: 455 },
    { x: 955, y: 555, w: 270, h: 455 },
    { x: 1195, y: 630, w: 250, h: 390 },
  ],
};

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
      weightValue: heightWeight,
      actions: createDefaultActions(),
      widthScale: 1,
      baselineOffset: 0,
    };
  })
  .filter((entry) => entry.heightWeight >= 1 && entry.heightWeight <= 20)
  .sort((a, b) => a.heightWeight - b.heightWeight);

export const ANIMAL_WEIGHT_VALUES = ANIMAL_SPRITES.map((entry) => entry.weightValue);

const imageCache = new Map<string, HTMLImageElement>();
const spriteCache = new Map<string, Sprite>();

export function spriteForWeight(weight: number): AnimalSpriteEntry | null {
  if (ANIMAL_SPRITES.length === 0) return null;
  const exact = ANIMAL_SPRITES.find((entry) => entry.weightValue === weight);
  if (exact) return exact;
  return ANIMAL_SPRITES.reduce((best, entry) =>
    Math.abs(entry.weightValue - weight) < Math.abs(best.weightValue - weight) ? entry : best,
  );
}

export function weightForValue(value: number): number {
  if (ANIMAL_WEIGHT_VALUES.includes(value)) return value;
  return ANIMAL_WEIGHT_VALUES.reduce((best, weight) =>
    Math.abs(weight - value) < Math.abs(best - value) ? weight : best,
    ANIMAL_WEIGHT_VALUES[0] ?? value,
  );
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
      frames: [FRAME_RECTS.idle[0]],
      frameDurationMs: 500,
    },
    jump: {
      frames: FRAME_RECTS.jump,
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
