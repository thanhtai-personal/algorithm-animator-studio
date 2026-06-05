import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PathInput, SecretInput, StatusTile, VoiceRowsTable, parseVoiceRows, serializeVoiceRows, type VoiceRow } from "./settings/SettingsFields";
import { readSystemLang, subscribeSystemLang, type Lang } from "@/lib/i18n";
import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import {
  buildRuntimeSettingsHeaders,
  clearRuntimeSettings,
  getRuntimeSettings,
  saveRuntimeSettings,
  type RuntimeSettings,
} from "@/lib/runtimeSettings";

type HealthResponse = {
  ok: boolean;
  piperExe: string;
  piperExists: boolean;
  modelDir: string;
  generatedDir?: string;
};

type PiperModel = {
  key: string;
  label: string;
  lang: "vi" | "en";
  available: boolean;
  modelPath: string;
  jsonPath: string;
};

type SelectPathResponse = { ok: boolean; path: string };

type ElevenLabsConfigResponse = { hasApiKey: boolean; voices: { id: string; label: string }[] };
type SupertonicConfigResponse = { serverOk: boolean; baseUrl: string; model: string; defaultVoice: string; voices: { id: string; label: string }[]; error?: string };
type SettingsForm = Required<Pick<RuntimeSettings, "MODEL_DIR" | "PIPER_EXE" | "MUSIC_LIBRARY_DIR" | "ELEVENLABS_API_KEY" | "ELEVENLABS_VOICES" | "SUPERTONIC_BASE_URL" | "SUPERTONIC_MODEL" | "SUPERTONIC_DEFAULT_VOICE" | "SUPERTONIC_TOTAL_STEPS">>;

const EMPTY_FORM: SettingsForm = { MODEL_DIR: "", PIPER_EXE: "", MUSIC_LIBRARY_DIR: "", ELEVENLABS_API_KEY: "", ELEVENLABS_VOICES: "", SUPERTONIC_BASE_URL: "", SUPERTONIC_MODEL: "", SUPERTONIC_DEFAULT_VOICE: "", SUPERTONIC_TOTAL_STEPS: "" };

export default function Settings() {
  const [form, setForm] = useState<SettingsForm>(() => ({ ...EMPTY_FORM, ...getRuntimeSettings() }));
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const [voiceRows, setVoiceRows] = useState<VoiceRow[]>(() => parseVoiceRows(getRuntimeSettings().ELEVENLABS_VOICES));
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [elevenLabs, setElevenLabs] = useState<ElevenLabsConfigResponse | null>(null);
  const [supertonic, setSupertonic] = useState<SupertonicConfigResponse | null>(null);
  const [models, setModels] = useState<PiperModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);

  const availableModels = useMemo(() => models.filter((model) => model.available).length, [models]);
  const vi = lang === "vi";

  useEffect(() => {
    void refreshHealth();
  }, []);

  useEffect(() => subscribeSystemLang(setLang), []);

  async function refreshHealth() {
    setLoading(true);
    try {
      const headers = buildRuntimeSettingsHeaders();
      const [healthData, modelData, elevenData, supertonicData] = await Promise.all([
        parseApiResponse<HealthResponse>(await fetch(buildApiUrl("/api/health"), { headers })),
        parseApiResponse<{ models: PiperModel[] }>(await fetch(buildApiUrl("/api/models"), { headers })),
        parseApiResponse<ElevenLabsConfigResponse>(await fetch(buildApiUrl("/api/elevenlabs/config"), { headers })),
        parseApiResponse<SupertonicConfigResponse>(await fetch(buildApiUrl("/api/supertonic/config"), { headers })),
      ]);
      setHealth(healthData);
      setModels(modelData.models);
      setElevenLabs(elevenData);
      setSupertonic(supertonicData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không kiểm tra được Piper.", "Could not check Piper."));
    } finally {
      setLoading(false);
    }
  }

  function updateField(key: keyof SettingsForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateVoiceRows(nextRows: VoiceRow[]) {
    setVoiceRows(nextRows);
    updateField("ELEVENLABS_VOICES", serializeVoiceRows(nextRows));
  }

  function updateVoiceRow(index: number, patch: Partial<VoiceRow>) {
    updateVoiceRows(voiceRows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }

  function addVoiceRow() {
    updateVoiceRows([...voiceRows, { id: "", label: "" }]);
  }

  function removeVoiceRow(index: number) {
    updateVoiceRows(voiceRows.filter((_, rowIndex) => rowIndex !== index));
  }

  async function handleSave() {
    saveRuntimeSettings(form);
    toast.success(txt(vi, "Đã lưu settings runtime.", "Runtime settings saved."));
    await refreshHealth();
  }

  async function handleReset() {
    clearRuntimeSettings();
    setForm(EMPTY_FORM);
    setVoiceRows([]);
    toast.success(txt(vi, "Đã xoá cấu hình runtime local. App sẽ dùng .env/default.", "Local runtime overrides cleared. The app will use .env/default values."));
    await refreshHealth();
  }

  async function selectPath(kind: "directory" | "file", target: keyof SettingsForm, title: string) {
    setSelecting(target);
    const toastId = toast.loading(txt(vi, "Đang mở hộp chọn đường dẫn...", "Opening path picker..."));
    try {
      const data = await parseApiResponse<SelectPathResponse>(await fetch(buildApiUrl("/api/system/select-directory"), {
        method: "POST",
        headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ kind, title, initialPath: form[target] }),
      }));
      updateField(target, data.path);
      toast.success(txt(vi, "Đã chọn đường dẫn.", "Path selected."), { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không chọn được đường dẫn.", "Could not select the path."), { id: toastId });
    } finally {
      setSelecting(null);
    }
  }

  async function openPath(targetPath: string) {
    try {
      await parseApiResponse(await fetch(buildApiUrl("/api/system/open-directory"), {
        method: "POST",
        headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ path: targetPath }),
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không mở được Explorer.", "Could not open the folder."));
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{txt(vi, "Cài đặt", "Settings")}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> {txt(vi, "Lưu settings", "Save settings")}</Button>
            <Button variant="outline" onClick={refreshHealth} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" /> {txt(vi, "Kiểm tra lại", "Check again")}
            </Button>
            <Button variant="ghost" onClick={handleReset}><Trash2 className="mr-2 h-4 w-4" /> {txt(vi, "Xoá override", "Clear overrides")}</Button>
          </div>
        </div>

        <Tabs defaultValue="voice" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-2 bg-muted/40 p-1">
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="api-key">API Key</TabsTrigger>
            <TabsTrigger value="health">{txt(vi, "Health Check", "Health Check")}</TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Voice</CardTitle>
                <CardDescription>{txt(vi, "Đường dẫn Piper, thư viện nhạc nền, voice mapping và thông số voice mặc định.", "Piper paths, background music library, voice mapping, and default voice settings.")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <PathInput
                  id="model-dir"
                  label="MODEL_DIR"
                  description={txt(vi, "Thư mục chứa các file model .onnx và .onnx.json.", "Folder containing .onnx and .onnx.json model files.")}
                  lang={lang}
                  value={form.MODEL_DIR}
                  placeholder="models"
                  busy={selecting === "MODEL_DIR"}
                  onChange={(value) => updateField("MODEL_DIR", value)}
                  onSelect={() => selectPath("directory", "MODEL_DIR", txt(vi, "Chọn thư mục chứa Piper models", "Select the Piper models folder"))}
                  onOpen={() => openPath(form.MODEL_DIR)}
                />
                <PathInput
                  id="piper-exe"
                  label="PIPER_EXE"
                  description={txt(vi, "Đường dẫn tới piper.exe, ví dụ models/.venv/Scripts/piper.exe.", "Path to piper.exe, for example models/.venv/Scripts/piper.exe.")}
                  lang={lang}
                  value={form.PIPER_EXE}
                  placeholder="models/.venv/Scripts/piper.exe"
                  busy={selecting === "PIPER_EXE"}
                  onChange={(value) => updateField("PIPER_EXE", value)}
                  onSelect={() => selectPath("file", "PIPER_EXE", txt(vi, "Chọn piper.exe", "Select piper.exe"))}
                  onOpen={() => openPath(form.PIPER_EXE)}
                />
                <PathInput
                  id="music-library-dir"
                  label="MUSIC_LIBRARY_DIR"
                  description={txt(vi, "Thư mục chứa thư viện nhạc nền. Mỗi track nằm trong một folder riêng, kèm License.txt nếu cần ghi credit YouTube.", "Folder containing the background music library. Each track should be in its own folder, with License.txt when YouTube credit is needed.")}
                  lang={lang}
                  value={form.MUSIC_LIBRARY_DIR}
                  placeholder="C:/Users/.../Music/youtube-audios"
                  busy={selecting === "MUSIC_LIBRARY_DIR"}
                  onChange={(value) => updateField("MUSIC_LIBRARY_DIR", value)}
                  onSelect={() => selectPath("directory", "MUSIC_LIBRARY_DIR", txt(vi, "Chọn thư mục thư viện nhạc nền", "Select the background music library folder"))}
                  onOpen={() => openPath(form.MUSIC_LIBRARY_DIR)}
                />
                <VoiceRowsTable rows={voiceRows} lang={lang} onAdd={addVoiceRow} onUpdate={updateVoiceRow} onRemove={removeVoiceRow} />
                <div className="grid gap-3 md:grid-cols-2">
                  <SecretInput
                    id="supertonic-default-voice"
                    label="SUPERTONIC_DEFAULT_VOICE"
                    description={txt(vi, "Voice mặc định, ví dụ M1/F1 hoặc custom voice đã import.", "Default voice, for example M1/F1 or an imported custom voice.")}
                    value={form.SUPERTONIC_DEFAULT_VOICE}
                    placeholder="M1"
                    type="text"
                    onChange={(value) => updateField("SUPERTONIC_DEFAULT_VOICE", value)}
                  />
                  <SecretInput
                    id="supertonic-total-steps"
                    label="SUPERTONIC_TOTAL_STEPS"
                    description={txt(vi, "Chất lượng 5-12, mặc định 8.", "Quality from 5-12, default 8.")}
                    value={form.SUPERTONIC_TOTAL_STEPS}
                    placeholder="8"
                    type="text"
                    onChange={(value) => updateField("SUPERTONIC_TOTAL_STEPS", value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-key" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>API Key</CardTitle>
                <CardDescription>{txt(vi, "API key và cấu hình kết nối tới các voice provider local/cloud.", "API keys and connection settings for local/cloud voice providers.")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <SecretInput
                  id="elevenlabs-api-key"
                  label="ELEVENLABS_API_KEY"
                  description={txt(vi, "API key dùng cho ElevenLabs PRO. Giá trị lưu local trong trình duyệt và gửi tới backend qua runtime header.", "API key for ElevenLabs PRO. The value is stored locally in the browser and sent to the backend through runtime headers.")}
                  value={form.ELEVENLABS_API_KEY}
                  placeholder="sk_..."
                  onChange={(value) => updateField("ELEVENLABS_API_KEY", value)}
                />
                <SecretInput
                  id="supertonic-base-url"
                  label="SUPERTONIC_BASE_URL"
                  description={txt(vi, "URL của Supertonic local server, mặc định http://127.0.0.1:6688.", "URL of the local Supertonic server, default http://127.0.0.1:6688.")}
                  value={form.SUPERTONIC_BASE_URL}
                  placeholder="http://127.0.0.1:6688"
                  type="text"
                  onChange={(value) => updateField("SUPERTONIC_BASE_URL", value)}
                />
                <SecretInput
                  id="supertonic-model"
                  label="SUPERTONIC_MODEL"
                  description={txt(vi, "Model Supertonic cần dùng, ví dụ supertonic-3.", "Supertonic model to use, for example supertonic-3.")}
                  value={form.SUPERTONIC_MODEL}
                  placeholder="supertonic-3"
                  type="text"
                  onChange={(value) => updateField("SUPERTONIC_MODEL", value)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Health Check</CardTitle>
                <CardDescription>{txt(vi, "Kiểm tra backend local, piper.exe, voice services và danh sách model hiện có.", "Check the local backend, piper.exe, voice services, and available models.")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <StatusTile lang={lang} label="Backend" ok={Boolean(health?.ok)} value={health ? txt(vi, "Đã kết nối", "Connected") : txt(vi, "Chưa kiểm tra", "Not checked")} />
                  <StatusTile lang={lang} label="Piper exe" ok={Boolean(health?.piperExists)} value={health?.piperExe || "-"} />
                  <StatusTile lang={lang} label="Models" ok={availableModels > 0} value={txt(vi, `${availableModels}/${models.length} model sẵn sàng`, `${availableModels}/${models.length} models ready`)} />
                  <StatusTile lang={lang} label="ElevenLabs" ok={Boolean(elevenLabs?.hasApiKey)} value={elevenLabs?.hasApiKey ? txt(vi, `${elevenLabs.voices.length} voice đã cấu hình`, `${elevenLabs.voices.length} voices configured`) : txt(vi, "Chưa có API key", "No API key")} />
                  <StatusTile lang={lang} label="Supertonic" ok={Boolean(supertonic?.serverOk)} value={supertonic?.serverOk ? `${supertonic.voices.length} voice · ${supertonic.model}` : supertonic?.error || txt(vi, "Chưa chạy server", "Server is not running")} />
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">{txt(vi, "Model dir đang dùng", "Active model directory")}</p>
                  <p className="break-all text-muted-foreground">{health?.modelDir || form.MODEL_DIR || "models"}</p>
                </div>
                <Separator />
                <div className="grid gap-3 md:grid-cols-2">
                  {models.map((model) => (
                    <div key={model.key} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{model.label}</p>
                          <p className="text-xs text-muted-foreground">{model.lang.toUpperCase()} · {model.key}</p>
                        </div>
                        <Badge variant={model.available ? "default" : "secondary"}>{model.available ? txt(vi, "Sẵn sàng", "Ready") : txt(vi, "Thiếu", "Missing")}</Badge>
                      </div>
                      <p className="break-all text-xs text-muted-foreground">ONNX: {model.modelPath}</p>
                      <p className="break-all text-xs text-muted-foreground">JSON: {model.jsonPath}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function txt(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}
