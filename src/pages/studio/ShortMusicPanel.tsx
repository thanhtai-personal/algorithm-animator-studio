import { Upload } from "lucide-react";
import { audioEngine } from "@/lib/audio";
import { ASSET_MUSIC_OPTIONS, BackgroundMusicId, getAssetMusicOption, isAssetMusicId, isLibraryMusicId, isProceduralMusicPreset } from "@/lib/backgroundMusic";
import { MUSIC_PRESETS } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { AlgorithmStudio } from "./useAlgorithmStudio";

type Track = { id: BackgroundMusicId; title: string; subtitle: string; hasLicense?: boolean };

export function ShortMusicPanel({ studio: s, standalone = false }: { studio: AlgorithmStudio; standalone?: boolean }) {
  const tracks: Track[] = [
    ...MUSIC_PRESETS.filter((item) => item.id !== "custom").map((item) => ({
      id: item.id as BackgroundMusicId,
      title: item.label[s.lang],
      subtitle: item.id === "off" ? (s.lang === "vi" ? "Không dùng nhạc nền" : "No background music") : (s.lang === "vi" ? "Preset tạo sẵn" : "Procedural preset"),
    })),
    ...ASSET_MUSIC_OPTIONS.map((track) => ({ id: track.id, title: track.label[s.lang], subtitle: s.lang === "vi" ? "Track có sẵn" : "Bundled track" })),
    ...s.libraryMusicTracks.map((track) => ({ id: track.id, title: track.title, subtitle: track.licenseText ? "MUSIC_LIBRARY_DIR · License" : "MUSIC_LIBRARY_DIR", hasLicense: Boolean(track.licenseText) })),
  ];
  const filtered = tracks.filter((track) => `${track.title} ${track.subtitle}`.toLowerCase().includes(s.musicSearch.trim().toLowerCase()));
  return (
    <div className={standalone ? "space-y-4" : "space-y-4 border-t border-border/40 pt-3"}>
      <div className="flex flex-col gap-2">
        <Label className="text-sm">🎵 {s.tr("bgMusicPreset")}</Label>
        <Input value={s.musicSearch} onChange={(event) => s.setMusicSearch(event.target.value)} placeholder={s.lang === "vi" ? "Tìm nhạc theo tên..." : "Search music..."} />
        <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <Upload className="h-3.5 w-3.5" /> {s.tr("uploadMusic")}
          <input type="file" accept="audio/*" className="hidden" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) { s.onMusicUpload(file); s.setMusicPreset("custom"); }
          }} />
        </label>
      </div>
      <div className="max-h-[320px] overflow-y-auto pr-1">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {filtered.map((track) => <MusicCard key={track.id} track={track} active={s.musicPreset === track.id} onClick={() => s.setMusicPreset(track.id)} />)}
        </div>
      </div>
      <div className="space-y-3 rounded-lg border border-border/70 bg-background/40 p-3">
        <Label>Vol <span className="float-right font-mono text-xs text-emerald-300">{s.musicVol}%</span></Label>
        <Slider value={[s.musicVol]} min={0} max={100} onValueChange={([value]) => s.setMusicVol(value)} />
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => testMusic(s)}>{s.tr("test")} 4s</Button>
        </div>
        <p className="text-xs text-muted-foreground">{s.tr("audioInVideo")}</p>
      </div>
    </div>
  );
}

function MusicCard(props: { track: Track; active: boolean; onClick: () => void }) {
  const exclusive = isProceduralMusicPreset(props.track.id) && props.track.id !== "off";
  const cls = props.active
    ? exclusive ? "border-yellow-400/60 bg-slate-800/70 text-slate-100" : "border-yellow-400/70 bg-yellow-400/10 text-yellow-50"
    : exclusive ? "border-slate-700/80 bg-slate-900/55 text-slate-300 hover:border-slate-500" : "border-border bg-card/60 hover:border-emerald-400/50 hover:bg-emerald-400/10";
  return (
    <button type="button" onClick={props.onClick} className={`min-h-20 rounded-lg border p-3 text-left transition ${cls}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-sm font-semibold">{props.track.title}</span>
        {props.active ? <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-slate-950">1</span> : null}
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{props.track.subtitle}{props.track.hasLicense ? " · License" : ""}</p>
    </button>
  );
}

function testMusic(s: AlgorithmStudio) {
  audioEngine.resume();
  if (isProceduralMusicPreset(s.musicPreset)) {
    audioEngine.setMusicPreset(s.musicPreset);
    setTimeout(() => { audioEngine.stopMusic(); audioEngine.setMusicPreset("off"); }, 4000);
    return;
  }
  const start = (url?: string) => {
    if (url) audioEngine.setMusicSource(url);
    audioEngine.setMusicPreset("custom");
    audioEngine.startMusic();
    setTimeout(() => { audioEngine.stopMusic(); audioEngine.setMusicPreset("off"); }, 4000);
  };
  if (isAssetMusicId(s.musicPreset)) return void getAssetMusicOption(s.musicPreset)?.loadUrl().then(start);
  if (isLibraryMusicId(s.musicPreset)) return start(s.libraryMusicTracks.find((track) => track.id === s.musicPreset)?.audioUrl);
  start();
}
