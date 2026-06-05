import { RefreshCcw, Upload, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { LongContentStudio } from "./useLongContentStudio";
import { uiText } from "@/lib/i18n";

export function VoicePanel({ studio: s }: { studio: LongContentStudio }) {
  const piperModels = [...s.piperModels].sort((a, b) => Number(b.lang === s.lang) - Number(a.lang === s.lang));
  const selectedPiperModel = s.piperModels.find((model) => model.key === s.piperModelKey);
  const supertonicLangLabel = s.lang === "vi" ? "Vietnamese (vi)" : "English (en)";
  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.34),0_0_28px_rgba(16,185,129,0.05)]">
      <div>
        <h2 className="flex items-center gap-2 font-semibold"><Volume2 className="h-4 w-4 text-emerald-400" /> {uiText("Voice-over")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{uiText("Cấu hình giọng đọc dùng khi preview hoặc export video.")}</p>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
        <div>
          <Label>{uiText("Bật voice")}</Label>
          {s.longVideoType === "classic" ? <p className="mt-1 text-xs text-muted-foreground">{uiText("Classic lecture luôn cần voice.")}</p> : null}
        </div>
        <Switch checked={s.narrationEnabled} onCheckedChange={s.setNarrationEnabled} disabled={s.longVideoType === "classic"} />
      </div>
      <div>
        <Label>{uiText("Nguồn giọng đọc")}</Label>
        <Select value={s.voiceProvider} onValueChange={(value) => s.setVoiceProvider(value as typeof s.voiceProvider)}>
          <SelectTrigger className="mt-2 border-yellow-400/70 bg-yellow-400/10 font-semibold text-yellow-50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="browser">{uiText("Browser TTS · preview only")}</SelectItem>
            <SelectItem value="piper">{uiText("Piper local · tạo file và nhúng vào video")}</SelectItem>
            <SelectItem value="elevenlabs">{uiText("ElevenLabs PRO · tạo file và nhúng vào video")}</SelectItem>
            <SelectItem value="supertonic">{uiText("Supertonic local · 44.1kHz WAV")}</SelectItem>
            <SelectItem value="rvc-applio">{uiText("RVC/Applio local · clone giọng")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {s.voiceProvider === "piper" ? (
        <div>
          <Label>{uiText("Piper model")}</Label>
          <Select value={s.piperModelKey} onValueChange={s.setPiperModelKey}>
            <SelectTrigger className="mt-2"><SelectValue placeholder={uiText("Chọn model Piper")} /></SelectTrigger>
            <SelectContent>
              {piperModels.map((model) => <SelectItem key={model.key} value={model.key}>{model.label}{model.available ? "" : " · thiếu file"}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="mt-3 rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
            <div className="grid gap-1">
              <span>{uiText("Piper exe:")} <strong className={s.voiceHealth?.piperExists ? "text-emerald-300" : "text-rose-300"}>{s.voiceHealth?.piperExists ? "đã sẵn sàng" : "chưa tìm thấy"}</strong></span>
              <span>{uiText("Model dir:")} <strong>{s.piperRuntime?.modelDir || s.voiceHealth?.modelDir || "models"}</strong></span>
              <span>{uiText("Model đang chọn:")} <strong className={selectedPiperModel?.available ? "text-emerald-300" : "text-yellow-300"}>{selectedPiperModel?.available ? "đủ file" : "thiếu .onnx/.json"}</strong></span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button type="button" size="sm" variant="outline" onClick={s.refreshPiperRuntime}><RefreshCcw className="mr-2 h-3.5 w-3.5" /> {uiText("Kiểm tra")}</Button>
              <Button type="button" size="sm" variant="outline" onClick={s.installSelectedPiperModel} disabled={s.piperInstalling || !selectedPiperModel?.canInstall}>
                {s.piperInstalling ? "Đang cài..." : "Cài model"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {s.voiceProvider === "elevenlabs" ? (
        <div className="grid gap-3">
          <div>
            <Label>{uiText("ElevenLabs model")}</Label>
            <Select value={s.elevenModelId} onValueChange={s.setElevenModelId}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>{(s.elevenConfig?.models ?? []).map((model) => <SelectItem key={model.id} value={model.id}>{model.label} · {model.creditRateLabel}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{uiText("Voice")}</Label>
            <Select value={s.elevenVoiceId} onValueChange={s.setElevenVoiceId}>
              <SelectTrigger className="mt-2"><SelectValue placeholder={uiText("Chọn voice ID")} /></SelectTrigger>
              <SelectContent>{(s.elevenConfig?.voices ?? []).map((voice) => <SelectItem key={voice.id} value={voice.id}>{voice.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">API key: {s.elevenConfig?.hasApiKey ? "đã cấu hình" : "chưa có ELEVENLABS_API_KEY"}</p>
        </div>
      ) : null}

      {s.voiceProvider === "supertonic" ? (
        <div className="grid gap-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <Label>{uiText("Supertonic voice/style")}</Label>
              <Button type="button" size="sm" variant="outline" disabled={s.supertonicImporting} asChild>
                <label className="cursor-pointer" htmlFor="supertonic-voice-json">
                  <Upload className="mr-2 h-3.5 w-3.5" /> {s.supertonicImporting ? "Đang import..." : "Import voice JSON"}
                </label>
              </Button>
              <input
                id="supertonic-voice-json"
                className="hidden"
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (file) void s.importSupertonicVoiceJson(file);
                }}
              />
            </div>
            <Select value={s.supertonicVoice} onValueChange={s.setSupertonicVoice}>
              <SelectTrigger className="mt-2"><SelectValue placeholder={uiText("Chọn voice Supertonic")} /></SelectTrigger>
              <SelectContent>{(s.supertonicConfig?.voices ?? []).map((voice) => <SelectItem key={voice.id} value={voice.id}>{voice.label}</SelectItem>)}</SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">{uiText("Model được chọn khi start server; dropdown này dùng nhiều voice/style trong model đang chạy.")}</p>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
            <div className="grid gap-1">
              <span>{uiText("Server:")} <strong className={s.supertonicConfig?.serverOk ? "text-emerald-300" : "text-rose-300"}>{s.supertonicConfig?.serverOk ? "đã kết nối" : "chưa chạy"}</strong></span>
              <span>{uiText("Base URL:")} <strong>{s.supertonicConfig?.baseUrl || "http://127.0.0.1:6688"}</strong></span>
              <span>{uiText("Model:")} <strong>{s.supertonicConfig?.model || "supertonic-3"}</strong></span>
              <span>{uiText("Ngôn ngữ TTS:")} <strong className="text-emerald-300">{supertonicLangLabel}</strong> {uiText("· lấy theo header app")}</span>
              {s.supertonicConfig?.error ? <span className="text-yellow-300">{s.supertonicConfig.error}</span> : null}
            </div>
            <Button type="button" size="sm" variant="outline" className="mt-3" onClick={s.refreshPiperRuntime}><RefreshCcw className="mr-2 h-3.5 w-3.5" /> {uiText("Kiểm tra")}</Button>
          </div>
          <NumberSlider label={uiText("Chất lượng Supertonic")} value={s.supertonicTotalSteps} min={5} max={12} suffix=" steps" step={1} onChange={s.setSupertonicTotalSteps} />
        </div>
      ) : null}

      {s.voiceProvider === "rvc-applio" ? (
        <div className="grid gap-3">
          <div>
            <Label>{uiText("Piper source model")}</Label>
            <Select value={s.piperModelKey} onValueChange={s.setPiperModelKey}>
              <SelectTrigger className="mt-2"><SelectValue placeholder={uiText("Chọn model Piper nguồn")} /></SelectTrigger>
              <SelectContent>
                {piperModels.map((model) => <SelectItem key={model.key} value={model.key}>{model.label}{model.available ? "" : " · thiếu file"}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">{uiText("Flow: Piper tạo giọng gốc từng scene → RVC/Applio chuyển sang model giọng custom → ghép WAV để export.")}</p>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
            <div className="grid gap-1">
              <span>{uiText("Server:")} <strong className={s.rvcApplioConfig?.serverOk ? "text-emerald-300" : "text-rose-300"}>{s.rvcApplioConfig?.serverOk ? "đã kết nối" : "chưa chạy"}</strong></span>
              <span>{uiText("Base URL:")} <strong>{s.rvcApplioConfig?.baseUrl || "http://127.0.0.1:6969"}</strong></span>
              <span>{uiText("API:")} <strong>{s.rvcApplioConfig?.apiName || "/infer_convert"}</strong></span>
              <span>{uiText("Model:")} <strong>{s.rvcApplioConfig?.modelName || "chọn trong Settings/.env"}</strong></span>
              <span>{uiText("F0:")} <strong>{s.rvcApplioConfig?.f0Method || "rmvpe"}</strong> · pitch <strong>{s.rvcApplioConfig?.pitch ?? 0}</strong></span>
              {s.rvcApplioConfig?.error ? <span className="text-yellow-300">{s.rvcApplioConfig.error}</span> : null}
            </div>
            <Button type="button" size="sm" variant="outline" className="mt-3" onClick={s.refreshPiperRuntime}><RefreshCcw className="mr-2 h-3.5 w-3.5" /> {uiText("Kiểm tra")}</Button>
          </div>
        </div>
      ) : null}
      <NumberSlider label={uiText("Tốc độ đọc")} value={s.narrationRate} min={0.7} max={1.2} suffix="x" step={0.05} onChange={s.setNarrationRate} />
      <NumberSlider label={uiText("Âm lượng voice")} value={s.narrationVol} min={0} max={100} suffix="%" onChange={s.setNarrationVol} />
      <Button className="w-full" variant={s.voiceProvider === "browser" ? "outline" : "default"} onClick={s.generateVoiceOver} disabled={s.voiceLoading}>
        {s.voiceLoading ? "Đang tạo voice..." : s.voiceProvider === "browser" ? "Đọc thử Browser TTS" : "Tạo voice-over cho video"}
      </Button>
      {s.voiceUrl ? <audio className="w-full" controls src={s.voiceUrl} /> : null}
      <p className="text-xs text-muted-foreground">
        Browser TTS chỉ dùng để nghe thử. Muốn video export có voice, hãy chọn Piper, ElevenLabs, Supertonic hoặc RVC/Applio.
        {s.voiceFileName ? ` File hiện tại: ${s.voiceFileName}` : ""}
      </p>
    </Card>
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
