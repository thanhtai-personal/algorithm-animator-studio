export type LandTileName = "night" | "tree" | "grass" | "stone";

export type LandTileFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type LandTileMap = {
  tileWidth: number;
  rows: {
    height: number;
    tileWidth?: number;
    tiles: LandTileName[];
  }[];
};

type LandTileMapSpriteOptions = {
  imageUrl: string;
  frames?: Partial<Record<LandTileName, LandTileFrame>>;
};

const DEFAULT_FRAMES: Record<LandTileName, LandTileFrame> = {
  night: { x: 0, y: 0, w: 850, h: 128 },
  tree: { x: 0, y: 92, w: 38, h: 42 },
  grass: { x: 160, y: 176, w: 42, h: 22 },
  stone: { x: 0, y: 190, w: 42, h: 84 },
};

export class LandTileMapSprite {
  private readonly image: HTMLImageElement | null;
  private readonly frames: Record<LandTileName, LandTileFrame>;

  constructor(options: LandTileMapSpriteOptions) {
    this.frames = { ...DEFAULT_FRAMES, ...options.frames };
    if (typeof Image === "undefined") {
      this.image = null;
      return;
    }
    this.image = new Image();
    this.image.src = options.imageUrl;
  }

  drawMap(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, map: LandTileMap) {
    if (!this.image?.complete || this.image.naturalWidth <= 0 || this.image.naturalHeight <= 0) return false;

    ctx.save();
    let dy = y;
    for (let row = 0; dy < y + h; row++) {
      const tileRow = map.rows[row % map.rows.length];
      if (!tileRow?.tiles.length) continue;
      const tileWidth = Math.max(1, tileRow.tileWidth ?? map.tileWidth);
      const colCount = Math.ceil(w / tileWidth);
      const rowHeight = Math.min(tileRow.height, y + h - dy);
      for (let col = 0; col < colCount; col++) {
        const tile = tileRow.tiles[col % tileRow.tiles.length];
        this.drawTile(ctx, tile, x + col * tileWidth, dy, tileWidth, rowHeight);
      }
      dy += tileRow.height;
    }
    ctx.restore();
    return true;
  }

  drawTile(ctx: CanvasRenderingContext2D, tile: LandTileName, x: number, y: number, w: number, h: number) {
    if (!this.image?.complete || this.image.naturalWidth <= 0 || this.image.naturalHeight <= 0) return false;
    const frame = this.frames[tile];
    ctx.drawImage(this.image, frame.x, frame.y, frame.w, frame.h, x, y, w, h);
    return true;
  }

  drawBackground(ctx: CanvasRenderingContext2D, tile: LandTileName, x: number, y: number, w: number, h: number) {
    if (!this.image?.complete || this.image.naturalWidth <= 0 || this.image.naturalHeight <= 0) return false;
    const frame = this.frames[tile];
    const scale = Math.max(h / frame.h, 1);
    const drawW = frame.w * scale;
    const drawH = frame.h * scale;
    const drawY = y + h - drawH;

    ctx.save();
    if (drawW >= w) {
      ctx.drawImage(this.image, frame.x, frame.y, frame.w, frame.h, x, drawY, drawW, drawH);
    } else {
      for (let dx = x; dx < x + w; dx += drawW) {
        ctx.drawImage(this.image, frame.x, frame.y, frame.w, frame.h, dx, drawY, drawW, drawH);
      }
    }
    ctx.restore();
    return true;
  }
}
