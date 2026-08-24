import { FileMusic, Music2, Upload } from "lucide-react";
import { useId } from "react";
import { Accordion } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemLang } from "@/hooks/use-system-lang";
import { BUILTIN_MELODIES } from "../defaults";
import { melodyLabel, rhythmicText, type RhythmicTextKey } from "../i18n";
import { layoutText } from "../layoutI18n";
import { BALL_STYLES, PLATFORM_STYLES, SYNTH_PRESETS, type AudioSourceMeta, type CourseItemOverride, type CourseItemStyle, type StudioSettings } from "../types";
import type { LyricFormat } from "../lib/lyrics";
import { RhythmicCourseEditor } from "./RhythmicCourseEditor";
import { RhythmicMediaAccordionItems } from "./RhythmicMediaControls";

type Patch = <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => void;

type Props = {
  settings: StudioSettings; source: AudioSourceMeta; sourceInfo: string; usableHits: number; patch: Patch;
  loadBuiltin: (name: string) => void; importMidi: (file: File) => Promise<void>; importAudio: (file: File) => Promise<void>;
  backgroundName: string | null; importBackground: (file: File) => Promise<void>; clearBackground: () => void;
  lyricRaw: string; setLyricRaw: (value: string) => void; lyricCount: number; lyricFormat: LyricFormat | null;
  importLyrics: (file: File) => Promise<void>; applyLyrics: () => void; clearLyrics: () => void;
  selectedNodeIndex: number | null; courseOverrides: CourseItemOverride[]; onSelectNode: (index: number | null) => void;
  onApplyCourseItem: (style: CourseItemStyle, span: number) => void; onClearSelectedCourseItem: () => void; onClearCourseLayout: () => void;
};

function UploadCard({ title, hint, accept, kind, onFile }: { title: string; hint: string; accept: string; kind: "midi" | "audio"; onFile: (file: File) => Promise<void> }) {
  const id = useId(); const Icon = kind === "midi" ? FileMusic : Music2;
  return <label htmlFor={id} className="group flex cursor-pointer items-center gap-3 rounded-xl border bg-background/65 px-3 py-3 transition hover:border-primary/50 hover:bg-primary/[0.04]">
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="block truncate text-[11px] text-muted-foreground">{hint}</span></span>
    <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary" /><input id={id} className="sr-only" type="file" accept={accept} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void onFile(file); }} />
  </label>;
}

function Range({ label, value, min, max, step, unit = "", onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (value: number) => void }) {
  const shown = Number.isInteger(step) ? value : value.toFixed(step < 0.1 ? 2 : 1);
  return <div className="space-y-2"><div className="flex justify-between gap-3"><Label className="text-xs text-muted-foreground">{label}</Label><span className="text-xs font-semibold tabular-nums">{shown}{unit}</span></div><Slider value={[value]} min={min} max={max} step={step} onValueChange={([next]) => onChange(next)} /></div>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <div className="flex items-center justify-between gap-3"><Label className="text-sm">{label}</Label><Switch checked={checked} onCheckedChange={onChange} /></div>; }
function Choice({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) { return <div className="space-y-2"><Label className="text-xs text-muted-foreground">{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>; }
function Color({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <div className="flex items-center justify-between gap-3"><Label className="text-sm">{label}</Label><input className="h-9 w-14 cursor-pointer rounded-md border bg-transparent p-1" type="color" value={value} onChange={(e) => onChange(e.target.value)} /></div>; }

export function RhythmicControlSections(props: Props) {
  const lang = useSystemLang();
  const t = (key: RhythmicTextKey, values?: Record<string, string | number>) => rhythmicText(lang, key, values);
  const lt = (key: Parameters<typeof layoutText>[1]) => layoutText(lang, key);
  const platformLabel = (value: string) => value.startsWith("glass-") && value !== "glass" ? layoutText(lang, `platform.${value}` as Parameters<typeof layoutText>[1]) : t(`platformStyle.${value}` as RhythmicTextKey);
  const platformOptions = PLATFORM_STYLES.map((value) => ({ value, label: platformLabel(value) }));
  const ballOptions = BALL_STYLES.map((value) => ({ value, label: t(`ball.${value}` as RhythmicTextKey) }));
  const synthOptions = SYNTH_PRESETS.map((value) => ({ value, label: t(`synth.${value}` as RhythmicTextKey) }));
  const accelOptions = (["none", "ease-in", "ease-out", "pulse"] as const).map((value) => ({ value, label: t(`acceleration.${value}` as RhythmicTextKey) }));
  const mixOptions = (["single", "alternate", "accent", "shuffle"] as const).map((value) => ({ value, label: t(`platformMix.${value}` as RhythmicTextKey) }));
  const midiOptions = (["auto", "single"] as const).map((value) => ({ value, label: t(`midiMode.${value}` as RhythmicTextKey) }));

  return <div className="space-y-3">
    <div><h2 className="font-semibold">{t("controls.title")}</h2><p className="text-xs text-muted-foreground">{t("controls.platforms", { count: props.usableHits })}</p></div>
    <Tabs defaultValue="source" className="w-full">
      <TabsList className="h-10 w-full justify-start overflow-x-auto bg-muted/40 p-1">
        {["source", "terrain", "layout", "motion", "visual", "media", "sound"].map((tab) => <TabsTrigger key={tab} value={tab} className="shrink-0 px-3 text-xs">{lt(`tabs.${tab}` as Parameters<typeof layoutText>[1])}</TabsTrigger>)}
      </TabsList>

      <TabsContent value="source" className="space-y-4 pt-2">
        <Choice label={t("song.builtin")} value={props.source.type === "builtin" ? props.source.name : "imported"} options={[{ value: "imported", label: t("song.imported") }, ...Object.keys(BUILTIN_MELODIES).map((name) => ({ value: name, label: melodyLabel(lang, name) }))]} onChange={(value) => value !== "imported" && props.loadBuiltin(value)} />
        <UploadCard title={t("song.uploadMidi")} hint={t("song.uploadMidiHint")} accept=".mid,.midi,audio/midi" kind="midi" onFile={props.importMidi} />
        <UploadCard title={t("song.uploadAudio")} hint={t("song.uploadAudioHint")} accept="audio/*" kind="audio" onFile={props.importAudio} />
        <div className="rounded-lg border bg-muted/30 p-3"><p className="truncate text-sm font-medium">{props.source.type === "builtin" ? melodyLabel(lang, props.source.name) : props.source.name}</p><p className="mt-1 text-xs text-muted-foreground">{props.sourceInfo}</p></div>
        <Toggle label={t("song.playOriginal")} checked={props.settings.playOriginalSong} onChange={(v) => props.patch("playOriginalSong", v)} />
        <Range label={t("song.playbackSpeed")} value={props.settings.playbackSpeed} min={0.35} max={2} step={0.05} unit="×" onChange={(v) => props.patch("playbackSpeed", v)} />
        <Range label={t("song.syncOffset")} value={props.settings.syncOffsetMs} min={-400} max={400} step={5} unit="ms" onChange={(v) => props.patch("syncOffsetMs", v)} />
        <Range label={t("song.minBeatSpacing")} value={props.settings.minBounceSpacingMs} min={40} max={600} step={10} unit="ms" onChange={(v) => props.patch("minBounceSpacingMs", v)} />
      </TabsContent>

      <TabsContent value="terrain" className="space-y-4 pt-2">
        <Choice label={t("course.platformMix")} value={props.settings.platformMixMode} options={mixOptions} onChange={(v) => props.patch("platformMixMode", v as StudioSettings["platformMixMode"])} />
        <Choice label={t("course.primaryStyle")} value={props.settings.platformPrimaryStyle} options={platformOptions} onChange={(v) => props.patch("platformPrimaryStyle", v as StudioSettings["platformPrimaryStyle"])} />
        {props.settings.platformMixMode !== "single" && <Choice label={t("course.secondaryStyle")} value={props.settings.platformSecondaryStyle} options={platformOptions} onChange={(v) => props.patch("platformSecondaryStyle", v as StudioSettings["platformSecondaryStyle"])} />}
        <Range label={t("course.platformWidth")} value={props.settings.platformWidth} min={120} max={360} step={4} unit="px" onChange={(v) => props.patch("platformWidth", v)} />
        <Range label={t("course.verticalGap")} value={props.settings.platformGap} min={90} max={240} step={5} unit="px" onChange={(v) => props.patch("platformGap", v)} />
        <Range label={t("course.laneSpread")} value={props.settings.laneSpread} min={220} max={560} step={5} unit="px" onChange={(v) => props.patch("laneSpread", v)} />
        <Range label={t("course.platformGlow")} value={props.settings.platformGlow} min={0} max={1.5} step={0.05} onChange={(v) => props.patch("platformGlow", v)} />
        <Toggle label={t("course.impactRipple")} checked={props.settings.impactRipple} onChange={(v) => props.patch("impactRipple", v)} />
      </TabsContent>

      <TabsContent value="layout" className="pt-2"><RhythmicCourseEditor nodeCount={props.usableHits} selectedNodeIndex={props.selectedNodeIndex} overrides={props.courseOverrides} onSelectNode={props.onSelectNode} onApply={props.onApplyCourseItem} onClearSelected={props.onClearSelectedCourseItem} onClearAll={props.onClearCourseLayout} /></TabsContent>

      <TabsContent value="motion" className="space-y-4 pt-2">
        <Range label={t("motion.bounceHeight")} value={props.settings.bounceHeight} min={45} max={260} step={5} unit="px" onChange={(v) => props.patch("bounceHeight", v)} />
        <Range label={t("motion.arcCurve")} value={props.settings.curveIntensity} min={0} max={1.2} step={0.02} onChange={(v) => props.patch("curveIntensity", v)} />
        <Range label={t("motion.cameraAnchor")} value={props.settings.cameraAnchor} min={0.2} max={0.55} step={0.01} onChange={(v) => props.patch("cameraAnchor", v)} />
        <Range label={t("motion.cameraFollow")} value={props.settings.cameraSmoothing} min={0.03} max={0.65} step={0.01} onChange={(v) => props.patch("cameraSmoothing", v)} />
        <Choice label={t("motion.accelerationMode")} value={props.settings.accelerationMode} options={accelOptions} onChange={(v) => props.patch("accelerationMode", v as StudioSettings["accelerationMode"])} />
        <Range label={t("motion.accelerationFactor")} value={props.settings.accelerationFactor} min={0.5} max={2.5} step={0.05} onChange={(v) => props.patch("accelerationFactor", v)} />
      </TabsContent>

      <TabsContent value="visual" className="space-y-4 pt-2">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t("visual.titleText")}</Label>
          <Input value={props.settings.titleText} maxLength={64} placeholder="MARBLE MUSIC" onChange={(event) => props.patch("titleText", event.target.value)} />
          <p className="text-[11px] text-muted-foreground">{t("visual.titleTextHint")}</p>
        </div>
        <Toggle label={t("visual.impactPulse")} checked={props.settings.pulseAnimation} onChange={(v) => props.patch("pulseAnimation", v)} />
        <Toggle label={t("visual.marbleGlow")} checked={props.settings.glowAnimation} onChange={(v) => props.patch("glowAnimation", v)} />
        <Range label={t("visual.trailLength")} value={props.settings.trailLength} min={0} max={48} step={1} onChange={(v) => props.patch("trailLength", v)} />
        <Range label={t("visual.collisionParticles")} value={props.settings.particleCount} min={0} max={48} step={1} onChange={(v) => props.patch("particleCount", v)} />
        <Range label={t("visual.marbleSize")} value={props.settings.ballSize} min={6} max={28} step={1} unit="px" onChange={(v) => props.patch("ballSize", v)} />
        <Choice label={t("visual.ballStyle")} value={props.settings.ballStyle} options={ballOptions} onChange={(v) => props.patch("ballStyle", v as StudioSettings["ballStyle"])} />
        <Color label={t("visual.neonStart")} value={props.settings.prismStart} onChange={(v) => props.patch("prismStart", v)} />
        <Color label={t("visual.neonEnd")} value={props.settings.prismEnd} onChange={(v) => props.patch("prismEnd", v)} />
      </TabsContent>

      <TabsContent value="media" className="pt-2"><Accordion type="multiple" defaultValue={["background"]}><RhythmicMediaAccordionItems settings={props.settings} patch={props.patch} backgroundName={props.backgroundName} importBackground={props.importBackground} clearBackground={props.clearBackground} lyricRaw={props.lyricRaw} setLyricRaw={props.setLyricRaw} lyricCount={props.lyricCount} lyricFormat={props.lyricFormat} importLyrics={props.importLyrics} applyLyrics={props.applyLyrics} clearLyrics={props.clearLyrics} /></Accordion></TabsContent>

      <TabsContent value="sound" className="space-y-4 pt-2">
        <Range label={t("sound.musicVolume")} value={props.settings.musicVolume} min={0} max={1.15} step={0.02} onChange={(v) => props.patch("musicVolume", v)} />
        <Toggle label={t("sound.midiPlayback")} checked={props.settings.midiPlaybackEnabled} onChange={(v) => props.patch("midiPlaybackEnabled", v)} />
        <Choice label={t("sound.midiMode")} value={props.settings.midiInstrumentMode} options={midiOptions} onChange={(v) => props.patch("midiInstrumentMode", v as StudioSettings["midiInstrumentMode"])} />
        <Toggle label={t("sound.instrumentNativeAudio")} checked={props.settings.instrumentNativeAudio} onChange={(v) => props.patch("instrumentNativeAudio", v)} />
        <Choice label={t("sound.hitSynth")} value={props.settings.synthPreset} options={synthOptions} onChange={(v) => props.patch("synthPreset", v as StudioSettings["synthPreset"])} />
        <Range label={t("sound.synthVolume")} value={props.settings.synthVolume} min={0} max={0.75} step={0.01} onChange={(v) => props.patch("synthVolume", v)} />
        <Range label={t("sound.reverb")} value={props.settings.synthReverb} min={0} max={0.8} step={0.02} onChange={(v) => props.patch("synthReverb", v)} />
        <Range label={t("sound.brightness")} value={props.settings.synthBrightness} min={0} max={1} step={0.02} onChange={(v) => props.patch("synthBrightness", v)} />
        <Range label={t("sound.stereoWidth")} value={props.settings.synthStereoWidth} min={0} max={1} step={0.02} onChange={(v) => props.patch("synthStereoWidth", v)} />
      </TabsContent>
    </Tabs>
  </div>;
}
