import { useEffect, useMemo, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseVoiceRows, serializeVoiceRows, type VoiceRow } from "./settings/SettingsFields";
import { SettingsApiKeyTab } from "./settings/SettingsApiKeyTab";
import { SettingsDataTab } from "./settings/SettingsDataTab";
import { SettingsHealthTab } from "./settings/SettingsHealthTab";
import { EMPTY_FORM, type ElevenLabsConfigResponse, type HealthResponse, type PiperModel, type RvcApplioConfigResponse, type SelectPathResponse, type SettingsForm, type SettingsFormKey, type SupertonicConfigResponse, type VieneuConfigResponse } from "./settings/SettingsTypes";
import { SettingsVoiceTab } from "./settings/SettingsVoiceTab";
import { readSystemLang, subscribeSystemLang, t, type Lang } from "@/lib/i18n";
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
  const [rvcApplio, setRvcApplio] = useState<RvcApplioConfigResponse | null>(null);
  const [vieneu, setVieneu] = useState<VieneuConfigResponse | null>(null);
  const [models, setModels] = useState<PiperModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);

  const availableModels = useMemo(() => models.filter((model) => model.available).length, [models]);

  useEffect(() => {
    void refreshHealth();
  }, []);

  useEffect(() => subscribeSystemLang(setLang), []);

  async function refreshHealth() {
    setLoading(true);
    try {
      const headers = buildRuntimeSettingsHeaders();
      const [healthData, modelData, elevenData, supertonicData, rvcApplioData, vieneuData] = await Promise.all([
        parseApiResponse<HealthResponse>(await fetch(buildApiUrl("/api/health"), { headers })),
        parseApiResponse<{ models: PiperModel[] }>(await fetch(buildApiUrl("/api/models"), { headers })),
        parseApiResponse<ElevenLabsConfigResponse>(await fetch(buildApiUrl("/api/elevenlabs/config"), { headers })),
        parseApiResponse<SupertonicConfigResponse>(await fetch(buildApiUrl("/api/supertonic/config"), { headers })),
        parseApiResponse<RvcApplioConfigResponse>(await fetch(buildApiUrl("/api/rvc-applio/config"), { headers })),
        parseApiResponse<VieneuConfigResponse>(await fetch(buildApiUrl("/api/vieneu/config"), { headers })),
      ]);
      setHealth(healthData);
      setModels(modelData.models);
      setElevenLabs(elevenData);
      setSupertonic(supertonicData);
      setRvcApplio(rvcApplioData);
      setVieneu(vieneuData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "settingsCouldNotCheckPiper"));
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
    toast.success(t(lang, "settingsRuntimeSaved"));
    await refreshHealth();
  }

  async function handleReset() {
    clearRuntimeSettings();
    setForm(EMPTY_FORM);
    setVoiceRows([]);
    toast.success(t(lang, "settingsOverridesCleared"));
    await refreshHealth();
  }

  async function selectPath(kind: "directory" | "file", target: SettingsFormKey, title: string) {
    setSelecting(target);
    const toastId = toast.loading(t(lang, "settingsOpeningPathPicker"));
    try {
      const data = await parseApiResponse<SelectPathResponse>(await fetch(buildApiUrl("/api/system/select-directory"), {
        method: "POST",
        headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ kind, title, initialPath: form[target] }),
      }));
      updateField(target, data.path);
      toast.success(t(lang, "settingsPathSelected"), { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "settingsCouldNotSelectPath"), { id: toastId });
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
      toast.error(error instanceof Error ? error.message : t(lang, "settingsCouldNotOpenFolder"));
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t(lang, "settingsTitle")}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> {t(lang, "settingsSave")}</Button>
            <Button variant="ghost" onClick={handleReset}><Trash2 className="mr-2 h-4 w-4" /> {t(lang, "settingsClearOverrides")}</Button>
          </div>
        </div>

        <Tabs defaultValue="voice" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted/40 p-1 md:grid-cols-4">
            <TabsTrigger value="voice">{t(lang, "settingsVoiceTab")}</TabsTrigger>
            <TabsTrigger value="data">{t(lang, "settingsDataTab")}</TabsTrigger>
            <TabsTrigger value="api-key">{t(lang, "settingsApiKeyTab")}</TabsTrigger>
            <TabsTrigger value="health">{t(lang, "settingsHealthCheckTab")}</TabsTrigger>
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
              loading={loading}
              models={models}
              onRefreshHealth={refreshHealth}
              rvcApplio={rvcApplio}
              supertonic={supertonic}
              vieneu={vieneu}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
