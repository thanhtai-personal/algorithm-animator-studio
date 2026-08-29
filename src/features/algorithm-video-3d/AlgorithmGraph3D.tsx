import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Frame } from "@/lib/algorithms";
import type { Theme } from "@/lib/renderer";
import { AlgorithmGlowSprite3D } from "./AlgorithmGlowSprite3D";
import { AlgorithmTextSprite3D } from "./AlgorithmTextSprite3D";
import { graphNodePosition } from "./algorithm3dMath";

export function AlgorithmGraph3D({ frame, theme, deterministicProgress }: {
  frame: Frame;
  theme: Theme;
  deterministicProgress?: number;
}) {
  const graph = frame.graph!;
  return (
    <group position={[0, 0.04, 0]}>
      {graph.edges.map((edge, index) => {
        const nodeA = graph.nodes.find((node) => node.id === edge.a) ?? graph.nodes[edge.a];
        const nodeB = graph.nodes.find((node) => node.id === edge.b) ?? graph.nodes[edge.b];
        if (!nodeA || !nodeB) return null;
        const a = graphNodePosition(nodeA);
        const b = graphNodePosition(nodeB);
        const active = edgeMatches(graph.activeEdge, edge.a, edge.b);
        const onPath = graph.pathEdges?.some(([x, y]) => edgeMatches([x, y], edge.a, edge.b)) ?? false;
        return (
          <GraphEdge3D
            key={`${edge.a}-${edge.b}-${index}`}
            a={a}
            b={b}
            color={onPath ? "#fde047" : active ? theme.highlight : "#607086"}
            active={active}
            onPath={onPath}
            deterministicProgress={deterministicProgress}
          />
        );
      })}

      {graph.nodes.map((node) => {
        const p = graphNodePosition(node);
        const visited = graph.visited?.includes(node.id);
        const current = graph.current === node.id;
        const start = graph.start === node.id;
        const end = graph.end === node.id;
        const color = start ? "#22d3ee" : end ? "#fb7185" : current ? theme.highlight : visited ? theme.sorted : theme.bar;
        return (
          <GraphNode3D
            key={node.id}
            position={[p.x, p.y, p.z]}
            label={node.label ?? String(node.id)}
            distance={graph.dist?.[node.id]}
            color={color}
            current={current}
            start={start}
            end={end}
            visited={Boolean(visited)}
            deterministicProgress={deterministicProgress}
          />
        );
      })}
    </group>
  );
}

function GraphNode3D({ position, label, distance, color, current, start, end, visited, deterministicProgress }: {
  position: [number, number, number];
  label: string;
  distance?: number | string;
  color: string;
  current: boolean;
  start: boolean;
  end: boolean;
  visited: boolean;
  deterministicProgress?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = deterministicProgress != null
      ? Math.sin(Math.PI * deterministicProgress)
      : (Math.sin(clock.elapsedTime * 3.2 + position[0] * 0.2) + 1) * 0.5;
    const scale = current ? 1 + pulse * 0.07 : 1;
    ref.current.scale.setScalar(scale);
  });
  const featured = current || start || end;

  return (
    <group ref={ref} position={position}>
      {featured ? <AlgorithmGlowSprite3D position={[0, 0.2, -0.08]} scale={[2.4, 2.4, 1]} color={color} opacity={current ? 0.19 : 0.11} /> : null}
      <NodePedestal color={color} featured={featured} />
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.63, 40, 28]} />
        <meshPhysicalMaterial
          color={darken(color, featured ? 0.15 : visited ? 0.32 : 0.46)}
          roughness={featured ? 0.12 : 0.2}
          metalness={0.64}
          clearcoat={1}
          clearcoatRoughness={0.1}
          emissive={color}
          emissiveIntensity={current ? 0.26 : featured ? 0.12 : visited ? 0.045 : 0.015}
        />
      </mesh>
      <mesh position={[0, 0.12, 0.515]} renderOrder={6}>
        <circleGeometry args={[0.285, 32]} />
        <meshBasicMaterial color={color} transparent opacity={featured ? 0.94 : 0.56} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.12, -0.02]}>
        <sphereGeometry args={[0.39, 30, 20]} />
        <meshPhysicalMaterial color={lighten(color, 0.32)} transparent opacity={0.34} roughness={0.04} metalness={0.18} emissive={color} emissiveIntensity={0.2} depthWrite={false} />
      </mesh>

      {featured ? (
        <group position={[0, -0.54, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.86, current ? 0.045 : 0.028, 10, 64]} />
            <meshBasicMaterial color={color} transparent opacity={current ? 0.95 : 0.66} toneMapped={false} depthWrite={false} />
          </mesh>
          <mesh>
            <torusGeometry args={[1.03, 0.012, 8, 64]} />
            <meshBasicMaterial color={color} transparent opacity={0.22} toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      ) : null}

      <AlgorithmTextSprite3D text={label} position={[0, 1.28, 0.03]} color={color} scale={0.72} />
      {distance != null ? <AlgorithmTextSprite3D text={`d ${distance}`} position={[0, 1.89, 0.03]} color="#fde047" scale={0.46} subtle /> : null}
    </group>
  );
}

function NodePedestal({ color, featured }: { color: string; featured: boolean }) {
  return (
    <group position={[0, -0.54, 0]}>
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[0.72, 0.92, 0.19, 32]} />
        <meshStandardMaterial color="#111827" roughness={0.28} metalness={0.82} />
      </mesh>
      <mesh position={[0, 0.105, 0]}>
        <cylinderGeometry args={[0.64, 0.64, 0.026, 32]} />
        <meshBasicMaterial color={color} transparent opacity={featured ? 0.85 : 0.22} toneMapped={false} />
      </mesh>
    </group>
  );
}

function GraphEdge3D({ a, b, color, active, onPath, deterministicProgress }: {
  a: { x: number; y: number; z: number };
  b: { x: number; y: number; z: number };
  color: string;
  active: boolean;
  onPath: boolean;
  deterministicProgress?: number;
}) {
  const dotRef = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => makeEdgeCurve(a, b), [a.x, a.y, a.z, b.x, b.y, b.z]);
  const outerGeometry = useMemo(() => new THREE.TubeGeometry(curve, 24, onPath ? 0.075 : active ? 0.065 : 0.045, 10, false), [curve, active, onPath]);
  const coreGeometry = useMemo(() => new THREE.TubeGeometry(curve, 24, onPath ? 0.032 : active ? 0.027 : 0.014, 8, false), [curve, active, onPath]);

  useFrame(({ clock }) => {
    if (!dotRef.current || (!active && !onPath)) return;
    const t = deterministicProgress != null ? deterministicProgress : (clock.elapsedTime * 0.54) % 1;
    dotRef.current.position.copy(curve.getPointAt(THREE.MathUtils.clamp(t, 0, 1)));
  });

  return (
    <group>
      <mesh geometry={outerGeometry} castShadow={active || onPath}>
        <meshStandardMaterial color={active || onPath ? darken(color, 0.3) : "#263244"} roughness={0.26} metalness={0.78} />
      </mesh>
      <mesh geometry={coreGeometry} renderOrder={3}>
        <meshBasicMaterial color={color} transparent opacity={active ? 0.92 : onPath ? 0.78 : 0.19} toneMapped={false} depthWrite={false} />
      </mesh>
      {(active || onPath) ? (
        <mesh ref={dotRef} renderOrder={7}>
          <sphereGeometry args={[active ? 0.12 : 0.095, 18, 12]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
}

function makeEdgeCurve(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  const start = new THREE.Vector3(a.x, a.y, a.z);
  const end = new THREE.Vector3(b.x, b.y, b.z);
  const distance = start.distanceTo(end);
  const midpoint = start.clone().lerp(end, 0.5);
  midpoint.y += Math.min(0.9, 0.18 + distance * 0.045);
  midpoint.z += Math.sin((a.x + b.z) * 0.37) * Math.min(0.28, distance * 0.018);
  return new THREE.CatmullRomCurve3([start, midpoint, end], false, "centripetal");
}

function edgeMatches(pair: [number, number] | null | undefined, a: number, b: number) {
  return Boolean(pair && ((pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a)));
}

function darken(color: string, amount: number) {
  return `#${new THREE.Color(color).lerp(new THREE.Color("#07101d"), amount).getHexString()}`;
}

function lighten(color: string, amount: number) {
  return `#${new THREE.Color(color).lerp(new THREE.Color("#ffffff"), amount).getHexString()}`;
}
