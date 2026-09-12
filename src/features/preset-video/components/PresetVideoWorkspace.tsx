import { useEffect, useMemo, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Film, RotateCcw, Scissors } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMusicLibraryTracks, type MusicLibraryTrack } from "@/lib/musicLibrary";
import { usePresetVideoMedia } from "../hooks/usePresetVideoMedia";
import { createDefaultPresetVideoSettings, loadPresetVideoSettings, savePresetVideoSettings } from "../lib/presetVideoDraft";
import { renderPresetVideo } from "../lib/presetVideoApi";
import { findRecommendedPresetMusic } from "../lib/presetVideoMusic";
import { getPresetVideoOutputSize, PRESET_VIDEO_OUTPUT_SIZES } from "../outputPresets";
import type { PresetVideoDefinition, PresetVideoExportSettings, PresetVideoRenderResponse, PresetVideoSourceClip, PresetVideoTimelineClip } from "../types";
import { formatPresetSeconds, TrimSlider } from "./PresetVideoControls";
import { PresetVideoCustomClipsCard } from "./PresetVideoCustomClipsCard";
import { PresetVideoSourcePickerCard } from "./PresetVideoSourcePickerCard";
import { PresetVideoSocialMetadataCard } from "./PresetVideoSocialMetadataCard";
import { PresetVideoPreviewEditor } from "./PresetVideoPreviewEditor";
import { PresetVideoMusicSettings } from "./PresetVideoMusicSettings";
import { PresetVideoVoiceoverSettings } from "./PresetVideoVoiceoverSettings";
import { PresetVideoMediaStatusCard, PresetVideoRenderProgressCard } from "./PresetVideoStatusCards";

type Props = { preset: PresetVideoDefinition; onBack: () => void };
const MIN_TRIM_SECONDS = 0.1;

export function PresetVideoWorkspace({ preset, onBack }: Props) {
  const [settings, setSettings] = useState<PresetVideoExportSettings>(() => loadPresetVideoSettings(preset));
  const [tracks, setTracks] = useState<MusicLibraryTrack[]>([]);
  const [musicLoading, setMusicLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderMessage, setRenderMessage] = useState("");
  const [result, setResult] = useState<PresetVideoRenderResponse | null>(null);
  const playerRef = useRef<PlayerRef>(null);
  const media = usePresetVideoMedia(preset, settings.timelineVideoClips);

  useEffect(() => { setSettings(loadPresetVideoSettings(preset)); setResult(null); }, [preset]);
  useEffect(() => { savePresetVideoSettings(preset.id, settings); }, [preset.id, settings]);
  useEffect(() => {
    let alive = true; setMusicLoading(true);
    getMusicLibraryTracks().then((items) => { if (alive) setTracks(items); }).catch((error) => { if (alive) { setTracks([]); toast.error(error instanceof Error ? error.message : "Không tải được thư viện nhạc."); } }).finally(() => { if (alive) setMusicLoading(false); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    const recommended = findRecommendedPresetMusic(tracks, preset.musicRecommendation); if (!recommended) return;
    setSettings((current) => { const currentTrackExists = tracks.some((track) => track.id === current.backgroundMusicId); if (current.backgroundMusicId && currentTrackExists) return current; return { ...current, backgroundMusicId: recommended.id, backgroundMusicVolume: preset.musicRecommendation?.defaultVolume ?? current.backgroundMusicVolume }; });
  }, [preset.id, preset.musicRecommendation, tracks]);

  const output = getPresetVideoOutputSize(settings.outputPreset);
  const usesLocalVideoSources = preset.videoSourceStrategy === "local";
  const requiredSourceIds = useMemo(() => [...(preset.videoSources || []).map((source) => source.id), ...settings.timelineVideoClips.map((clip) => clip.id)], [preset.videoSources, settings.timelineVideoClips]);
  const missingLocalVideoSources = usesLocalVideoSources ? requiredSourceIds.filter((id) => !media.videoSourceUrls[id]) : [];
  const selectedTrack = useMemo(() => tracks.find((track) => track.id === settings.backgroundMusicId), [settings.backgroundMusicId, tracks]);
  const inputProps = useMemo(() => ({
    presetId: preset.id, aspectRatio: output.aspectRatio, durationSeconds: preset.defaultDurationSeconds, fps: preset.defaultFps,
    backgroundMusicUrl: selectedTrack?.audioUrl || "", backgroundMusicVolume: settings.backgroundMusicVolume, originalAudioVolume: settings.originalAudioVolume,
    voiceoverAudioUrl: settings.voiceoverAudioUrl, voiceoverVolume: settings.voiceoverVolume, lyricTimings: settings.lyricTimings, videoSourceUrls: media.previewVideoSourceUrls, timelineVideoClips: settings.timelineVideoClips,
  }), [media.previewVideoSourceUrls, output.aspectRatio, preset, selectedTrack?.audioUrl, settings.backgroundMusicVolume, settings.lyricTimings, settings.originalAudioVolume, settings.timelineVideoClips, settings.voiceoverAudioUrl, settings.voiceoverVolume]);

  function patchSettings(patch: Partial<PresetVideoExportSettings>) { setSettings((current) => ({ ...current, ...patch })); }
  function previewAt(timeSeconds: number) { playerRef.current?.seekTo(Math.max(0, Math.floor(timeSeconds * preset.defaultFps))); playerRef.current?.play(); }
  async function selectLocalVideoSource(source: PresetVideoSourceClip, file: File) { try { await media.importSource(source, file); toast.success(`Đã cắt và cache clip ${source.title}`); } catch { } }
  async function selectLocalVideoSources(sources: readonly PresetVideoSourceClip[], file: File) { try { await media.importSources(sources, file); toast.success(`Đã cắt và cache ${sources.length} trích đoạn từ ${file.name}`); } catch { } }

  function addTimelineClip() {
    const timelineStartSeconds = Math.min(Math.max(0, settings.trimStartSeconds), Math.max(0, preset.defaultDurationSeconds - MIN_TRIM_SECONDS));
    const timelineEndSeconds = Math.min(preset.defaultDurationSeconds, timelineStartSeconds + 8);
    const clip: PresetVideoTimelineClip = { id: createTimelineClipId(), title: `Video custom ${settings.timelineVideoClips.length + 1}`, clipStartSeconds: 0, clipEndSeconds: 8, timelineStartSeconds, timelineEndSeconds };
    patchSettings({ timelineVideoClips: [...settings.timelineVideoClips, clip] });
  }
  function updateTimelineClip(clipId: string, patch: Partial<PresetVideoTimelineClip>) {
    const current = settings.timelineVideoClips.find((clip) => clip.id === clipId); if (!current) return;
    if ((patch.clipStartSeconds !== undefined && patch.clipStartSeconds !== current.clipStartSeconds) || (patch.clipEndSeconds !== undefined && patch.clipEndSeconds !== current.clipEndSeconds)) media.invalidateSource(clipId);
    patchSettings({ timelineVideoClips: settings.timelineVideoClips.map((clip) => clip.id === clipId ? { ...clip, ...patch } : clip) });
  }
  function removeTimelineClip(clipId: string) { media.invalidateSource(clipId); patchSettings({ timelineVideoClips: settings.timelineVideoClips.filter((clip) => clip.id !== clipId) }); }
  async function selectTimelineClip(clip: PresetVideoTimelineClip, file: File) { try { await media.importSource(clip, file); updateTimelineClip(clip.id, { title: file.name.slice(0, 120) }); toast.success(`Đã cắt và cache ${file.name}`); } catch { } }

  function reset() {
    const defaults = createDefaultPresetVideoSettings(preset); const recommended = findRecommendedPresetMusic(tracks, preset.musicRecommendation);
    setSettings({ ...defaults, backgroundMusicId: recommended?.id || "" }); setResult(null); setRenderProgress(0); setRenderMessage(""); playerRef.current?.seekTo(0);
  }
  async function exportVideo() {
    if (missingLocalVideoSources.length) { toast.error(`Còn thiếu ${missingLocalVideoSources.length} video local trước khi export.`); return; }
    setRendering(true); setRenderProgress(0); setRenderMessage("Đang khởi tạo render..."); setResult(null);
    try {
      const rendered = await renderPresetVideo({ preset, settings, backgroundMusicUrl: selectedTrack?.audioUrl }, (event) => { setRenderProgress(event.progress); setRenderMessage(event.message); });
      setResult(rendered); toast.success(`Đã export ${rendered.fileName}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Export preset video thất bại."); } finally { setRendering(false); }
  }

  return <div className="space-y-4">
    <header className="flex flex-col gap-3 rounded-xl border bg-card/70 p-4 md:flex-row md:items-center md:justify-between"><div className="flex items-start gap-3"><Button variant="ghost" size="icon" onClick={onBack} aria-label="Quay lại kho preset"><ArrowLeft className="h-4 w-4" /></Button><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Preset Video</p><h1 className="mt-1 text-xl font-bold">{preset.name}</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">{preset.description}</p></div></div><div className="flex gap-2"><Button variant="outline" disabled={rendering || Boolean(media.uploadingSourceId)} onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Reset</Button><Button disabled={rendering || Boolean(media.uploadingSourceId) || missingLocalVideoSources.length > 0} onClick={() => void exportVideo()}><Film className="mr-2 h-4 w-4" />{rendering ? `Đang render ${Math.round(renderProgress * 100)}%` : "Export MP4"}</Button></div></header>

    <PresetVideoPreviewEditor preset={preset} settings={settings} inputProps={inputProps} playerRef={playerRef} compositionWidth={output.width} compositionHeight={output.height} aspectRatio={output.aspectRatio} preloadingCount={media.preloadingCount} disabled={rendering} onSettingsChange={patchSettings} />

    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><section className="min-w-0 space-y-4">
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Scissors className="h-4 w-4" />Đoạn export</CardTitle></CardHeader><CardContent className="space-y-5">
        <TrimSlider label="Bắt đầu" value={settings.trimStartSeconds} max={Math.max(0, settings.trimEndSeconds - MIN_TRIM_SECONDS)} duration={preset.defaultDurationSeconds} onChange={(value) => patchSettings({ trimStartSeconds: Math.min(value, settings.trimEndSeconds - MIN_TRIM_SECONDS) })} />
        <TrimSlider label="Kết thúc" value={settings.trimEndSeconds} min={Math.min(preset.defaultDurationSeconds, settings.trimStartSeconds + MIN_TRIM_SECONDS)} max={preset.defaultDurationSeconds} duration={preset.defaultDurationSeconds} onChange={(value) => patchSettings({ trimEndSeconds: Math.max(value, settings.trimStartSeconds + MIN_TRIM_SECONDS) })} />
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm"><span>{formatPresetSeconds(settings.trimStartSeconds)} → {formatPresetSeconds(settings.trimEndSeconds)}</span><span className="font-semibold">{formatPresetSeconds(settings.trimEndSeconds - settings.trimStartSeconds)}</span></div><Button variant="outline" onClick={() => previewAt(settings.trimStartSeconds)}>Preview đoạn đã chọn</Button>
      </CardContent></Card>
      {usesLocalVideoSources ? <PresetVideoCustomClipsCard clips={settings.timelineVideoClips} videoSourceUrls={media.videoSourceUrls} uploadingSourceId={media.uploadingSourceId} durationSeconds={preset.defaultDurationSeconds} disabled={rendering} onAdd={addTimelineClip} onRemove={removeTimelineClip} onChange={updateTimelineClip} onSelect={(clip, file) => void selectTimelineClip(clip, file)} onPreview={previewAt} /> : null}
    </section>

    <aside className="space-y-4"><Card><CardHeader><CardTitle className="text-base">Export settings</CardTitle></CardHeader><CardContent className="space-y-5">
      <div className="space-y-2"><Label>Kích thước</Label><Select value={settings.outputPreset} onValueChange={(value) => patchSettings({ outputPreset: value as PresetVideoExportSettings["outputPreset"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRESET_VIDEO_OUTPUT_SIZES.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">{output.aspectRatio} · {output.width}×{output.height} · {preset.defaultFps} FPS</p></div>
      <PresetVideoMusicSettings preset={preset} settings={settings} tracks={tracks} selectedTrack={selectedTrack} musicLoading={musicLoading} onChange={patchSettings} />
    </CardContent></Card>
    <PresetVideoVoiceoverSettings preset={preset} settings={settings} disabled={rendering} onChange={patchSettings} />
    {usesLocalVideoSources && preset.videoSources?.length ? <PresetVideoSourcePickerCard sources={preset.videoSources} videoSourceUrls={media.videoSourceUrls} uploadingSourceId={media.uploadingSourceId} disabled={rendering} onSelect={(source, file) => void selectLocalVideoSource(source, file)} onSelectMany={(sources, file) => void selectLocalVideoSources(sources, file)} /> : null}
    {preset.socialMetadata ? <PresetVideoSocialMetadataCard metadata={preset.socialMetadata} musicCredit={selectedTrack?.licenseText} /> : null}
    {requiredSourceIds.length ? <PresetVideoMediaStatusCard preparing={media.mediaPreparing || media.preloadingCount > 0} error={media.mediaError} sourceCount={requiredSourceIds.filter((id) => Boolean(media.videoSourceUrls[id])).length} requiredSourceCount={requiredSourceIds.length} localMode={usesLocalVideoSources} /> : null}
    {rendering ? <PresetVideoRenderProgressCard progress={renderProgress} message={renderMessage} /> : null}
    {result ? <Card><CardHeader><CardTitle className="text-base">Export hoàn tất</CardTitle></CardHeader><CardContent className="space-y-3"><video controls src={result.videoUrl} className="w-full rounded-lg bg-black" /><div className="text-xs text-muted-foreground"><p>{result.fileName}</p><p>{result.width}×{result.height} · {formatPresetSeconds(result.durationSeconds)}</p></div><div className="grid grid-cols-2 gap-2"><Button variant="outline" asChild><a href={result.videoUrl} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" />Mở file</a></Button><Button variant="outline" asChild><Link to="/assets">Generated Assets</Link></Button></div></CardContent></Card> : null}
    </aside></div>
  </div>;
}

function createTimelineClipId() { return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
