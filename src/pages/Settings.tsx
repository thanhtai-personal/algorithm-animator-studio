import { useEffect, useMemo, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseVoiceRows, serializeVoiceRows, type VoiceRow } from "./settings/SettingsFields";
import { SettingsApiKeyTab } from "./settings/SettingsApiKeyTab";
import { SettingsChillTab } from "./settings/SettingsChillTab";
import { SettingsDataTab } from "./settings/SettingsDataTab";
import { SettingsHealthTab } from "./settings/SettingsHealthTab";
import { SettingsModulesTab } from "./settings/SettingsModulesTab";
import { EMPTY_FORM, type ElevenLabsConfigResponse, type HealthResponse, type PiperModel, type RvcApplioConfigResponse, type RvcApplioTemplateFileResponse, type SelectPathResponse, type SettingsForm, type SettingsFormKey, type SupertonicConfigResponse, type VieneuConfigResponse, type YoutubeToolsHealthResponse } from "./settings/SettingsTypes";
import { SettingsVoiceTab } from "./settings/SettingsVoiceTab";
import { readSystemLang, subscribeSystemLang, t, text, type Lang } from "@/lib/i18n";
import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import {
  buildRuntimeSettingsHeaders,
  clearRuntimeSettings,
  getRuntimeSettings,
  saveRuntimeSettings,
} from "@/lib/runtimeSettings";
import {
  clearMenuFeatureSettings,
  DEFAULT_MENU_FEATURE_SETTINGS,
  getMenuFeatureSettings,
  saveMenuFeatureSettings,
  type MenuFeatureSettings,
} from "@/lib/menuFeatureSettings";
import { readChillTracks, saveChillTracks, type ChillTrack } from "@/lib/chillMusicSettings";

export default function Settings() {
  const [form, setForm] = useState<SettingsForm>(() => ({ ...EMPTY_FORM, ...getRuntimeSettings() }));
  const [menuFeatures, setMenuFeatures] = useState<MenuFeatureSettings>(() => getMenuFeatureSettings());
  const [chillTracks, setChillTracks] = useState<ChillTrack[]>(() => readChillTracks());
  const [applioTemplates, setApplioTemplates] = useState<RvcApplioTemplateFileResponse>({
    filePath: "",
    convertTemplatesJson: "[]",
    ttsTemplatesJson: "[]",
  });
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const [voiceRows, setVoiceRows] = useState<VoiceRow[]>(() => parseVoiceRows(getRuntimeSettings().ELEVENLABS_VOICES));
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [elevenLabs, setElevenLabs] = useState<ElevenLabsConfigResponse | null>(null);
  const [supertonic, setSupertonic] = useState<SupertonicConfigResponse | null>(null);
  const [rvcApplio, setRvcApplio] = useState<RvcApplioConfigResponse | null>(null);
  const [vieneu, setVieneu] = useState<VieneuConfigResponse | null>(null);
  const [youtubeTools, setYoutubeTools] = useState<YoutubeToolsHealthResponse | null>(null);
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
      const [healthData, modelData, elevenData, supertonicData, rvcApplioData, vieneuData, applioTemplateData, youtubeToolsData] = await Promise.all([
        parseApiResponse<HealthResponse>(await fetch(buildApiUrl("/api/health"), { headers })),
        parseApiResponse<{ models: PiperModel[] }>(await fetch(buildApiUrl("/api/models"), { headers })),
        parseApiResponse<ElevenLabsConfigResponse>(await fetch(buildApiUrl("/api/elevenlabs/config"), { headers })),
        parseApiResponse<SupertonicConfigResponse>(await fetch(buildApiUrl("/api/supertonic/config"), { headers })),
        parseApiResponse<RvcApplioConfigResponse>(await fetch(buildApiUrl("/api/rvc-applio/config"), { headers })),
        parseApiResponse<VieneuConfigResponse>(await fetch(buildApiUrl("/api/vieneu/config"), { headers })),
        parseApiResponse<RvcApplioTemplateFileResponse>(await fetch(buildApiUrl("/api/rvc-applio/templates"), { headers })),
        parseApiResponse<YoutubeToolsHealthResponse>(await fetch(buildApiUrl("/api/youtube-tools/health"), { headers })),
      ]);
      setHealth(healthData);
      setModels(modelData.models);
      setElevenLabs(elevenData);
      setSupertonic(supertonicData);
      setRvcApplio(rvcApplioData);
      setVieneu(vieneuData);
      setApplioTemplates(applioTemplateData);
      setYoutubeTools(youtubeToolsData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "settingsCouldNotCheckPiper"));
    } finally {
      setLoading(false);
    }
  }

  function updateField(key: SettingsFormKey, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateApplioTemplate(key: keyof Pick<RvcApplioTemplateFileResponse, "convertTemplatesJson" | "ttsTemplatesJson">, value: string) {
    setApplioTemplates((current) => ({ ...current, [key]: value }));
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
    saveMenuFeatureSettings(menuFeatures);
    saveChillTracks(chillTracks);
    const savedTemplates = await parseApiResponse<RvcApplioTemplateFileResponse>(await fetch(buildApiUrl("/api/rvc-applio/templates"), {
      method: "PUT",
      headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        convertTemplatesJson: applioTemplates.convertTemplatesJson,
        ttsTemplatesJson: applioTemplates.ttsTemplatesJson,
      }),
    }));
    setApplioTemplates(savedTemplates);
    toast.success(t(lang, "settingsRuntimeSaved"));
    await refreshHealth();
  }

  async function handleReset() {
    clearRuntimeSettings();
    clearMenuFeatureSettings();
    setForm(EMPTY_FORM);
    setMenuFeatures({ ...DEFAULT_MENU_FEATURE_SETTINGS });
    setChillTracks([]);
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
    <div className="kai-settings-page min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t(lang, "settingsTitle")}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> {t(lang, "settingsSave")}</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost"><Trash2 className="mr-2 h-4 w-4" /> {t(lang, "settingsClearOverrides")}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t(lang, "settingsResetConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t(lang, "settingsResetConfirmDescription")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t(lang, "settingsCancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => void handleReset()}
                  >
                    {t(lang, "settingsResetConfirmAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Tabs defaultValue={getDefaultSettingsTab()} className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted/40 p-1 md:grid-cols-6">
            <TabsTrigger value="voice">{t(lang, "settingsVoiceTab")}</TabsTrigger>
            <TabsTrigger value="data">{t(lang, "settingsDataTab")}</TabsTrigger>
            <TabsTrigger value="tools">{text(lang, "Modules", "Module")}</TabsTrigger>
            <TabsTrigger value="chill">Chill</TabsTrigger>
            <TabsTrigger value="api-key">{t(lang, "settingsApiKeyTab")}</TabsTrigger>
            <TabsTrigger value="health">{t(lang, "settingsHealthCheckTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="mt-0">
            <SettingsVoiceTab
              applioTemplates={applioTemplates}
              form={form}
              lang={lang}
              selecting={selecting}
              voiceRows={voiceRows}
              onAddVoiceRow={addVoiceRow}
              onOpenPath={openPath}
              onRemoveVoiceRow={removeVoiceRow}
              onSelectPath={selectPath}
              onUpdateField={updateField}
              onUpdateApplioTemplate={updateApplioTemplate}
              onUpdateVoiceRow={updateVoiceRow}
            />
          </TabsContent>

          <TabsContent value="data" className="mt-0">
            <SettingsDataTab form={form} lang={lang} selecting={selecting} onOpenPath={openPath} onSelectPath={selectPath} onUpdateField={updateField} />
          </TabsContent>

          <TabsContent value="tools" className="mt-0">
            <SettingsModulesTab lang={lang} settings={menuFeatures} onChange={setMenuFeatures} />
          </TabsContent>

          <TabsContent value="chill" className="mt-0">
            <SettingsChillTab tracks={chillTracks} onChange={setChillTracks} />
          </TabsContent>

          <TabsContent value="api-key" className="mt-0">
            <SettingsApiKeyTab form={form} lang={lang} onUpdateField={updateField} />
          </TabsContent>

          <TabsContent value="health" className="mt-0">
            <SettingsHealthTab
              availableModels={availableModels}
              elevenLabs={elevenLabs}
              health={health}
              lang={lang}
              loading={loading}
              models={models}
              onRefreshHealth={refreshHealth}
              rvcApplio={rvcApplio}
              supertonic={supertonic}
              vieneu={vieneu}
              youtubeTools={youtubeTools}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}


function getDefaultSettingsTab() {
  if (typeof window === "undefined") return "voice";
  const tab = new URLSearchParams(window.location.search).get("tab") || "voice";
  if (tab === "modules" || tab === "providers") return "tools";
  return ["voice", "data", "tools", "chill", "api-key", "health"].includes(tab) ? tab : "voice";
}
