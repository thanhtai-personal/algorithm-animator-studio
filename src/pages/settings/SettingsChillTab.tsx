import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getChillEmbedSrc, readChillModeEnabled, saveChillModeEnabled, type ChillTrack } from "@/lib/chillMusicSettings";

type Props = {
  tracks: ChillTrack[];
  onChange: (tracks: ChillTrack[]) => void;
};

export function SettingsChillTab({ tracks, onChange }: Props) {
  const [previewTrackId, setPreviewTrackId] = useState("");
  const [chillModeEnabled, setChillModeEnabled] = useState(() => readChillModeEnabled());

  function toggleChillMode(enabled: boolean) {
    setChillModeEnabled(enabled);
    saveChillModeEnabled(enabled);
  }

  function updateTrack(id: string, patch: Partial<ChillTrack>) {
    onChange(tracks.map((track) => (track.id === id ? { ...track, ...patch } : track)));
  }

  function addTrack() {
    onChange([{ id: crypto.randomUUID(), title: "Chill track", embedCode: "" }, ...tracks]);
  }

  function removeTrack(id: string) {
    onChange(tracks.filter((track) => track.id !== id));
    if (previewTrackId === id) setPreviewTrackId("");
  }

  return (
    <section className="rounded-xl border border-border/70 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Chill</h2>
          <p className="text-sm text-muted-foreground">Thêm iframe/link YouTube, bấm Preview để xem thử ngay trong tab này.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-10 items-center gap-2 rounded-md border border-border/70 px-3 text-sm">
            <Switch aria-label="Enable chill mode" checked={chillModeEnabled} onCheckedChange={toggleChillMode} />
            <span>Enable chill mode</span>
            <span className="text-xs text-muted-foreground">{chillModeEnabled ? "On" : "Off"}</span>
          </div>
          <Button type="button" variant="outline" onClick={addTrack}>
            <Plus className="mr-2 h-4 w-4" /> Thêm nhạc
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {tracks.map((track) => (
          <ChillTrackEditor
            key={track.id}
            track={track}
            previewing={previewTrackId === track.id}
            onPreview={() => setPreviewTrackId((current) => (current === track.id ? "" : track.id))}
            onRemove={() => removeTrack(track.id)}
            onUpdate={(patch) => updateTrack(track.id, patch)}
          />
        ))}
        {!tracks.length ? <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Chưa có nhạc.</div> : null}
      </div>
    </section>
  );
}

type TrackEditorProps = {
  track: ChillTrack;
  previewing: boolean;
  onPreview: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<ChillTrack>) => void;
};

function ChillTrackEditor({ track, previewing, onPreview, onRemove, onUpdate }: TrackEditorProps) {
  const previewSrc = useMemo(() => getChillEmbedSrc(track.embedCode, { autoplay: false }), [track.embedCode]);

  return (
    <div className="grid gap-3 rounded-lg border border-border/70 p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Input value={track.title} onChange={(event) => onUpdate({ title: event.target.value })} placeholder="Tên bài" />
        <div className="flex gap-2 md:shrink-0">
          <Button type="button" variant="outline" onClick={onPreview} disabled={!previewSrc}>
            {previewing ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {previewing ? "Ẩn preview" : "Preview"}
          </Button>
          <Button type="button" variant="destructive" size="icon" onClick={onRemove} title="Xóa">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Textarea value={track.embedCode} onChange={(event) => onUpdate({ embedCode: event.target.value })} rows={4} placeholder="<iframe ...></iframe> hoặc link YouTube" />
      {!previewSrc && track.embedCode.trim() ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Link/iframe chưa hợp lệ, hãy dùng link YouTube hoặc mã embed YouTube.
        </div>
      ) : null}
      {previewing && previewSrc ? (
        <div className="overflow-hidden rounded-lg border border-cyan-400/30 bg-slate-950">
          <iframe
            className="aspect-video w-full"
            src={previewSrc}
            title={`Preview ${track.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      ) : null}
    </div>
  );
}
