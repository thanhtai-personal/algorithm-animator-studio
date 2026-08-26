import { useRef } from "react";
import { FileAudio2, FileMusic, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { RhythmicStudioController } from "@/features/rhythmic-studio/hooks/useRhythmicStudioController";
import type { MarbleTowerPlaylistTrack } from "../hooks/useMarbleTowerPlaylist";

export function MarbleTowerControls({
  studio,
  driveMultiplier,
  onDriveChange,
  playlist,
  currentTrackIndex,
  onAudioFiles,
  onSelectTrack,
}: {
  studio: RhythmicStudioController;
  driveMultiplier: number;
  onDriveChange: (value: number) => void;
  playlist: MarbleTowerPlaylistTrack[];
  currentTrackIndex: number;
  onAudioFiles: (files: File[]) => void;
  onSelectTrack: (index: number) => void;
}) {
  const audioRef = useRef<HTMLInputElement>(null);
  const sourceLocked = studio.playing || studio.recording;

  return (
    <aside className="space-y-3">
      <section className="rounded-xl border bg-card/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileMusic className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Nhạc cho video</h2>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Màn hình này chỉ dùng nhạc audio. Có thể chọn nhiều bài để phát tuần tự rồi lặp lại từ đầu cho tới khi cuộc đua dừng.
        </p>
        <Button type="button" variant="outline" className="w-full" disabled={sourceLocked} onClick={() => audioRef.current?.click()}>
          <FileAudio2 className="mr-2 h-4 w-4" />Upload nhạc / playlist
        </Button>
        <input
          ref={audioRef}
          type="file"
          multiple
          className="hidden"
          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length) onAudioFiles(files);
            event.currentTarget.value = "";
          }}
        />

        {playlist.length ? (
          <div className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-lg border bg-background/35 p-2">
            {playlist.map((track, index) => {
              const active = index === currentTrackIndex;
              return (
                <button
                  key={track.id}
                  type="button"
                  disabled={sourceLocked}
                  onClick={() => onSelectTrack(index)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${active ? "bg-primary/15 font-semibold text-primary" : "hover:bg-muted/60"}`}
                >
                  <span className="w-5 shrink-0 text-right text-[10px] text-muted-foreground">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{track.name}</span>
                  {active ? <span className="text-[10px] uppercase">current</span> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Chưa có playlist. Hãy upload một hoặc nhiều file nhạc để phát trong cuộc đua.
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Động lực ban đầu</h2>
        </div>
        <div className="flex items-center justify-between text-xs">
          <Label>Launch impulse</Label>
          <b>{driveMultiplier.toFixed(2)}×</b>
        </div>
        <Slider className="mt-3" min={4} max={10} step={0.25} value={[driveMultiplier]} disabled={studio.recording} onValueChange={([value]) => onDriveChange(value)} />
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Kéo từ 4× tới 10×. Tất cả bi nhận cùng một cú đẩy theo tiếp tuyến của tháp khi cổng mở, sau đó tiếp tục bằng gravity và va chạm.
        </p>
      </section>

      <section className="rounded-xl border bg-card/60 p-4">
        <h2 className="mb-2 text-sm font-semibold">Camera</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">Không còn bi được chọn. Camera tự động chuyển mục tiêu và luôn bám theo bi đang dẫn đầu.</p>
      </section>

      <section className="rounded-xl border bg-card/60 p-4">
        <h2 className="mb-3 text-sm font-semibold">Âm lượng</h2>
        <VolumeRow label="Nhạc gốc" value={studio.settings.musicVolume} max={1.5} onChange={(value) => studio.patch("musicVolume", value)} />
        <VolumeRow label="Hiệu ứng / synth" value={studio.settings.synthVolume} max={1.5} onChange={(value) => studio.patch("synthVolume", value)} />
        <Label className="mt-3 block text-xs">Tên project</Label>
        <Input className="mt-1.5" value={studio.projectName} disabled={studio.recording} onChange={(event) => studio.setProjectName(event.target.value)} />
      </section>
    </aside>
  );
}

function VolumeRow({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span>{Math.round(value * 100)}%</span></div>
      <Slider min={0} max={max} step={0.01} value={[value]} onValueChange={([next]) => onChange(next)} />
    </div>
  );
}
