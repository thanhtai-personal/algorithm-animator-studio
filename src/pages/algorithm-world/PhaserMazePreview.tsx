import { useEffect, useRef } from "react";
import Phaser from "phaser";
import type { Frame } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/renderer";
import { MazePreviewScene } from "./MazePreviewScene";
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


export function PhaserMazePreview({ frame, width, height, title, subtitle, theme, lang }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<MazePreviewScene | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new MazePreviewScene();
    sceneRef.current = scene;
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width,
      height,
      backgroundColor: "#020617",
      scene,
      transparent: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    });
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    gameRef.current?.scale.resize(width, height);
  }, [width, height]);

  useEffect(() => {
    sceneRef.current?.setPreviewState({ frame, title, subtitle, theme, lang });
  }, [frame, title, subtitle, theme, lang]);

  return (
    <div
      ref={hostRef}
      className="mx-auto overflow-hidden rounded-lg bg-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.14)]"
      style={videoPreviewViewportStyle(width, height)}
    />
  );
}
