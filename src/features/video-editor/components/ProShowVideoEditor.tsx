import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Film, ImagePlus, Loader2, Music2, Play, Scissors, Trash2, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { readSystemLang, subscribeSystemLang, text, type Lang } from "@/lib/i18n";
import { VIDEO_EDITOR_TRANSITIONS } from "../lib/videoEditorConstants";
import { renderTimelineVideo } from "../lib/videoEditorApi";
import type { TimelineRenderResponse, VideoEditorAsset, VideoEditorAspectRatio, VideoEditorClip, VideoEditorFitMode, VideoEditorRenderEngine, VideoEditorTransition } from "../lib/videoEditorTypes";

type Props = {
  renderEngine: VideoEditorRenderEngine;
  onVideoCreated: () => Promise<void> | void;
};

type TrackKind = "visual" | "audio";

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
  const audioClips = clips.filter((clip) => clip.type === "audio");
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
    const asset = audioClips[0] ? assets.find((item) => item.id === audioClips[0].assetId) : undefined;
    const audio = audioRef.current;
    if (!asset || !audio) return;
    audio.src = asset.url;
    audio.loop = true;
    audio.volume = 0.9;
  }, [audioClips[0]?.assetId, assets]);

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

  function addFiles(fileList: FileList | null, targetTrack?: TrackKind) {
    const newAssets = Array.from(fileList || []).map(createAsset).filter(Boolean) as VideoEditorAsset[];
    if (!newAssets.length) return;
    setAssets((current) => [...current, ...newAssets]);
    if (targetTrack) {
      setClips((current) => [...current, ...newAssets.filter((asset) => canUseOnTrack(asset, targetTrack)).map(createClipFromAsset)]);
    }
  }

  function handleEditorDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
  }

  function handleTrackDrop(event: DragEvent<HTMLElement>, track: TrackKind, beforeClipId?: string) {
    event.preventDefault();
    event.stopPropagation();
    const assetId = event.dataTransfer.getData("asset-id");
    const clipId = event.dataTransfer.getData("clip-id");
    if (assetId) {
      const asset = assets.find((item) => item.id === assetId);
      if (asset && canUseOnTrack(asset, track)) insertClip(createClipFromAsset(asset), beforeClipId);
      return;
    }
    if (clipId) moveClipBefore(clipId, beforeClipId, track);
    if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files, track);
  }

  function insertClip(clip: VideoEditorClip, beforeClipId?: string) {
    setClips((current) => beforeClipId ? insertBefore(current, clip, beforeClipId) : [...current, clip]);
  }

  function updateClip(id: string, patch: Partial<VideoEditorClip>) {
    setClips((current) => current.map((clip) => clip.id === id ? { ...clip, ...patch } : clip));
  }

  function removeClip(id: string) {
    setClips((current) => current.filter((clip) => clip.id !== id));
  }

  function moveClipBefore(clipId: string, beforeClipId: string | undefined, track: TrackKind) {
    setClips((current) => {
      const moving = current.find((clip) => clip.id === clipId);
      if (!moving || !canClipUseTrack(moving, track) || moving.id === beforeClipId) return current;
      const without = current.filter((clip) => clip.id !== clipId);
      return beforeClipId ? insertBefore(without, moving, beforeClipId) : [...without, moving];
    });
  }

  async function handleRender() {
    if (!visualClips.length) {
      toast.error(text(lang, "Add at least one image or video to Track 1.", "Cần thêm ít nhất 1 ảnh hoặc video vào Track 1."));
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
    <Card className="border-cyan-500/20 bg-cyan-500/[0.03]" onDragOver={(event) => event.preventDefault()} onDrop={handleEditorDrop}>
      <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl"><Scissors className="h-5 w-5 text-cyan-300" /> {text(lang, "Common video editor", "Trình ghép video chung")}</CardTitle>
          <CardDescription>{text(lang, "Drag media into the bin, arrange two ProShow-style tracks, then render MP4 with FFmpeg or Remotion.", "Kéo media vào kho, sắp xếp 2 track kiểu ProShow rồi render MP4 bằng FFmpeg hoặc Remotion.")}</CardDescription>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/40">
          <Upload className="h-4 w-4" /> {text(lang, "Upload media", "Upload media")}
          <input type="file" multiple accept="image/*,audio/*,video/*" className="hidden" onChange={(event) => addFiles(event.target.files)} />
        </label>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_120px_110px_auto] xl:items-end">
            <Field label={text(lang, "Output name", "Tên video")}><Input value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
            <Field label={text(lang, "Aspect", "Tỉ lệ")}><Select value={aspectRatio} onValueChange={(value) => setAspectRatio(value as VideoEditorAspectRatio)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="16:9">16:9</SelectItem><SelectItem value="9:16">9:16</SelectItem></SelectContent></Select></Field>
            <Field label="FPS"><Select value={String(fps)} onValueChange={(value) => setFps(Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="24">24</SelectItem><SelectItem value="30">30</SelectItem><SelectItem value="60">60</SelectItem></SelectContent></Select></Field>
            <Button className="xl:min-w-64" onClick={() => void handleRender()} disabled={rendering || !visualClips.length}>
              {rendering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
              {renderEngine === "remotion" ? text(lang, "Render MP4 with Remotion", "Render MP4 bằng Remotion") : text(lang, "Export MP4 with FFmpeg", "Export MP4 bằng FFmpeg")}
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary"><ImagePlus className="mr-1 h-3.5 w-3.5" /> {timelineStats.image} ảnh</Badge>
            <Badge variant="secondary"><Video className="mr-1 h-3.5 w-3.5" /> {timelineStats.video} video</Badge>
            <Badge variant="secondary"><Music2 className="mr-1 h-3.5 w-3.5" /> {timelineStats.audio} audio</Badge>
            <Badge variant="outline">{renderEngine === "remotion" ? "Remotion" : "FFmpeg"}</Badge>
            <Badge variant="outline">{totalDuration.toFixed(1)}s</Badge>
          </div>
          <PreviewPanel asset={currentAsset} clip={preview?.clip} aspectRatio={aspectRatio} progress={progress} elapsed={elapsed} totalDuration={totalDuration} playing={playing} onReset={() => setElapsed(0)} onPlay={() => setPlaying((value) => !value)} />
        </div>

        <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
          <TimelineTrack title="Track 1: Hình ảnh / video" icon={<Film className="h-4 w-4" />} clips={visualClips} assets={assets} track="visual" onDrop={handleTrackDrop} onRemove={removeClip} onUpdate={updateClip} />
          <TimelineTrack title="Track 2: Voice / nhạc" icon={<Music2 className="h-4 w-4" />} clips={audioClips} assets={assets} track="audio" onDrop={handleTrackDrop} onRemove={removeClip} onUpdate={updateClip} />
        </div>

        <MediaBin assets={assets} onFiles={addFiles} />
        <audio ref={audioRef} />
        {lastVideo ? (
          <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="break-words text-sm font-semibold text-emerald-100">{lastVideo.fileName}</p>
            <video src={lastVideo.videoUrl} controls className="w-full rounded-lg bg-black" />
            {lastVideo.warning ? <p className="text-xs text-amber-100">{lastVideo.warning}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Field(props: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{props.label}</Label>{props.children}</div>;
}

function PreviewPanel(props: { asset?: VideoEditorAsset; clip?: VideoEditorClip; aspectRatio: VideoEditorAspectRatio; progress: number; elapsed: number; totalDuration: number; playing: boolean; onReset: () => void; onPlay: () => void }) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-3">
      <div className="overflow-hidden rounded-lg border bg-black shadow-2xl shadow-black/30" style={{ aspectRatio: props.aspectRatio === "9:16" ? "9 / 16" : "16 / 9" }}>
        {props.asset ? <PreviewAsset asset={props.asset} clip={props.clip} /> : <div className="grid h-full place-items-center text-sm text-muted-foreground">Preview timeline</div>}
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

function TimelineTrack(props: { title: string; icon: ReactNode; clips: VideoEditorClip[]; assets: VideoEditorAsset[]; track: TrackKind; onDrop: (event: DragEvent<HTMLElement>, track: TrackKind, beforeClipId?: string) => void; onRemove: (id: string) => void; onUpdate: (id: string, patch: Partial<VideoEditorClip>) => void }) {
  return (
    <section className="grid gap-2 md:grid-cols-[160px_minmax(0,1fr)]">
      <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">{props.icon}{props.title}</div>
      <div className="flex min-h-28 gap-2 overflow-x-auto rounded-md border border-dashed border-border/80 bg-background/50 p-2" onDragOver={(event) => event.preventDefault()} onDrop={(event) => props.onDrop(event, props.track)}>
        {props.clips.length ? props.clips.map((clip) => (
          <TimelineClip key={clip.id} clip={clip} asset={props.assets.find((asset) => asset.id === clip.assetId)} track={props.track} onDrop={props.onDrop} onRemove={props.onRemove} onUpdate={props.onUpdate} />
        )) : <div className="grid min-w-full place-items-center text-sm text-muted-foreground">Drop media here</div>}
      </div>
    </section>
  );
}

function TimelineClip(props: { clip: VideoEditorClip; asset?: VideoEditorAsset; track: TrackKind; onDrop: (event: DragEvent<HTMLElement>, track: TrackKind, beforeClipId?: string) => void; onRemove: (id: string) => void; onUpdate: (id: string, patch: Partial<VideoEditorClip>) => void }) {
  const { clip } = props;
  return (
    <article draggable onDragStart={(event) => event.dataTransfer.setData("clip-id", clip.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => props.onDrop(event, props.track, clip.id)} className="grid w-72 shrink-0 gap-2 rounded-md border bg-card p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{props.asset?.name || clip.label}</span>
        <Button size="icon" variant="ghost" onClick={() => props.onRemove(clip.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Duration"><Input type="number" min={1} max={180} value={clip.durationSeconds} onChange={(event) => props.onUpdate(clip.id, { durationSeconds: Number(event.target.value) })} /></Field>
        {clip.type !== "audio" ? <Field label="Fit"><Select value={clip.fitMode} onValueChange={(value) => props.onUpdate(clip.id, { fitMode: value as VideoEditorFitMode })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cover">cover</SelectItem><SelectItem value="contain">contain</SelectItem></SelectContent></Select></Field> : null}
      </div>
      {clip.type !== "audio" ? (
        <Field label="Animation chuyển slide">
          <Select value={clip.transition} onValueChange={(value) => props.onUpdate(clip.id, { transition: value as VideoEditorTransition })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{VIDEO_EDITOR_TRANSITIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      ) : null}
      {clip.type === "video" ? (
        <label className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2 text-sm">
          <span>Âm thanh gốc video</span>
          <Switch checked={clip.keepOriginalAudio === true} onCheckedChange={(checked) => props.onUpdate(clip.id, { keepOriginalAudio: checked })} />
        </label>
      ) : null}
    </article>
  );
}

function MediaBin(props: { assets: VideoEditorAsset[]; onFiles: (files: FileList | null) => void }) {
  return (
    <section className="space-y-3 rounded-lg border bg-background/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Kho media</h3>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/40"><Upload className="h-4 w-4" /> Upload<input type="file" multiple accept="image/*,audio/*,video/*" className="hidden" onChange={(event) => props.onFiles(event.target.files)} /></label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {props.assets.length ? props.assets.map((asset) => <MediaAsset key={asset.id} asset={asset} />) : <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-4">Drop ảnh, video hoặc audio từ máy tính vào editor</div>}
      </div>
    </section>
  );
}

function MediaAsset({ asset }: { asset: VideoEditorAsset }) {
  return (
    <article draggable onDragStart={(event) => event.dataTransfer.setData("asset-id", asset.id)} className="grid gap-2 rounded-md border bg-card p-2">
      <div className="grid aspect-video place-items-center overflow-hidden rounded bg-slate-950 text-muted-foreground">
        {asset.type === "image" ? <img src={asset.url} className="h-full w-full object-cover" alt="" /> : asset.type === "video" ? <video src={asset.url} muted className="h-full w-full object-cover" /> : <Music2 className="h-7 w-7" />}
      </div>
      <div className="flex items-center gap-2 text-xs"><Badge variant="outline">{asset.type}</Badge><span className="truncate">{asset.name}</span></div>
    </article>
  );
}

function PreviewAsset({ asset, clip }: { asset: VideoEditorAsset; clip?: VideoEditorClip }) {
  const effect = clip?.transition === "blurry" ? "scale-105 blur-sm opacity-90" : clip?.transition === "fade" ? "opacity-90" : clip?.transition === "zoom-in" ? "scale-105" : "";
  if (asset.type === "image") return <img src={asset.url} alt="" className={`h-full w-full object-cover transition-all duration-500 ${effect}`} />;
  if (asset.type === "video") return <video key={asset.id} src={asset.url} muted={clip?.keepOriginalAudio !== true} autoPlay loop className={`h-full w-full object-cover ${effect}`} />;
  return <div className="grid h-full place-items-center text-muted-foreground"><Music2 className="h-8 w-8" /></div>;
}

function createAsset(file: File): VideoEditorAsset | null {
  const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : null;
  if (!type) return null;
  return { id: makeId(), type, file, name: file.name, url: URL.createObjectURL(file) };
}

function createClipFromAsset(asset: VideoEditorAsset): VideoEditorClip {
  return { id: makeId(), assetId: asset.id, type: asset.type, label: asset.name, durationSeconds: asset.type === "image" ? 4 : asset.type === "video" ? 6 : 12, fitMode: "cover", transition: asset.type === "audio" ? "none" : "blurry", keepOriginalAudio: false };
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
  return { id: clip.id, assetId: clip.assetId, type: clip.type, durationSeconds: clip.durationSeconds, fitMode: clip.fitMode, transition: clip.transition, keepOriginalAudio: clip.keepOriginalAudio === true };
}

function canUseOnTrack(asset: VideoEditorAsset, track: TrackKind) {
  return track === "audio" ? asset.type === "audio" : asset.type === "image" || asset.type === "video";
}

function canClipUseTrack(clip: VideoEditorClip, track: TrackKind) {
  return track === "audio" ? clip.type === "audio" : clip.type !== "audio";
}

function insertBefore(clips: VideoEditorClip[], clip: VideoEditorClip, beforeClipId: string) {
  const index = clips.findIndex((item) => item.id === beforeClipId);
  if (index < 0) return [...clips, clip];
  return [...clips.slice(0, index), clip, ...clips.slice(index)];
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
