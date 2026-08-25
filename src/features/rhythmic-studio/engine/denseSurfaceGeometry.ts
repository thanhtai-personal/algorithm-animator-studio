import type { DenseSurfaceLayout, MarblePlatform } from "./marblePhysicsTypes";

export interface DenseSurfaceSegment {
  id: string;
  surfaceId: number;
  fromIndex: number;
  toIndex: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  layout: DenseSurfaceLayout;
}

/** Physical polyline shared by Canvas and WebGL dense-passage renderers. */
export function denseSurfaceSegments(platforms: MarblePlatform[]): DenseSurfaceSegment[] {
  const visible = platforms.filter((platform) => !platform.visualHidden && platform.denseSurfaceId !== undefined);
  const segments: DenseSurfaceSegment[] = [];
  for (let index = 0; index < visible.length - 1; index += 1) {
    const from = visible[index];
    const to = visible[index + 1];
    if (from.denseSurfaceId !== to.denseSurfaceId || !from.denseLayout) continue;
    segments.push({
      id: `${from.denseSurfaceId}-${from.index}-${to.index}`,
      surfaceId: from.denseSurfaceId,
      fromIndex: from.index,
      toIndex: to.index,
      fromX: from.contactX,
      fromY: from.contactY,
      toX: to.contactX,
      toY: to.contactY,
      layout: from.denseLayout,
    });
  }
  return segments;
}
