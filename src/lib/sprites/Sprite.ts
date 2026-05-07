export type SpriteActionName = "idle" | "jump" | string;

export type SpriteFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type SpriteAction = {
  frames: SpriteFrame[];
  loop?: boolean;
  frameDurationMs?: number;
};

export type SpriteDrawOptions = {
  width: number;
  height: number;
  alpha?: number;
};

type SpriteOptions = {
  image: HTMLImageElement;
  actions: Record<SpriteActionName, SpriteAction>;
  defaultAction?: SpriteActionName;
};

export class Sprite {
  private readonly image: HTMLImageElement;
  private readonly actions: Record<SpriteActionName, SpriteAction>;
  private readonly preparedFrames = new Map<string, PreparedFrame | null>();
  private actionName: SpriteActionName;
  private elapsedMs = 0;

  constructor(options: SpriteOptions) {
    this.image = options.image;
    this.actions = options.actions;
    this.actionName = options.defaultAction ?? "idle";
  }

  setAction(actionName: SpriteActionName) {
    if (!this.actions[actionName]) return;
    if (this.actionName === actionName) return;
    this.actionName = actionName;
    this.elapsedMs = 0;
  }

  getAction() {
    return this.actionName;
  }

  resetAction(actionName = this.actionName) {
    if (this.actions[actionName]) this.actionName = actionName;
    this.elapsedMs = 0;
  }

  update(deltaMs: number) {
    this.elapsedMs += Math.max(0, deltaMs);
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, options: SpriteDrawOptions) {
    const action = this.actions[this.actionName] ?? this.actions.idle;
    const frame = resolveFrame(action, this.elapsedMs);
    if (!frame || !this.image.complete || this.image.naturalWidth <= 0) return false;
    const prepared = this.prepareFrame(frame);
    if (!prepared) return false;

    const aspect = prepared.w / prepared.h;
    const drawH = options.height;
    const drawW = Math.min(options.width, drawH * aspect);
    const drawX = x + (options.width - drawW) / 2;

    ctx.save();
    ctx.globalAlpha = options.alpha ?? 1;
    ctx.drawImage(prepared.canvas, prepared.x, prepared.y, prepared.w, prepared.h, drawX, y, drawW, drawH);
    ctx.restore();
    return true;
  }

  private prepareFrame(frame: SpriteFrame): PreparedFrame | null {
    const key = `${frame.x}:${frame.y}:${frame.w}:${frame.h}`;
    if (this.preparedFrames.has(key)) return this.preparedFrames.get(key) ?? null;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(frame.w));
    canvas.height = Math.max(1, Math.round(frame.h));
    const canvasContext = canvas.getContext("2d", { willReadFrequently: true });
    if (!canvasContext) return null;

    canvasContext.drawImage(this.image, frame.x, frame.y, frame.w, frame.h, 0, 0, canvas.width, canvas.height);
    const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
    removeConnectedBackground(imageData, canvas.width, canvas.height);
    canvasContext.putImageData(imageData, 0, 0);

    const bounds = getOpaqueBounds(imageData, canvas.width, canvas.height);
    if (!bounds) {
      this.preparedFrames.set(key, null);
      return null;
    }

    const prepared = { canvas, ...bounds };
    this.preparedFrames.set(key, prepared);
    return prepared;
  }
}

type PreparedFrame = {
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
  w: number;
  h: number;
};

function resolveFrame(action: SpriteAction | undefined, elapsedMs: number): SpriteFrame | null {
  if (!action?.frames.length) return null;
  if (action.frames.length === 1) return action.frames[0];

  const frameDuration = Math.max(40, action.frameDurationMs ?? 120);
  const frameIndex = Math.floor(elapsedMs / frameDuration);
  if (action.loop !== false) return action.frames[frameIndex % action.frames.length];
  return action.frames[Math.min(action.frames.length - 1, frameIndex)];
}

function removeConnectedBackground(imageData: ImageData, width: number, height: number) {
  const { data } = imageData;
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (visited[index]) return;
    const dataIndex = index * 4;
    if (!isBackgroundPixel(data[dataIndex], data[dataIndex + 1], data[dataIndex + 2], data[dataIndex + 3])) return;
    visited[index] = 1;
    queue.push(index);
  };

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let i = 0; i < queue.length; i++) {
    const index = queue[i];
    const x = index % width;
    const y = Math.floor(index / width);
    data[index * 4 + 3] = 0;
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }
}

function getOpaqueBounds(imageData: ImageData, width: number, height: number) {
  const { data } = imageData;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= 8) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function isBackgroundPixel(r: number, g: number, b: number, a: number) {
  if (a <= 8) return true;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return r >= 220 && g >= 220 && b >= 220 && spread <= 26;
}
