import { useRef } from "react";
import { FileAudio2, FileMusic, Rocket, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { RhythmicStudioController } from "@/features/rhythmic-studio/hooks/useRhythmicStudioController";
import { MARBLES, type MarbleId } from "../marble/marbleCatalog";
import type { RacePhysics } from "../physics/RacePhysics";

export function MarbleTowerControls({ studio, playerId, onPlayerChange, driveMultiplier, onDriveChange, physics }: {
  studio: RhythmicStudioController; playerId: MarbleId; onPlayerChange: (id: MarbleId) => void; driveMultiplier: number; onDriveChange: (value: number) => void; physics: RacePhysics | null;
}) {
  const midiRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const sourceLocked = studio.playing || studio.recording;
  return <aside className="space-y-3">
    <section className="rounded-xl border bg-card/60 p-4">
      <div className="mb-3 flex items-center gap-2"><FileMusic className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Nhạc cho video</h2></div>
      <p className="mb-3 text-xs text-muted-foreground">Dùng audio/MIDI engine và recorder có sẵn của Kai Studio.</p>
      <div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" disabled={sourceLocked} onClick={() => midiRef.current?.click()}><Upload className="mr-2 h-4 w-4" />MIDI</Button><Button type="button" variant="outline" disabled={sourceLocked} onClick={() => audioRef.current?.click()}><FileAudio2 className="mr-2 h-4 w-4" />Audio</Button></div>
      <input ref={midiRef} type="file" className="hidden" accept=".mid,.midi,audio/midi,audio/x-midi" onChange={(event) => { const file = event.target.files?.[0]; if (file) void studio.importMidi(file); event.currentTarget.value = ""; }} />
      <input ref={audioRef} type="file" className="hidden" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg" onChange={(event) => { const file = event.target.files?.[0]; if (file) void studio.importAudio(file); event.currentTarget.value = ""; }} />
      <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs"><b className="block truncate">{studio.source.name}</b><span className="text-muted-foreground">{studio.source.type.toUpperCase()} · {studio.sourceEvents.length} events · {(studio.durationMs / 1000).toFixed(1)}s</span></div>
    </section>
    <section className="rounded-xl border bg-card/60 p-4">
      <div className="mb-3 flex items-center gap-2"><Rocket className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Động lực bi</h2></div>
      <div className="flex items-center justify-between text-xs"><Label>Forward drive</Label><b>{driveMultiplier.toFixed(2)}×</b></div>
      <Slider className="mt-3" min={0.75} max={3.2} step={0.05} value={[driveMultiplier]} disabled={studio.recording} onValueChange={([value]) => onDriveChange(value)} />
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Giữ gravity/va chạm của game; thêm launch impulse và lực tiến để bi không lăn ì.</p>
      <Button className="mt-3 w-full" type="button" variant="secondary" disabled={!physics || !physics.getPlayerBody()} onClick={() => physics?.boostPlayer()}>BOOST bi đang chọn</Button>
    </section>
    <section className="rounded-xl border bg-card/60 p-4"><h2 className="mb-3 text-sm font-semibold">Hệ bi V3 gốc</h2><div className="grid grid-cols-4 gap-2">{MARBLES.map((marble) => <button key={marble.id} type="button" disabled={studio.playing || studio.recording} className={`rounded-lg border p-2 text-center transition ${playerId === marble.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "bg-background/35 hover:bg-muted/50"}`} onClick={() => onPlayerChange(marble.id)}><span className="mx-auto block h-7 w-7 rounded-full border border-white/60 shadow" style={{ background: `radial-gradient(circle at 35% 25%, ${marble.accent}, ${marble.color} 58%, #111 140%)` }} /><span className="mt-1 block truncate text-[10px] font-medium">{marble.name}</span></button>)}</div></section>
    <section className="rounded-xl border bg-card/60 p-4"><h2 className="mb-3 text-sm font-semibold">Âm lượng</h2><VolumeRow label="Nhạc gốc" value={studio.settings.musicVolume} max={1.5} onChange={(value) => studio.patch("musicVolume", value)} /><VolumeRow label="MIDI / synth" value={studio.settings.synthVolume} max={1.5} onChange={(value) => studio.patch("synthVolume", value)} /><Label className="mt-3 block text-xs">Tên project</Label><Input className="mt-1.5" value={studio.projectName} disabled={studio.recording} onChange={(event) => studio.setProjectName(event.target.value)} /></section>
  </aside>;
}

function VolumeRow({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  return <div className="mb-3"><div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span>{Math.round(value * 100)}%</span></div><Slider min={0} max={max} step={0.01} value={[value]} onValueChange={([next]) => onChange(next)} /></div>;
}
