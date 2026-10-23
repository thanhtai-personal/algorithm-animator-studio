import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Download, Film, ImagePlus, Music2, Scissors, Upload, Video } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { t, readSystemLang, subscribeSystemLang, type Lang  } from "@/lib/i18n";
import { getMusicLibraryTracks } from "@/lib/musicLibrary";
import { VideoEditorPreview } from "./VideoEditorPreview";
import { VideoEditorLyricsPanel } from "./VideoEditorLyricsPanel";
import { MediaBin, TimelineTrack, type TrackKind } from "./VideoEditorTimeline";
import { createAsset, createAssetFromLibraryTrack, createClipFromAsset, getDefaultClipDuration, mergeLibraryAssets, readMediaDurationSeconds } from "../lib/videoEditorAssetHelpers";
import { fromDraftAsset, loadVideoEditorDraft, saveVideoEditorDraft, toDraftAsset } from "../lib/videoEditorDraftStore";
import { renderTimelineVideo } from "../lib/videoEditorApi";
import { DEFAULT_VIDEO_EDITOR_LYRICS, normalizeEditorLyrics } from "../lib/videoEditorLyrics";
import { canClipUseTrack, canUseOnTrack, clampVolume, createRenderedVideoAsset, downloadVideo, getActiveTimelineClip, getPreviewClip, insertBefore, toRenderClip } from "../lib/videoEditorTimelineHelpers";
import type { TimelineRenderResponse, VideoEditorAsset, VideoEditorAspectRatio, VideoEditorClip, VideoEditorLyrics, VideoEditorRenderEngine } from "../lib/videoEditorTypes";

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
  const [lyrics, setLyrics] = useState<VideoEditorLyrics>(DEFAULT_VIDEO_EDITOR_LYRICS);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [lastVideo, setLastVideo] = useState<TimelineRenderResponse | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const assetUrlsRef = useRef<string[]>([]);
  const seekingRef = useRef(false);
  const resumeAfterSeekRef = useRef(false);

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
        setLyrics(normalizeEditorLyrics(draft.lyrics));
        setAssets(mergeLibraryAssets(draft.assets.map(fromDraftAsset), []));
        setClips(draft.clips.map((clip) => ({ ...clip, transitionSeconds: clip.transitionSeconds || 1.5, volume: clampVolume(clip.volume) })));
      })
      .finally(() => setDraftLoaded(true));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAssets((current) => mergeLibraryAssets(current, []));
    getMusicLibraryTracks()
      .then(async (tracks) => {
        const libraryAssets = await Promise.all(tracks.map(createAssetFromLibraryTrack));
        if (!cancelled) {
          setAssets((current) => mergeLibraryAssets(current, libraryAssets.filter(Boolean) as VideoEditorAsset[]));
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    assetUrlsRef.current = assets.map((asset) => asset.url);
  }, [assets]);
  useEffect(() => () => assetUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);
  useEffect(() => {
    const pending = assets.filter((asset) => asset.source !== "silent" && (asset.type === "video" || asset.type === "audio") && !asset.durationSeconds);
    if (!pending.length) return;
    let cancelled = false;
    Promise.all(pending.map(async (asset) => ({ id: asset.id, duration: await readMediaDurationSeconds(asset.url, asset.type).catch(() => 0) }))).then((items) => {
      if (cancelled) return;
      const durations = new Map(items.filter((item) => item.duration > 0).map((item) => [item.id, item.duration]));
      setAssets((current) => current.map((asset) => durations.has(asset.id) ? { ...asset, durationSeconds: durations.get(asset.id) } : asset));
    });
    return () => { cancelled = true; };
  }, [assets]);
  useEffect(() => {
    const assetById = new Map(assets.map((asset) => [asset.id, asset]));
    setClips((current) => {
      let changed = false;
      const next = current.map((clip) => {
        const asset = assetById.get(clip.assetId);
        if (!asset?.durationSeconds || (clip.type !== "audio" && clip.type !== "video")) return clip;
        const legacyFallback = clip.type === "audio" ? 12 : 6;
        if (Math.abs(clip.durationSeconds - legacyFallback) > 0.0005) return clip;
        const durationSeconds = getDefaultClipDuration(asset);
        if (Math.abs(durationSeconds - clip.durationSeconds) <= 0.0005) return clip;
        changed = true;
        return { ...clip, durationSeconds };
      });
      return changed ? next : current;
    });
  }, [assets]);
  useEffect(() => {
    if (!draftLoaded) return;
    const timer = window.setTimeout(() => {
      void saveVideoEditorDraft({
        title, aspectRatio, fps, showWatermark, watermarkText, watermarkLogoAssetId, lyrics, clips,
        assets: assets.filter((asset) => asset.source !== "system-music" && asset.source !== "silent").map(toDraftAsset),
      }).catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [assets, aspectRatio, clips, draftLoaded, fps, lyrics, showWatermark, title, watermarkLogoAssetId, watermarkText]);

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
    const audio = audioRef.current;
    if (!audio) return;
    const audioPreview = getActiveTimelineClip(audioClips, elapsed);
    const asset = audioPreview?.clip ? assets.find((item) => item.id === audioPreview.clip.assetId) : undefined;
    if (!audioPreview || !asset || asset.source === "silent") {
      audio.pause();
      return;
    }

    const sourceChanged = audio.dataset.assetId !== asset.id;
    if (sourceChanged) {
      audio.src = asset.url;
      audio.loop = false;
      audio.dataset.assetId = asset.id;
      audio.load();
    }
    audio.volume = clampVolume(audioPreview.clip.volume);

    const desiredTime = Math.max(0, audioPreview.localTime);
    const syncTime = () => {
      const drift = Math.abs(audio.currentTime - desiredTime);
      if (!playing || sourceChanged || drift > 0.35) {
        try { audio.currentTime = desiredTime; } catch { /* metadata may still be loading */ }
      }
      if (playing) {
        if (audio.paused) void audio.play().catch(() => undefined);
      } else {
        audio.pause();
      }
    };

    if (audio.readyState >= 1) syncTime();
    else {
      audio.addEventListener("loadedmetadata", syncTime, { once: true });
      return () => audio.removeEventListener("loadedmetadata", syncTime);
    }
  }, [assets, audioClips, elapsed, playing]);

  function handleSeekStart() {
    if (seekingRef.current) return;
    seekingRef.current = true;
    resumeAfterSeekRef.current = playing;
    setPlaying(false);
  }

  function handleSeek(value: number) {
    setElapsed(Math.min(totalDuration, Math.max(0, value)));
  }

  function handleSeekEnd(value: number) {
    handleSeek(value);
    if (!seekingRef.current) return;
    const shouldResume = resumeAfterSeekRef.current;
    seekingRef.current = false;
    resumeAfterSeekRef.current = false;
    setPlaying(shouldResume);
  }

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
      toast.error(t(lang, "uiAddAtLeastOneImageOrVideoTo"));
      return;
    }
    setRendering(true);
    setRenderProgress(0);
    const toastId = toast.loading(renderEngine === "remotion"
      ? t(lang, "uiRenderingProshowTimelineWithRemotion")
      : t(lang, "uiExportingMp4Timeline")
    );
    try {
      const result = await renderTimelineVideo(
        { title, aspectRatio, fps, renderEngine, showWatermark, watermarkText, watermarkLogoAssetId, lyrics, clips: clips.map(toRenderClip) },
        assets,
        renderEngine === "remotion" ? (event) => {
          setRenderProgress(event.progress);
          toast.loading(`${Math.round(event.progress * 100)}% · ${event.message}`, { id: toastId });
        } : undefined,
      );
      setLastVideo(result);
      if (result.warning) toast.warning(result.warning);
      downloadVideo(result.videoUrl, result.fileName);
      const renderedAsset = await createRenderedVideoAsset(result);
      setAssets((current) => [...current, renderedAsset]);
      toast.success(t(lang, "uiVideoExportedToLibrary"), { id: toastId });
      await onVideoCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "uiCouldNotExportVideo"), { id: toastId });
    } finally {
      setRendering(false);
      setRenderProgress(0);
    }
  }

  return (
    <Card className="border-cyan-500/20 bg-cyan-500/[0.03]" onDragOver={(event) => event.preventDefault()} onDrop={handleEditorDrop}>
      <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl"><Scissors className="h-5 w-5 text-cyan-300" /> {t(lang, "uiCommonVideoEditor")}</CardTitle>
          <CardDescription>{t(lang, "uiDragMediaIntoTheBinArrangeTwoProshow")}</CardDescription>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/40">
          <Upload className="h-4 w-4" /> {t(lang, "uiUploadMedia")}
          <input type="file" multiple accept="image/*,audio/*,video/*" className="hidden" onChange={(event) => addFiles(event.target.files)} />
        </label>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_120px_110px_auto] xl:items-end">
            <Field label={t(lang, "uiOutputName")}><Input value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
            <Field label={t(lang, "uiAspect")}><Select value={aspectRatio} onValueChange={(value) => setAspectRatio(value as VideoEditorAspectRatio)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="16:9">16:9</SelectItem><SelectItem value="9:16">9:16</SelectItem></SelectContent></Select></Field>
            <Field label="FPS"><Select value={String(fps)} onValueChange={(value) => setFps(Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="24">24</SelectItem><SelectItem value="30">30</SelectItem><SelectItem value="60">60</SelectItem></SelectContent></Select></Field>
            <Button className="xl:min-w-64" onClick={() => void handleRender()} disabled={rendering || !visualClips.length}>
              {rendering ? <SystemLoader className="mr-2 h-4 w-4" /> : <Film className="mr-2 h-4 w-4" />}
              {rendering && renderEngine === "remotion"
                ? `Remotion ${Math.round(renderProgress * 100)}%`
                : renderEngine === "remotion" ? t(lang, "uiRenderMp4WithRemotion") : t(lang, "uiExportMp4WithFfmpeg")}
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
          <div className="rounded-lg border bg-background/20 p-3">
            <VideoEditorPreview
              asset={currentAsset}
              clip={preview?.clip}
              localTime={preview?.localTime}
              aspectRatio={aspectRatio}
              progress={progress}
              elapsed={elapsed}
              totalDuration={totalDuration}
              playing={playing}
              title={title}
              showWatermark={showWatermark}
              watermarkText={watermarkText}
              watermarkLogoAsset={assets.find((asset) => asset.id === watermarkLogoAssetId)}
              lyrics={lyrics}
              onReset={() => { handleSeekStart(); handleSeekEnd(0); }}
              onPlay={() => setPlaying((value) => !value)}
              onSeekStart={handleSeekStart}
              onSeek={handleSeek}
              onSeekEnd={handleSeekEnd}
            />
          </div>
        </div>

        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-sm font-semibold text-cyan-100">Media & Timeline</h3>
              <p className="text-xs text-muted-foreground">Kéo media từ kho bên trái sang Track 1 hoặc Track 2 ngay bên cạnh.</p>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)] xl:items-start">
            <div className="min-w-0 xl:sticky xl:top-4">
              <MediaBin assets={assets} onFiles={addFiles} />
            </div>
            <div className="min-w-0 space-y-3 rounded-lg border bg-muted/10 p-3">
              <TimelineTrack title="Track 1: Hình ảnh / video" icon={<Film className="h-4 w-4" />} clips={visualClips} assets={assets} track="visual" onDrop={handleTrackDrop} onRemove={removeClip} onUpdate={updateClip} />
              <TimelineTrack title="Track 2: Voice / nhạc" icon={<Music2 className="h-4 w-4" />} clips={audioClips} assets={assets} track="audio" onDrop={handleTrackDrop} onRemove={removeClip} onUpdate={updateClip} />
            </div>
          </div>
        </section>

        <section className="min-w-0 space-y-2">
          <div className="px-1">
            <h3 className="text-sm font-semibold text-cyan-100">Lyrics</h3>
            <p className="text-xs text-muted-foreground">Tạo, đọc và chỉnh toàn bộ lyric sau khi đã sắp xếp media/timeline.</p>
          </div>
          <VideoEditorLyricsPanel lyrics={lyrics} assets={assets} clips={clips} onChange={setLyrics} />
        </section>
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
