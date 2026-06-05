import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { t, type Lang } from "@/lib/i18n";
import { StatusTile } from "./SettingsFields";
import type { ElevenLabsConfigResponse, HealthResponse, PiperModel, SettingsForm, SupertonicConfigResponse } from "./SettingsTypes";

type SettingsHealthTabProps = {
  availableModels: number;
  elevenLabs: ElevenLabsConfigResponse | null;
  form: SettingsForm;
  health: HealthResponse | null;
  lang: Lang;
  models: PiperModel[];
  supertonic: SupertonicConfigResponse | null;
};

export function SettingsHealthTab(props: SettingsHealthTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(props.lang, "settingsHealthCheckTab")}</CardTitle>
        <CardDescription>{t(props.lang, "settingsHealthDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <StatusTile lang={props.lang} label="Backend" ok={Boolean(props.health?.ok)} value={props.health ? t(props.lang, "settingsConnected") : t(props.lang, "settingsNotChecked")} />
          <StatusTile lang={props.lang} label="Piper exe" ok={Boolean(props.health?.piperExists)} value={props.health?.piperExe || "-"} />
          <StatusTile lang={props.lang} label="Models" ok={props.availableModels > 0} value={`${props.availableModels}/${props.models.length} ${t(props.lang, "settingsModelsReady")}`} />
          <StatusTile lang={props.lang} label="ElevenLabs" ok={Boolean(props.elevenLabs?.hasApiKey)} value={props.elevenLabs?.hasApiKey ? `${props.elevenLabs.voices.length} ${t(props.lang, "settingsVoicesConfigured")}` : t(props.lang, "settingsNoApiKey")} />
          <StatusTile lang={props.lang} label="Supertonic" ok={Boolean(props.supertonic?.serverOk)} value={props.supertonic?.serverOk ? `${props.supertonic.voices.length} ${t(props.lang, "settingsVoiceTab")} · ${props.supertonic.model}` : props.supertonic?.error || t(props.lang, "settingsServerNotRunning")} />
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
