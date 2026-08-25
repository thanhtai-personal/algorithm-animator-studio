import type { StudioSettings } from "../types";
import { denseChassisMountProfile } from "./rhythmicSceneMath3D";

export function RhythmicDenseChassisMounts3D({ width, receiverZ, terrain, detail }: {
  width: number;
  receiverZ: number;
  terrain: StudioSettings["terrainProfile"];
  detail: number;
}) {
  const mount = denseChassisMountProfile(receiverZ);
  const positions = width >= 0.82 ? [-width * 0.28, width * 0.28] : [0];
  const stemRadius = 0.025 + detail * 0.008;
  const stemColor = terrain === "xylophone" ? "#77634f" : terrain === "comet" ? "#555b76" : "#5c6670";
  const anchorColor = terrain === "xylophone" ? "#322a24" : "#282d34";

  return <>
    {positions.map((x) => (
      <group key={x} position={[x, 0, 0]}>
        <mesh position={[0, 0, mount.stemCenterZ]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[stemRadius, stemRadius, mount.stemLength, 12]} />
          <meshStandardMaterial color={stemColor} roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0, mount.anchorCenterZ]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.068, 0.068, mount.anchorThickness, 16]} />
          <meshStandardMaterial color={anchorColor} roughness={0.48} metalness={0.46} />
        </mesh>
      </group>
    ))}
  </>;
}
