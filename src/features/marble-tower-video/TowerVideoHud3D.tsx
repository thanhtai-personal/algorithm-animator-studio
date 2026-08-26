import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { towerRankings, towerSectionAt } from "./towerMotion";

const RACER_NAMES = ["YOU", "NOVA", "PULSE", "COMET", "LUNA", "VOLT", "PIXEL", "ECHO"];

function roundedBox(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
  ctx.stroke();
}

function makeCanvasTexture(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { canvas, texture };
}

function drawPanel(ctx: CanvasRenderingContext2D, x: number, width: number, label: string, value: string, sub?: string) {
  ctx.fillStyle = "rgba(4, 7, 24, 0.72)";
  ctx.strokeStyle = "rgba(255,255,255,0.20)";
  ctx.lineWidth = 2;
  roundedBox(ctx, x, 42, width, 148, 24);
  ctx.fillStyle = "rgba(198,215,255,0.68)";
  ctx.font = "800 22px Arial";
  ctx.letterSpacing = "3px";
  ctx.fillText(label, x + 24, 78);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 42px Arial";
  ctx.letterSpacing = "0px";
  ctx.fillText(value, x + 24, 128);
  if (sub) {
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "700 20px Arial";
    ctx.fillText(sub, x + 24, 164);
  }
}

function TopHudTexture({ timeRef, durationMs, drive, recording, title }: { timeRef: MutableRefObject<number>; durationMs: number; drive: number; recording: boolean; title: string }) {
  const data = useMemo(() => makeCanvasTexture(1200, 230), []);
  const lastKeyRef = useRef("");
  useEffect(() => () => data.texture.dispose(), [data]);
  useFrame(() => {
    const timeMs = timeRef.current;
    const rankings = towerRankings(timeMs, durationMs, drive);
    const rank = Math.max(1, rankings.findIndex((entry) => entry.index === 0) + 1);
    const section = towerSectionAt(timeMs / Math.max(1, durationMs));
    const key = `${Math.round(timeMs / 100)}:${rank}:${section}:${recording}:${title}`;
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;
    const ctx = data.canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, data.canvas.width, data.canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = "800 23px Arial";
    ctx.textAlign = "center";
    ctx.fillText(title || "MARBLE MUSIC", 600, 28);
    ctx.textAlign = "left";
    drawPanel(ctx, 26, 342, "YOU", section, `${Math.round(timeMs / 1000)}s`);
    drawPanel(ctx, 429, 342, "POSITION", `${rank} / 8`, "TOWER RACE");
    const leaders = rankings.slice(0, 3).map((entry, index) => `${index + 1}. ${RACER_NAMES[entry.index]}`).join("   ");
    drawPanel(ctx, 832, 342, "TOP 3", leaders, recording ? "● REC" : "LIVE PREVIEW");
    data.texture.needsUpdate = true;
  });
  return <sprite><spriteMaterial map={data.texture} transparent depthTest={false} depthWrite={false} toneMapped={false} /></sprite>;
}

function BottomHudTexture({ timeRef, durationMs }: { timeRef: MutableRefObject<number>; durationMs: number }) {
  const data = useMemo(() => makeCanvasTexture(1200, 100), []);
  const lastBucketRef = useRef(-1);
  useEffect(() => () => data.texture.dispose(), [data]);
  useFrame(() => {
    const timeMs = timeRef.current;
    const bucket = Math.round(timeMs / 50);
    if (bucket === lastBucketRef.current) return;
    lastBucketRef.current = bucket;
    const ctx = data.canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 1200, 100);
    const progress = Math.max(0, Math.min(1, timeMs / Math.max(1, durationMs)));
    ctx.fillStyle = "rgba(5,8,24,0.72)";
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    roundedBox(ctx, 24, 20, 1152, 60, 24);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(52, 48, 1010, 8);
    ctx.fillStyle = "#63efff";
    ctx.fillRect(52, 48, 1010 * progress, 8);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 20px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`${(timeMs / 1000).toFixed(1)} / ${(durationMs / 1000).toFixed(1)}s`, 1146, 60);
    data.texture.needsUpdate = true;
  });
  return <sprite><spriteMaterial map={data.texture} transparent depthTest={false} depthWrite={false} toneMapped={false} /></sprite>;
}

export function TowerVideoHud3D({ timeRef, durationMs, drive, recording, title }: { timeRef: MutableRefObject<number>; durationMs: number; drive: number; recording: boolean; title: string }) {
  const { camera, size } = useThree();
  const root = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!root.current) return;
    root.current.position.copy(camera.position);
    root.current.quaternion.copy(camera.quaternion);
    root.current.translateZ(-5);
  });
  const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(54 / 2)) * 5;
  const visibleWidth = visibleHeight * Math.max(0.45, size.width / Math.max(1, size.height));
  const topWidth = visibleWidth * 0.94;
  const topHeight = topWidth * (230 / 1200);
  const bottomWidth = visibleWidth * 0.94;
  const bottomHeight = bottomWidth * (100 / 1200);
  return <group ref={root} renderOrder={1000}>
    <group position={[0, visibleHeight / 2 - topHeight / 2 - 0.08, 0]} scale={[topWidth, topHeight, 1]}><TopHudTexture timeRef={timeRef} durationMs={durationMs} drive={drive} recording={recording} title={title} /></group>
    <group position={[0, -visibleHeight / 2 + bottomHeight / 2 + 0.08, 0]} scale={[bottomWidth, bottomHeight, 1]}><BottomHudTexture timeRef={timeRef} durationMs={durationMs} /></group>
  </group>;
}
