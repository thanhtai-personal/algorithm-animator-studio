import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type ChillTrack } from "@/lib/chillMusicSettings";

type Props = {
  tracks: ChillTrack[];
  onChange: (tracks: ChillTrack[]) => void;
};

export function SettingsChillTab({ tracks, onChange }: Props) {
  function updateTrack(id: string, patch: Partial<ChillTrack>) {
    onChange(tracks.map((track) => (track.id === id ? { ...track, ...patch } : track)));
  }

  function addTrack() {
    onChange([...tracks, { id: crypto.randomUUID(), title: "Chill track", embedCode: "" }]);
  }

  function removeTrack(id: string) {
    onChange(tracks.filter((track) => track.id !== id));
  }

  return (
    <section className="rounded-xl border border-border/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Chill</h2>
        <Button type="button" variant="outline" onClick={addTrack}>
          <Plus className="mr-2 h-4 w-4" /> Thêm nhạc
        </Button>
      </div>
      <div className="space-y-3">
        {tracks.map((track) => (
          <div key={track.id} className="grid gap-3 rounded-lg border border-border/70 p-3">
            <div className="flex items-center gap-2">
              <Input value={track.title} onChange={(event) => updateTrack(track.id, { title: event.target.value })} placeholder="Tên bài" />
              <Button type="button" variant="destructive" size="icon" onClick={() => removeTrack(track.id)} title="Xóa">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea value={track.embedCode} onChange={(event) => updateTrack(track.id, { embedCode: event.target.value })} rows={4} placeholder="<iframe ...></iframe>" />
          </div>
        ))}
        {!tracks.length ? <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Chưa có nhạc.</div> : null}
      </div>
    </section>
  );
}
