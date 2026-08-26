import haalandSpriteUrl from "../../../../haaland.jpg";
import type { AnimalSpriteEntry } from "@/lib/animalColumns";

// haaland.jpg is a 10 x 10 pose sheet. These hand-picked rectangles stay
// inside the pose grid (y=100..600), excluding the title and Premier League footer.
export const HAALAND_SPRITE_ENTRY: AnimalSpriteEntry = {
  id: "haaland",
  label: "Erling Haaland",
  src: haalandSpriteUrl,
  heightWeight: 0,
  weightValue: 0,
  widthScale: 0.94,
  baselineOffset: 0,
  actions: {
    idle: {
      frames: [{ x: 229, y: 544, w: 27, h: 48, clearRects: [{ x: 0, y: 0, w: 10, h: 10 }] }],
      frameDurationMs: 500,
    },
    jump: {
      frames: [
        { x: 88, y: 491, w: 30, h: 48, clearRects: [{ x: 0, y: 0, w: 10, h: 10 }] },
        { x: 89, y: 119, w: 29, h: 49, clearRects: [{ x: 0, y: 0, w: 10, h: 10 }] },
        { x: 43, y: 119, w: 29, h: 49, clearRects: [{ x: 0, y: 0, w: 10, h: 10 }] },
        { x: 272, y: 117, w: 30, h: 51, clearRects: [{ x: 0, y: 0, w: 10, h: 10 }] },
        { x: 179, y: 384, w: 25, h: 47, clearRects: [{ x: 0, y: 0, w: 10, h: 10 }] },
        { x: 178, y: 544, w: 30, h: 48, clearRects: [{ x: 0, y: 0, w: 10, h: 10 }] },
      ],
      loop: false,
      frameDurationMs: 90,
    },
  },
};
