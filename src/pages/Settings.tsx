import { useEffect, useMemo, useState } from "react";
import { FolderOpen, RefreshCw, Save, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

type SettingsForm = Required<Pick<RuntimeSettings, "MODEL_DIR" | "PIPER_EXE" | "MUSIC_LIBRARY_DIR">>;

const EMPTY_FORM: SettingsForm = { MODEL_DIR: "", PIPER_EXE: "", MUSIC_LIBRARY_DIR: "" };

export default function Settings() {
  const [form, setForm] = useState<SettingsForm>(() => ({ ...EMPTY_FORM, ...getRuntimeSettings() }));
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [models, setModels] = useState<PiperModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);

  const availableModels = useMemo(() => models.filter((model) => model.available).length, [models]);

  useEffect(() => {
    void refreshHealth();
  }, []);

  async function refreshHealth() {
    setLoading(true);
    try {
      const headers = buildRuntimeSettingsHeaders();
      const [healthData, modelData] = await Promise.all([
        parseApiResponse<HealthResponse>(await fetch(buildApiUrl("/api/health"), { headers })),
        parseApiResponse<{ models: PiperModel[] }>(await fetch(buildApiUrl("/api/models"), { headers })),
      ]);
      setHealth(healthData);
      setModels(modelData.models);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không kiểm tra được Piper.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(key: keyof SettingsForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    saveRuntimeSettings(form);
    toast.success("Đã lưu đường dẫn Piper runtime.");
    await refreshHealth();
  }

  async function handleReset() {
    clearRuntimeSettings();
    setForm(EMPTY_FORM);
    toast.success("Đã xoá cấu hình runtime local. App sẽ dùng .env/default.");
    await refreshHealth();
  }

  async function selectPath(kind: "directory" | "file", target: keyof SettingsForm, title: string) {
    setSelecting(target);
    try {
      const data = await parseApiResponse<SelectPathResponse>(await fetch(buildApiUrl("/api/system/select-directory"), {
        method: "POST",
        headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ kind, title, initialPath: form[target] }),
      }));
      updateField(target, data.path);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không chọn được đường dẫn.");
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
      toast.error(error instanceof Error ? error.message : "Không mở được Explorer.");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Piper Runtime Settings</CardTitle>
            <CardDescription>
              Cấu hình đường dẫn model và piper.exe cho backend local. Các giá trị này ghi đè .env thông qua request header, nên có thể kiểm tra lại mà không cần restart server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <PathInput
              id="model-dir"
              label="MODEL_DIR"
              description="Thư mục chứa các file model .onnx và .onnx.json."
              value={form.MODEL_DIR}
              placeholder="models"
              busy={selecting === "MODEL_DIR"}
              onChange={(value) => updateField("MODEL_DIR", value)}
              onSelect={() => selectPath("directory", "MODEL_DIR", "Chọn thư mục chứa Piper models")}
              onOpen={() => openPath(form.MODEL_DIR)}
            />
            <PathInput
              id="piper-exe"
              label="PIPER_EXE"
              description="Đường dẫn tới piper.exe, ví dụ models/.venv/Scripts/piper.exe."
              value={form.PIPER_EXE}
              placeholder="models/.venv/Scripts/piper.exe"
              busy={selecting === "PIPER_EXE"}
              onChange={(value) => updateField("PIPER_EXE", value)}
              onSelect={() => selectPath("file", "PIPER_EXE", "Chọn piper.exe")}
              onOpen={() => openPath(form.PIPER_EXE)}
            />
            <PathInput
              id="music-library-dir"
              label="MUSIC_LIBRARY_DIR"
              description="Thư mục chứa thư viện nhạc nền. Mỗi track nằm trong một folder riêng, kèm License.txt nếu cần ghi credit YouTube."
              value={form.MUSIC_LIBRARY_DIR}
              placeholder="C:/Users/.../Music/youtube-audios"
              busy={selecting === "MUSIC_LIBRARY_DIR"}
              onChange={(value) => updateField("MUSIC_LIBRARY_DIR", value)}
              onSelect={() => selectPath("directory", "MUSIC_LIBRARY_DIR", "Chọn thư mục thư viện nhạc nền")}
              onOpen={() => openPath(form.MUSIC_LIBRARY_DIR)}
            />

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Lưu settings</Button>
              <Button variant="outline" onClick={refreshHealth} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" /> Kiểm tra lại
              </Button>
              <Button variant="ghost" onClick={handleReset}><Trash2 className="mr-2 h-4 w-4" /> Xoá override</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health check</CardTitle>
            <CardDescription>Kiểm tra backend local, piper.exe và danh sách model hiện có.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <StatusTile label="Backend" ok={Boolean(health?.ok)} value={health ? "Đã kết nối" : "Chưa kiểm tra"} />
              <StatusTile label="Piper exe" ok={Boolean(health?.piperExists)} value={health?.piperExe || "-"} />
              <StatusTile label="Models" ok={availableModels > 0} value={`${availableModels}/${models.length} model sẵn sàng`} />
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Model dir đang dùng</p>
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
                    <Badge variant={model.available ? "default" : "secondary"}>{model.available ? "Ready" : "Missing"}</Badge>
                  </div>
                  <p className="break-all text-xs text-muted-foreground">ONNX: {model.modelPath}</p>
                  <p className="break-all text-xs text-muted-foreground">JSON: {model.jsonPath}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

type PathInputProps = {
  id: string;
  label: string;
  description: string;
  value: string;
  placeholder: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSelect: () => void;
  onOpen: () => void;
};

function PathInput({ id, label, description, value, placeholder, busy, onChange, onSelect, onOpen }: PathInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex flex-col gap-2 md:flex-row">
        <Input id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
        <Button type="button" variant="outline" onClick={onSelect} disabled={busy}>
          <Search className="mr-2 h-4 w-4" /> Chọn
        </Button>
        <Button type="button" variant="ghost" onClick={onOpen} disabled={!value.trim()}>
          <FolderOpen className="mr-2 h-4 w-4" /> Mở
        </Button>
      </div>
    </div>
  );
}

function StatusTile({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-medium">{label}</p>
        <Badge variant={ok ? "default" : "secondary"}>{ok ? "OK" : "Check"}</Badge>
      </div>
      <p className="break-all text-sm text-muted-foreground">{value}</p>
    </div>
  );
}
