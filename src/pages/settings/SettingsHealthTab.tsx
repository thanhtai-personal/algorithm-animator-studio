import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {uiText, t, type Lang} from "@/lib/i18n";
import { StatusTile } from "./SettingsFields";
import type { ElevenLabsConfigResponse, HealthResponse, PiperModel, RvcApplioConfigResponse, SettingsForm, SupertonicConfigResponse } from "./SettingsTypes";

type SettingsHealthTabProps = {
  availableModels: number;
  elevenLabs: ElevenLabsConfigResponse | null;
  form: SettingsForm;
  health: HealthResponse | null;
  lang: Lang;
  loading: boolean;
  models: PiperModel[];
  onRefreshHealth: () => void;
  rvcApplio: RvcApplioConfigResponse | null;
  supertonic: SupertonicConfigResponse | null;
};

export function SettingsHealthTab(props: SettingsHealthTabProps) {
  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <CardTitle>{t(props.lang, "settingsHealthCheckTab")}</CardTitle>
          <CardDescription>{t(props.lang, "settingsHealthDescription")}</CardDescription>
        </div>
        <Button variant="outline" onClick={props.onRefreshHealth} disabled={props.loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> {t(props.lang, "settingsCheckAgain")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <StatusTile lang={props.lang} label={uiText("Backend")} ok={Boolean(props.health?.ok)} value={props.health ? t(props.lang, "settingsConnected") : t(props.lang, "settingsNotChecked")} />
          <StatusTile lang={props.lang} label={uiText("Piper exe")} ok={Boolean(props.health?.piperExists)} value={props.health?.piperExe || "-"} />
          <StatusTile lang={props.lang} label={uiText("Models")} ok={props.availableModels > 0} value={`${props.availableModels}/${props.models.length} ${t(props.lang, "settingsModelsReady")}`} />
          <StatusTile lang={props.lang} label={uiText("ElevenLabs")} ok={Boolean(props.elevenLabs?.hasApiKey)} value={props.elevenLabs?.hasApiKey ? `${props.elevenLabs.voices.length} ${t(props.lang, "settingsVoicesConfigured")}` : t(props.lang, "settingsNoApiKey")} />
          <StatusTile lang={props.lang} label={uiText("Supertonic")} ok={Boolean(props.supertonic?.serverOk)} value={props.supertonic?.serverOk ? `${props.supertonic.voices.length} ${t(props.lang, "settingsVoiceTab")} · ${props.supertonic.model}` : props.supertonic?.error || t(props.lang, "settingsServerNotRunning")} />
          <StatusTile lang={props.lang} label={uiText("Applio server")} ok={Boolean(props.rvcApplio?.serverOk)} value={props.rvcApplio?.serverOk ? props.rvcApplio.baseUrl : props.rvcApplio?.error || t(props.lang, "settingsServerNotRunning")} />
          <StatusTile lang={props.lang} label={uiText("Applio Python")} ok={Boolean(props.rvcApplio?.pythonExists && props.rvcApplio?.bridgeExists)} value={`${props.rvcApplio?.pythonExe || "-"} · bridge ${props.rvcApplio?.bridgeExists ? "OK" : t(props.lang, "settingsMissing")}`} />
          <StatusTile lang={props.lang} label={uiText("Applio API template")} ok={Boolean(props.rvcApplio?.argTemplateConfigured)} value={props.rvcApplio?.argTemplateConfigured ? props.rvcApplio.apiName : "RVC_APPLIO_ARG_TEMPLATE_JSON"} />
          <StatusTile lang={props.lang} label={uiText("Applio dev startup")} ok={Boolean(props.rvcApplio?.startCommandConfigured)} value={props.rvcApplio?.startCommandConfigured ? props.rvcApplio.startCommand : "RVC_APPLIO_START_COMMAND"} />
          <StatusTile lang={props.lang} label={t(props.lang, "settingsGeneratedData")} ok={Boolean(props.health?.generatedDir)} value={props.health?.generatedDir || "-"} />
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <p className="font-medium">{t(props.lang, "settingsActiveModelDir")}</p>
          <p className="break-all text-muted-foreground">{props.health?.modelDir || props.form.MODEL_DIR || "models"}</p>
        </div>
        <Separator />
        <div className="grid gap-3 md:grid-cols-2">
          {props.models.map((model) => (
            <div key={model.key} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{model.label}</p>
                  <p className="text-xs text-muted-foreground">{model.lang.toUpperCase()} · {model.key}</p>
                </div>
                <Badge variant={model.available ? "default" : "secondary"}>{model.available ? t(props.lang, "settingsReady") : t(props.lang, "settingsMissing")}</Badge>
              </div>
              <p className="break-all text-xs text-muted-foreground">ONNX: {model.modelPath}</p>
              <p className="break-all text-xs text-muted-foreground">JSON: {model.jsonPath}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
