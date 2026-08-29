import { useMemo } from "react";
import * as THREE from "three";
import type { Frame } from "@/lib/algorithms";
import type { Theme } from "@/lib/renderer";
import { AlgorithmTextSprite3D } from "./AlgorithmTextSprite3D";
import { graphNodePosition } from "./algorithm3dMath";

export function AlgorithmGraph3D({ frame, theme }: { frame: Frame; theme: Theme }) {
  const graph = frame.graph!;
  return (
    <group>
      {graph.edges.map((edge, index) => {
        const a = graphNodePosition(graph.nodes[edge.a]);
        const b = graphNodePosition(graph.nodes[edge.b]);
        const active = edgeMatches(graph.activeEdge, edge.a, edge.b);
        const onPath = graph.pathEdges?.some(([x, y]) => edgeMatches([x, y], edge.a, edge.b)) ?? false;
        return <GraphEdge3D key={`${edge.a}-${edge.b}-${index}`} a={a} b={b} color={onPath ? "#fde047" : active ? theme.highlight : "#64748b"} radius={onPath ? 0.085 : active ? 0.07 : 0.038} />;
      })}
      {graph.nodes.map((node) => {
        const p = graphNodePosition(node);
        const visited = graph.visited?.includes(node.id);
        const current = graph.current === node.id;
        const start = graph.start === node.id;
        const end = graph.end === node.id;
        const color = start ? "#22d3ee" : end ? "#fb7185" : current ? theme.highlight : visited ? theme.sorted : theme.bar;
        return (
          <group key={node.id} position={[p.x, p.y, p.z]}>
            {(start || end || current) ? (
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.72, 0]}>
                <torusGeometry args={[0.8, 0.055, 12, 42]} />
                <meshBasicMaterial color={color} toneMapped={false} />
              </mesh>
            ) : null}
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.58, 28, 20]} />
              <meshPhysicalMaterial color={color} roughness={0.16} metalness={0.38} clearcoat={1} emissive={color} emissiveIntensity={current ? 0.48 : 0.08} />
            </mesh>
            <AlgorithmTextSprite3D text={node.label ?? String(node.id)} position={[0, 1.12, 0]} color={color} scale={0.72} />
            {graph.dist?.[node.id] != null ? <AlgorithmTextSprite3D text={String(graph.dist[node.id])} position={[0, 1.72, 0]} color="#fde047" scale={0.48} /> : null}
          </group>
        );
      })}
    </group>
  );
}

function GraphEdge3D({ a, b, color, radius }: {
  a: { x: number; y: number; z: number };
  b: { x: number; y: number; z: number };
  color: string;
  radius: number;
}) {
  const geometry = useMemo(() => {
    const start = new THREE.Vector3(a.x, a.y, a.z);
    const end = new THREE.Vector3(b.x, b.y, b.z);
    const curve = new THREE.LineCurve3(start, end);
    return new THREE.TubeGeometry(curve, 1, radius, 10, false);
  }, [a.x, a.y, a.z, b.x, b.y, b.z, radius]);
  return (
    <mesh geometry={geometry} castShadow={radius > 0.05}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={radius > 0.05 ? 0.34 : 0.03} roughness={0.3} metalness={0.44} />
    </mesh>
  );
}

function edgeMatches(pair: [number, number] | null | undefined, a: number, b: number) {
  return Boolean(pair && ((pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a)));
}
