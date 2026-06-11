import { useEffect, useMemo, useState } from "react";
import { Loader2, Music2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMusicLibraryTracks, type MusicLibraryTrack } from "@/lib/musicLibrary";

type Props = {
  onPick: (track: MusicLibraryTrack) => Promise<void> | void;
};

export function VideoEditorMusicPicker({ onPick }: Props) {
  const [tracks, setTracks] = useState<MusicLibraryTrack[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMusicLibraryTracks()
      .then((items) => {
        setTracks(items);
        setSelectedId((current) => current || items[0]?.id || "");
      })
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedTrack = useMemo(() => tracks.find((track) => track.id === selectedId), [selectedId, tracks]);

  async function handlePick() {
    if (!selectedTrack) return;
    setAdding(true);
    try {
      await onPick(selectedTrack);
      toast.success("Đã thêm nhạc nền vào Track 2.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thêm được nhạc nền.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <section className="grid gap-3 rounded-lg border bg-background/40 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div className="space-y-2">
        <Label className="flex items-center gap-2"><Music2 className="h-4 w-4 text-cyan-300" /> Nhạc nền hệ thống</Label>
        <Select value={selectedId} onValueChange={setSelectedId} disabled={loading || !tracks.length}>
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Đang tải thư viện nhạc..." : "Chọn nhạc nền"} />
          </SelectTrigger>
          <SelectContent>
            {tracks.map((track) => (
              <SelectItem key={track.id} value={track.id}>{track.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onClick={() => void handlePick()} disabled={!selectedTrack || adding}>
        {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        Thêm vào Track 2
      </Button>
    </section>
  );
}
