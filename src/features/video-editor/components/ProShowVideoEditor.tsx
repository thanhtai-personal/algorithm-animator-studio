import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Film, ImagePlus, Loader2, Music2, Play, Scissors, Trash2, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { readSystemLang, subscribeSystemLang, text, type Lang } from "@/lib/i18n";
import { renderTimelineVideo } from "../lib/videoEditorApi";
import type { TimelineRenderResponse, VideoEditorAsset, VideoEditorAspectRatio, VideoEditorClip, VideoEditorFitMode, VideoEditorRenderEngine, VideoEditorTransition } from "../lib/videoEditorTypes";

type Props = {
  renderEngine: VideoEditorRenderEngine;
  onVideoCreated: () => Promise<void> | void;
};

export function ProShowVideoEditor({ renderEngine, onVideoCreated }: Props) {
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const [assets, setAssets] = useState<VideoEditorAsset[]>([]);
  const [clips, setClips] = useState<VideoEditorClip[]>([]);
  const [title, setTitle] = useState("proshow-style-video");
  const [aspectRatio, setAspectRatio] = useState<VideoEditorAspectRatio>("16:9");
  const [fps, setFps] = useState(30);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [lastVideo, setLastVideo] = useState<TimelineRenderResponse | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const assetUrlsRef = useRef<string[]>([]);

  useEffect(() => subscribeSystemLang(setLang), []);
  useEffect(() => {
    assetUrlsRef.current = assets.map((asset) => asset.url);
  }, [assets]);
  useEffect(() => () => assetUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const visualClips = clips.filter((clip) => clip.type !== "audio");
  const audioClip = clips.find((clip) => clip.type === "audio");
  const totalDuration = Math.max(1, visualClips.reduce((sum, clip) => sum + clip.durationSeconds, 0));
  const preview = getPreviewClip(visualClips, elapsed);
  const currentAsset = preview?.clip ? assets.find((asset) => asset.id === preview.clip.assetId) : undefined;
  const progress = Math.min(100, (elapsed / totalDuration) * 100);

  useEffect(() => {
    if (!playing) return;
    const startedAt = performance.now() - elapsed * 1000;
    const timer = window.setInterval(() => {
      const nextElapsed = (performance.now() - startedAt) / 1000;
      if (nextElapsed >= totalDuration) {
        setElapsed(0);
        setPlaying(false);
        audioRef.current?.pause();
        return;
      }
      setElapsed(nextElapsed);
    }, 120);
    return () => window.clearInterval(timer);
  }, [playing, elapsed, totalDuration]);

  useEffect(() => {
    const asset = audioClip ? assets.find((item) => item.id === audioClip.assetId) : undefined;
    const audio = audioRef.current;
    if (!asset || !audio) return;
    audio.src = asset.url;
    audio.loop = true;
    audio.volume = 0.9;
  }, [audioClip?.assetId, assets]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.currentTime = elapsed;
      void audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }, [playing]);

  const timelineStats = useMemo(() => ({
    image: clips.filter((clip) => clip.type === "image").length,
    video: clips.filter((clip) => clip.type === "video").length,
    audio: clips.filter((clip) => clip.type === "audio").length,
  }), [clips]);

  function addFiles(fileList: FileList | null) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const newAssets = files.map(createAsset).filter(Boolean) as VideoEditorAsset[];
    setAssets((current) => [...current, ...newAssets]);
    setClips((current) => [...current, ...newAssets.map(createClipFromAsset)]);
  }

  function updateClip(id: string, patch: Partial<VideoEditorClip>) {
    setClips((current) => current.map((clip) => clip.id === id ? { ...clip, ...patch } : clip));
  }

  function removeClip(id: string) {
    setClips((current) => current.filter((clip) => clip.id !== id));
  }

  function moveClip(id: string, direction: -1 | 1) {
    setClips((current) => {
      const index = current.findIndex((clip) => clip.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  }

  async function handleRender() {
    if (!visualClips.length) {
      toast.error(text(lang, "Add at least one image or video to the timeline.", "Cần thêm ít nhất 1 ảnh hoặc video vào timeline."));
      return;
    }
    setRendering(true);
    const toastId = toast.loading(renderEngine === "remotion"
      ? text(lang, "Rendering ProShow timeline with Remotion...", "Đang render timeline ProShow bằng Remotion...")
      : text(lang, "Exporting MP4 timeline...", "Đang export timeline MP4...")
    );
    try {
      const result = await renderTimelineVideo({ title, aspectRatio, fps, renderEngine, clips: clips.map(toRenderClip) }, assets);
      setLastVideo(result);
      toast.success(text(lang, "Video exported to library.", "Đã export video vào thư viện."), { id: toastId });
      await onVideoCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not export video.", "Không export được video."), { id: toastId });
    } finally {
      setRendering(false);
    }
  }

  return (
    <Card className="border-cyan-500/20 bg-cyan-500/[0.03]">
      <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl"><Scissors className="h-5 w-5 text-cyan-300" /> {text(lang, "Common video editor", "Trình ghép video chung")}</CardTitle>
          <CardDescription>{renderEngine === "remotion"
            ? text(lang, "Upload images, audio and videos, arrange the same ProShow-style timeline, then render MP4 with Remotion.", "Upload ảnh, âm thanh, video; sắp xếp cùng timeline kiểu ProShow rồi render MP4 bằng Remotion.")
            : text(lang, "Upload images, audio and videos, arrange a basic timeline, preview, then export MP4 like a lightweight ProShow workflow.", "Upload ảnh, âm thanh, video; sắp xếp timeline cơ bản, preview rồi export MP4 giống workflow ProShow rút gọn.")}</CardDescription>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/40">
          <Upload className="h-4 w-4" /> {text(lang, "Upload media", "Upload media")}
          <input type="file" multiple accept="image/*,audio/*,video/*" className="hidden" onChange={(event) => addFiles(event.target.files)} />
        </label>
      </CardHeader>
      <CardContent className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_130px_120px]">
            <Field label={text(lang, "Output name", "Tên video")}><Input value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
            <Field label={text(lang, "Aspect", "Tỉ lệ")}><Select value={aspectRatio} onValueChange={(value) => setAspectRatio(value as VideoEditorAspectRatio)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="16:9">16:9</SelectItem><SelectItem value="9:16">9:16</SelectItem></SelectContent></Select></Field>
            <Field label="FPS"><Select value={String(fps)} onValueChange={(value) => setFps(Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="24">24</SelectItem><SelectItem value="30">30</SelectItem><SelectItem value="60">60</SelectItem></SelectContent></Select></Field>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary"><ImagePlus className="mr-1 h-3.5 w-3.5" /> {timelineStats.image} ảnh</Badge>
            <Badge variant="secondary"><Video className="mr-1 h-3.5 w-3.5" /> {timelineStats.video} video</Badge>
            <Badge variant="secondary"><Music2 className="mr-1 h-3.5 w-3.5" /> {timelineStats.audio} audio</Badge>
            <Badge variant="outline">{renderEngine === "remotion" ? "Remotion" : "FFmpeg"}</Badge>
            <Badge variant="outline">{totalDuration.toFixed(1)}s</Badge>
          </div>

          <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-xl border bg-muted/10 p-3">
            {clips.length ? clips.map((clip, index) => (
              <TimelineClipCard key={clip.id} clip={clip} index={index} asset={assets.find((asset) => asset.id === clip.assetId)} onMove={moveClip} onRemove={removeClip} onUpdate={updateClip} />
            )) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                {text(lang, "Upload images, audio or videos to start building the timeline.", "Upload ảnh, âm thanh hoặc video để bắt đầu dựng timeline.")}
              </div>
            )}
          </div>

          <Button onClick={() => void handleRender()} disabled={rendering || !visualClips.length}>
            {rendering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
            {renderEngine === "remotion" ? text(lang, "Render MP4 with Remotion", "Render MP4 bằng Remotion") : text(lang, "Export MP4 with FFmpeg", "Export MP4 bằng FFmpeg")}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border bg-black" style={{ aspectRatio: aspectRatio === "9:16" ? "9 / 16" : "16 / 9" }}>
            {currentAsset ? <PreviewAsset asset={currentAsset} transition={preview?.clip.transition || "none"} /> : <div className="grid h-full place-items-center text-sm text-muted-foreground">Preview timeline</div>}
          </div>
          <Progress value={progress} />
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-3 text-sm">
            <span>{elapsed.toFixed(1)}s / {totalDuration.toFixed(1)}s</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setElapsed(0)}>0:00</Button>
              <Button size="sm" onClick={() => setPlaying((value) => !value)}><Play className="mr-2 h-4 w-4" />{playing ? "Pause" : "Play"}</Button>
            </div>
          </div>
          <audio ref={audioRef} />
          {lastVideo ? (
            <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="break-words text-sm font-semibold text-emerald-100">{lastVideo.fileName}</p>
              <video src={lastVideo.videoUrl} controls className="w-full rounded-lg bg-black" />
              {lastVideo.warning ? <p className="text-xs text-amber-100">{lastVideo.warning}</p> : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Field(props: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{props.label}</Label>{props.children}</div>;
}

function TimelineClipCard(props: { clip: VideoEditorClip; index: number; asset?: VideoEditorAsset; onMove: (id: string, direction: -1 | 1) => void; onRemove: (id: string) => void; onUpdate: (id: string, patch: Partial<VideoEditorClip>) => void }) {
  const { clip } = props;
  return (
    <article className="grid gap-3 rounded-xl border bg-background/70 p-3 md:grid-cols-[90px_minmax(0,1fr)_auto]">
      <div className="grid aspect-video place-items-center overflow-hidden rounded-lg bg-slate-950 text-xs text-muted-foreground">
        {props.asset?.type === "image" ? <img src={props.asset.url} className="h-full w-full object-cover" alt="" /> : props.asset?.type === "video" ? <video src={props.asset.url} muted className="h-full w-full object-cover" /> : <Music2 className="h-6 w-6" />}
      </div>
      <div className="min-w-0 space-y-3">
        <div className="flex min-w-0 items-center gap-2"><Badge variant="outline">#{props.index + 1}</Badge><span className="truncate text-sm font-medium">{props.asset?.name || clip.label}</span></div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Field label="Duration"><Input type="number" min={1} max={180} value={clip.durationSeconds} onChange={(event) => props.onUpdate(clip.id, { durationSeconds: Number(event.target.value) })} disabled={clip.type === "audio"} /></Field>
          <Field label="Fit"><Select value={clip.fitMode} onValueChange={(value) => props.onUpdate(clip.id, { fitMode: value as VideoEditorFitMode })} disabled={clip.type === "audio"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cover">cover</SelectItem><SelectItem value="contain">contain</SelectItem></SelectContent></Select></Field>
          <Field label="Transition"><Select value={clip.transition} onValueChange={(value) => props.onUpdate(clip.id, { transition: value as VideoEditorTransition })} disabled={clip.type === "audio"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">none</SelectItem><SelectItem value="fade">fade</SelectItem><SelectItem value="zoom">zoom</SelectItem></SelectContent></Select></Field>
        </div>
      </div>
      <div className="flex items-start gap-2 md:flex-col">
        <Button size="icon" variant="outline" onClick={() => props.onMove(clip.id, -1)}><ArrowUp className="h-4 w-4" /></Button>
        <Button size="icon" variant="outline" onClick={() => props.onMove(clip.id, 1)}><ArrowDown className="h-4 w-4" /></Button>
        <Button size="icon" variant="outline" onClick={() => props.onRemove(clip.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </article>
  );
}

function PreviewAsset({ asset, transition }: { asset: VideoEditorAsset; transition: VideoEditorTransition }) {
  const className = `h-full w-full ${transition === "zoom" ? "scale-105" : ""} ${transition === "fade" ? "opacity-90" : ""}`;
  if (asset.type === "image") return <img src={asset.url} alt="" className={`${className} object-cover transition-all duration-500`} />;
  if (asset.type === "video") return <video key={asset.id} src={asset.url} muted autoPlay loop className={`${className} object-cover`} />;
  return <div className="grid h-full place-items-center text-muted-foreground"><Music2 className="h-8 w-8" /></div>;
}

function createAsset(file: File): VideoEditorAsset | null {
  const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : null;
  if (!type) return null;
  return { id: makeId(), type, file, name: file.name, url: URL.createObjectURL(file) };
}

function createClipFromAsset(asset: VideoEditorAsset): VideoEditorClip {
  return { id: makeId(), assetId: asset.id, type: asset.type, label: asset.name, durationSeconds: asset.type === "image" ? 4 : asset.type === "video" ? 6 : 1, fitMode: "cover", transition: asset.type === "image" ? "fade" : "none" };
}

function getPreviewClip(clips: VideoEditorClip[], elapsed: number) {
  let cursor = 0;
  for (const clip of clips) {
    const end = cursor + clip.durationSeconds;
    if (elapsed >= cursor && elapsed < end) return { clip, localTime: elapsed - cursor };
    cursor = end;
  }
  return clips.length ? { clip: clips[clips.length - 1], localTime: clips[clips.length - 1].durationSeconds } : null;
}

function toRenderClip(clip: VideoEditorClip) {
  return { id: clip.id, assetId: clip.assetId, type: clip.type, durationSeconds: clip.durationSeconds, fitMode: clip.fitMode, transition: clip.transition };
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
