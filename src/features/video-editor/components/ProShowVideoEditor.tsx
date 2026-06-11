import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Download, Film, ImagePlus, Loader2, Music2, Scissors, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { readSystemLang, subscribeSystemLang, text, type Lang } from "@/lib/i18n";
import type { MusicLibraryTrack } from "@/lib/musicLibrary";
import { VideoEditorMusicPicker } from "./VideoEditorMusicPicker";
import { VideoEditorPreview } from "./VideoEditorPreview";
import { MediaBin, TimelineTrack, type TrackKind } from "./VideoEditorTimeline";
import { fromDraftAsset, loadVideoEditorDraft, saveVideoEditorDraft, toDraftAsset } from "../lib/videoEditorDraftStore";
import { renderTimelineVideo } from "../lib/videoEditorApi";
import type { TimelineRenderResponse, VideoEditorAsset, VideoEditorAspectRatio, VideoEditorClip, VideoEditorRenderEngine } from "../lib/videoEditorTypes";

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
  const [showWatermark, setShowWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState("KAI STUDIO");
  const [watermarkLogoAssetId, setWatermarkLogoAssetId] = useState("");
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [lastVideo, setLastVideo] = useState<TimelineRenderResponse | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const assetUrlsRef = useRef<string[]>([]);

  useEffect(() => subscribeSystemLang(setLang), []);
  useEffect(() => {
    loadVideoEditorDraft()
      .then((draft) => {
        if (!draft) return;
        setTitle(draft.title);
        setAspectRatio(draft.aspectRatio);
        setFps(draft.fps);
        setShowWatermark(draft.showWatermark !== false);
        setWatermarkText(draft.watermarkText || "KAI STUDIO");
        setWatermarkLogoAssetId(draft.watermarkLogoAssetId || "");
        setAssets(draft.assets.map(fromDraftAsset));
        setClips(draft.clips.map((clip) => ({ ...clip, transitionSeconds: clip.transitionSeconds || 1.5 })));
      })
      .finally(() => setDraftLoaded(true));
  }, []);

  useEffect(() => {
    assetUrlsRef.current = assets.map((asset) => asset.url);
  }, [assets]);
  useEffect(() => () => assetUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);
  useEffect(() => {
    if (!draftLoaded) return;
    const timer = window.setTimeout(() => {
      void saveVideoEditorDraft({
        title, aspectRatio, fps, showWatermark, watermarkText, watermarkLogoAssetId, clips,
        assets: assets.map(toDraftAsset),
      }).catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [assets, aspectRatio, clips, draftLoaded, fps, showWatermark, title, watermarkLogoAssetId, watermarkText]);

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
      if (elapsed === 0) audio.currentTime = 0;
    }
  }, [elapsed, playing]);

  const timelineStats = useMemo(() => ({
    image: clips.filter((clip) => clip.type === "image").length,
    video: clips.filter((clip) => clip.type === "video").length,
    audio: clips.filter((clip) => clip.type === "audio").length,
  }), [clips]);
  const imageAssets = assets.filter((asset) => asset.type === "image");

  function addFiles(fileList: FileList | null, targetTrack?: TrackKind) {
    const newAssets = Array.from(fileList || []).map(createAsset).filter(Boolean) as VideoEditorAsset[];
    if (!newAssets.length) return;
    setAssets((current) => [...current, ...newAssets]);
    if (targetTrack) {
      setClips((current) => [...current, ...newAssets.filter((asset) => canUseOnTrack(asset, targetTrack)).map(createClipFromAsset)]);
    }
  }

  async function addLibraryMusic(track: MusicLibraryTrack) {
    const response = await fetch(track.audioUrl);
    if (!response.ok) throw new Error("Không tải được nhạc nền đã chọn.");
    const blob = await response.blob();
    const fileName = track.fileName || `${track.title}.mp3`;
    const asset = createAssetFromFile(new File([blob], fileName, { type: blob.type || "audio/mpeg" }), track.title);
    setAssets((current) => [...current, asset]);
    setClips((current) => [...current, createClipFromAsset(asset)]);
  }

  function addLogoFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    const asset = createAsset(file);
    if (!asset || asset.type !== "image") return;
    setAssets((current) => [...current, asset]);
    setWatermarkLogoAssetId(asset.id);
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
      const result = await renderTimelineVideo({ title, aspectRatio, fps, renderEngine, showWatermark, watermarkText, watermarkLogoAssetId, clips: clips.map(toRenderClip) }, assets);
      setLastVideo(result);
      downloadVideo(result.videoUrl, result.fileName);
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
          <div className="grid gap-3 rounded-lg border bg-background/40 p-3 lg:grid-cols-[auto_minmax(180px,280px)_minmax(180px,280px)_auto] lg:items-end">
            <label className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2 text-sm lg:self-end">
              <span>Hiện header KAI</span>
              <Switch checked={showWatermark} onCheckedChange={setShowWatermark} />
            </label>
            <Field label="Text header"><Input value={watermarkText} onChange={(event) => setWatermarkText(event.target.value)} disabled={!showWatermark || Boolean(watermarkLogoAssetId)} /></Field>
            <Field label="Logo thay text">
              <Select value={watermarkLogoAssetId || "text"} onValueChange={(value) => setWatermarkLogoAssetId(value === "text" ? "" : value)} disabled={!showWatermark}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Dùng text</SelectItem>
                  {imageAssets.map((asset) => <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted/40">
              <ImagePlus className="h-4 w-4" /> Upload logo
              <input type="file" accept="image/*" className="hidden" onChange={(event) => addLogoFile(event.target.files)} />
            </label>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary"><ImagePlus className="mr-1 h-3.5 w-3.5" /> {timelineStats.image} ảnh</Badge>
            <Badge variant="secondary"><Video className="mr-1 h-3.5 w-3.5" /> {timelineStats.video} video</Badge>
            <Badge variant="secondary"><Music2 className="mr-1 h-3.5 w-3.5" /> {timelineStats.audio} audio</Badge>
            <Badge variant="outline">{renderEngine === "remotion" ? "Remotion" : "FFmpeg"}</Badge>
            <Badge variant="outline">{totalDuration.toFixed(1)}s</Badge>
          </div>
          <VideoEditorPreview asset={currentAsset} clip={preview?.clip} aspectRatio={aspectRatio} progress={progress} elapsed={elapsed} totalDuration={totalDuration} playing={playing} onReset={() => setElapsed(0)} onPlay={() => setPlaying((value) => !value)} />
        </div>

        <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
          <TimelineTrack title="Track 1: Hình ảnh / video" icon={<Film className="h-4 w-4" />} clips={visualClips} assets={assets} track="visual" onDrop={handleTrackDrop} onRemove={removeClip} onUpdate={updateClip} />
          <TimelineTrack title="Track 2: Voice / nhạc" icon={<Music2 className="h-4 w-4" />} clips={audioClips} assets={assets} track="audio" onDrop={handleTrackDrop} onRemove={removeClip} onUpdate={updateClip} />
        </div>

        <VideoEditorMusicPicker onPick={addLibraryMusic} />
        <MediaBin assets={assets} onFiles={addFiles} />
        <audio ref={audioRef} />
        {lastVideo ? (
          <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="break-words text-sm font-semibold text-emerald-100">{lastVideo.fileName}</p>
            <Button variant="outline" onClick={() => downloadVideo(lastVideo.videoUrl, lastVideo.fileName)}><Download className="mr-2 h-4 w-4" /> Tải video MP4</Button>
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

function createAsset(file: File): VideoEditorAsset | null {
  const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : null;
  if (!type) return null;
  return createAssetFromFile(file);
}

function createAssetFromFile(file: File, label?: string): VideoEditorAsset {
  const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "video";
  return { id: makeId(), type, file, name: label || file.name, url: URL.createObjectURL(file) };
}

function createClipFromAsset(asset: VideoEditorAsset): VideoEditorClip {
  return { id: makeId(), assetId: asset.id, type: asset.type, label: asset.name, durationSeconds: asset.type === "image" ? 4 : asset.type === "video" ? 6 : 12, fitMode: "contain", transition: asset.type === "audio" ? "none" : "blurry", transitionSeconds: 1.5, keepOriginalAudio: false };
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
  return { id: clip.id, assetId: clip.assetId, type: clip.type, durationSeconds: clip.durationSeconds, fitMode: clip.fitMode, transition: clip.transition, transitionSeconds: clip.transitionSeconds, keepOriginalAudio: clip.keepOriginalAudio === true };
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

function downloadVideo(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
