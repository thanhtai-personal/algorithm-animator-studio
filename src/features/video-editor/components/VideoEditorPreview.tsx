import { useEffect, useRef } from "react";
import { Maximize2, Music2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { VideoEditorAspectRatio, VideoEditorAsset, VideoEditorClip } from "../lib/videoEditorTypes";

type Props = {
  asset?: VideoEditorAsset;
  clip?: VideoEditorClip;
  aspectRatio: VideoEditorAspectRatio;
  progress: number;
  elapsed: number;
  totalDuration: number;
  playing: boolean;
  onReset: () => void;
  onPlay: () => void;
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
        {props.asset ? <PreviewAsset asset={props.asset} clip={props.clip} playing={props.playing} /> : <div className="grid h-full place-items-center text-sm text-muted-foreground">Preview timeline</div>}
        <Button className="absolute right-3 top-3 bg-background/80 backdrop-blur" size="icon" variant="outline" onClick={() => void previewRef.current?.requestFullscreen?.()}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
      <Progress value={props.progress} />
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

function PreviewAsset({ asset, clip, playing }: { asset: VideoEditorAsset; clip?: VideoEditorClip; playing: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fitClass = clip?.fitMode === "cover" ? "object-cover" : "object-contain";
  const effect = clip?.transition === "zoom-in" ? "scale-105" : "";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [asset.id, playing]);

  if (asset.type === "image") return <img src={asset.url} alt="" className={`h-full w-full ${fitClass} transition-all duration-500 ${effect}`} />;
  if (asset.type === "video") return <video ref={videoRef} key={asset.id} src={asset.url} muted={clip?.keepOriginalAudio !== true} loop={playing} playsInline className={`h-full w-full ${fitClass} ${effect}`} />;
  return <div className="grid h-full place-items-center text-muted-foreground"><Music2 className="h-8 w-8" /></div>;
}
