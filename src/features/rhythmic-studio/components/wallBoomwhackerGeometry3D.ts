export interface WallBoomwhackerGeometry {
  radius: number;
  length: number;
  mouthZ: number;
  backZ: number;
}

export function wallBoomwhackerGeometry(
  _width: number,
  height: number,
  depth: number,
  compact = false,
): WallBoomwhackerGeometry {
  const radius = compact ? height * 0.5 : Math.max(0.135, height * 0.52);
  const length = Math.max(2.05, depth);
  return {
    radius,
    length,
    mouthZ: length * 0.5,
    backZ: -length * 0.5,
  };
}
