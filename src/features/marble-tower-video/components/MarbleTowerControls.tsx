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
  onMusicFiles,
  onSelectTrack,
}: {
  studio: RhythmicStudioController;
  driveMultiplier: number;
  onDriveChange: (value: number) => void;
  playlist: MarbleTowerPlaylistTrack[];
  currentTrackIndex: number;
  onMusicFiles: (files: File[]) => void;
  onSelectTrack: (index: number) => void;
}) {
  const musicRef = useRef<HTMLInputElement>(null);
  const sourceLocked = studio.playing || studio.recording;
  const midiLoaded = studio.source.type === "midi";

  return (
    <aside className="space-y-3">
      <section className="rounded-xl border bg-card/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileMusic className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Nhạc cho cuộc đua</h2>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Audio hỗ trợ playlist nhiều bài. MIDI được đọc như một bản nhạc synth và chỉ bắt đầu sau câu “Let&apos;s go!”.
        </p>
        <Button type="button" variant="outline" className="w-full" disabled={sourceLocked} onClick={() => musicRef.current?.click()}>
          <FileAudio2 className="mr-2 h-4 w-4" />Upload nhạc / MIDI
        </Button>
        <input
          ref={musicRef}
          type="file"
          multiple
          className="hidden"
          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.mid,.midi,audio/midi,audio/x-midi"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length) onMusicFiles(files);
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
        ) : midiLoaded ? (
          <div className="mt-3 rounded-lg border bg-background/35 px-3 py-2 text-xs">
            <b className="block truncate">{studio.source.name}</b>
            <span className="text-muted-foreground">MIDI · {studio.sourceEvents.length} note events · {(studio.durationMs / 1000).toFixed(1)}s</span>
          </div>
        ) : (
          <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Chưa có nhạc. Chọn nhiều file audio để tạo playlist hoặc chọn một file MIDI.
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
          Bi nặng hơn nhưng gia tốc trọng trường vẫn chuẩn g = 9,81 m/s². Sau cú xuất phát, tốc độ trên dốc tăng tự nhiên theo trọng lực, không còn bộ hãm tốc nhân tạo.
        </p>
      </section>

      <section className="rounded-xl border bg-card/60 p-4">
        <h2 className="mb-2 text-sm font-semibold">Camera</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">Camera luôn theo bi dẫn đầu và tự đổi mục tiêu khi thứ hạng thay đổi.</p>
      </section>

      <section className="rounded-xl border bg-card/60 p-4">
        <h2 className="mb-3 text-sm font-semibold">Âm lượng</h2>
        <VolumeRow label="Nhạc" value={studio.settings.musicVolume} max={1.5} onChange={(value) => studio.patch("musicVolume", value)} />
        <VolumeRow label="Hiệu ứng / MIDI synth" value={studio.settings.synthVolume} max={1.5} onChange={(value) => studio.patch("synthVolume", value)} />
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
