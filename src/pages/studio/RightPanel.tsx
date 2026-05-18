import { Upload } from "lucide-react";
import { MUSIC_PRESETS, PLATFORMS, SFX_OPTIONS } from "@/lib/i18n";
import { audioEngine, SfxKind } from "@/lib/audio";
import { ASSET_MUSIC_OPTIONS, BackgroundMusicId, getAssetMusicOption, isAssetMusicId, isLibraryMusicId, isProceduralMusicPreset } from "@/lib/backgroundMusic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { THEMES } from "@/lib/renderer";
import { AssetSfxOption, getAssetSfxOption, SELECT_ASSET_SFX_OPTIONS, SWAP_ASSET_SFX_OPTIONS } from "@/lib/selectSounds";
import { EXPORT_FORMATS, ExportFormat } from "./exportFormats";
import { AlgorithmStudio } from "./useAlgorithmStudio";

type Props = { studio: AlgorithmStudio };

export function RightPanel({ studio: s }: Props) {
  return (
    <Card className="p-4 h-fit">
      <Tabs defaultValue="ui">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="ui">{s.tr("ui")}</TabsTrigger>
          <TabsTrigger value="motion">{s.tr("motion")}</TabsTrigger>
          <TabsTrigger value="audio">{s.tr("audio")}</TabsTrigger>
        </TabsList>
        <AppearanceTab studio={s} />
        <ExportTab studio={s} />
        <AudioTab studio={s} />
      </Tabs>
    </Card>
  );
}

function AppearanceTab({ studio: s }: Props) {
  return (
    <TabsContent value="ui" className="space-y-3 pt-4">
      <div>
        <Label>{s.tr("title")}</Label>
        <Input className="mt-2" value={s.title} onChange={(e) => s.setTitle(e.target.value)} />
      </div>
      <div>
        <Label>{s.tr("subtitle")}</Label>
        <Input className="mt-2" value={s.subtitle} onChange={(e) => s.setSubtitle(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        {(["bg", "bar", "highlight", "swap", "sorted", "pivot"] as const).map((k) => (
          <div key={k}>
            <Label className="capitalize text-xs">{k}</Label>
            <input
              type="color"
              value={s.theme[k]}
              onChange={(e) => s.setTheme({ ...s.theme, [k]: e.target.value })}
              className="mt-1 w-full h-9 rounded border border-border bg-transparent"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        {Object.keys(THEMES).map((name) => (
          <Button key={name} size="sm" variant={s.themeName === name ? "default" : "outline"} onClick={() => s.setThemeName(name as keyof typeof THEMES)}>
            {name[0].toUpperCase() + name.slice(1)}
          </Button>
        ))}
      </div>
      <div className="space-y-3 border-t border-border/40 pt-3">
        <div>
          <Label>{s.lang === "vi" ? "Kiểu cột" : "Column style"}</Label>
          <Select value={s.columnVisualMode} onValueChange={(v) => s.setColumnVisualMode(v as typeof s.columnVisualMode)}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">{s.lang === "vi" ? "Cột thường" : "Bar columns"}</SelectItem>
              <SelectItem value="animal">{s.lang === "vi" ? "Animal columns" : "Animal columns"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {s.columnVisualMode === "animal" ? (
          <>
            <div>
              <div className="mb-2 flex justify-between">
                <Label>{s.lang === "vi" ? "Kích thước sprite" : "Sprite scale"}</Label>
                <span className="font-mono text-xs text-emerald-400">{s.animalSpriteScale.toFixed(1)}x</span>
              </div>
              <Slider value={[s.animalSpriteScale]} min={0.6} max={1.6} step={0.1} onValueChange={([v]) => s.setAnimalSpriteScale(v)} />
            </div>
            <div>
              <div className="mb-2 flex justify-between">
                <Label>{s.lang === "vi" ? "Độ nhảy" : "Jump intensity"}</Label>
                <span className="font-mono text-xs text-emerald-400">{s.animalJumpIntensity.toFixed(1)}x</span>
              </div>
              <Slider value={[s.animalJumpIntensity]} min={0.4} max={1.8} step={0.1} onValueChange={([v]) => s.setAnimalJumpIntensity(v)} />
            </div>
            <label className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              {s.lang === "vi" ? "Highlight cũng nhảy" : "Highlighted animals jump"}
              <input
                type="checkbox"
                checked={s.animalHighlightJump}
                onChange={(e) => s.setAnimalHighlightJump(e.target.checked)}
                className="h-4 w-4 accent-emerald-400"
              />
            </label>
          </>
        ) : null}
      </div>
    </TabsContent>
  );
}

function ExportTab({ studio: s }: Props) {
  return (
    <TabsContent value="motion" className="space-y-3 pt-4">
      <div>
        <Label>{s.tr("platform")}</Label>
        <Select value={s.platformId} onValueChange={(v) => s.setPlatformId(v as typeof s.platformId)}>
          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{s.tr("format")}</Label>
        <Select value={s.exportFormat} onValueChange={(v) => s.setExportFormat(v as ExportFormat)}>
          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EXPORT_FORMATS.map((format) => (
              <SelectItem key={format.id} value={format.id}>{format.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <div className="flex justify-between mb-2">
          <Label>{s.tr("fps")}</Label>
          <span className="font-mono text-emerald-400">{s.fps}</span>
        </div>
        <Slider value={[s.fps]} min={15} max={60} step={1} onValueChange={([v]) => s.setFps(v)} />
      </div>
      <p className="text-xs text-muted-foreground">{s.tr("exportNote")}</p>
    </TabsContent>
  );
}

function AudioTab({ studio: s }: Props) {
  return (
    <TabsContent value="audio" className="pt-4 space-y-4">
      <SfxSelect
        label={s.tr("sfxCompare")}
        value={s.sfxCompare}
        onChange={(v) => s.setSfxCompare(v as SfxKind)}
        lang={s.lang}
        assetLabel={s.lang === "vi" ? "Âm select/compare" : "Select/compare sounds"}
        assetOptions={SELECT_ASSET_SFX_OPTIONS}
        onTest={() => testSfx(s.sfxCompare)}
      />
      <SfxSelect
        label={s.tr("sfxSwap")}
        value={s.sfxSwap}
        onChange={(v) => s.setSfxSwap(v as SfxKind)}
        lang={s.lang}
        assetLabel={s.lang === "vi" ? "Âm swap" : "Swap sounds"}
        assetOptions={SWAP_ASSET_SFX_OPTIONS}
        onTest={() => testSfx(s.sfxSwap)}
      />
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs w-10">SFX</span>
        <Slider value={[s.sfxVol]} min={0} max={100} onValueChange={([v]) => s.setSfxVol(v)} />
        <span className="text-xs font-mono w-10 text-right">{s.sfxVol}%</span>
      </div>
      <MusicControls studio={s} />
    </TabsContent>
  );
}

function SfxSelect(props: {
  label: string;
  value: SfxKind;
  lang: "en" | "vi";
  assetLabel: string;
  assetOptions: AssetSfxOption[];
  onChange: (value: string) => void;
  onTest: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">🔊 {props.label}</Label>
      <Select value={props.value} onValueChange={props.onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{props.lang === "vi" ? "Âm tạo sẵn" : "Procedural sounds"}</SelectLabel>
            {SFX_OPTIONS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label[props.lang]}</SelectItem>)}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>{props.assetLabel}</SelectLabel>
            {props.assetOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.label[props.lang]}</SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground flex items-center gap-1"><Upload className="w-3 h-3" /> Upload</span>
        <Button size="sm" variant="outline" onClick={props.onTest}>Test</Button>
      </div>
    </div>
  );
}

function testSfx(kind: SfxKind) {
  audioEngine.resume();
  const option = getAssetSfxOption(kind);
  if (!option) {
    audioEngine.playSfx(kind);
    return;
  }
  void option.loadUrl()
    .then((url) => audioEngine.loadAssetSfx(option.id, url))
    .then(() => audioEngine.playSfx(option.id))
    .catch(() => {});
}

function MusicControls({ studio: s }: Props) {
  return (
    <div className="space-y-2 pt-2 border-t border-border/40">
      <Label className="text-sm">🎵 {s.tr("bgMusicPreset")}</Label>
      <Select value={s.musicPreset} onValueChange={(v) => s.setMusicPreset(v as BackgroundMusicId)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{s.lang === "vi" ? "Preset tạo sẵn" : "Procedural presets"}</SelectLabel>
            {MUSIC_PRESETS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label[s.lang]}</SelectItem>)}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>{s.lang === "vi" ? "Nhạc nền có sẵn" : "Bundled tracks"}</SelectLabel>
            {ASSET_MUSIC_OPTIONS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label[s.lang]}</SelectItem>)}
          </SelectGroup>
          {s.libraryMusicTracks.length ? (
            <>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>MUSIC_LIBRARY_DIR</SelectLabel>
                {s.libraryMusicTracks.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          ) : null}
        </SelectContent>
      </Select>
      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
        <Upload className="w-3 h-3" /> {s.tr("uploadMusic")}
        <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { s.onMusicUpload(f); s.setMusicPreset("custom"); } }} />
      </label>
      <div className="flex items-center gap-2">
        <span className="text-xs w-10">Vol</span>
        <Slider value={[s.musicVol]} min={0} max={100} onValueChange={([v]) => s.setMusicVol(v)} />
        <span className="text-xs font-mono w-10 text-right">{s.musicVol}%</span>
      </div>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => testMusic(s)}>{s.tr("test")} 4s</Button>
      </div>
      <p className="text-xs text-muted-foreground">{s.tr("audioInVideo")}</p>
    </div>
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

  if (isAssetMusicId(s.musicPreset)) {
    void getAssetMusicOption(s.musicPreset)?.loadUrl().then(start);
    return;
  }
  if (isLibraryMusicId(s.musicPreset)) {
    start(s.libraryMusicTracks.find((track) => track.id === s.musicPreset)?.audioUrl);
    return;
  }
  start();
}
