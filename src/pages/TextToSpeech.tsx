import { useEffect, useMemo, useState } from "react";
import { MicVocal, WandSparkles } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { readSystemLang, subscribeSystemLang, text, type Lang } from "@/lib/i18n";
import {
  convertRvcApplioVoice,
  generateElevenLabsVoice,
  generateGptSoVitsVoice,
  generatePiperVoice,
  generateRvcApplioVoice,
  generateSupertonicVoice,
  generateVieneuVoice,
  getElevenLabsConfig,
  getGptSoVitsConfig,
  getPiperModels,
  getRvcApplioConfig,
  getSupertonicConfig,
  getVieneuConfig,
  type ElevenLabsConfig,
  type GptSoVitsConfig,
  type PiperModel,
  type RvcApplioConfig,
  type SupertonicConfig,
  type VieneuConfig,
  type VoiceGenerateResult,
} from "@/lib/voiceApi";

const DEFAULT_TEXT = "KAI Studio is ready to generate voice-over for your video workflow.";

type Provider = "piper" | "supertonic" | "vieneu" | "gpt-sovits" | "elevenlabs" | "applio-tts";

export default function TextToSpeech() {
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const [textValue, setTextValue] = useState(DEFAULT_TEXT);
  const [fileName, setFileName] = useState("voice-over");
  const [provider, setProvider] = useState<Provider>("piper");
  const [models, setModels] = useState<PiperModel[]>([]);
  const [modelKey, setModelKey] = useState("");
  const [supertonic, setSupertonic] = useState<SupertonicConfig | null>(null);
  const [vieneu, setVieneu] = useState<VieneuConfig | null>(null);
  const [elevenLabs, setElevenLabs] = useState<ElevenLabsConfig | null>(null);
  const [gptSoVits, setGptSoVits] = useState<GptSoVitsConfig | null>(null);
  const [applio, setApplio] = useState<RvcApplioConfig | null>(null);
  const [elevenVoiceId, setElevenVoiceId] = useState("");
  const [elevenModelId, setElevenModelId] = useState("");
  const [applioTtsTemplateId, setApplioTtsTemplateId] = useState("");
  const [gptReferenceAudioPath, setGptReferenceAudioPath] = useState("");
  const [gptPromptText, setGptPromptText] = useState("");
  const [gptTextLang, setGptTextLang] = useState("en");
  const [gptPromptLang, setGptPromptLang] = useState("en");
  const [convertTemplateId, setConvertTemplateId] = useState("");
  const [sourceAudioRelativePath, setSourceAudioRelativePath] = useState("");
  const [result, setResult] = useState<VoiceGenerateResult | null>(null);
  const [converted, setConverted] = useState<VoiceGenerateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);

  const availableModels = useMemo(() => models.filter((model) => model.available), [models]);

  useEffect(() => subscribeSystemLang(setLang), []);

  useEffect(() => {
    refreshConfig().catch((error) => toast.error(error instanceof Error ? error.message : "Could not load voice config."));
  }, []);

  async function refreshConfig() {
    const [nextModels, nextSupertonic, nextVieneu, nextEleven, nextGptSoVits, nextApplio] = await Promise.all([
      getPiperModels(),
      getSupertonicConfig().catch(() => null),
      getVieneuConfig().catch(() => null),
      getElevenLabsConfig().catch(() => null),
      getGptSoVitsConfig().catch(() => null),
      getRvcApplioConfig().catch(() => null),
    ]);
    setModels(nextModels);
    setSupertonic(nextSupertonic);
    setVieneu(nextVieneu);
    setElevenLabs(nextEleven);
    setGptSoVits(nextGptSoVits);
    setApplio(nextApplio);
    setModelKey((current) => current || nextModels.find((model) => model.available)?.key || nextModels[0]?.key || "");
    setElevenVoiceId((current) => current || nextEleven?.voices[0]?.id || "");
    setElevenModelId((current) => current || nextEleven?.models[0]?.id || "eleven_multilingual_v2");
    setGptReferenceAudioPath((current) => current || nextGptSoVits?.referenceAudioPath || "");
    setGptTextLang((current) => current || nextGptSoVits?.defaultTextLang || "en");
    setGptPromptLang((current) => current || nextGptSoVits?.defaultPromptLang || "en");
    setApplioTtsTemplateId((current) => current || nextApplio?.ttsTemplates[0]?.id || "");
    setConvertTemplateId((current) => current || nextApplio?.templates[0]?.id || "");
  }

  async function handleGenerate() {
    const normalizedText = textValue.trim();
    if (!normalizedText) {
      toast.error(text(lang, "Please enter text first.", "Vui lòng nhập nội dung trước."));
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const output = await runGenerate(normalizedText);
      setResult(output);
      setSourceAudioRelativePath(output.relativePath || "");
      toast.success(text(lang, "Voice generated.", "Đã tạo voice."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not generate voice.", "Không tạo được voice."));
    } finally {
      setLoading(false);
    }
  }

  async function runGenerate(normalizedText: string) {
    const safeFileName = fileName.trim() || "voice-over";
    if (provider === "piper") {
      return generatePiperVoice({ text: normalizedText, modelKey, sentenceSilence: 0.15, speechRate: 1, fileName: safeFileName });
    }
    if (provider === "supertonic") {
      return generateSupertonicVoice({ text: normalizedText, voice: supertonic?.defaultVoice || "", lang, speed: 1, totalSteps: supertonic?.defaultTotalSteps || 8, fileName: safeFileName });
    }
    if (provider === "vieneu") {
      return generateVieneuVoice({ text: normalizedText, fileName: safeFileName, mode: vieneu?.mode, emotion: vieneu?.emotion, voiceId: vieneu?.defaultVoiceId });
    }
    if (provider === "gpt-sovits") {
      return generateGptSoVitsVoice({
        text: normalizedText,
        fileName: safeFileName,
        textLang: gptTextLang,
        promptLang: gptPromptLang,
        referenceAudioPath: gptReferenceAudioPath,
        promptText: gptPromptText,
        mediaType: gptSoVits?.mediaType || "wav",
        textSplitMethod: gptSoVits?.textSplitMethod || "cut5",
      });
    }
    if (provider === "elevenlabs") {
      return generateElevenLabsVoice({ text: normalizedText, modelId: elevenModelId, voiceId: elevenVoiceId, fileName: safeFileName });
    }
    return generateRvcApplioVoice({ text: normalizedText, fileName: safeFileName, templateId: applioTtsTemplateId });
  }

  async function handleConvert() {
    if (!sourceAudioRelativePath.trim()) {
      toast.error(text(lang, "Enter a generated audio relative path first.", "Nhập relative path audio đã tạo trước."));
      return;
    }
    setConverting(true);
    setConverted(null);
    try {
      const output = await convertRvcApplioVoice({
        audioRelativePath: sourceAudioRelativePath.trim(),
        fileName: `${fileName.trim() || "custom-voice"}-custom`,
        templateId: convertTemplateId || undefined,
      });
      setConverted(output);
      toast.success(text(lang, "Custom voice generated.", "Đã chuyển sang custom voice."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not convert custom voice.", "Không chuyển được custom voice."));
    } finally {
      setConverting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 text-foreground">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{text(lang, "Text to Speech", "Text to Speech")}</h1>
        <p className="text-sm text-muted-foreground">
          {text(lang, "Generate voice-over and convert generated audio to custom voice with Applio/RVC.", "Tạo voice-over và chuyển audio đã tạo sang custom voice bằng Applio/RVC.")}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MicVocal className="h-5 w-5" /> {text(lang, "Generate voice", "Tạo voice")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{text(lang, "Input text", "Nội dung")}</Label>
              <Textarea value={textValue} onChange={(event) => setTextValue(event.target.value)} rows={8} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{text(lang, "Provider", "Nguồn voice")}</Label>
                <Select value={provider} onValueChange={(value) => setProvider(value as Provider)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piper">Piper local</SelectItem>
                    <SelectItem value="supertonic">Supertonic</SelectItem>
                    <SelectItem value="vieneu">VieNeu</SelectItem>
                    <SelectItem value="gpt-sovits">GPT-SoVITS Experimental</SelectItem>
                    <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                    <SelectItem value="applio-tts">Applio TTS custom voice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{text(lang, "File name", "Tên file")}</Label>
                <Input value={fileName} onChange={(event) => setFileName(event.target.value)} />
              </div>
            </div>

            {provider === "piper" ? (
              <SelectField label={text(lang, "Piper model", "Model Piper")} value={modelKey} onChange={setModelKey} options={availableModels.map((model) => ({ value: model.key, label: model.label }))} />
            ) : null}
            {provider === "elevenlabs" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <SelectField label="ElevenLabs voice" value={elevenVoiceId} onChange={setElevenVoiceId} options={(elevenLabs?.voices || []).map((voice) => ({ value: voice.id, label: voice.label }))} />
                <SelectField label="ElevenLabs model" value={elevenModelId} onChange={setElevenModelId} options={(elevenLabs?.models || []).map((model) => ({ value: model.id, label: model.label }))} />
              </div>
            ) : null}
            {provider === "gpt-sovits" ? (
              <div className="space-y-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                <p className="text-sm text-yellow-100">
                  {gptSoVits?.enabled
                    ? text(lang, "GPT-SoVITS uses a local API and usually needs reference audio plus matching prompt text.", "GPT-SoVITS dùng API local và thường cần audio mẫu cùng text khớp audio mẫu.")
                    : text(lang, "GPT-SoVITS is disabled in Settings > Provider. Enable it and restart the app before generating.", "GPT-SoVITS đang tắt trong Cài đặt > Provider. Bật rồi restart app trước khi tạo voice.")}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <SelectField label={text(lang, "Text language", "Ngôn ngữ text")} value={gptTextLang} onChange={setGptTextLang} options={GPT_SOVITS_LANGS} />
                  <SelectField label={text(lang, "Prompt language", "Ngôn ngữ audio mẫu")} value={gptPromptLang} onChange={setGptPromptLang} options={GPT_SOVITS_LANGS} />
                </div>
                <div className="space-y-2">
                  <Label>{text(lang, "Reference audio path", "Đường dẫn audio mẫu")}</Label>
                  <Input value={gptReferenceAudioPath} onChange={(event) => setGptReferenceAudioPath(event.target.value)} placeholder="C:/voices/reference.wav" />
                </div>
                <div className="space-y-2">
                  <Label>{text(lang, "Prompt text", "Text khớp audio mẫu")}</Label>
                  <Textarea value={gptPromptText} onChange={(event) => setGptPromptText(event.target.value)} rows={3} placeholder="Exact sentence spoken in the reference audio" />
                </div>
              </div>
            ) : null}
            {provider === "applio-tts" ? (
              <SelectField label={text(lang, "Applio TTS template", "Template Applio TTS")} value={applioTtsTemplateId} onChange={setApplioTtsTemplateId} options={(applio?.ttsTemplates || []).map((template) => ({ value: template.id, label: template.label }))} />
            ) : null}

            <Button onClick={handleGenerate} disabled={loading || (provider === "piper" && !modelKey) || (provider === "gpt-sovits" && !gptSoVits?.enabled)}>
              {loading ? <SystemLoader className="mr-2 h-4 w-4" /> : <WandSparkles className="mr-2 h-4 w-4" />}
              {text(lang, "Generate", "Tạo voice")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{text(lang, "Result", "Kết quả")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AudioResult lang={lang} result={result} />
            <div className="rounded-xl border p-4">
              <h3 className="font-semibold">{text(lang, "Voice to custom voice", "Voice sang custom voice")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {text(lang, "Use Applio/RVC to convert a generated audio file to a configured custom voice.", "Dùng Applio/RVC để chuyển audio đã tạo sang giọng custom đã cấu hình.")}
              </p>
              <div className="mt-4 space-y-3">
                <SelectField label={text(lang, "Convert template", "Template chuyển giọng")} value={convertTemplateId} onChange={setConvertTemplateId} options={(applio?.templates || []).map((template) => ({ value: template.id, label: template.label }))} />
                <div className="space-y-2">
                  <Label>{text(lang, "Generated audio relative path", "Relative path audio đã tạo")}</Label>
                  <Input value={sourceAudioRelativePath} onChange={(event) => setSourceAudioRelativePath(event.target.value)} placeholder="2026-06-09/voice-over.wav" />
                </div>
                <Button variant="secondary" onClick={handleConvert} disabled={converting || !sourceAudioRelativePath.trim()}>
                  {converting ? <SystemLoader className="mr-2 h-4 w-4" /> : <WandSparkles className="mr-2 h-4 w-4" />}
                  {text(lang, "Convert", "Chuyển giọng")}
                </Button>
              </div>
            </div>
            <AudioResult lang={lang} result={converted} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

const GPT_SOVITS_LANGS = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "yue", label: "Cantonese" },
  { value: "auto", label: "Auto" },
];

function SelectField(props: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{props.label}</Label>
      <Select value={props.value} onValueChange={props.onChange}>
        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent>
          {props.options.length ? props.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          )) : <SelectItem value="__empty" disabled>No options</SelectItem>}
        </SelectContent>
      </Select>
    </div>
  );
}

function AudioResult({ result, lang }: { result: VoiceGenerateResult | null; lang: Lang }) {
  if (!result) return <p className="text-sm text-muted-foreground">{text(lang, "No audio yet.", "Chưa có audio.")}</p>;
  return (
    <div className="space-y-2 rounded-xl border p-3">
      <p className="font-medium">{result.fileName}</p>
      {result.audioUrl ? <audio controls className="w-full" src={result.audioUrl} /> : null}
      <p className="break-all text-xs text-muted-foreground">{result.relativePath}</p>
    </div>
  );
}
