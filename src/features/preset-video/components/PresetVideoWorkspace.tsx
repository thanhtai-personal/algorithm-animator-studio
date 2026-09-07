import { Component, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Film, Music2, RotateCcw, Scissors } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SystemLoader } from "@/components/ui/system-loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { getMusicLibraryTracks, type MusicLibraryTrack } from "@/lib/musicLibrary";
import { createDefaultPresetVideoSettings, loadPresetVideoSettings, savePresetVideoSettings } from "../lib/presetVideoDraft";
import { PresetLyricTimingEditor } from "./PresetLyricTimingEditor";
import { PresetVideoMediaStatusCard, PresetVideoRenderProgressCard } from "./PresetVideoStatusCards";
import { preparePresetVideoMedia, renderPresetVideo } from "../lib/presetVideoApi";
import { getPresetVideoOutputSize, PRESET_VIDEO_OUTPUT_SIZES } from "../outputPresets";
import type { PresetVideoDefinition, PresetVideoExportSettings, PresetVideoRenderResponse } from "../types";
import { PresetVideoComposition } from "../PresetVideoComposition";

type Props = {
  preset: PresetVideoDefinition;
  onBack: () => void;
};

const MIN_TRIM_SECONDS = 0.1;

export function PresetVideoWorkspace({ preset, onBack }: Props) {
  const [settings, setSettings] = useState<PresetVideoExportSettings>(() => loadPresetVideoSettings(preset));
  const [tracks, setTracks] = useState<MusicLibraryTrack[]>([]);
  const [musicLoading, setMusicLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderMessage, setRenderMessage] = useState("");
  const [videoSourceUrls, setVideoSourceUrls] = useState<Record<string, string>>({});
  const [mediaPreparing, setMediaPreparing] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [result, setResult] = useState<PresetVideoRenderResponse | null>(null);
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    setSettings(loadPresetVideoSettings(preset));
    setResult(null);
    setVideoSourceUrls({});
    setMediaError("");
  }, [preset]);

  useEffect(() => {
    savePresetVideoSettings(preset.id, settings);
  }, [preset.id, settings]);

  useEffect(() => {
    if (!preset.videoSources?.length) {
      setVideoSourceUrls({});
      setMediaPreparing(false);
      setMediaError("");
      return;
    }

    let alive = true;
    setMediaPreparing(true);
    setMediaError("");
    preparePresetVideoMedia(preset)
      .then((media) => {
        if (alive) setVideoSourceUrls(media.videoSourceUrls);
      })
      .catch((error) => {
        if (!alive) return;
        const message = error instanceof Error ? error.message : "Không chuẩn bị được clip video nền.";
        setMediaError(message);
        toast.error(message);
      })
      .finally(() => {
        if (alive) setMediaPreparing(false);
      });

    return () => { alive = false; };
  }, [preset]);

  useEffect(() => {
    let alive = true;
    setMusicLoading(true);
    getMusicLibraryTracks()
      .then((items) => { if (alive) setTracks(items); })
      .catch((error) => {
        if (alive) {
          setTracks([]);
          toast.error(error instanceof Error ? error.message : "Không tải được thư viện nhạc.");
        }
      })
      .finally(() => { if (alive) setMusicLoading(false); });
    return () => { alive = false; };
  }, []);

  const output = getPresetVideoOutputSize(settings.outputPreset);
  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === settings.backgroundMusicId),
    [settings.backgroundMusicId, tracks],
  );
  const inputProps = useMemo(() => ({
    presetId: preset.id,
    aspectRatio: output.aspectRatio,
    durationSeconds: preset.defaultDurationSeconds,
    fps: preset.defaultFps,
    backgroundMusicUrl: selectedTrack?.audioUrl || "",
    backgroundMusicVolume: settings.backgroundMusicVolume,
    originalAudioVolume: settings.originalAudioVolume,
    lyricTimings: settings.lyricTimings,
    videoSourceUrls,
  }), [output.aspectRatio, preset, selectedTrack?.audioUrl, settings.backgroundMusicVolume, settings.originalAudioVolume, settings.lyricTimings, videoSourceUrls]);

  const inFrame = Math.max(0, Math.floor(settings.trimStartSeconds * preset.defaultFps));
  const outFrame = Math.max(inFrame, Math.ceil(settings.trimEndSeconds * preset.defaultFps) - 1);
  const durationInFrames = Math.max(1, Math.round(preset.defaultDurationSeconds * preset.defaultFps));

  function patchSettings(patch: Partial<PresetVideoExportSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function setTrimStart(value: number) {
    patchSettings({ trimStartSeconds: Math.min(value, settings.trimEndSeconds - MIN_TRIM_SECONDS) });
  }

  function setTrimEnd(value: number) {
    patchSettings({ trimEndSeconds: Math.max(value, settings.trimStartSeconds + MIN_TRIM_SECONDS) });
  }

  function updateLyricTiming(cueId: string, timing: { start: number; end: number }) {
    patchSettings({ lyricTimings: { ...settings.lyricTimings, [cueId]: timing } });
  }

  function resetLyricTiming() {
    patchSettings({ lyricTimings: createDefaultPresetVideoSettings(preset).lyricTimings });
  }

  function previewAt(timeSeconds: number) {
    playerRef.current?.seekTo(Math.max(0, Math.floor(timeSeconds * preset.defaultFps)));
    playerRef.current?.play();
  }

  function previewTrim() {
    playerRef.current?.seekTo(inFrame);
    playerRef.current?.play();
  }

  function reset() {
    setSettings(createDefaultPresetVideoSettings(preset));
    setResult(null);
    setRenderProgress(0);
    setRenderMessage("");
    playerRef.current?.seekTo(0);
  }

  async function exportVideo() {
    setRendering(true);
    setRenderProgress(0);
    setRenderMessage("Đang khởi tạo render...");
    setResult(null);
    try {
      const rendered = await renderPresetVideo({
        preset,
        settings,
        backgroundMusicUrl: selectedTrack?.audioUrl,
      }, (event) => {
        setRenderProgress(event.progress);
        setRenderMessage(event.message);
      });
      setResult(rendered);
      toast.success(`Đã export ${rendered.fileName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export preset video thất bại.");
    } finally {
      setRendering(false);
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 rounded-xl border bg-card/70 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Quay lại kho preset">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Preset Video</p>
            <h1 className="mt-1 text-xl font-bold">{preset.name}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{preset.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={rendering} onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Reset</Button>
          <Button disabled={rendering} onClick={() => void exportVideo()}><Film className="mr-2 h-4 w-4" />{rendering ? `Đang render ${Math.round(renderProgress * 100)}%` : "Export MP4"}</Button>
        </div>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-4">
          <Card className="overflow-hidden bg-black">
            <CardContent className="flex justify-center p-0">
              <div
                className="w-full"
                style={{
                  maxWidth: output.aspectRatio === "9:16" ? "32dvh" : output.aspectRatio === "1:1" ? "58dvh" : undefined,
                  maxHeight: "58dvh",
                  aspectRatio: `${output.width} / ${output.height}`,
                }}
              >
                <PresetPreviewErrorBoundary key={`${preset.id}-${output.aspectRatio}`}>
                  <Player
                    ref={playerRef}
                    component={PresetVideoComposition}
                    inputProps={inputProps}
                    durationInFrames={durationInFrames}
                    compositionWidth={output.width}
                    compositionHeight={output.height}
                    fps={preset.defaultFps}
                    inFrame={inFrame}
                    outFrame={outFrame}
                    controls
                    style={{ width: "100%", height: "100%", background: "#000" }}
                  />
                </PresetPreviewErrorBoundary>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Scissors className="h-4 w-4" />Đoạn export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <TrimSlider
                label="Bắt đầu"
                value={settings.trimStartSeconds}
                max={Math.max(0, settings.trimEndSeconds - MIN_TRIM_SECONDS)}
                duration={preset.defaultDurationSeconds}
                onChange={setTrimStart}
              />
              <TrimSlider
                label="Kết thúc"
                value={settings.trimEndSeconds}
                min={Math.min(preset.defaultDurationSeconds, settings.trimStartSeconds + MIN_TRIM_SECONDS)}
                max={preset.defaultDurationSeconds}
                duration={preset.defaultDurationSeconds}
                onChange={setTrimEnd}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm">
                <span>{formatSeconds(settings.trimStartSeconds)} → {formatSeconds(settings.trimEndSeconds)}</span>
                <span className="font-semibold">{formatSeconds(settings.trimEndSeconds - settings.trimStartSeconds)}</span>
              </div>
              <Button variant="outline" onClick={previewTrim}>Preview đoạn đã chọn</Button>
            </CardContent>
          </Card>

          {preset.editableLyrics?.length ? (
            <PresetLyricTimingEditor
              cues={preset.editableLyrics}
              timings={settings.lyricTimings}
              durationSeconds={preset.defaultDurationSeconds}
              onChange={updateLyricTiming}
              onReset={resetLyricTiming}
              onPreview={previewAt}
            />
          ) : null}
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Export settings</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Kích thước</Label>
                <Select value={settings.outputPreset} onValueChange={(value) => patchSettings({ outputPreset: value as PresetVideoExportSettings["outputPreset"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRESET_VIDEO_OUTPUT_SIZES.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{output.aspectRatio} · {output.width}×{output.height} · {preset.defaultFps} FPS</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Music2 className="h-4 w-4" />Nhạc nền</Label>
                <Select
                  value={settings.backgroundMusicId || "none"}
                  disabled={musicLoading}
                  onValueChange={(value) => patchSettings({ backgroundMusicId: value === "none" ? "" : value })}
                >
                  <SelectTrigger><SelectValue placeholder={musicLoading ? "Đang tải..." : "Không dùng nhạc"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không dùng nhạc</SelectItem>
                    {tracks.map((track) => <SelectItem key={track.id} value={track.id}>{track.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedTrack ? <MusicPreview src={selectedTrack.audioUrl} volume={settings.backgroundMusicVolume} /> : null}
              </div>

              <VolumeSlider label="Music volume" value={settings.backgroundMusicVolume} onChange={(value) => patchSettings({ backgroundMusicVolume: value })} />
              {preset.hasOriginalAudio
                ? <VolumeSlider label="Original audio" value={settings.originalAudioVolume} onChange={(value) => patchSettings({ originalAudioVolume: value })} />
                : <p className="text-xs text-muted-foreground">Preset này không khai báo original audio.</p>}
            </CardContent>
          </Card>

          {preset.videoSources?.length ? (
            <PresetVideoMediaStatusCard
              preparing={mediaPreparing}
              error={mediaError}
              sourceCount={Object.keys(videoSourceUrls).length}
            />
          ) : null}

          {rendering ? <PresetVideoRenderProgressCard progress={renderProgress} message={renderMessage} /> : null}

          {result ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Export hoàn tất</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <video controls src={result.videoUrl} className="w-full rounded-lg bg-black" />
                <div className="text-xs text-muted-foreground">
                  <p>{result.fileName}</p>
                  <p>{result.width}×{result.height} · {formatSeconds(result.durationSeconds)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" asChild><a href={result.videoUrl} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" />Mở file</a></Button>
                  <Button variant="outline" asChild><Link to="/assets">Generated Assets</Link></Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function TrimSlider(props: { label: string; value: number; min?: number; max: number; duration: number; onChange: (value: number) => void }) {
  const min = props.min ?? 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <Label>{props.label}</Label>
        <span className="font-mono text-xs text-muted-foreground">{formatSeconds(props.value)}</span>
      </div>
      <Slider
        value={[Math.min(props.max, Math.max(min, props.value))]}
        min={min}
        max={Math.max(min, props.max)}
        step={0.1}
        onValueChange={([value]) => props.onChange(value)}
      />
      <div className="flex justify-between text-[11px] text-muted-foreground"><span>00:00.0</span><span>{formatSeconds(props.duration)}</span></div>
    </div>
  );
}

function VolumeSlider(props: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm"><Label>{props.label}</Label><span>{Math.round(props.value * 100)}%</span></div>
      <Slider value={[props.value]} min={0} max={1} step={0.01} onValueChange={([value]) => props.onChange(value)} />
    </div>
  );
}

function MusicPreview({ src, volume }: { src: string; volume: number }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.volume = volume;
  }, [volume]);
  return <audio ref={ref} controls preload="metadata" src={src} className="h-9 w-full" />;
}

function formatSeconds(value: number) {
  const safe = Math.max(0, Number.isFinite(value) ? value : 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
}

class PresetPreviewErrorBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: "" };

  static getDerivedStateFromError(error: Error) {
    return { error: error.message || "Preset preview bị lỗi." };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Preset video preview failed", error, info);
  }

  render() {
    if (this.state.error) {
      return <div className="grid min-h-72 place-items-center p-8 text-center text-sm text-red-300">{this.state.error}</div>;
    }
    return this.props.children;
  }
}
