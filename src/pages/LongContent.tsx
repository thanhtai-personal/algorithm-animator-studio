import { ChevronDown, ChevronRight, Download, Film, Languages, Pause, Play, RefreshCcw, Volume2 } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ALGORITHMS, ALGO_GROUPS, COMPLEXITY } from "@/lib/algorithms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { AuthProfile, getCurrentProfile, isSuperAdminProfile } from "@/lib/auth";
import { THEMES } from "@/lib/renderer";
import { EXPORT_FORMATS, ExportFormat } from "./studio/exportFormats";
import { MusicPanel } from "./long-content/MusicPanel";
import { ScriptPanel } from "./long-content/ScriptPanel";
import { LongContentStudio, useLongContentStudio } from "./long-content/useLongContentStudio";

export default function LongContent() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const studio = useLongContentStudio();
  const canExport = isSuperAdminProfile(profile);

  useEffect(() => {
    let cancelled = false;
    getCurrentProfile()
      .then((nextProfile) => {
        if (!cancelled) setProfile(isSuperAdminProfile(nextProfile) ? nextProfile : null);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function requestExport() {
    if (!canExport) {
      navigate("/auth", { replace: false, state: { from: "/long-content" } });
      return;
    }
    void studio.exportVideo();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[360px_1fr]">
        <LeftControls studio={studio} onExport={requestExport} />
        <div className="space-y-4">
          <PreviewPanel studio={studio} />
          <MusicPanel studio={studio} />
          <ScriptPanel studio={studio} />
        </div>
      </main>
    </div>
  );
}

function LeftControls({ studio: s, onExport }: { studio: LongContentStudio; onExport: () => void }) {
  return (
    <div className="space-y-4">
      <VisualExportPanel studio={s} onExport={onExport} />
      <CollapsibleSection title="Cấu hình nội dung" icon={<Film className="h-4 w-4 text-emerald-400" />}>
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
      </CollapsibleSection>

      <NarrationControls studio={s} />
    </div>
  );
}

function VisualExportPanel({ studio: s, onExport }: { studio: LongContentStudio; onExport: () => void }) {
  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.34),0_0_28px_rgba(16,185,129,0.06)]">
      <div className="space-y-3">
        <div>
          <h2 className="font-semibold">Visual & export</h2>
          <p className="text-xs text-muted-foreground">Cấu hình hình ảnh và xuất video.</p>
        </div>
        <Button className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-600" onClick={onExport} disabled={s.exporting}>
          <Download className="mr-2 h-4 w-4" />
          {s.exporting ? `Đang xuất ${s.exportProgress}%` : "Xuất long video 16:9"}
        </Button>
      </div>

      <div className="grid gap-3">
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
      </div>

      {s.algo.category === "sort" ? <AnimalControls studio={s} compact /> : null}
    </Card>
  );
}

function CollapsibleSection(props: { title: string; icon?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const Icon = open ? ChevronDown : ChevronRight;
  return (
    <Card className="border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.34),0_0_28px_rgba(16,185,129,0.05)]">
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen((value) => !value)}>
        <span className="flex items-center gap-2">
          {props.icon}
          <span className="font-semibold">{props.title}</span>
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </button>
      {open ? <div className="mt-4 space-y-4">{props.children}</div> : null}
    </Card>
  );
}

function PreviewPanel({ studio: s }: { studio: LongContentStudio }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full border-border/70 p-3 shadow-[0_16px_42px_rgba(15,23,42,0.38),0_0_34px_rgba(14,165,233,0.06)]">
        <canvas
          ref={s.canvasRef}
          width={s.W}
          height={s.H}
          className="mx-auto rounded-xl border border-border/60 bg-slate-950"
          style={{ width: "100%", maxHeight: "72vh", aspectRatio: "16 / 9" }}
        />
      </Card>
      <Card className="w-full max-w-4xl space-y-3 border-border/70 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.32),0_0_24px_rgba(16,185,129,0.05)]">
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
    <CollapsibleSection title="Voice-over kịch bản" icon={<Volume2 className="h-4 w-4 text-emerald-400" />}>
      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
        <Label>Bật voice khi preview/export</Label>
        <Switch checked={s.narrationEnabled} onCheckedChange={s.setNarrationEnabled} />
      </div>
      <div>
        <Label>Nguồn giọng đọc</Label>
        <Select value={s.voiceProvider} onValueChange={(value) => s.setVoiceProvider(value as typeof s.voiceProvider)}>
          <SelectTrigger className="mt-2 border-yellow-400/70 bg-yellow-400/10 font-semibold text-yellow-50 shadow-[0_0_0_1px_rgba(250,204,21,0.18),0_0_22px_rgba(250,204,21,0.12)] hover:bg-yellow-400/15 focus:ring-yellow-400/40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="browser">Browser TTS · preview only</SelectItem>
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
        Browser TTS chỉ dùng để nghe thử trong preview vì trình duyệt không cung cấp audio stream ổn định cho export. Muốn video có voice, hãy chọn Piper hoặc ElevenLabs; app sẽ tự tạo lại voice nếu kịch bản đổi.
        {s.voiceFileName ? ` File hiện tại: ${s.voiceFileName}` : ""}
      </p>
    </CollapsibleSection>
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

function AnimalControls({ studio: s, compact = false }: { studio: LongContentStudio; compact?: boolean }) {
  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-background/30 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.24)]">
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
        <div className={compact ? "grid gap-3 md:grid-cols-3" : "space-y-3"}>
          <NumberSlider label="Sprite" value={s.animalSpriteScale} min={0.6} max={1.6} suffix="x" step={0.1} onChange={s.setAnimalSpriteScale} />
          <NumberSlider label="Độ nhảy" value={s.animalJumpIntensity} min={0.4} max={1.8} suffix="x" step={0.1} onChange={s.setAnimalJumpIntensity} />
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
            <Label>Highlight cũng nhảy</Label>
            <Switch checked={s.animalHighlightJump} onCheckedChange={s.setAnimalHighlightJump} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
