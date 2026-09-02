import { useEffect, useRef } from "react";
import { Maximize2, Music2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { VideoEditorAspectRatio, VideoEditorAsset, VideoEditorClip, VideoEditorLyrics } from "../lib/videoEditorTypes";
import { VideoEditorLyricOverlay } from "./VideoEditorLyricOverlay";

type Props = {
  asset?: VideoEditorAsset;
  clip?: VideoEditorClip;
  localTime?: number;
  aspectRatio: VideoEditorAspectRatio;
  progress: number;
  elapsed: number;
  totalDuration: number;
  playing: boolean;
  title: string;
  showWatermark: boolean;
  watermarkText: string;
  watermarkLogoAsset?: VideoEditorAsset;
  lyrics: VideoEditorLyrics;
  onReset: () => void;
  onPlay: () => void;
  onSeek: (elapsed: number) => void;
};

export function VideoEditorPreview(props: Props) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const previewStyle = {
        aspectRatio: props.aspectRatio === "9:16" ? "9 / 16" : "16 / 9",
    maxHeight: props.aspectRatio === "9:16" ? "62vh" : "58vh",
    maxWidth: props.aspectRatio === "9:16" ? "min(100%, calc(62vh * 9 / 16))" : "min(100%, calc(58vh * 16 / 9))",
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3">
      <div ref={previewRef} className="relative mx-auto w-full overflow-hidden rounded-lg border bg-black shadow-2xl shadow-black/30" style={previewStyle}>
        {props.asset ? <PreviewAsset asset={props.asset} clip={props.clip} playing={props.playing} localTime={props.localTime || 0} /> : <div className="grid h-full place-items-center text-sm text-muted-foreground">Preview timeline</div>}
        <VideoEditorLyricOverlay lyrics={props.lyrics} elapsed={props.elapsed} />
        <PreviewChrome title={props.title} showWatermark={props.showWatermark} watermarkText={props.watermarkText} watermarkLogo={props.watermarkLogoAsset} elapsed={props.elapsed} totalDuration={props.totalDuration} />
        <Button className="absolute right-3 top-3 bg-background/80 backdrop-blur" size="icon" variant="outline" onClick={() => void previewRef.current?.requestFullscreen?.()}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
      <Slider value={[props.elapsed]} min={0} max={props.totalDuration} step={0.1} onValueChange={([value]) => props.onSeek(value)} />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-3 text-sm">
        <span>{props.elapsed.toFixed(1)}s / {props.totalDuration.toFixed(1)}s</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={props.onReset}>0:00</Button>
          <Button size="sm" onClick={props.onPlay}><Play className="mr-2 h-4 w-4" />{props.playing ? "Pause" : "Play"}</Button>
        </div>
      </div>
    </div>
  );
}

function PreviewChrome(props: { title: string; showWatermark: boolean; watermarkText: string; watermarkLogo?: VideoEditorAsset; elapsed: number; totalDuration: number }) {
  const progress = Math.min(100, (props.elapsed / Math.max(1, props.totalDuration)) * 100);
  return (
    <>
      <div className="pointer-events-none absolute left-8 right-8 top-7 flex items-center justify-between gap-6 text-[clamp(16px,2vw,26px)] font-black text-slate-100 drop-shadow-[0_3px_18px_rgba(0,0,0,0.75)]">
        <span>{props.showWatermark ? (props.watermarkLogo ? <img src={props.watermarkLogo.url} alt="" className="max-h-[74px] max-w-[260px] object-contain" /> : props.watermarkText) : ""}</span>
        <span className="min-w-0 truncate text-right">{props.title}</span>
      </div>
      <div className="pointer-events-none absolute bottom-6 left-8 right-8 h-3 overflow-hidden rounded-full bg-slate-200/30">
        <div className="h-full bg-white" style={{ width: `${progress}%` }} />
      </div>
      <div className="pointer-events-none absolute bottom-12 left-8 rounded-full bg-slate-950/60 px-3 py-1.5 text-[clamp(12px,1.6vw,22px)] font-extrabold text-slate-100">
        {props.elapsed.toFixed(1)}s / {props.totalDuration.toFixed(1)}s
      </div>
    </>
  );
}

function PreviewAsset({ asset, clip, playing, localTime }: { asset: VideoEditorAsset; clip?: VideoEditorClip; playing: boolean; localTime: number }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fitClass = clip?.fitMode === "cover" ? "object-cover" : "object-contain";
  const motion = getPreviewMotion(clip, localTime);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = clampVolume(clip?.volume);
    if (playing) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
      if (Number.isFinite(localTime)) video.currentTime = Math.max(0, localTime);
    }
  }, [asset.id, localTime, playing]);

  if (asset.type === "image") return <img src={asset.url} alt="" className={`h-full w-full ${fitClass}`} style={motion} />;
  if (asset.type === "video") return <video ref={videoRef} key={asset.id} src={asset.url} muted={clip?.keepOriginalAudio !== true} loop={playing} playsInline className={`h-full w-full ${fitClass}`} style={motion} />;
  return <div className="grid h-full place-items-center text-muted-foreground"><Music2 className="h-8 w-8" /></div>;
}

function getPreviewMotion(clip: VideoEditorClip | undefined, localTime: number) {
  const base = { opacity: 1, filter: "none", transform: "none", transition: "opacity 120ms linear, filter 120ms linear, transform 120ms linear" };
  if (!clip || clip.transition === "none") return base;

  const duration = Math.max(0.1, clip.durationSeconds);
  const transitionSeconds = Math.min(duration / 2, Math.max(0.1, clip.transitionSeconds || 1.5));
  const enter = clamp01(1 - localTime / transitionSeconds);
  const exit = clamp01((localTime - (duration - transitionSeconds)) / transitionSeconds);
  const edge = Math.max(enter, exit);
  const opacity = clip.transition === "fade" || clip.transition === "blurry" || clip.transition.startsWith("slide") ? 1 - edge : 1;
  const progress = clamp01(localTime / duration);

  if (clip.transition === "fade") return { ...base, opacity };
  if (clip.transition === "blurry") return { ...base, opacity, filter: `blur(${edge * 18}px)`, transform: `scale(${1.04 + edge * 0.03})` };
  if (clip.transition === "zoom-in") return { ...base, opacity: 1 - edge * 0.25, transform: `scale(${1 + progress * 0.12})` };
  if (clip.transition === "zoom-out") return { ...base, opacity: 1 - edge * 0.25, transform: `scale(${1.12 - progress * 0.12})` };
  if (clip.transition === "slide-left") return { ...base, opacity, transform: `translateX(${enter * 24 - exit * 24}%)` };
  if (clip.transition === "slide-right") return { ...base, opacity, transform: `translateX(${-enter * 24 + exit * 24}%)` };
  if (clip.transition === "slide-up") return { ...base, opacity, transform: `translateY(${enter * 24 - exit * 24}%)` };
  if (clip.transition === "slide-down") return { ...base, opacity, transform: `translateY(${-enter * 24 + exit * 24}%)` };
  if (clip.transition === "push-left") return { ...base, transform: `translateX(${enter * 100 - exit * 100}%)` };
  if (clip.transition === "push-right") return { ...base, transform: `translateX(${-enter * 100 + exit * 100}%)` };
  return base;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function clampVolume(value: unknown) {
  const parsed = Number(value ?? 1);
  return Number.isFinite(parsed) ? Math.min(2, Math.max(0, parsed)) : 1;
}
