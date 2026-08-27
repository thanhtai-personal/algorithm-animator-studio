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
  position: [-37, 33, 20],
  radiusTop: 1.55,
  radiusBottom: 1.9,
  height: 66,
};

const STUDIO_COLUMN_POSITIONS = [
  [-32, -8], [-32, 42], [32, -8], [32, 42],
] as const;

export const STUDIO_COLUMN_SOLIDS: StudioSolid[] = STUDIO_COLUMN_POSITIONS.map(([x, z]) => ({
  id: `studio-column-${x}-${z}`,
  kind: "box" as const,
  position: [x, 35, z] as const,
  size: [0.45, 70, 0.45] as const,
}));

export const STUDIO_SOLIDS: StudioSolid[] = [TOWER_CORE_SOLID, ...STUDIO_COLUMN_SOLIDS];
