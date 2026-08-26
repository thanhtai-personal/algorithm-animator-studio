import { FileMusic, Music2, Upload } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useSystemLang } from "@/hooks/use-system-lang";
import { BUILTIN_MELODIES } from "@/features/rhythmic-studio/defaults";
import { melodyLabel } from "@/features/rhythmic-studio/i18n";
import { ballStyleText } from "@/features/rhythmic-studio/ballStyleI18n";
import { MARBLE_AVATARS, marbleAvatarText } from "@/features/rhythmic-studio/lib/marbleAvatars";
import { BALL_STYLES, type BallStyle, type MarbleAvatar } from "@/features/rhythmic-studio/types";
import type { RhythmicStudioController } from "@/features/rhythmic-studio/hooks/useRhythmicStudioController";

type Props = { studio: RhythmicStudioController; drive: number; onDriveChange: (value: number) => void };

function UploadCard({ title, hint, accept, icon: Icon, onFile }: { title: string; hint: string; accept: string; icon: typeof Music2; onFile: (file: File) => Promise<void> }) {
  const id = useId();
  return <label htmlFor={id} className="group flex cursor-pointer items-center gap-3 rounded-xl border bg-background/55 px-3 py-3 transition hover:border-primary/50 hover:bg-primary/[0.04]">
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="block truncate text-[11px] text-muted-foreground">{hint}</span></span>
    <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
    <input id={id} className="sr-only" type="file" accept={accept} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void onFile(file); }} />
  </label>;
}

function Range({ label, value, min, max, step, unit = "", onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (value: number) => void }) {
  return <div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label className="text-xs text-muted-foreground">{label}</Label><span className="text-xs font-semibold tabular-nums">{value.toFixed(step < 0.1 ? 2 : 1)}{unit}</span></div><Slider value={[value]} min={min} max={max} step={step} onValueChange={([next]) => onChange(next)} /></div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-3"><Label className="text-sm">{label}</Label><Switch checked={checked} onCheckedChange={onChange} /></div>;
}

export function MarbleTowerControls({ studio, drive, onDriveChange }: Props) {
  const lang = useSystemLang();
  const vi = lang === "vi";
  const sourceAudioEnabled = studio.source.type === "midi" ? studio.settings.midiPlaybackEnabled : studio.settings.playOriginalSong;
  const sourceAudioAvailable = studio.source.type === "midi" ? studio.sourceEvents.length > 0 : studio.source.type === "audio" && Boolean(studio.audioUrl);
  return <aside className="space-y-4">
    <section className="space-y-4 rounded-2xl border bg-card/65 p-4 shadow-sm">
      <div><h2 className="font-semibold">{vi ? "Nhạc & nguồn" : "Music & source"}</h2><p className="mt-1 text-xs text-muted-foreground">{vi ? "Dùng lại MIDI, audio engine và đồng bộ của Rhythmic Studio." : "Reuses Rhythmic Studio MIDI, audio engine and sync."}</p></div>
      <div className="space-y-2"><Label className="text-xs text-muted-foreground">{vi ? "Nhạc mẫu" : "Built-in song"}</Label><Select value={studio.source.type === "builtin" ? studio.source.name : "imported"} onValueChange={(value) => value !== "imported" && studio.loadBuiltin(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="imported">{vi ? "Đã nhập" : "Imported"}</SelectItem>{Object.keys(BUILTIN_MELODIES).map((name) => <SelectItem key={name} value={name}>{melodyLabel(lang, name)}</SelectItem>)}</SelectContent></Select></div>
      <UploadCard title={vi ? "Nhập MIDI" : "Import MIDI"} hint={vi ? "Giữ nguyên hệ phát MIDI hiện có" : "Uses the existing MIDI playback engine"} accept=".mid,.midi,audio/midi" icon={FileMusic} onFile={studio.importMidi} />
      <UploadCard title={vi ? "Nhập file nhạc" : "Import audio"} hint={vi ? "Phân tích nhịp + phát audio gốc" : "Beat analysis + original audio playback"} accept="audio/*" icon={Music2} onFile={studio.importAudio} />
      <div className="rounded-lg border bg-muted/25 p-3"><p className="truncate text-sm font-medium">{studio.source.type === "builtin" ? melodyLabel(lang, studio.source.name) : studio.source.name}</p><p className="mt-1 text-xs text-muted-foreground">{studio.audioFileInfo}</p></div>
      <Toggle label={vi ? "Phát âm thanh nguồn" : "Source audio"} checked={sourceAudioEnabled} onChange={(enabled) => sourceAudioAvailable || studio.source.type === "midi" ? void studio.setSourceAudioEnabled(enabled) : undefined} />
      <Range label={vi ? "Tốc độ phát nhạc" : "Playback speed"} value={studio.settings.playbackSpeed} min={0.5} max={2} step={0.05} unit="×" onChange={(value) => studio.patch("playbackSpeed", value)} />
      <Range label={vi ? "Âm lượng nhạc" : "Music volume"} value={studio.settings.musicVolume} min={0} max={1.15} step={0.02} onChange={(value) => studio.patch("musicVolume", value)} />
    </section>

    <section className="space-y-4 rounded-2xl border bg-card/65 p-4 shadow-sm">
      <div><h2 className="font-semibold">{vi ? "Bi & động lực" : "Marbles & drive"}</h2><p className="mt-1 text-xs text-muted-foreground">{vi ? "Mặc định đã tăng lực chạy; tăng thêm nếu muốn video nhanh, mạnh hơn." : "Higher default drive for faster, punchier race motion."}</p></div>
      <Range label={vi ? "Động lực đường đua" : "Race drive"} value={drive} min={0.85} max={2.4} step={0.05} unit="×" onChange={onDriveChange} />
      <div className="space-y-2"><Label className="text-xs text-muted-foreground">{vi ? "Kiểu bi" : "Marble style"}</Label><Select value={studio.settings.ballStyle} onValueChange={(value) => studio.patch("ballStyle", value as BallStyle)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BALL_STYLES.map((style) => <SelectItem key={style} value={style}>{ballStyleText(lang, style)}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label className="text-xs text-muted-foreground">{vi ? "Sprite trên bi chính" : "Player sprite"}</Label><Select value={studio.settings.marbleAvatar} onValueChange={(value) => studio.patch("marbleAvatar", value as MarbleAvatar)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MARBLE_AVATARS.map((avatar) => <SelectItem key={avatar} value={avatar}>{marbleAvatarText(lang, avatar)}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid grid-cols-2 gap-3"><label className="space-y-2 text-xs text-muted-foreground">{vi ? "Màu chính" : "Main color"}<Input type="color" value={studio.settings.ballBaseColor} className="h-10 p-1" onChange={(event) => studio.patch("ballBaseColor", event.target.value)} /></label><label className="space-y-2 text-xs text-muted-foreground">{vi ? "Màu vân" : "Stripe color"}<Input type="color" value={studio.settings.ballStripeColor} className="h-10 p-1" onChange={(event) => studio.patch("ballStripeColor", event.target.value)} /></label></div>
      <Toggle label={vi ? "Glow / magic" : "Glow / magic"} checked={studio.settings.glowAnimation} onChange={(value) => studio.patch("glowAnimation", value)} />
      <Range label={vi ? "Độ dài đuôi sáng" : "Trail length"} value={studio.settings.trailLength} min={0} max={48} step={1} onChange={(value) => studio.patch("trailLength", value)} />
    </section>

    <section className="space-y-3 rounded-2xl border bg-card/65 p-4 shadow-sm">
      <div><h2 className="font-semibold">{vi ? "Thông tin video" : "Video identity"}</h2></div>
      <div className="space-y-2"><Label className="text-xs text-muted-foreground">{vi ? "Tên dự án" : "Project name"}</Label><Input value={studio.projectName} onChange={(event) => studio.setProjectName(event.target.value)} /></div>
      <div className="space-y-2"><Label className="text-xs text-muted-foreground">{vi ? "Tiêu đề trong video" : "On-video title"}</Label><Input value={studio.settings.titleText} maxLength={48} onChange={(event) => studio.patch("titleText", event.target.value)} /></div>
      <Button type="button" variant="outline" className="w-full" onClick={studio.randomize}>{vi ? "Đổi nhanh phong cách" : "Randomize look"}</Button>
    </section>
  </aside>;
}
