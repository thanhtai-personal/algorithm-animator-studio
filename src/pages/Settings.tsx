import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseVoiceRows, serializeVoiceRows, type VoiceRow } from "./settings/SettingsFields";
import { SettingsApiKeyTab } from "./settings/SettingsApiKeyTab";
import { SettingsDataTab } from "./settings/SettingsDataTab";
import { SettingsHealthTab } from "./settings/SettingsHealthTab";
import { EMPTY_FORM, type ElevenLabsConfigResponse, type HealthResponse, type PiperModel, type SelectPathResponse, type SettingsForm, type SettingsFormKey, type SupertonicConfigResponse } from "./settings/SettingsTypes";
import { SettingsVoiceTab } from "./settings/SettingsVoiceTab";
import { txt } from "./settings/settingsText";
import { readSystemLang, subscribeSystemLang, type Lang } from "@/lib/i18n";
import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import {
  buildRuntimeSettingsHeaders,
  clearRuntimeSettings,
  getRuntimeSettings,
  saveRuntimeSettings,
} from "@/lib/runtimeSettings";

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

  function updateField(key: SettingsFormKey, value: string) {
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

  async function selectPath(kind: "directory" | "file", target: SettingsFormKey, title: string) {
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
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted/40 p-1 md:grid-cols-4">
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="api-key">API Key</TabsTrigger>
            <TabsTrigger value="health">{txt(vi, "Health Check", "Health Check")}</TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="mt-0">
            <SettingsVoiceTab
              form={form}
              lang={lang}
              selecting={selecting}
              voiceRows={voiceRows}
              onAddVoiceRow={addVoiceRow}
              onOpenPath={openPath}
              onRemoveVoiceRow={removeVoiceRow}
              onSelectPath={selectPath}
              onUpdateField={updateField}
              onUpdateVoiceRow={updateVoiceRow}
            />
          </TabsContent>

          <TabsContent value="data" className="mt-0">
            <SettingsDataTab form={form} lang={lang} selecting={selecting} onOpenPath={openPath} onSelectPath={selectPath} onUpdateField={updateField} />
          </TabsContent>

          <TabsContent value="api-key" className="mt-0">
            <SettingsApiKeyTab form={form} lang={lang} onUpdateField={updateField} />
          </TabsContent>

          <TabsContent value="health" className="mt-0">
            <SettingsHealthTab
              availableModels={availableModels}
              elevenLabs={elevenLabs}
              form={form}
              health={health}
              lang={lang}
              models={models}
              supertonic={supertonic}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
