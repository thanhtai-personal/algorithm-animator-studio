import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { PlayerRef } from "@remotion/player";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadPresetVoiceover } from "../lib/presetVoiceoverApi";
import type { PresetVideoDefinition, PresetVideoExportSettings } from "../types";

type Props = {
  preset: PresetVideoDefinition;
  settings: PresetVideoExportSettings;
  playerRef: RefObject<PlayerRef>;
  disabled?: boolean;
  onSettingsChange: (patch: Partial<PresetVideoExportSettings>) => void;
};

export function PresetVideoVoiceRecorder({ preset, settings, playerRef, disabled = false, onSettingsChange }: Props) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [time, setTime] = useState(0);

  const activeCue = useMemo(() => (preset.editableLyrics || []).find((cue) => {
    const timing = settings.lyricTimings[cue.id] ?? cue;
    return time >= timing.start && time < timing.end;
  }), [preset.editableLyrics, settings.lyricTimings, time]);

  const nextCue = useMemo(() => (preset.editableLyrics || []).find((cue) => {
    const timing = settings.lyricTimings[cue.id] ?? cue;
    return timing.start > time;
  }), [preset.editableLyrics, settings.lyricTimings, time]);

  useEffect(() => () => cleanup(), []);

  function tick() {
    setTime((playerRef.current?.getCurrentFrame() ?? 0) / preset.defaultFps);
    timerRef.current = window.requestAnimationFrame(tick);
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Trình duyệt không hỗ trợ ghi âm microphone.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => void saveRecording(recorder.mimeType || preferred || "audio/webm");
      playerRef.current?.seekTo(0);
      playerRef.current?.play();
      setTime(0);
      setRecording(true);
      recorder.start(250);
      timerRef.current = window.requestAnimationFrame(tick);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không mở được microphone.");
      cleanup();
    }
  }

  function stop() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    playerRef.current?.pause();
    setRecording(false);
    if (timerRef.current !== null) window.cancelAnimationFrame(timerRef.current);
    timerRef.current = null;
  }

  async function saveRecording(mimeType: string) {
    const blob = new Blob(chunksRef.current, { type: mimeType });
    stopStream();
    if (!blob.size) {
      toast.error("Bản ghi âm rỗng.");
      return;
    }
    setSaving(true);
    try {
      const result = await uploadPresetVoiceover(preset.id, blob, mimeType);
      onSettingsChange({ voiceoverAudioRelativePath: result.relativePath, voiceoverAudioUrl: result.audioUrl, voiceoverVolume: 1 });
      toast.success("Đã gắn bản ghi âm vào preset.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được bản ghi âm.");
    } finally {
      setSaving(false);
      chunksRef.current = [];
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }

  function cleanup() {
    if (timerRef.current !== null) window.cancelAnimationFrame(timerRef.current);
    stopStream();
  }

  return <Card>
    <CardHeader>
      <CardTitle className="flex items-center justify-between text-base">
        <span className="flex items-center gap-2"><Mic className="h-4 w-4" />Thu voice theo timeline</span>
        {recording ? <span className="text-xs font-bold text-red-500">REC {time.toFixed(1)}s</span> : null}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="rounded-xl border bg-black px-5 py-6 text-center text-white">
        <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-white/40">Teleprompter - không render vào video</div>
        <div className="flex min-h-24 items-center justify-center text-2xl font-bold leading-snug md:text-3xl">
          {activeCue ? activeCue.lines.join(" " ) : recording ? "..." : "Bấm Ghi âm để bắt đầu đọc theo lyric"}
        </div>
        {nextCue ? <div className="mt-4 text-sm text-white/35">Tiếp: {nextCue.lines.join(" " )}</div> : null}
      </div>
      {!recording ? (
        <Button className="w-full" disabled={disabled || saving} onClick={() => void start()}>
          <Mic className="mr-2 h-4 w-4" />{saving ? "Đang lưu..." : "Ghi âm từ đầu"}
        </Button>
      ) : (
        <Button variant="destructive" className="w-full" onClick={stop}>
          <Square className="mr-2 h-4 w-4" />Dừng và dùng bản ghi
        </Button>
      )}
      {settings.voiceoverAudioUrl ? <audio controls src={settings.voiceoverAudioUrl} className="h-9 w-full" /> : null}
      <p className="text-xs text-muted-foreground">Preview chạy từ đầu khi ghi. Lyric đổi theo đúng cue timing và chỉ hiện ngoài khung video.</p>
    </CardContent>
  </Card>;
}
