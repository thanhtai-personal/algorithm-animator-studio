import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, OrthographicCamera, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { Frame, AlgorithmWorldCell, AlgorithmWorldState } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/renderer";
import { videoPreviewViewportStyle } from "@/lib/videoPreviewViewport";

type Props = {
  frame: Frame | null | undefined;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  theme: Theme;
  lang: Lang;
};

type Arena = {
  key: string;
  sideLabel: string;
  world: AlgorithmWorldState;
  color: string;
};

const CELL_SIZE = 0.48;
const WALL_HEIGHT = 0.42;
const TILE_INSET = 0.1;

function keyOf(cell: AlgorithmWorldCell) {
  return `${cell.x}:${cell.y}`;
}

function toWorld(cell: AlgorithmWorldCell, cols: number, rows: number): [number, number, number] {
  const x = (cell.x - (cols - 1) / 2) * CELL_SIZE;
  const z = (((rows - 1) / 2) - cell.y) * CELL_SIZE;
  return [x, 0, z];
}

function cellColor(kind: "closed" | "open" | "path" | "pulse", baseColor: string) {
  if (kind === "closed") return "#42367d";
  if (kind === "open") return "#2b8aa6";
  if (kind === "path") return "#24d17e";
  if (kind === "pulse") return baseColor;
  return baseColor;
}

function MazeArena({ arena, xOffset }: { arena: Arena; xOffset: number }) {
  const { world, color } = arena;
  const wallKeys = useMemo(() => new Set(world.walls.map(keyOf)), [world.walls]);
  const dynamicKeys = useMemo(() => new Set(world.dynamicWalls.map(keyOf)), [world.dynamicWalls]);
  const closedKeys = useMemo(() => new Set(world.closedSet.map(keyOf)), [world.closedSet]);
  const openKeys = useMemo(() => new Set(world.openSet.map(keyOf)), [world.openSet]);
  const pathKeys = useMemo(() => new Set(world.path.map(keyOf)), [world.path]);
  const pulseKeys = useMemo(() => new Set((world.pulseCells ?? []).map(keyOf)), [world.pulseCells]);
  const visibleKeys = useMemo(() => new Set((world.visibleCells ?? []).map(keyOf)), [world.visibleCells]);
  const goal = toWorld(world.goal, world.cols, world.rows);
  const start = toWorld(world.start, world.cols, world.rows);
  const current = world.current ? toWorld(world.current, world.cols, world.rows) : start;

  const tiles = useMemo(() => {
    const entries: Array<{ cell: AlgorithmWorldCell; kind: "closed" | "open" | "path" | "pulse"; color: string }> = [];
    for (const cell of world.closedSet) entries.push({ cell, kind: "closed", color: cellColor("closed", color) });
    for (const cell of world.openSet) if (!closedKeys.has(keyOf(cell))) entries.push({ cell, kind: "open", color: cellColor("open", color) });
    for (const cell of world.path) entries.push({ cell, kind: "path", color: cellColor("path", color) });
    for (const cell of world.pulseCells ?? []) entries.push({ cell, kind: "pulse", color: cellColor("pulse", color) });
    return entries;
  }, [world.closedSet, world.openSet, world.path, world.pulseCells, closedKeys, color]);

  return (
    <group position={[xOffset, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[world.cols * CELL_SIZE + 0.7, world.rows * CELL_SIZE + 0.7]} />
        <meshStandardMaterial color="#0f1724" roughness={0.96} metalness={0.04} />
      </mesh>
      <mesh position={[0, -0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[world.cols * CELL_SIZE + 1.25, world.rows * CELL_SIZE + 1.25]} />
        <meshStandardMaterial color="#09101a" roughness={1} metalness={0} />
      </mesh>
      {Array.from({ length: world.cols + 1 }).map((_, index) => {
        const x = (index - world.cols / 2) * CELL_SIZE;
        return <mesh key={`gx-${index}`} position={[x, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.01, world.rows * CELL_SIZE]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.16} />
        </mesh>;
      })}
      {Array.from({ length: world.rows + 1 }).map((_, index) => {
        const z = ((world.rows / 2) - index) * CELL_SIZE;
        return <mesh key={`gz-${index}`} position={[0, 0.002, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[world.cols * CELL_SIZE, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.16} />
        </mesh>;
      })}

      {tiles.map((entry, index) => {
        const [x, , z] = toWorld(entry.cell, world.cols, world.rows);
        const tileOpacity = entry.kind === "path" ? 0.98 : entry.kind === "pulse" ? 0.9 : 0.76;
        const emissiveIntensity = entry.kind === "path" ? 0.46 : entry.kind === "pulse" ? 0.36 : 0.18;
        return (
          <RoundedBox key={`${entry.kind}-${index}-${entry.cell.x}-${entry.cell.y}`} args={[CELL_SIZE - TILE_INSET, 0.04, CELL_SIZE - TILE_INSET]} radius={0.05} smoothness={2} position={[x, 0.024, z]} castShadow>
            <meshStandardMaterial color={entry.color} transparent opacity={tileOpacity} roughness={0.4} metalness={0.12} emissive={entry.color} emissiveIntensity={emissiveIntensity} />
          </RoundedBox>
        );
      })}

      {world.walls.map((cell) => {
        const [x, , z] = toWorld(cell, world.cols, world.rows);
        return (
          <RoundedBox key={`wall-${cell.x}-${cell.y}`} args={[CELL_SIZE - 0.04, WALL_HEIGHT, CELL_SIZE - 0.04]} radius={0.05} smoothness={2} position={[x, WALL_HEIGHT / 2, z]} castShadow receiveShadow>
            <meshStandardMaterial color="#354659" roughness={0.72} metalness={0.18} />
          </RoundedBox>
        );
      })}
      {world.dynamicWalls.map((cell) => {
        const [x, , z] = toWorld(cell, world.cols, world.rows);
        return (
          <RoundedBox key={`dynamic-${cell.x}-${cell.y}`} args={[CELL_SIZE - 0.08, WALL_HEIGHT + 0.07, CELL_SIZE - 0.08]} radius={0.05} smoothness={2} position={[x, (WALL_HEIGHT + 0.07) / 2, z]} castShadow>
            <meshStandardMaterial color="#ef6b6b" roughness={0.42} metalness={0.12} emissive="#b91c1c" emissiveIntensity={0.34} />
          </RoundedBox>
        );
      })}

      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.25}>
        <group position={[start[0], 0.18, start[2]]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.34, 24]} />
            <meshStandardMaterial color="#60a5fa" emissive="#2563eb" emissiveIntensity={0.22} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.08, 20, 20]} />
            <meshStandardMaterial color="#dbeafe" />
          </mesh>
        </group>
      </Float>

      <Float speed={1.2} rotationIntensity={0} floatIntensity={0.32}>
        <group position={[goal[0], 0.2, goal[2]]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.16, 0.2, 0.42, 24]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.42} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <torusGeometry args={[0.14, 0.04, 10, 28]} />
            <meshStandardMaterial color="#fde68a" emissive="#fde68a" emissiveIntensity={0.25} />
          </mesh>
        </group>
      </Float>

      <group position={[current[0], 0.15, current[2]]}>
        <mesh castShadow>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color={world.vehicleColor || color} emissive={world.vehicleColor || color} emissiveIntensity={0.28} roughness={0.28} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.19, 0.24, 28]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {world.visibleCells?.length ? (
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[world.cols * CELL_SIZE + 0.72, world.rows * CELL_SIZE + 0.72]} />
          <meshBasicMaterial color="#020617" transparent opacity={0.08} />
        </mesh>
      ) : null}
      {visibleKeys.size ? Array.from({ length: world.cols * world.rows }).map((_, index) => {
        const x = index % world.cols;
        const y = Math.floor(index / world.cols);
        const cell = { x, y };
        if (wallKeys.has(keyOf(cell)) || dynamicKeys.has(keyOf(cell)) || visibleKeys.has(keyOf(cell))) return null;
        const [px, , pz] = toWorld(cell, world.cols, world.rows);
        return <mesh key={`fog-${x}-${y}`} position={[px, 0.035, pz]}>
          <boxGeometry args={[CELL_SIZE - 0.1, 0.07, CELL_SIZE - 0.1]} />
          <meshStandardMaterial color="#050b13" transparent opacity={0.85} roughness={1} metalness={0} />
        </mesh>;
      }) : null}
    </group>
  );
}

function CameraRig({ totalWidth, totalDepth }: { totalWidth: number; totalDepth: number }) {
  const { camera, size } = useThree();
  const initialized = useRef(false);

  useLayoutEffect(() => {
    const ortho = camera as THREE.OrthographicCamera;
    const zoomX = Math.max(14, 940 / Math.max(240, totalWidth * 100));
    const zoomY = Math.max(14, 760 / Math.max(240, totalDepth * 100));
    ortho.zoom = Math.min(68, Math.max(22, Math.min(zoomX, zoomY) * (size.width < size.height ? 0.94 : 1.04)));
    ortho.position.set(0, 9.4, 6.8);
    ortho.lookAt(0, 0, 0);
    ortho.updateProjectionMatrix();
    initialized.current = true;
  }, [camera, size.height, size.width, totalDepth, totalWidth]);

  useFrame(() => {
    if (!initialized.current) return;
    camera.lookAt(0, 0, 0);
  });

  return <OrthographicCamera makeDefault near={0.1} far={60} position={[0, 9.4, 6.8]} zoom={34} />;
}

function MazeScene({ frame }: { frame: Frame | null | undefined }) {
  const arenas = useMemo<Arena[]>(() => {
    if (frame?.worldCompare) {
      return [
        { key: "left", sideLabel: frame.worldCompare.left.algorithmName ?? "Left", world: frame.worldCompare.left, color: frame.worldCompare.left.vehicleColor || "#38bdf8" },
        { key: "right", sideLabel: frame.worldCompare.right.algorithmName ?? "Right", world: frame.worldCompare.right, color: frame.worldCompare.right.vehicleColor || "#f472b6" },
      ];
    }
    if (frame?.world) {
      return [{ key: "single", sideLabel: frame.world.algorithmName ?? "Maze", world: frame.world, color: frame.world.vehicleColor || "#38bdf8" }];
    }
    return [];
  }, [frame]);

  const totalWidth = useMemo(() => {
    if (!arenas.length) return 10;
    const widths = arenas.map((arena) => arena.world.cols * CELL_SIZE + 0.7);
    return widths.reduce((sum, value) => sum + value, 0) + (arenas.length > 1 ? 2.2 : 0);
  }, [arenas]);
  const totalDepth = useMemo(() => Math.max(...arenas.map((arena) => arena.world.rows * CELL_SIZE + 0.7), 8), [arenas]);
  const gap = 1.8;
  const offsets = useMemo(() => {
    if (arenas.length <= 1) return [0];
    const leftWidth = arenas[0].world.cols * CELL_SIZE + 0.7;
    const rightWidth = arenas[1].world.cols * CELL_SIZE + 0.7;
    const total = leftWidth / 2 + rightWidth / 2 + gap;
    return [-total / 2 + leftWidth / 2, total / 2 - rightWidth / 2];
  }, [arenas]);

  return (
    <>
      <color attach="background" args={["#050b14"]} />
      <fog attach="fog" args={["#050b14", 11, 28]} />
      <CameraRig totalWidth={totalWidth} totalDepth={totalDepth} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 10, 6]} intensity={1.3} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[-6, 5, -4]} intensity={0.7} color="#7dd3fc" />
      <pointLight position={[6, 4, 5]} intensity={0.55} color="#f9a8d4" />
      <mesh position={[0, -0.24, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[totalWidth + 8, totalDepth + 8]} />
        <meshStandardMaterial color="#030712" roughness={1} metalness={0} />
      </mesh>
      {arenas.map((arena, index) => <MazeArena key={arena.key} arena={arena} xOffset={offsets[index] ?? 0} />)}
    </>
  );
}

function ArenaBadge({ arena, side, lang }: { arena: Arena; side: "left" | "right" | "single"; lang: Lang }) {
  const world = arena.world;
  const tone = side === "right" ? "border-fuchsia-300/35 bg-fuchsia-400/12 text-fuchsia-50" : "border-cyan-300/35 bg-cyan-400/12 text-cyan-50";
  const statusLabel = lang === "vi" ? "Trạng thái" : "Status";
  const stepsLabel = lang === "vi" ? "Bước" : "Steps";
  const pathLabel = lang === "vi" ? "Path" : "Path";
  return (
    <div className={`min-w-0 rounded-xl border px-3 py-2 text-[11px] shadow-[0_10px_24px_rgba(2,6,23,.24)] backdrop-blur ${tone}`}>
      <div className="truncate text-xs font-semibold uppercase tracking-[0.18em]">{arena.sideLabel}</div>
      <div className="mt-1 line-clamp-1 text-[11px] text-white/80">{world.algorithmName ?? world.algorithmId ?? "—"}</div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-white/85">
        <div><div className="opacity-60">{stepsLabel}</div><div className="font-semibold">{world.stepCount ?? 0}</div></div>
        <div><div className="opacity-60">{pathLabel}</div><div className="font-semibold">{world.pathLength ?? world.path.length}</div></div>
        <div><div className="opacity-60">{lang === "vi" ? "Đã duyệt" : "Visited"}</div><div className="font-semibold">{world.visitedCount ?? world.closedSet.length}</div></div>
      </div>
      <div className="mt-2 line-clamp-2 text-[10px] text-white/72"><span className="opacity-60">{statusLabel}: </span>{world.status}</div>
    </div>
  );
}

export function MazePreview3D({ frame, width, height, title, subtitle, theme, lang }: Props) {
  const arenas = useMemo<Arena[]>(() => {
    if (frame?.worldCompare) {
      return [
        { key: "left", sideLabel: lang === "vi" ? "Bên trái" : "Left", world: frame.worldCompare.left, color: frame.worldCompare.left.vehicleColor || theme.highlight },
        { key: "right", sideLabel: lang === "vi" ? "Bên phải" : "Right", world: frame.worldCompare.right, color: frame.worldCompare.right.vehicleColor || theme.swap },
      ];
    }
    if (frame?.world) return [{ key: "single", sideLabel: lang === "vi" ? "Thuật toán" : "Algorithm", world: frame.world, color: frame.world.vehicleColor || theme.highlight }];
    return [];
  }, [frame, lang, theme.highlight, theme.swap]);

  return (
    <div className="relative mx-auto overflow-hidden rounded-lg bg-slate-950" style={videoPreviewViewportStyle(width, height)}>
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }} style={{ width: "100%", height: "100%" }}>
        <MazeScene frame={frame} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3 p-3">
          <div className="max-w-[58%] rounded-xl border border-white/10 bg-slate-950/58 px-3 py-2 text-white shadow-[0_12px_30px_rgba(2,6,23,.28)] backdrop-blur">
            <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/90">{lang === "vi" ? "Maze 3D" : "Maze 3D"}</div>
            <div className="mt-1 line-clamp-1 text-sm font-semibold">{title}</div>
            <div className="line-clamp-2 text-[11px] text-white/70">{subtitle}</div>
          </div>
          <div className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-right text-[11px] text-emerald-50 shadow-[0_12px_30px_rgba(2,6,23,.24)] backdrop-blur">
            <div className="uppercase tracking-[0.18em] text-emerald-200/80">{lang === "vi" ? "Camera" : "Camera"}</div>
            <div className="mt-1 font-semibold">{lang === "vi" ? "Góc cố định ổn định" : "Stable fixed angle"}</div>
            <div className="text-white/65">{lang === "vi" ? "ít lắc, dễ theo dõi" : "less shake, easier to follow"}</div>
          </div>
        </div>
        <div className={`grid gap-2 p-3 ${arenas.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {arenas.map((arena, index) => <ArenaBadge key={arena.key} arena={arena} side={arenas.length > 1 ? (index === 0 ? "left" : "right") : "single"} lang={lang} />)}
        </div>
      </div>
    </div>
  );
}
