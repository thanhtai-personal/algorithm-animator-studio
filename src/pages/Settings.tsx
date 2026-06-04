import { useEffect, useMemo, useState } from "react";
import { FolderOpen, Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
type VoiceRow = { id: string; label: string };

type SettingsForm = Required<Pick<RuntimeSettings, "MODEL_DIR" | "PIPER_EXE" | "MUSIC_LIBRARY_DIR" | "ELEVENLABS_API_KEY" | "ELEVENLABS_VOICES" | "SUPERTONIC_BASE_URL" | "SUPERTONIC_MODEL" | "SUPERTONIC_DEFAULT_VOICE" | "SUPERTONIC_TOTAL_STEPS">>;

const EMPTY_FORM: SettingsForm = { MODEL_DIR: "", PIPER_EXE: "", MUSIC_LIBRARY_DIR: "", ELEVENLABS_API_KEY: "", ELEVENLABS_VOICES: "", SUPERTONIC_BASE_URL: "", SUPERTONIC_MODEL: "", SUPERTONIC_DEFAULT_VOICE: "", SUPERTONIC_TOTAL_STEPS: "" };

export default function Settings() {
  const [form, setForm] = useState<SettingsForm>(() => ({ ...EMPTY_FORM, ...getRuntimeSettings() }));
  const [voiceRows, setVoiceRows] = useState<VoiceRow[]>(() => parseVoiceRows(getRuntimeSettings().ELEVENLABS_VOICES));
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [elevenLabs, setElevenLabs] = useState<ElevenLabsConfigResponse | null>(null);
  const [supertonic, setSupertonic] = useState<SupertonicConfigResponse | null>(null);
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
      toast.error(error instanceof Error ? error.message : "Không kiểm tra được Piper.");
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
    toast.success("Đã lưu settings runtime.");
    await refreshHealth();
  }

  async function handleReset() {
    clearRuntimeSettings();
    setForm(EMPTY_FORM);
    setVoiceRows([]);
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
            <SecretInput
              id="elevenlabs-api-key"
              label="ELEVENLABS_API_KEY"
              description="API key dùng cho ElevenLabs PRO. Giá trị lưu local trong trình duyệt và gửi tới backend qua runtime header."
              value={form.ELEVENLABS_API_KEY}
              placeholder="sk_..."
              onChange={(value) => updateField("ELEVENLABS_API_KEY", value)}
            />
            <VoiceRowsTable rows={voiceRows} onAdd={addVoiceRow} onUpdate={updateVoiceRow} onRemove={removeVoiceRow} />

            <SecretInput
              id="supertonic-base-url"
              label="SUPERTONIC_BASE_URL"
              description="URL của Supertonic local server, mặc định http://127.0.0.1:6688."
              value={form.SUPERTONIC_BASE_URL}
              placeholder="http://127.0.0.1:6688"
              type="text"
              onChange={(value) => updateField("SUPERTONIC_BASE_URL", value)}
            />
            <SecretInput
              id="supertonic-model"
              label="SUPERTONIC_MODEL"
              description="Model Supertonic cần dùng, ví dụ supertonic-3."
              value={form.SUPERTONIC_MODEL}
              placeholder="supertonic-3"
              type="text"
              onChange={(value) => updateField("SUPERTONIC_MODEL", value)}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <SecretInput
                id="supertonic-default-voice"
                label="SUPERTONIC_DEFAULT_VOICE"
                description="Voice mặc định, ví dụ M1/F1 hoặc custom voice đã import."
                value={form.SUPERTONIC_DEFAULT_VOICE}
                placeholder="M1"
                type="text"
                onChange={(value) => updateField("SUPERTONIC_DEFAULT_VOICE", value)}
              />
              <SecretInput
                id="supertonic-total-steps"
                label="SUPERTONIC_TOTAL_STEPS"
                description="Chất lượng 5-12, mặc định 8."
                value={form.SUPERTONIC_TOTAL_STEPS}
                placeholder="8"
                type="text"
                onChange={(value) => updateField("SUPERTONIC_TOTAL_STEPS", value)}
              />
            </div>

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
              <StatusTile label="ElevenLabs" ok={Boolean(elevenLabs?.hasApiKey)} value={elevenLabs?.hasApiKey ? `${elevenLabs.voices.length} voice đã cấu hình` : "Chưa có API key"} />
              <StatusTile label="Supertonic" ok={Boolean(supertonic?.serverOk)} value={supertonic?.serverOk ? `${supertonic.voices.length} voice · ${supertonic.model}` : supertonic?.error || "Chưa chạy server"} />
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

function SecretInput(props: { id: string; label: string; description: string; value: string; placeholder: string; type?: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <p className="text-sm text-muted-foreground">{props.description}</p>
      <Input
        id={props.id}
        type={props.type ?? "password"}
        autoComplete="off"
        value={props.value}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

function VoiceRowsTable(props: {
  rows: VoiceRow[];
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<VoiceRow>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Label>ELEVENLABS_VOICES</Label>
          <p className="mt-1 text-sm text-muted-foreground">Khai báo các voice sẽ xuất hiện trong dropdown ElevenLabs.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={props.onAdd}>
          <Plus className="mr-2 h-4 w-4" /> Thêm voice
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voice ID</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-20 text-right">Xóa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.rows.length ? props.rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input value={row.id} placeholder="VOICE_ID" onChange={(event) => props.onUpdate(index, { id: event.target.value })} />
                </TableCell>
                <TableCell>
                  <Input value={row.label} placeholder="Giọng đọc chính" onChange={(event) => props.onUpdate(index, { label: event.target.value })} />
                </TableCell>
                <TableCell className="text-right">
                  <Button type="button" variant="ghost" size="icon" onClick={() => props.onRemove(index)} aria-label="Xóa voice">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">Chưa có voice. Bấm Thêm voice để nhập Voice ID.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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

function parseVoiceRows(value?: string): VoiceRow[] {
  if (!value?.trim()) return [];
  try {
    const rows = JSON.parse(value) as Array<Partial<VoiceRow>>;
    return Array.isArray(rows)
      ? rows.map((row) => ({ id: String(row.id || ""), label: String(row.label || "") })).filter((row) => row.id || row.label)
      : [];
  } catch {
    return [];
  }
}

function serializeVoiceRows(rows: VoiceRow[]) {
  const voices = rows
    .map((row) => ({ id: row.id.trim(), label: row.label.trim() || row.id.trim() }))
    .filter((row) => row.id);
  return voices.length ? JSON.stringify(voices) : "";
}
