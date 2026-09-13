import { useEffect, useMemo, useState } from "react";
import { MicVocal, Trash2, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SystemLoader } from "@/components/ui/system-loader";
import { generateElevenLabsVoice, generateGptSoVitsVoice, generatePiperVoice, generateRvcApplioVoice, generateSupertonicVoice, generateVieneuVoice, getElevenLabsConfig, getGptSoVitsConfig, getPiperModels, getRvcApplioConfig, getSupertonicConfig, getVieneuConfig, type ElevenLabsConfig, type GptSoVitsConfig, type PiperModel, type RvcApplioConfig, type SupertonicConfig, type VieneuConfig, type VoiceGenerateResult } from "@/lib/voiceApi";
import type { PresetVideoDefinition, PresetVideoExportSettings, PresetVideoLanguage } from "../types";
import { VolumeSlider } from "./PresetVideoControls";

type Provider = "piper" | "supertonic" | "vieneu" | "gpt-sovits" | "elevenlabs" | "applio-tts";
type Props = { preset: PresetVideoDefinition; language: PresetVideoLanguage; settings: PresetVideoExportSettings; disabled?: boolean; onChange: (patch: Partial<PresetVideoExportSettings>) => void };

export function PresetVideoVoiceoverSettings({ preset, language, settings, disabled = false, onChange }: Props) {
  const defaultText = useMemo(() => (preset.editableLyrics || []).map((cue) => cue.lines.join(" " ).trim()).filter(Boolean).join("\n"), [preset]);
  const [text, setText] = useState(defaultText);
  const [provider, setProvider] = useState<Provider>("piper");
  const [generating, setGenerating] = useState(false);
  const [models, setModels] = useState<PiperModel[]>([]);
  const [modelKey, setModelKey] = useState("");
  const [supertonic, setSupertonic] = useState<SupertonicConfig | null>(null);
  const [vieneu, setVieneu] = useState<VieneuConfig | null>(null);
  const [elevenLabs, setElevenLabs] = useState<ElevenLabsConfig | null>(null);
  const [gptSoVits, setGptSoVits] = useState<GptSoVitsConfig | null>(null);
  const [applio, setApplio] = useState<RvcApplioConfig | null>(null);
  const [elevenVoiceId, setElevenVoiceId] = useState("");
  const [elevenModelId, setElevenModelId] = useState("");
  const [applioTemplateId, setApplioTemplateId] = useState("");
  const [gptReferenceAudioPath, setGptReferenceAudioPath] = useState("");
  const [gptPromptText, setGptPromptText] = useState("");
  const [gptTextLang, setGptTextLang] = useState<PresetVideoLanguage>(language);
  const [gptPromptLang, setGptPromptLang] = useState<PresetVideoLanguage>(language);

  useEffect(() => setText(defaultText), [defaultText, preset.id, language]);
  useEffect(() => {
    setGptTextLang(language);
    setGptPromptLang(language);
    setModelKey(choosePiperModel(models, language)?.key || "");
    if (language !== "vi" && provider === "vieneu") setProvider("piper");
  }, [language, models, provider]);
  useEffect(() => {
    let active = true;
    Promise.all([getPiperModels().catch(() => [] as PiperModel[]), getSupertonicConfig().catch(() => null), getVieneuConfig().catch(() => null), getElevenLabsConfig().catch(() => null), getGptSoVitsConfig().catch(() => null), getRvcApplioConfig().catch(() => null)]).then(([nextModels, nextSupertonic, nextVieneu, nextEleven, nextGpt, nextApplio]) => {
      if (!active) return;
      setModels(nextModels); setSupertonic(nextSupertonic); setVieneu(nextVieneu); setElevenLabs(nextEleven); setGptSoVits(nextGpt); setApplio(nextApplio);
      setModelKey(choosePiperModel(nextModels, language)?.key || "");
      setElevenVoiceId(nextEleven?.voices[0]?.id || ""); setElevenModelId(nextEleven?.models[0]?.id || "eleven_multilingual_v2");
      setApplioTemplateId(nextApplio?.ttsTemplates[0]?.id || ""); setGptReferenceAudioPath(nextGpt?.referenceAudioPath || "");
    });
    return () => { active = false; };
  }, []);

  const availableModels = models.filter((item) => item.available);
  const ready = provider === "piper" ? Boolean(modelKey) : provider === "supertonic" ? Boolean(supertonic?.enabled && supertonic.defaultVoice) : provider === "vieneu" ? Boolean(language === "vi" && vieneu?.enabled) : provider === "elevenlabs" ? Boolean(elevenLabs?.hasApiKey && elevenVoiceId && elevenModelId) : provider === "gpt-sovits" ? Boolean(gptSoVits?.enabled) : Boolean(applio?.enabled && applioTemplateId);

  async function handleGenerate() {
    const normalizedText = text.trim(); if (!normalizedText) return toast.error(language === "vi" ? "Hãy nhập lời voice-over trước." : "Enter the voice-over script first.");
    setGenerating(true);
    try { const output = await runGenerate(normalizedText); onChange({ voiceoverAudioRelativePath: output.relativePath, voiceoverAudioUrl: output.audioUrl }); if (output.warning) toast.warning(output.warning); toast.success(language === "vi" ? "Đã tạo voice-over và gắn vào preset." : "Voice-over generated and attached to the preset."); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to generate voice-over."); } finally { setGenerating(false); }
  }

  async function runGenerate(normalizedText: string): Promise<VoiceGenerateResult> {
    const fileName = `${preset.id}-${language}-voiceover`;
    const segments = normalizedText.split("\n").map((item) => item.trim()).filter(Boolean);
    if (provider === "piper") return generatePiperVoice({ text: normalizedText, segments, modelKey, sentenceSilence: 0.15, speechRate: 1, fileName });
    if (provider === "supertonic") return generateSupertonicVoice({ text: normalizedText, segments, voice: supertonic?.defaultVoice || "", lang: language, speed: 1, totalSteps: supertonic?.defaultTotalSteps || 8, fileName });
    if (provider === "vieneu") return generateVieneuVoice({ text: normalizedText, segments, fileName, mode: vieneu?.mode, emotion: vieneu?.emotion, voiceId: vieneu?.defaultVoiceId });
    if (provider === "gpt-sovits") return generateGptSoVitsVoice({ text: normalizedText, segments, fileName, textLang: gptTextLang, promptLang: gptPromptLang, referenceAudioPath: gptReferenceAudioPath, promptText: gptPromptText, mediaType: gptSoVits?.mediaType || "wav", textSplitMethod: gptSoVits?.textSplitMethod || "cut5" });
    if (provider === "elevenlabs") return generateElevenLabsVoice({ text: normalizedText, modelId: elevenModelId, voiceId: elevenVoiceId, fileName });
    return generateRvcApplioVoice({ text: normalizedText, segments, fileName, templateId: applioTemplateId || undefined });
  }

  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><MicVocal className="h-4 w-4" />Voice-over / TTS · {language.toUpperCase()}</CardTitle></CardHeader><CardContent className="space-y-4">
    <div className="space-y-2"><Label>{language === "vi" ? "Lời đọc" : "Script"}</Label><Textarea value={text} onChange={(event) => setText(event.target.value)} rows={7} disabled={disabled || generating} /><p className="text-xs text-muted-foreground">{language === "vi" ? "Lời đọc được lấy từ lyric của ngôn ngữ hệ thống." : "The script follows the current system-language lyrics."}</p></div>
    <div className="space-y-2"><Label>Provider</Label><Select value={provider} onValueChange={(value) => setProvider(value as Provider)} disabled={disabled || generating}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="piper">Piper local</SelectItem><SelectItem value="supertonic">Supertonic</SelectItem><SelectItem value="vieneu" disabled={language !== "vi"}>VieNeu {language !== "vi" ? "(Vietnamese only)" : ""}</SelectItem><SelectItem value="gpt-sovits">GPT-SoVITS Experimental</SelectItem><SelectItem value="elevenlabs">ElevenLabs</SelectItem><SelectItem value="applio-tts">Applio TTS custom voice</SelectItem></SelectContent></Select></div>
    {provider === "piper" ? <SelectField label="Piper model" value={modelKey} onChange={setModelKey} options={availableModels.map((item) => ({ value: item.key, label: item.label }))} /> : null}
    {provider === "elevenlabs" ? <><SelectField label="ElevenLabs voice" value={elevenVoiceId} onChange={setElevenVoiceId} options={(elevenLabs?.voices || []).map((item) => ({ value: item.id, label: item.label }))} /><SelectField label="ElevenLabs model" value={elevenModelId} onChange={setElevenModelId} options={(elevenLabs?.models || []).map((item) => ({ value: item.id, label: item.label }))} /></> : null}
    {provider === "gpt-sovits" ? <div className="space-y-3 rounded-lg border p-3"><p className="text-xs text-muted-foreground">Language locked to system: {language.toUpperCase()}</p><div className="space-y-2"><Label>Reference audio path</Label><Input value={gptReferenceAudioPath} onChange={(event) => setGptReferenceAudioPath(event.target.value)} /></div><div className="space-y-2"><Label>Prompt text</Label><Textarea value={gptPromptText} onChange={(event) => setGptPromptText(event.target.value)} rows={3} /></div></div> : null}
    {provider === "applio-tts" ? <SelectField label="Applio TTS template" value={applioTemplateId} onChange={setApplioTemplateId} options={(applio?.ttsTemplates || []).map((item) => ({ value: item.id, label: item.label }))} /> : null}
    <Button className="w-full" disabled={disabled || generating || !ready || !text.trim()} onClick={() => void handleGenerate()}>{generating ? <SystemLoader className="mr-2 h-4 w-4" /> : <WandSparkles className="mr-2 h-4 w-4" />}{generating ? (language === "vi" ? "Đang tạo..." : "Generating...") : (language === "vi" ? "Tạo voice-over" : "Generate voice-over")}</Button>
    {settings.voiceoverAudioUrl ? <div className="space-y-2 rounded-lg border bg-muted/20 p-3"><audio controls preload="metadata" src={settings.voiceoverAudioUrl} className="h-9 w-full" /><p className="break-all text-[11px] text-muted-foreground">{settings.voiceoverAudioRelativePath}</p><Button variant="outline" size="sm" disabled={disabled || generating} onClick={() => onChange({ voiceoverAudioRelativePath: "", voiceoverAudioUrl: "" })}><Trash2 className="mr-2 h-4 w-4" />{language === "vi" ? "Bỏ voice-over" : "Remove voice-over"}</Button></div> : null}
    <VolumeSlider label="Voice-over volume" value={settings.voiceoverVolume} onChange={(value) => onChange({ voiceoverVolume: value })} />
  </CardContent></Card>;
}

function choosePiperModel(models: PiperModel[], language: PresetVideoLanguage) {
  const available = models.filter((item) => item.available);
  const tokens = language === "vi" ? ["vi", "vietnam"] : ["en", "english"];
  return available.find((item) => tokens.some((token) => `${item.key} ${item.label}`.toLowerCase().includes(token))) || available[0];
}
function SelectField(props: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) { return <div className="space-y-2"><Label>{props.label}</Label><Select value={props.value} onValueChange={props.onChange}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{props.options.length ? props.options.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>) : <SelectItem value="__empty" disabled>No options</SelectItem>}</SelectContent></Select></div>; }
