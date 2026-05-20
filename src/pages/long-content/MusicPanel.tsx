import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { isProceduralMusicPreset, type BackgroundMusicId } from "@/lib/backgroundMusic";
import type { LongContentStudio } from "./useLongContentStudio";

export function MusicPanel({ studio: s, compact = false }: { studio: LongContentStudio; compact?: boolean }) {
  const selected = s.music.selectedIds;
  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.34),0_0_28px_rgba(234,179,8,0.06)]">
      <div className={`flex flex-col gap-3 ${compact ? "" : "lg:flex-row lg:items-end lg:justify-between"}`}>
        <div>
          <h2 className="font-semibold">Nhạc nền</h2>
          <p className="text-xs text-muted-foreground">Chọn một track để loop, hoặc chọn nhiều track để phát theo thứ tự.</p>
        </div>
        <div className={`grid gap-2 ${compact ? "" : "sm:grid-cols-[minmax(220px,360px)_220px]"}`}>
          <Input value={s.music.search} onChange={(event) => s.music.setSearch(event.target.value)} placeholder="Tìm nhạc theo tên..." />
          <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            <Upload className="h-3.5 w-3.5" /> Upload .mp3/.wav
            <input type="file" accept="audio/*" className="hidden" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) s.onMusicUpload(file);
            }} />
          </label>
        </div>
      </div>

      <div className={`grid gap-3 ${compact ? "" : "lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start"}`}>
        <div className="max-h-[340px] overflow-y-auto pr-1" onScroll={(event) => {
          const el = event.currentTarget;
          if (s.music.canLoadMore && el.scrollTop + el.clientHeight >= el.scrollHeight - 48) s.music.loadMore();
        }}>
          <div className={`grid gap-2 ${compact ? "" : "sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"}`}>
            {s.music.visibleTracks.map((track) => (
              <MusicCard key={track.id} id={track.id} title={track.title} subtitle={track.subtitle}
                order={selected.indexOf(track.id) + 1} onClick={() => s.music.toggleTrack(track.id)} hasLicense={Boolean(track.licenseText)} />
            ))}
          </div>
          {s.music.canLoadMore ? <button type="button" className="mt-3 w-full rounded-md border border-border py-2 text-xs text-muted-foreground hover:bg-accent" onClick={s.music.loadMore}>Tải thêm nhạc</button> : null}
        </div>

        <div className="space-y-3 rounded-lg border border-border/70 bg-background/40 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.24)]">
          <Label>Âm lượng nhạc <span className="float-right font-mono text-xs text-emerald-300">{s.musicVol}%</span></Label>
          <Slider value={[s.musicVol]} min={0} max={100} onValueChange={([value]) => s.setMusicVol(value)} />
          {selected.length > 1 ? <p className="text-xs text-muted-foreground">Playlist: {s.music.selectedTracks.map((track, index) => `${index + 1}. ${track.title}`).join(" · ")}</p> : null}
          {s.music.selectedLicenseText ? <p className="text-xs text-yellow-200">License sẽ tự thêm vào mô tả YouTube.</p> : null}
        </div>
      </div>
    </Card>
  );
}

function MusicCard(props: { id: BackgroundMusicId; title: string; subtitle: string; order: number; hasLicense: boolean; onClick: () => void }) {
  const active = props.order > 0;
  const exclusivePreset = isProceduralMusicPreset(props.id) && props.id !== "off";
  const cardClass = active
    ? exclusivePreset
      ? "border-yellow-400/60 bg-slate-800/70 text-slate-100 shadow-[0_0_16px_rgba(148,163,184,0.12)]"
      : "border-yellow-400/70 bg-yellow-400/10 text-yellow-50 shadow-[0_0_18px_rgba(250,204,21,0.12)]"
    : exclusivePreset
      ? "border-slate-700/80 bg-slate-900/55 text-slate-300 hover:border-slate-500 hover:bg-slate-800/70"
      : "border-border bg-card/60 hover:border-emerald-400/50 hover:bg-emerald-400/10";
  const subtitle = exclusivePreset ? `${props.subtitle} · không ghép track khác` : props.subtitle;

  return (
    <button type="button" onClick={props.onClick} className={`min-h-24 rounded-lg border p-3 text-left transition ${cardClass}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-sm font-semibold">{props.title}</span>
        {active ? <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-slate-950">{props.order}</span> : null}
      </div>
      <p className={`mt-2 line-clamp-2 text-xs ${exclusivePreset ? "text-slate-400" : "text-muted-foreground"}`}>
        {subtitle}{props.hasLicense ? " · License" : ""}
      </p>
    </button>
  );
}
