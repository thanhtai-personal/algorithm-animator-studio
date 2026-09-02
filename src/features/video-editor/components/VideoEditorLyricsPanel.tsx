import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Captions, RotateCcw, Sparkles, Trash2, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SystemLoader } from "@/components/ui/system-loader";
import { transcribeVideoEditorLyrics } from "../lib/videoEditorApi";
import { shiftLyricCues } from "../lib/videoEditorLyrics";
import type { VideoEditorAsset, VideoEditorClip, VideoEditorLyricCue, VideoEditorLyrics } from "../lib/videoEditorTypes";

type Props = {
  lyrics: VideoEditorLyrics;
  assets: VideoEditorAsset[];
  clips: VideoEditorClip[];
  onChange: (lyrics: VideoEditorLyrics) => void;
};

export function VideoEditorLyricsPanel({ lyrics, assets, clips, onChange }: Props) {
  const [transcribing, setTranscribing] = useState(false);
  const [timingShift, setTimingShift] = useState("0");
  const sourceAssets = useMemo(() => assets.filter((asset) => asset.source !== "silent" && (asset.type === "audio" || asset.type === "video")), [assets]);
  const selectedAsset = sourceAssets.find((asset) => asset.id === lyrics.sourceAssetId) || sourceAssets[0];

  function patch(patchValue: Partial<VideoEditorLyrics>) {
    onChange({ ...lyrics, ...patchValue });
  }

  async function handleAutoLyrics() {
    if (!selectedAsset) {
      toast.error("Hãy thêm audio hoặc video có giọng hát trước.");
      return;
    }
    setTranscribing(true);
    const toastId = toast.loading("Whisper đang nhận lyric và căn timestamp từng từ...");
    try {
      const result = await transcribeVideoEditorLyrics(selectedAsset, { model: lyrics.model, language: lyrics.language });
      const offset = getSourceTimelineOffset(clips, selectedAsset.id, selectedAsset.type);
      const cues = offset > 0 ? result.cues.map((cue) => ({
        ...cue,
        start: cue.start + offset,
        end: cue.end + offset,
        words: cue.words.map((word) => ({ ...word, start: word.start + offset, end: word.end + offset })),
      })) : result.cues;
      patch({ sourceAssetId: selectedAsset.id, enabled: true, cues: cloneLyricCues(cues), generatedCues: cloneLyricCues(cues) });
      if (result.warning) toast.warning(result.warning);
      toast.success(`Đã tạo ${cues.length} dòng lyric.`, { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tự tạo được lyric.", { id: toastId });
    } finally {
      setTranscribing(false);
    }
  }

  function updateCue(id: string, patchValue: Partial<VideoEditorLyricCue>) {
    patch({ cues: lyrics.cues.map((cue) => cue.id === id ? { ...cue, ...patchValue } : cue) });
  }

  function handleResetGeneratedLyrics() {
    const generatedCues = lyrics.generatedCues || [];
    if (!generatedCues.length) {
      toast.error("Chưa có kết quả Auto Generate để reset.");
      return;
    }
    patch({ cues: cloneLyricCues(generatedCues), enabled: true });
    setTimingShift("0");
    toast.success("Đã reset lyric về kết quả Auto Generate gần nhất.");
  }

  function handleApplyTimingShift() {
    const offsetSeconds = parseDecimalInput(timingShift);
    if (offsetSeconds == null) {
      toast.error("Độ trễ phải là một số, ví dụ -1, 0.85 hoặc 1.2.");
      return;
    }
    if (!lyrics.cues.length) {
      toast.error("Chưa có lyric để dịch thời gian.");
      return;
    }
    patch({ cues: shiftLyricCues(lyrics.cues, offsetSeconds) });
    const sign = offsetSeconds > 0 ? "+" : "";
    toast.success(`Đã dịch toàn bộ lyric ${sign}${offsetSeconds}s.`);
  }

  return (
    <section className="space-y-3 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.04] p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-semibold"><Captions className="h-4 w-4 text-cyan-300" /> Auto Lyrics</div>
          <p className="mt-1 text-xs text-muted-foreground">Whisper tạo lyric theo câu + timestamp từng từ; preview và export dùng chung hiệu ứng.</p>
        </div>
        <label className="flex items-center gap-2 text-sm"><span>Hiện lyric</span><Switch checked={lyrics.enabled} onCheckedChange={(enabled) => patch({ enabled })} /></label>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_120px_120px_auto] lg:items-end">
        <Field label="Nguồn giọng hát">
          <Select value={selectedAsset?.id || "none"} onValueChange={(sourceAssetId) => patch({ sourceAssetId, generatedCues: [] })}>
            <SelectTrigger><SelectValue placeholder="Chọn audio/video" /></SelectTrigger>
            <SelectContent>
              {sourceAssets.length ? sourceAssets.map((asset) => <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>) : <SelectItem value="none" disabled>Chưa có audio/video</SelectItem>}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Ngôn ngữ">
          <Select value={lyrics.language} onValueChange={(language) => patch({ language })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="auto">Auto</SelectItem><SelectItem value="vi">Tiếng Việt</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="zh">中文</SelectItem><SelectItem value="ko">한국어</SelectItem><SelectItem value="ja">日本語</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label="Whisper model">
          <Select value={lyrics.model} onValueChange={(model) => patch({ model })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="tiny">tiny</SelectItem><SelectItem value="base">base</SelectItem><SelectItem value="small">small</SelectItem><SelectItem value="medium">medium</SelectItem></SelectContent>
          </Select>
        </Field>
        <Button onClick={() => void handleAutoLyrics()} disabled={transcribing || !selectedAsset}>
          {transcribing ? <SystemLoader className="mr-2 h-4 w-4" /> : <WandSparkles className="mr-2 h-4 w-4" />}Tự tạo lyric
        </Button>
      </div>

      <div className="grid gap-3 rounded-md border border-dashed border-cyan-500/25 bg-background/30 p-3 md:grid-cols-[minmax(220px,360px)_auto_minmax(0,1fr)] md:items-end">
        <Field label="Dịch thời gian lyric (giây)">
          <Input
            value={timingShift}
            inputMode="decimal"
            placeholder="VD: -1.0 hoặc 0.85"
            onChange={(event) => setTimingShift(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") handleApplyTimingShift(); }}
          />
        </Field>
        <Button type="button" variant="secondary" onClick={handleApplyTimingShift} disabled={!lyrics.cues.length}>Apply</Button>
        <p className="text-xs text-muted-foreground md:pb-2">Số dương = hiện trễ hơn, số âm = hiện sớm hơn. Apply cộng cùng giá trị vào start/end của mọi dòng và timestamp từng từ.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Animation">
          <Select value={lyrics.animation} onValueChange={(animation) => patch({ animation: animation as VideoEditorLyrics["animation"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="karaoke">Karaoke từng từ</SelectItem>
              <SelectItem value="pop">Pop / punch</SelectItem>
              <SelectItem value="slide-up">Slide up</SelectItem>
              <SelectItem value="fade">Fade</SelectItem>
              <SelectItem value="typewriter">Typewriter</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Vị trí">
          <Select value={lyrics.position} onValueChange={(position) => patch({ position: position as VideoEditorLyrics["position"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="top">Trên</SelectItem><SelectItem value="center">Giữa</SelectItem><SelectItem value="bottom">Dưới</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label={`Cỡ chữ ${lyrics.fontSize}px`}><Input type="range" min={24} max={120} value={lyrics.fontSize} onChange={(event) => patch({ fontSize: Number(event.target.value) })} /></Field>
        <div className="grid grid-cols-3 gap-2">
          <ColorField label="Chữ" value={lyrics.textColor} onChange={(textColor) => patch({ textColor })} />
          <ColorField label="Sáng" value={lyrics.highlightColor} onChange={(highlightColor) => patch({ highlightColor })} />
          <ColorField label="Viền" value={lyrics.outlineColor} onChange={(outlineColor) => patch({ outlineColor })} />
        </div>
      </div>

      {lyrics.cues.length ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{lyrics.cues.length} dòng lyric — có thể sửa text/timing</p>
            <div className="flex flex-wrap items-center gap-1">
              <Button type="button" size="sm" variant="outline" onClick={handleResetGeneratedLyrics} disabled={!lyrics.generatedCues?.length}><RotateCcw className="mr-1 h-3.5 w-3.5" />Reset Auto Gen</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => patch({ cues: [], enabled: false })}><Trash2 className="mr-1 h-3.5 w-3.5" />Xóa lyric</Button>
            </div>
          </div>
          <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
            {lyrics.cues.map((cue, index) => (
              <div key={cue.id} className="grid gap-2 rounded-md border bg-background/50 p-2 md:grid-cols-[46px_110px_110px_minmax(0,1fr)] md:items-center">
                <span className="text-center text-xs font-bold text-cyan-300">#{index + 1}</span>
                <CueTimeInput
                  ariaLabel={`Lyric ${index + 1} start`}
                  value={cue.start}
                  validate={(value) => value <= cue.end - 0.05}
                  onCommit={(start) => updateCue(cue.id, { start, words: [] })}
                />
                <CueTimeInput
                  ariaLabel={`Lyric ${index + 1} end`}
                  value={cue.end}
                  validate={(value) => value >= cue.start + 0.05}
                  onCommit={(end) => updateCue(cue.id, { end, words: [] })}
                />
                <Input aria-label={`Lyric ${index + 1} text`} value={cue.text} onChange={(event) => updateCue(cue.id, { text: event.target.value, words: [] })} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" />Chọn audio/video rồi bấm “Tự tạo lyric”. Với nhạc có vocal lớn, model small/medium thường chính xác hơn base.</span>
          {lyrics.generatedCues?.length ? <Button type="button" size="sm" variant="outline" onClick={handleResetGeneratedLyrics}><RotateCcw className="mr-1 h-3.5 w-3.5" />Khôi phục Auto Gen</Button> : null}
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="space-y-1 text-[11px] text-muted-foreground"><span>{label}</span><Input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-9 cursor-pointer p-1" /></label>;
}

function cloneLyricCues(cues: VideoEditorLyricCue[]) {
  return cues.map((cue) => ({ ...cue, words: cue.words.map((word) => ({ ...word })) }));
}

function getSourceTimelineOffset(clips: VideoEditorClip[], assetId: string, assetType: VideoEditorAsset["type"]) {
  const trackClips = clips.filter((clip) => assetType === "audio" ? clip.type === "audio" : clip.type !== "audio");
  let offset = 0;
  for (const clip of trackClips) {
    if (clip.assetId === assetId) return offset;
    offset += clip.durationSeconds;
  }
  return 0;
}

function parseDecimalInput(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function CueTimeInput({ ariaLabel, value, validate, onCommit }: { ariaLabel: string; value: number; validate: (value: number) => boolean; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(() => formatCueTime(value));
  const [invalid, setInvalid] = useState(false);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (Object.is(lastValueRef.current, value)) return;
    lastValueRef.current = value;
    setDraft(formatCueTime(value));
    setInvalid(false);
  }, [value]);

  function validateAndCommit() {
    const parsed = parseDecimalInput(draft);
    if (parsed == null || !validate(parsed)) {
      setInvalid(true);
      return false;
    }
    setInvalid(false);
    lastValueRef.current = parsed;
    onCommit(parsed);
    return true;
  }

  return (
    <Input
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      type="text"
      inputMode="decimal"
      value={draft}
      className={invalid ? "border-destructive focus-visible:ring-destructive" : undefined}
      onChange={(event) => { setDraft(event.target.value); setInvalid(false); }}
      onBlur={validateAndCommit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        } else if (event.key === "Escape") {
          setDraft(formatCueTime(value));
          setInvalid(false);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function formatCueTime(value: number) {
  return Number.isFinite(value) ? String(value) : "";
}
