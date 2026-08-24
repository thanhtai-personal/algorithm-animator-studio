import { useId } from "react";
import { FileMusic, Music2, Upload } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useSystemLang } from "@/hooks/use-system-lang";
import { BUILTIN_MELODIES } from "../defaults";
import { melodyLabel, rhythmicText, type RhythmicTextKey } from "../i18n";
import { BALL_STYLES, PLATFORM_STYLES, SYNTH_PRESETS, type AudioSourceMeta, type StudioSettings } from "../types";
import type { LyricFormat } from "../lib/lyrics";
import { RhythmicMediaAccordionItems } from "./RhythmicMediaControls";

type Patch = <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => void;

type Props = {
  settings: StudioSettings;
  source: AudioSourceMeta;
  sourceInfo: string;
  usableHits: number;
  patch: Patch;
  loadBuiltin: (name: string) => void;
  importMidi: (file: File) => Promise<void>;
  importAudio: (file: File) => Promise<void>;
  backgroundName: string | null;
  importBackground: (file: File) => Promise<void>;
  clearBackground: () => void;
  lyricRaw: string;
  setLyricRaw: (value: string) => void;
  lyricCount: number;
  lyricFormat: LyricFormat | null;
  importLyrics: (file: File) => Promise<void>;
  applyLyrics: () => void;
  clearLyrics: () => void;
};

function UploadSourceButton({ title, hint, accept, kind, onFile }: { title: string; hint: string; accept: string; kind: "midi" | "audio"; onFile: (file: File) => Promise<void> }) {
  const inputId = useId();
  const Icon = kind === "midi" ? FileMusic : Music2;
  return <label htmlFor={inputId} className="group flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border border-border/80 bg-background/70 px-3 py-3 transition hover:border-primary/50 hover:bg-primary/[0.04] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted/60 text-primary shadow-sm transition group-hover:scale-105 group-hover:bg-primary/10"><Icon className="h-5 w-5" /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold leading-5">{title}</span><span className="block truncate text-[11px] text-muted-foreground">{hint}</span></span>
    <Upload className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:text-primary" />
    <input id={inputId} className="sr-only" type="file" accept={accept} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void onFile(file); }} />
  </label>;
}

function RangeField({ label, value, min, max, step, unit = "", onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (value: number) => void }) {
  const displayed = Number.isInteger(step) ? value : value.toFixed(step < 0.1 ? 2 : 1);
  return <div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label className="text-xs text-muted-foreground">{label}</Label><span className="text-xs font-semibold tabular-nums">{displayed}{unit}</span></div><Slider value={[value]} min={min} max={max} step={step} onValueChange={([next]) => onChange(next)} /></div>;
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-3"><Label className="text-sm">{label}</Label><Switch checked={checked} onCheckedChange={onChange} /></div>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label className="text-xs text-muted-foreground">{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="flex items-center justify-between gap-3"><Label className="text-sm">{label}</Label><input className="h-9 w-14 cursor-pointer rounded-md border bg-transparent p-1" type="color" value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

export function RhythmicControls({ settings, source, sourceInfo, usableHits, patch, loadBuiltin, importMidi, importAudio, backgroundName, importBackground, clearBackground, lyricRaw, setLyricRaw, lyricCount, lyricFormat, importLyrics, applyLyrics, clearLyrics }: Props) {
  const lang = useSystemLang();
  const t = (key: RhythmicTextKey, values?: Record<string, string | number>) => rhythmicText(lang, key, values);
  const accelerationOptions = (["none", "ease-in", "ease-out", "pulse"] as const).map((value) => ({ value, label: t(`acceleration.${value}` as RhythmicTextKey) }));
  const synthOptions = SYNTH_PRESETS.map((value) => ({ value, label: t(`synth.${value}` as RhythmicTextKey) }));
  const platformStyleOptions = PLATFORM_STYLES.map((value) => ({ value, label: t(`platformStyle.${value}` as RhythmicTextKey) }));
  const ballStyleOptions = BALL_STYLES.map((value) => ({ value, label: t(`ball.${value}` as RhythmicTextKey) }));
  const platformMixOptions = (["single", "alternate", "accent", "shuffle"] as const).map((value) => ({ value, label: t(`platformMix.${value}` as RhythmicTextKey) }));
  const midiModeOptions = (["auto", "single"] as const).map((value) => ({ value, label: t(`midiMode.${value}` as RhythmicTextKey) }));

  return <div className="space-y-3">
    <div><h2 className="font-semibold">{t("controls.title")}</h2><p className="text-xs text-muted-foreground">{t("controls.platforms", { count: usableHits })}</p></div>
    <Accordion type="multiple" defaultValue={["song", "course", "motion"]} className="w-full">
      <AccordionItem value="song"><AccordionTrigger>{t("section.song")}</AccordionTrigger><AccordionContent className="space-y-4 px-1">
        <SelectField label={t("song.builtin")} value={source.type === "builtin" ? source.name : "imported"} options={[{ value: "imported", label: t("song.imported") }, ...Object.keys(BUILTIN_MELODIES).map((name) => ({ value: name, label: melodyLabel(lang, name) }))]} onChange={(value) => value !== "imported" && loadBuiltin(value)} />
        <div className="grid gap-2 sm:grid-cols-2">
          <UploadSourceButton title={t("song.uploadMidi")} hint={t("song.uploadMidiHint")} accept=".mid,.midi,audio/midi" kind="midi" onFile={importMidi} />
          <UploadSourceButton title={t("song.uploadAudio")} hint={t("song.uploadAudioHint")} accept="audio/*" kind="audio" onFile={importAudio} />
        </div>
        <div className="rounded-lg border bg-muted/30 p-3"><p className="truncate text-sm font-medium">{source.type === "builtin" ? melodyLabel(lang, source.name) : source.name}</p><p className="mt-1 text-xs text-muted-foreground">{sourceInfo}</p></div>
        <ToggleField label={t("song.playOriginal")} checked={settings.playOriginalSong} onChange={(value) => patch("playOriginalSong", value)} />
        <RangeField label={t("song.playbackSpeed")} value={settings.playbackSpeed} min={0.35} max={2} step={0.05} unit="×" onChange={(value) => patch("playbackSpeed", value)} />
        <RangeField label={t("song.syncOffset")} value={settings.syncOffsetMs} min={-400} max={400} step={5} unit="ms" onChange={(value) => patch("syncOffsetMs", value)} />
        <RangeField label={t("song.minBeatSpacing")} value={settings.minBounceSpacingMs} min={40} max={600} step={10} unit="ms" onChange={(value) => patch("minBounceSpacingMs", value)} />
        <ToggleField label={t("song.autoSync")} checked={settings.autoSyncGaps} onChange={(value) => patch("autoSyncGaps", value)} />
      </AccordionContent></AccordionItem>

      <AccordionItem value="course"><AccordionTrigger>{t("section.course")}</AccordionTrigger><AccordionContent className="space-y-4 px-1">
        <SelectField label={t("course.platformMix")} value={settings.platformMixMode} options={platformMixOptions} onChange={(value) => patch("platformMixMode", value as StudioSettings["platformMixMode"])} />
        <SelectField label={t("course.primaryStyle")} value={settings.platformPrimaryStyle} options={platformStyleOptions} onChange={(value) => patch("platformPrimaryStyle", value as StudioSettings["platformPrimaryStyle"])} />
        {settings.platformMixMode !== "single" && <SelectField label={t("course.secondaryStyle")} value={settings.platformSecondaryStyle} options={platformStyleOptions} onChange={(value) => patch("platformSecondaryStyle", value as StudioSettings["platformSecondaryStyle"])} />}
        {(settings.platformMixMode === "accent" || settings.platformMixMode === "shuffle") && <SelectField label={t("course.accentStyle")} value={settings.platformAccentStyle} options={platformStyleOptions} onChange={(value) => patch("platformAccentStyle", value as StudioSettings["platformAccentStyle"])} />}
        {settings.platformMixMode === "accent" && <RangeField label={t("course.accentEvery")} value={settings.platformAccentEvery} min={2} max={16} step={1} onChange={(value) => patch("platformAccentEvery", value)} />}
        <RangeField label={t("course.platformDetail")} value={settings.platformDetail} min={0.2} max={1.2} step={0.05} onChange={(value) => patch("platformDetail", value)} />
        <RangeField label={t("course.platformWidth")} value={settings.platformWidth} min={120} max={360} step={4} unit="px" onChange={(value) => patch("platformWidth", value)} />
        <RangeField label={t("course.platformThickness")} value={settings.platformThickness} min={8} max={34} step={1} unit="px" onChange={(value) => patch("platformThickness", value)} />
        <RangeField label={t("course.verticalGap")} value={settings.platformGap} min={90} max={240} step={5} unit="px" onChange={(value) => patch("platformGap", value)} />
        <RangeField label={t("course.laneSpread")} value={settings.laneSpread} min={220} max={560} step={5} unit="px" onChange={(value) => patch("laneSpread", value)} />
        <RangeField label={t("course.minJump")} value={settings.minBounceDistance} min={8} max={140} step={2} unit="px" onChange={(value) => patch("minBounceDistance", value)} />
        <RangeField label={t("course.platformTilt")} value={settings.platformTilt} min={0} max={18} step={1} unit="°" onChange={(value) => patch("platformTilt", value)} />
        <RangeField label={t("course.platformGlow")} value={settings.platformGlow} min={0} max={1.5} step={0.05} onChange={(value) => patch("platformGlow", value)} />
        <ToggleField label={t("course.impactRipple")} checked={settings.impactRipple} onChange={(value) => patch("impactRipple", value)} />
        <ToggleField label={t("course.showBeatNumbers")} checked={settings.showBeatLabels} onChange={(value) => patch("showBeatLabels", value)} />
      </AccordionContent></AccordionItem>

      <AccordionItem value="motion"><AccordionTrigger>{t("section.motion")}</AccordionTrigger><AccordionContent className="space-y-4 px-1">
        <RangeField label={t("motion.bounceHeight")} value={settings.bounceHeight} min={45} max={260} step={5} unit="px" onChange={(value) => patch("bounceHeight", value)} />
        <RangeField label={t("motion.arcCurve")} value={settings.curveIntensity} min={0} max={1.2} step={0.02} onChange={(value) => patch("curveIntensity", value)} />
        <RangeField label={t("motion.arcLength")} value={settings.curvePathLength} min={0} max={1.2} step={0.02} onChange={(value) => patch("curvePathLength", value)} />
        <RangeField label={t("motion.cameraAnchor")} value={settings.cameraAnchor} min={0.2} max={0.55} step={0.01} onChange={(value) => patch("cameraAnchor", value)} />
        <RangeField label={t("motion.cameraFollow")} value={settings.cameraSmoothing} min={0.03} max={0.65} step={0.01} onChange={(value) => patch("cameraSmoothing", value)} />
        <ToggleField label={t("motion.shapeSpeed")} checked={settings.decoupleBallSpeed} onChange={(value) => patch("decoupleBallSpeed", value)} />
        <SelectField label={t("motion.accelerationMode")} value={settings.accelerationMode} options={accelerationOptions} onChange={(value) => patch("accelerationMode", value as StudioSettings["accelerationMode"])} />
        <RangeField label={t("motion.accelerationFactor")} value={settings.accelerationFactor} min={0.5} max={2.5} step={0.05} onChange={(value) => patch("accelerationFactor", value)} />
        <RangeField label={t("motion.accelerationRate")} value={settings.accelerationRate} min={0.4} max={3} step={0.05} onChange={(value) => patch("accelerationRate", value)} />
      </AccordionContent></AccordionItem>

      <AccordionItem value="visual"><AccordionTrigger>{t("section.visual")}</AccordionTrigger><AccordionContent className="space-y-4 px-1">
        <ToggleField label={t("visual.impactPulse")} checked={settings.pulseAnimation} onChange={(value) => patch("pulseAnimation", value)} />
        <ToggleField label={t("visual.marbleGlow")} checked={settings.glowAnimation} onChange={(value) => patch("glowAnimation", value)} />
        <RangeField label={t("visual.impactSensitivity")} value={settings.animationSensitivity} min={0} max={1.5} step={0.05} onChange={(value) => patch("animationSensitivity", value)} />
        <RangeField label={t("visual.particleDensity")} value={settings.spectralDensity} min={0} max={1.5} step={0.05} onChange={(value) => patch("spectralDensity", value)} />
        <RangeField label={t("visual.trailLength")} value={settings.trailLength} min={0} max={48} step={1} onChange={(value) => patch("trailLength", value)} />
        <RangeField label={t("visual.collisionParticles")} value={settings.particleCount} min={0} max={48} step={1} onChange={(value) => patch("particleCount", value)} />
        <RangeField label={t("visual.marbleSize")} value={settings.ballSize} min={6} max={28} step={1} unit="px" onChange={(value) => patch("ballSize", value)} />
        <SelectField label={t("visual.ballStyle")} value={settings.ballStyle} options={ballStyleOptions} onChange={(value) => patch("ballStyle", value as StudioSettings["ballStyle"])} />
        <ColorField label={t("visual.gridShell")} value={settings.shellColor} onChange={(value) => patch("shellColor", value)} />
        <ColorField label={t("visual.neonStart")} value={settings.prismStart} onChange={(value) => patch("prismStart", value)} />
        <ColorField label={t("visual.neonEnd")} value={settings.prismEnd} onChange={(value) => patch("prismEnd", value)} />
        <ColorField label={t("visual.background")} value={settings.backgroundColor} onChange={(value) => patch("backgroundColor", value)} />
      </AccordionContent></AccordionItem>

      <RhythmicMediaAccordionItems settings={settings} patch={patch} backgroundName={backgroundName} importBackground={importBackground} clearBackground={clearBackground} lyricRaw={lyricRaw} setLyricRaw={setLyricRaw} lyricCount={lyricCount} lyricFormat={lyricFormat} importLyrics={importLyrics} applyLyrics={applyLyrics} clearLyrics={clearLyrics} />

      <AccordionItem value="sound"><AccordionTrigger>{t("section.sound")}</AccordionTrigger><AccordionContent className="space-y-4 px-1">
        <RangeField label={t("sound.musicVolume")} value={settings.musicVolume} min={0} max={1.15} step={0.02} onChange={(value) => patch("musicVolume", value)} />
        <ToggleField label={t("sound.midiPlayback")} checked={settings.midiPlaybackEnabled} onChange={(value) => patch("midiPlaybackEnabled", value)} />
        <SelectField label={t("sound.midiMode")} value={settings.midiInstrumentMode} options={midiModeOptions} onChange={(value) => patch("midiInstrumentMode", value as StudioSettings["midiInstrumentMode"])} />
        <ToggleField label={t("sound.instrumentNativeAudio")} checked={settings.instrumentNativeAudio} onChange={(value) => patch("instrumentNativeAudio", value)} />
        <SelectField label={t("sound.hitSynth")} value={settings.synthPreset} options={synthOptions} onChange={(value) => patch("synthPreset", value as StudioSettings["synthPreset"])} />
        <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-[11px] leading-4 text-muted-foreground">{t("sound.effectsHint")}</p>
        <RangeField label={t("sound.synthVolume")} value={settings.synthVolume} min={0} max={0.75} step={0.01} onChange={(value) => patch("synthVolume", value)} />
        <RangeField label={t("sound.reverb")} value={settings.synthReverb} min={0} max={0.8} step={0.02} onChange={(value) => patch("synthReverb", value)} />
        <RangeField label={t("sound.brightness")} value={settings.synthBrightness} min={0} max={1} step={0.02} onChange={(value) => patch("synthBrightness", value)} />
        <RangeField label={t("sound.stereoWidth")} value={settings.synthStereoWidth} min={0} max={1} step={0.02} onChange={(value) => patch("synthStereoWidth", value)} />
      </AccordionContent></AccordionItem>
    </Accordion>
  </div>;
}
