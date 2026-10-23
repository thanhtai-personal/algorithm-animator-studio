import { useEffect, useMemo, useState } from "react";
import { Check, FolderOpen, RefreshCcw, Upload, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const applioTemplates = useMemo(() => s.rvcApplioConfig?.templates ?? [], [s.rvcApplioConfig?.templates]);
  const applioTtsTemplates = useMemo(() => s.rvcApplioConfig?.ttsTemplates ?? [], [s.rvcApplioConfig?.ttsTemplates]);
  const [applioTemplateId, setApplioTemplateId] = useState("");

  useEffect(() => {
    if (!applioTemplates.some((template) => template.id === applioTemplateId)) {
      setApplioTemplateId(applioTemplates[0]?.id || "");
    }
  }, [applioTemplateId, applioTemplates]);
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
            <SelectItem value="vieneu">{uiText("VieNeu-TTS local · tiếng Việt/clone giọng")}</SelectItem>
            <SelectItem value="applio">{uiText("Applio TTS · EdgeTTS voices")}</SelectItem>
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
              <Label>{uiText("Supertonic TTS voice model/style")}</Label>
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
              <SelectTrigger className="mt-2"><SelectValue placeholder={uiText("Chọn TTS voice model/style")} /></SelectTrigger>
              <SelectContent>{(s.supertonicConfig?.voices ?? []).map((voice) => <SelectItem key={voice.id} value={voice.id}>{voice.label}</SelectItem>)}</SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">{uiText("Supertonic dùng dropdown này cho TTS voice/style. Custom voice bằng Applio nằm sau bước tạo audio.")}</p>
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

      {s.voiceProvider === "vieneu" ? (
        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>{uiText("VieNeu mode")}</Label>
              <Input className="mt-2" value={s.vieneuMode} onChange={(event) => s.setVieneuMode(event.target.value)} placeholder="turbo" />
            </div>
            <div>
              <Label>{uiText("Emotion")}</Label>
              <Input className="mt-2" value={s.vieneuEmotion} onChange={(event) => s.setVieneuEmotion(event.target.value)} placeholder="natural" />
            </div>
            <div>
              <Label>{uiText("Preset voice ID")}</Label>
              <Input className="mt-2" value={s.vieneuVoiceId} onChange={(event) => s.setVieneuVoiceId(event.target.value)} placeholder={uiText("Để trống = mặc định")} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
            <div className="grid gap-1">
              <span>{uiText("Python:")} <strong>{s.vieneuConfig?.pythonExe || "python"}</strong></span>
              <span>{uiText("VieNeu SDK:")} <strong className={s.vieneuConfig?.sdkInstalled ? "text-emerald-300" : "text-rose-300"}>{s.vieneuConfig?.sdkInstalled ? `OK${s.vieneuConfig.version ? ` · ${s.vieneuConfig.version}` : ""}` : "chưa sẵn sàng"}</strong></span>
              <span>{uiText("Bridge:")} <strong className={s.vieneuConfig?.bridgeExists ? "text-emerald-300" : "text-rose-300"}>{s.vieneuConfig?.bridgeExists ? "OK" : "thiếu script"}</strong></span>
              <span>{uiText("Reference audio:")} <strong>{s.vieneuConfig?.referenceAudioExists ? "đã cấu hình" : "không dùng"}</strong></span>
              {s.vieneuConfig?.error ? <span className="text-yellow-300">{s.vieneuConfig.error}</span> : null}
            </div>
            <Button type="button" size="sm" variant="outline" className="mt-3" onClick={s.refreshPiperRuntime}><RefreshCcw className="mr-2 h-3.5 w-3.5" /> {uiText("Kiểm tra")}</Button>
          </div>
        </div>
      ) : null}

      {s.voiceProvider === "applio" ? (
        <div className="grid gap-3">
          <div>
            <Label>{uiText("Applio TTS voice/model")}</Label>
            <Select value={s.applioTtsTemplateId} onValueChange={s.setApplioTtsTemplateId}>
              <SelectTrigger className="mt-2"><SelectValue placeholder={uiText("Chọn Applio TTS voice")} /></SelectTrigger>
              <SelectContent>{applioTtsTemplates.map((template) => <SelectItem key={template.id} value={template.id}>{template.label || template.ttsVoice || template.id}</SelectItem>)}</SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">{uiText("Danh sách này lấy từ Applio ttsTemplates, ví dụ vi-VN-HoaiMyNeural hoặc vi-VN-NamMinhNeural.")}</p>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
            <div className="grid gap-1">
              <span>{uiText("Applio server:")} <strong className={s.rvcApplioConfig?.serverOk ? "text-emerald-300" : "text-rose-300"}>{s.rvcApplioConfig?.serverOk ? "đã kết nối" : "chưa chạy"}</strong></span>
              <span>{uiText("gradio_client:")} <strong className={s.rvcApplioConfig?.gradioClientInstalled ? "text-emerald-300" : "text-rose-300"}>{s.rvcApplioConfig?.gradioClientInstalled ? "OK" : "thiếu package"}</strong></span>
              <span>{uiText("TTS templates:")} <strong>{applioTtsTemplates.length}</strong></span>
              {!s.rvcApplioConfig?.gradioClientInstalled ? <span className="break-all text-yellow-300">{s.rvcApplioConfig?.gradioClientInstallCommand || "npm run applio:install"}</span> : null}
              {s.rvcApplioConfig?.error ? <span className="text-yellow-300">{s.rvcApplioConfig.error}</span> : null}
            </div>
            <Button type="button" size="sm" variant="outline" className="mt-3" onClick={s.refreshPiperRuntime}><RefreshCcw className="mr-2 h-3.5 w-3.5" /> {uiText("Kiểm tra")}</Button>
          </div>
        </div>
      ) : null}

      <NumberSlider label={uiText("Tốc độ đọc")} value={s.narrationRate} min={0.7} max={1.2} suffix="x" step={0.05} onChange={s.setNarrationRate} />
      <NumberSlider label={uiText("Âm lượng voice")} value={s.narrationVol} min={0} max={100} suffix="%" onChange={s.setNarrationVol} />
      <Button className="w-full" variant={s.voiceProvider === "browser" ? "outline" : "default"} onClick={s.generateVoiceOver} disabled={s.voiceLoading || (s.voiceProvider === "vieneu" && !s.vieneuConfig?.sdkInstalled) || (s.voiceProvider === "applio" && (!s.rvcApplioConfig?.serverOk || !s.rvcApplioConfig?.gradioClientInstalled || applioTtsTemplates.length === 0))}>
        {s.voiceLoading ? "Đang tạo voice..." : s.voiceProvider === "browser" ? "Đọc thử Browser TTS" : "Tạo voice-over cho video"}
      </Button>
      {s.voiceUrl ? (
        <div className="grid gap-3 rounded-lg border border-border bg-background/40 p-3">
          <audio className="h-10 min-w-0 flex-1" controls src={s.voiceUrl} />
          <div className="grid gap-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <VoiceAssetButton
                active={s.activeVoiceKind === "original"}
                disabled={!s.originalVoice}
                fileName={s.originalVoice?.fileName || ""}
                label={uiText("Voice gốc")}
                onClick={() => s.selectGeneratedVoice("original")}
              />
              <VoiceAssetButton
                active={s.activeVoiceKind === "custom"}
                disabled={!s.customVoice}
                fileName={s.customVoice?.fileName || ""}
                label={uiText("Voice custom model")}
                onClick={() => s.selectGeneratedVoice("custom")}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={s.openSelectedVoiceFolder} disabled={!s.voiceRelativePath}>
              <FolderOpen className="mr-2 h-4 w-4" /> {uiText("Mở thư mục voice đang chọn")}
            </Button>
          </div>
          <div className="grid gap-1 text-xs text-muted-foreground">
            <span>{uiText("Applio custom voice:")} <strong className={s.rvcApplioConfig?.serverOk ? "text-emerald-300" : "text-rose-300"}>{s.rvcApplioConfig?.serverOk ? "đã kết nối" : "chưa chạy"}</strong></span>
            <span>{uiText("gradio_client:")} <strong className={s.rvcApplioConfig?.gradioClientInstalled ? "text-emerald-300" : "text-rose-300"}>{s.rvcApplioConfig?.gradioClientInstalled ? "OK" : "thiếu package"}</strong></span>
            <span>{uiText("Convert templates:")} <strong>{applioTemplates.length}</strong></span>
            <span>{uiText("Workflow:")} <strong>{uiText("audio đã tạo → chuyển voice bằng Applio")}</strong></span>
            {s.rvcApplioConfig?.error ? <span className="text-yellow-300">{s.rvcApplioConfig.error}</span> : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            {applioTemplates.length > 0 ? (
              <Select value={applioTemplateId} onValueChange={setApplioTemplateId}>
                <SelectTrigger><SelectValue placeholder={uiText("Chọn custom voice Applio")} /></SelectTrigger>
                <SelectContent>{applioTemplates.map((template) => <SelectItem key={template.id} value={template.id}>{template.label}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <div className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                {uiText("Chưa có Applio convert template. Thêm trong Settings -> Voice -> Applio.")}
              </div>
            )}
            <Button type="button" variant="outline" onClick={() => s.convertVoiceWithApplio(applioTemplateId || undefined)} disabled={s.voiceConverting || !s.voiceRelativePath || !s.rvcApplioConfig?.serverOk || !s.rvcApplioConfig?.gradioClientInstalled || applioTemplates.length === 0}>
              {s.voiceConverting ? "Đang chuyển..." : "Chuyển sang custom voice"}
            </Button>
          </div>
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Browser TTS chỉ dùng để nghe thử. Muốn video export có voice, hãy chọn Piper, ElevenLabs, Supertonic, VieNeu hoặc Applio TTS. Applio custom voice dùng để chuyển file audio đã tạo sang giọng RVC.
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

function VoiceAssetButton(props: { active: boolean; disabled: boolean; fileName: string; label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant={props.active ? "default" : "outline"}
      className="h-auto min-h-12 justify-start gap-2 px-3 py-2 text-left"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.active ? <Check className="h-4 w-4 shrink-0" /> : <Volume2 className="h-4 w-4 shrink-0" />}
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{props.label}</span>
        <span className="block truncate text-xs opacity-80">{props.fileName || uiText("Chưa có file")}</span>
      </span>
    </Button>
  );
}
