export type StudioSolid =
  | {
    id: string;
    kind: "cylinder";
    position: readonly [number, number, number];
    radiusTop: number;
    radiusBottom: number;
    height: number;
  }
  | {
    id: string;
    kind: "box";
    position: readonly [number, number, number];
    size: readonly [number, number, number];
  };

export const TOWER_CORE_SOLID: StudioSolid = {
  id: "tower-core",
  kind: "cylinder",
  position: [0, 17, 12],
  radiusTop: 1.55,
  radiusBottom: 1.9,
  height: 34,
};

export const STUDIO_COLUMN_SOLIDS: StudioSolid[] = [-26, -13, 0, 13, 26].map((x) => ({
  id: `studio-column-${x}`,
  kind: "box" as const,
  position: [x, 18, 18] as const,
  size: [0.35, 36, 0.35] as const,
}));

export const STUDIO_SOLIDS: StudioSolid[] = [TOWER_CORE_SOLID, ...STUDIO_COLUMN_SOLIDS];
