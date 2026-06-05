import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Lang } from "@/lib/i18n";
import { StatusTile } from "./SettingsFields";
import type { ElevenLabsConfigResponse, HealthResponse, PiperModel, SettingsForm, SupertonicConfigResponse } from "./SettingsTypes";
import { txt } from "./settingsText";

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
  const vi = props.lang === "vi";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Check</CardTitle>
        <CardDescription>{txt(vi, "Kiểm tra backend local, piper.exe, voice services và danh sách model hiện có.", "Check the local backend, piper.exe, voice services, and available models.")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <StatusTile lang={props.lang} label="Backend" ok={Boolean(props.health?.ok)} value={props.health ? txt(vi, "Đã kết nối", "Connected") : txt(vi, "Chưa kiểm tra", "Not checked")} />
          <StatusTile lang={props.lang} label="Piper exe" ok={Boolean(props.health?.piperExists)} value={props.health?.piperExe || "-"} />
          <StatusTile lang={props.lang} label="Models" ok={props.availableModels > 0} value={txt(vi, `${props.availableModels}/${props.models.length} model sẵn sàng`, `${props.availableModels}/${props.models.length} models ready`)} />
          <StatusTile lang={props.lang} label="ElevenLabs" ok={Boolean(props.elevenLabs?.hasApiKey)} value={props.elevenLabs?.hasApiKey ? txt(vi, `${props.elevenLabs.voices.length} voice đã cấu hình`, `${props.elevenLabs.voices.length} voices configured`) : txt(vi, "Chưa có API key", "No API key")} />
          <StatusTile lang={props.lang} label="Supertonic" ok={Boolean(props.supertonic?.serverOk)} value={props.supertonic?.serverOk ? `${props.supertonic.voices.length} voice · ${props.supertonic.model}` : props.supertonic?.error || txt(vi, "Chưa chạy server", "Server is not running")} />
          <StatusTile lang={props.lang} label={txt(vi, "Generated data", "Generated data")} ok={Boolean(props.health?.generatedDir)} value={props.health?.generatedDir || "-"} />
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <p className="font-medium">{txt(vi, "Model dir đang dùng", "Active model directory")}</p>
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
                <Badge variant={model.available ? "default" : "secondary"}>{model.available ? txt(vi, "Sẵn sàng", "Ready") : txt(vi, "Thiếu", "Missing")}</Badge>
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
