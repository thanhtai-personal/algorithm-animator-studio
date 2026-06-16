import { useEffect, useMemo, useState } from "react";
import { Player } from "@remotion/player";
import { Cpu, Play, RefreshCw, Sparkles } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { readSystemLang, subscribeSystemLang, text, type Lang } from "@/lib/i18n";
import { AlgorithmExplainerComposition } from "../remotion/AlgorithmExplainerComposition";
import { checkRemotionHealth, renderRemotionVideo } from "../lib/remotionVideoApi";
import {
  DEFAULT_REMOTION_VIDEO,
  getRemotionDimensions,
  normalizeRemotionVideoInput,
  type RemotionHealthResponse,
  type RemotionVideoAspectRatio,
  type RemotionVideoInputProps,
  type RemotionVideoTemplate,
} from "../lib/remotionVideoTypes";

type Props = {
  onVideoCreated: () => Promise<void> | void;
  preset?: Partial<RemotionVideoInputProps>;
  fixedTemplate?: RemotionVideoTemplate;
  heading?: string;
  description?: string;
};

export function RemotionVideoGenerator({ onVideoCreated, preset, fixedTemplate, heading, description }: Props) {
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const presetKey = JSON.stringify(preset || {});
  const initialForm = useMemo(() => {
    const parsedPreset = JSON.parse(presetKey) as Partial<RemotionVideoInputProps>;
    return normalizeRemotionVideoInput({ ...DEFAULT_REMOTION_VIDEO, ...parsedPreset, template: fixedTemplate || parsedPreset.template || DEFAULT_REMOTION_VIDEO.template });
  }, [presetKey, fixedTemplate]);
  const [form, setForm] = useState<RemotionVideoInputProps>(() => initialForm);
  const [dataText, setDataText] = useState(() => initialForm.data.join(", "));
  const [health, setHealth] = useState<RemotionHealthResponse | null>(null);
  const [rendering, setRendering] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lastVideoUrl, setLastVideoUrl] = useState("");

  useEffect(() => subscribeSystemLang(setLang), []);
  useEffect(() => {
    setForm(initialForm);
    setDataText(initialForm.data.join(", "));
  }, [initialForm]);
  useEffect(() => {
    void refreshHealth();
  }, []);

  const normalized = useMemo(() => normalizeRemotionVideoInput({ ...form, data: parseData(dataText) }), [form, dataText]);
  const dimensions = getRemotionDimensions(normalized.aspectRatio);
  const durationInFrames = Math.round(normalized.durationSeconds * normalized.fps);

  async function refreshHealth() {
    setChecking(true);
    try {
      setHealth(await checkRemotionHealth());
    } catch (error) {
      setHealth(null);
      toast.error(error instanceof Error ? error.message : text(lang, "Could not check Remotion.", "Không kiểm tra được Remotion."));
    } finally {
      setChecking(false);
    }
  }

  async function handleRender() {
    setRendering(true);
    setLastVideoUrl("");
    const toastId = toast.loading(text(lang, "Rendering with Remotion...", "Đang render bằng Remotion..."));
    try {
      const result = await renderRemotionVideo(normalized);
      setLastVideoUrl(result.videoUrl);
      toast.success(text(lang, "Remotion video saved to library.", "Đã lưu video Remotion vào thư viện."), { id: toastId });
      await onVideoCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Remotion render failed.", "Render Remotion thất bại."), { id: toastId });
    } finally {
      setRendering(false);
    }
  }

  return (
    <Card className="border-sky-500/20 bg-sky-500/[0.03]">
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-sky-300" /> {heading || text(lang, "Remotion video generator", "Trình tạo video Remotion")}</CardTitle>
          <CardDescription>
            {description || text(lang, "Create template videos with React scenes, subtitles, and stable server-side MP4 rendering.", "Tạo video template bằng React scene, phụ đề, và render MP4 ổn định ở backend.")}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={health?.available ? "default" : "secondary"}>{health?.available ? "Remotion OK" : "Remotion chưa sẵn sàng"}</Badge>
          <Button type="button" variant="outline" size="sm" onClick={() => void refreshHealth()} disabled={checking}>
            {checking ? <SystemLoader className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />} Health
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="Title" value={form.title} onChange={(title) => setForm((current) => ({ ...current, title }))} />
            <TextField label="Subtitle" value={form.subtitle} onChange={(subtitle) => setForm((current) => ({ ...current, subtitle }))} />
            <TextField label="Algorithm / label" value={form.algorithmLabel} onChange={(algorithmLabel) => setForm((current) => ({ ...current, algorithmLabel }))} />
            <TextField label="Watermark" value={form.watermark} onChange={(watermark) => setForm((current) => ({ ...current, watermark }))} />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {fixedTemplate ? <div className="space-y-2"><Label>Template</Label><div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">{fixedTemplate}</div></div> : <SelectField label="Template" value={form.template} items={["algorithm-explainer", "news-card", "story-card"]} onChange={(template) => setForm((current) => ({ ...current, template: template as RemotionVideoTemplate }))} />}
            <SelectField label="Aspect" value={form.aspectRatio} items={["16:9", "9:16"]} onChange={(aspectRatio) => setForm((current) => ({ ...current, aspectRatio: aspectRatio as RemotionVideoAspectRatio }))} />
            <TextField label="Seconds" type="number" value={String(form.durationSeconds)} onChange={(value) => setForm((current) => ({ ...current, durationSeconds: Number(value) }))} />
            <SelectField label="FPS" value={String(form.fps)} items={["24", "30", "60"]} onChange={(fps) => setForm((current) => ({ ...current, fps: Number(fps) }))} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="Primary color" value={form.primaryColor} onChange={(primaryColor) => setForm((current) => ({ ...current, primaryColor }))} />
            <TextField label="Accent color" value={form.accentColor} onChange={(accentColor) => setForm((current) => ({ ...current, accentColor }))} />
          </div>

          <div className="space-y-2">
            <Label>Data bars</Label>
            <Input value={dataText} onChange={(event) => setDataText(event.target.value)} placeholder="18, 42, 27, 64" />
          </div>

          <div className="space-y-2">
            <Label>Narration / subtitle text</Label>
            <Textarea rows={4} value={form.narration} onChange={(event) => setForm((current) => ({ ...current, narration: event.target.value }))} />
          </div>

          {health && !health.available ? (
            <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100">
              {health.message || "Remotion package hoặc entry point chưa sẵn sàng."}
            </div>
          ) : null}

          <Button className="w-full md:w-auto" onClick={() => void handleRender()} disabled={rendering || Boolean(health && !health.available)}>
            {rendering ? <SystemLoader className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {text(lang, "Render MP4 with Remotion", "Render MP4 bằng Remotion")}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border bg-black">
            <Player
              component={AlgorithmExplainerComposition}
              durationInFrames={durationInFrames}
              fps={normalized.fps}
              compositionWidth={dimensions.width}
              compositionHeight={dimensions.height}
              inputProps={normalized}
              controls
              style={{ width: "100%", aspectRatio: normalized.aspectRatio === "9:16" ? "9 / 16" : "16 / 9" }}
            />
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground"><Cpu className="h-4 w-4" /> {dimensions.width}×{dimensions.height} · {durationInFrames} frames</div>
            <p className="mt-1">{text(lang, "This option renders on the local backend and saves the MP4 into the same generated-videos library.", "Option này render ở backend local và lưu MP4 vào cùng thư viện generated-videos.")}</p>
          </div>
          {lastVideoUrl ? <video controls className="aspect-video w-full rounded-xl border bg-black" src={lastVideoUrl} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function TextField(props: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{props.label}</Label>
      <Input type={props.type || "text"} value={props.value} onChange={(event) => props.onChange(event.target.value)} />
    </div>
  );
}

function SelectField(props: { label: string; value: string; items: string[]; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{props.label}</Label>
      <Select value={props.value} onValueChange={props.onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{props.items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function parseData(value: string) {
  return value.split(/[\s,;]+/).map((item) => Number(item)).filter((item) => Number.isFinite(item));
}
