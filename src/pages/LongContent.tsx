import { Download, Film, Languages, Pause, Play, RefreshCcw, Upload, Volume2 } from "lucide-react";
import { ALGORITHMS, ALGO_GROUPS, COMPLEXITY } from "@/lib/algorithms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ASSET_MUSIC_OPTIONS, BackgroundMusicId } from "@/lib/backgroundMusic";
import { MUSIC_PRESETS } from "@/lib/i18n";
import { THEMES } from "@/lib/renderer";
import { EXPORT_FORMATS, ExportFormat } from "./studio/exportFormats";
import { ScriptPanel } from "./long-content/ScriptPanel";
import { LongContentStudio, useLongContentStudio } from "./long-content/useLongContentStudio";

export default function LongContent() {
  const studio = useLongContentStudio();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[360px_1fr]">
        <LeftControls studio={studio} />
        <div className="space-y-4">
          <PreviewPanel studio={studio} />
          <ScriptPanel studio={studio} />
        </div>
      </main>
    </div>
  );
}

function LeftControls({ studio: s }: { studio: LongContentStudio }) {
  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-emerald-400" />
          <h2 className="font-semibold">Cấu hình nội dung</h2>
        </div>
        <SystemLanguageInfo studio={s} />

        <div>
          <Label>Thuật toán</Label>
          <Select value={s.algoId} onValueChange={s.setAlgoId}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALGO_GROUPS.map((group, index) => (
                <div key={group.label.en}>
                  {index > 0 && <SelectSeparator />}
                  <SelectGroup>
                    <SelectLabel className="bg-emerald-500/10 text-[11px] uppercase tracking-wider text-emerald-300">
                      {group.label.vi}
                    </SelectLabel>
                    {group.ids.map((id) => <SelectItem key={id} value={id}>{ALGORITHMS[id].name}</SelectItem>)}
                  </SelectGroup>
                </div>
              ))}
            </SelectContent>
          </Select>
          {COMPLEXITY[s.algoId] ? <ComplexityBadges algoId={s.algoId} /> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberSlider label="Intro" value={s.introSeconds} min={3} max={10} suffix="s" onChange={s.setIntroSeconds} />
          <NumberSlider label="Animation" value={s.animationSeconds} min={12} max={90} suffix="s" onChange={s.setAnimationSeconds} />
        </div>
        <NumberSlider label="FPS export" value={s.fps} min={15} max={60} suffix="fps" onChange={s.setFps} />

        <div>
          <Label>Theme</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.keys(THEMES).map((name) => (
              <Button key={name} size="sm" variant={s.themeName === name ? "default" : "outline"} onClick={() => s.setThemeName(name as keyof typeof THEMES)}>
                {name[0].toUpperCase() + name.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <NarrationControls studio={s} />

      <MusicControls studio={s} />

      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Visual & export</h2>
        <div>
          <Label>Tỉ lệ video</Label>
          <div className="mt-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
            YouTube long video · 16:9 · 1920×1080
          </div>
        </div>
        <div>
          <Label>Định dạng</Label>
          <Select value={s.exportFormat} onValueChange={(v) => s.setExportFormat(v as ExportFormat)}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXPORT_FORMATS.map((format) => <SelectItem key={format.id} value={format.id}>{format.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <Label>Hiện code trong animation</Label>
          <Switch checked={s.showCode} onCheckedChange={s.setShowCode} />
        </div>
        {s.algo.category === "sort" ? <AnimalControls studio={s} /> : null}
        <Button className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-600" onClick={s.exportVideo} disabled={s.exporting}>
          <Download className="mr-2 h-4 w-4" />
          {s.exporting ? `Đang xuất ${s.exportProgress}%` : "Xuất long video 16:9"}
        </Button>
      </Card>
    </div>
  );
}

function PreviewPanel({ studio: s }: { studio: LongContentStudio }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full p-3">
        <canvas
          ref={s.canvasRef}
          width={s.W}
          height={s.H}
          className="mx-auto rounded-xl border border-border/60 bg-slate-950"
          style={{ width: "100%", maxHeight: "72vh", aspectRatio: "16 / 9" }}
        />
      </Card>
      <Card className="w-full max-w-4xl space-y-3 p-4">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => s.setPlaying(!s.playing)} disabled={s.exporting}>
            {s.playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {s.playing ? "Tạm dừng" : "Preview"}
          </Button>
          <Button variant="outline" onClick={() => { s.setPlaying(false); s.setElapsedSec(0); }}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
        <Slider value={[s.elapsedSec]} min={0} max={s.totalDuration} step={0.1} onValueChange={([value]) => { s.setPlaying(false); s.setElapsedSec(value); }} />
        <div className="flex justify-between gap-3 text-xs text-muted-foreground">
          <span>{s.timelineState.scene.title}</span>
          <span>{s.lang.toUpperCase()} · Voice {s.voiceProvider} · Frame {s.frameIdx + 1}/{s.frames.length} · {Math.round(s.totalDuration)}s</span>
        </div>
      </Card>
    </div>
  );
}

function SystemLanguageInfo({ studio: s }: { studio: LongContentStudio }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <Label className="flex items-center gap-2"><Languages className="h-4 w-4" /> Ngôn ngữ kịch bản</Label>
      <div className="mt-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200">
        {s.lang === "vi" ? "Tiếng Việt" : "English"}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Kịch bản, subtitle và voice-over tự dùng ngôn ngữ hệ thống đã chọn ở header. Đổi ngôn ngữ tại header chung để xuất bản VI hoặc EN.
      </p>
    </div>
  );
}

function NarrationControls({ studio: s }: { studio: LongContentStudio }) {
  const availablePiperModels = [...s.piperModels].sort((a, b) => Number(b.lang === s.lang) - Number(a.lang === s.lang));
  const selectedPiperModel = s.piperModels.find((model) => model.key === s.piperModelKey);
  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-emerald-400" />
        <h2 className="font-semibold">Voice-over kịch bản</h2>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
        <Label>Bật voice khi preview/export</Label>
        <Switch checked={s.narrationEnabled} onCheckedChange={s.setNarrationEnabled} />
      </div>
      <div>
        <Label>Nguồn giọng đọc</Label>
        <Select value={s.voiceProvider} onValueChange={(value) => s.setVoiceProvider(value as typeof s.voiceProvider)}>
          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="browser">Browser TTS · ghi bằng tab audio khi export</SelectItem>
            <SelectItem value="piper">Piper local · tạo file và nhúng vào video</SelectItem>
            <SelectItem value="elevenlabs">ElevenLabs PRO · tạo file và nhúng vào video</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {s.voiceProvider === "piper" ? (
        <div>
          <Label>Piper model</Label>
          <Select value={s.piperModelKey} onValueChange={s.setPiperModelKey}>
            <SelectTrigger className="mt-2"><SelectValue placeholder="Chọn model Piper" /></SelectTrigger>
            <SelectContent>
              {availablePiperModels.map((model) => (
                <SelectItem key={model.key} value={model.key}>
                  {model.label}{model.available ? "" : " · thiếu file"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-3 rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
            <div className="grid gap-1">
              <span>Piper exe: <strong className={s.voiceHealth?.piperExists ? "text-emerald-300" : "text-rose-300"}>{s.voiceHealth?.piperExists ? "đã sẵn sàng" : "chưa tìm thấy"}</strong></span>
              <span>Model dir: <strong>{s.piperRuntime?.modelDir || s.voiceHealth?.modelDir || "models"}</strong></span>
              <span>Model đang chọn: <strong className={selectedPiperModel?.available ? "text-emerald-300" : "text-yellow-300"}>{selectedPiperModel?.available ? "đủ file" : "thiếu .onnx/.json"}</strong></span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button type="button" size="sm" variant="outline" onClick={s.refreshPiperRuntime}>
                <RefreshCcw className="mr-2 h-3.5 w-3.5" /> Kiểm tra
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={s.installSelectedPiperModel} disabled={s.piperInstalling || !selectedPiperModel?.canInstall}>
                {s.piperInstalling ? "Đang cài..." : "Cài model"}
              </Button>
            </div>
            <p className="mt-2">Health check kiểm tra piper.exe, thư mục model và tải file .onnx + .onnx.json còn thiếu.</p>
          </div>
        </div>
      ) : null}
      {s.voiceProvider === "elevenlabs" ? (
        <div className="grid gap-3">
          <div>
            <Label>ElevenLabs model</Label>
            <Select value={s.elevenModelId} onValueChange={s.setElevenModelId}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(s.elevenConfig?.models ?? []).map((model) => <SelectItem key={model.id} value={model.id}>{model.label} · {model.creditRateLabel}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Voice</Label>
            <Select value={s.elevenVoiceId} onValueChange={s.setElevenVoiceId}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Chọn voice ID" /></SelectTrigger>
              <SelectContent>
                {(s.elevenConfig?.voices ?? []).map((voice) => <SelectItem key={voice.id} value={voice.id}>{voice.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">API key: {s.elevenConfig?.hasApiKey ? "đã cấu hình" : "chưa có ELEVENLABS_API_KEY"}</p>
        </div>
      ) : null}
      <NumberSlider label="Tốc độ đọc" value={s.narrationRate} min={0.7} max={1.2} suffix="x" step={0.05} onChange={s.setNarrationRate} />
      <NumberSlider label="Âm lượng voice" value={s.narrationVol} min={0} max={100} suffix="%" onChange={s.setNarrationVol} />
      <Button className="w-full" variant={s.voiceProvider === "browser" ? "outline" : "default"} onClick={s.generateVoiceOver} disabled={s.voiceLoading}>
        {s.voiceLoading ? "Đang tạo voice..." : s.voiceProvider === "browser" ? "Đọc thử Browser TTS" : "Tạo voice-over cho video"}
      </Button>
      {s.voiceUrl ? <audio className="w-full" controls src={s.voiceUrl} /> : null}
      <p className="text-xs text-muted-foreground">
        Browser TTS sẽ được ghi khi export bằng tab audio: chọn tab hiện tại và bật Share tab audio. Piper/ElevenLabs sẽ tự tạo voice nếu chưa có hoặc kịch bản đổi.
        {s.voiceFileName ? ` File hiện tại: ${s.voiceFileName}` : ""}
      </p>
    </Card>
  );
}

function MusicControls({ studio: s }: { studio: LongContentStudio }) {
  return (
    <Card className="space-y-4 p-4">
      <h2 className="font-semibold">Nhạc nền</h2>
      <div>
        <Label>Chọn nhạc</Label>
        <Select value={s.musicPreset} onValueChange={(value) => s.setMusicPreset(value as BackgroundMusicId)}>
          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Preset tạo sẵn</SelectLabel>
              {MUSIC_PRESETS.map((music) => <SelectItem key={music.id} value={music.id}>{music.label[s.lang]}</SelectItem>)}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Track có sẵn</SelectLabel>
              {ASSET_MUSIC_OPTIONS.map((music) => <SelectItem key={music.id} value={music.id}>{music.label[s.lang]}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <Upload className="h-3.5 w-3.5" /> Upload nhạc nền riêng (.mp3/.wav)
        <input type="file" accept="audio/*" className="hidden" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            s.onMusicUpload(file);
            s.setMusicPreset("custom");
          }
        }} />
      </label>
      <NumberSlider label="Âm lượng nhạc" value={s.musicVol} min={0} max={100} suffix="%" onChange={s.setMusicVol} />
      <p className="text-xs text-muted-foreground">Nhạc nền sẽ phát khi preview và được nhúng vào video export qua MediaRecorder.</p>
    </Card>
  );
}

function ComplexityBadges({ algoId }: { algoId: string }) {
  const item = COMPLEXITY[algoId];
  if (!item) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-mono">
      <span className="rounded border border-yellow-400/30 bg-yellow-400/15 px-2 py-0.5 text-yellow-300">Time {item.time}</span>
      {item.best && item.best !== item.time ? <span className="rounded border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-emerald-300">Best {item.best}</span> : null}
      {item.worst && item.worst !== item.time ? <span className="rounded border border-rose-400/30 bg-rose-400/15 px-2 py-0.5 text-rose-300">Worst {item.worst}</span> : null}
      <span className="rounded border border-cyan-400/30 bg-cyan-400/15 px-2 py-0.5 text-cyan-300">Space {item.space}</span>
    </div>
  );
}

function NumberSlider(props: { label: string; value: number; min: number; max: number; suffix: string; step?: number; onChange: (value: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex justify-between gap-2">
        <Label>{props.label}</Label>
        <span className="font-mono text-xs text-emerald-400">{props.value}{props.suffix}</span>
      </div>
      <Slider value={[props.value]} min={props.min} max={props.max} step={props.step ?? 1} onValueChange={([value]) => props.onChange(value)} />
    </div>
  );
}

function AnimalControls({ studio: s }: { studio: LongContentStudio }) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div>
        <Label>Kiểu cột</Label>
        <Select value={s.columnVisualMode} onValueChange={(value) => s.setColumnVisualMode(value as typeof s.columnVisualMode)}>
          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Cột thường</SelectItem>
            <SelectItem value="animal">Animal columns</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {s.columnVisualMode === "animal" ? (
        <>
          <NumberSlider label="Sprite" value={s.animalSpriteScale} min={0.6} max={1.6} suffix="x" step={0.1} onChange={s.setAnimalSpriteScale} />
          <NumberSlider label="Độ nhảy" value={s.animalJumpIntensity} min={0.4} max={1.8} suffix="x" step={0.1} onChange={s.setAnimalJumpIntensity} />
          <div className="flex items-center justify-between">
            <Label>Highlight cũng nhảy</Label>
            <Switch checked={s.animalHighlightJump} onCheckedChange={s.setAnimalHighlightJump} />
          </div>
        </>
      ) : null}
    </div>
  );
}
