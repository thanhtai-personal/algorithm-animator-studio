import { FileMusic, Upload } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { BUILTIN_MELODIES } from "../defaults";
import type { AudioSourceMeta, StudioSettings } from "../types";

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
};

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

export function RhythmicControls({ settings, source, sourceInfo, usableHits, patch, loadBuiltin, importMidi, importAudio }: Props) {
  return <div className="space-y-3">
    <div><h2 className="font-semibold">Marble Music controls</h2><p className="text-xs text-muted-foreground">{usableHits} beat platforms</p></div>
    <Accordion type="multiple" defaultValue={["song", "course", "motion"]} className="w-full">
      <AccordionItem value="song"><AccordionTrigger>Song & timing</AccordionTrigger><AccordionContent className="space-y-4 px-1">
        <SelectField label="Built-in sequence" value={source.type === "builtin" ? source.name : "imported"} options={[{ value: "imported", label: "Imported source" }, ...Object.keys(BUILTIN_MELODIES).map((name) => ({ value: name, label: name }))]} onChange={(value) => value !== "imported" && loadBuiltin(value)} />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="relative overflow-hidden"><FileMusic className="mr-2 h-4 w-4" />Import MIDI<input className="absolute inset-0 cursor-pointer opacity-0" type="file" accept=".mid,.midi,audio/midi" onChange={(event) => event.target.files?.[0] && void importMidi(event.target.files[0])} /></Button>
          <Button variant="outline" className="relative overflow-hidden"><Upload className="mr-2 h-4 w-4" />Import song<input className="absolute inset-0 cursor-pointer opacity-0" type="file" accept="audio/*" onChange={(event) => event.target.files?.[0] && void importAudio(event.target.files[0])} /></Button>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3"><p className="truncate text-sm font-medium">{source.name}</p><p className="mt-1 text-xs text-muted-foreground">{sourceInfo}</p></div>
        <ToggleField label="Play original song" checked={settings.playOriginalSong} onChange={(value) => patch("playOriginalSong", value)} />
        <RangeField label="Playback speed" value={settings.playbackSpeed} min={0.35} max={2} step={0.05} unit="×" onChange={(value) => patch("playbackSpeed", value)} />
        <RangeField label="Sync offset" value={settings.syncOffsetMs} min={-400} max={400} step={5} unit="ms" onChange={(value) => patch("syncOffsetMs", value)} />
        <RangeField label="Min beat spacing" value={settings.minBounceSpacingMs} min={40} max={600} step={10} unit="ms" onChange={(value) => patch("minBounceSpacingMs", value)} />
        <ToggleField label="Auto-sync dense hits" checked={settings.autoSyncGaps} onChange={(value) => patch("autoSyncGaps", value)} />
      </AccordionContent></AccordionItem>

      <AccordionItem value="course"><AccordionTrigger>Marble course</AccordionTrigger><AccordionContent className="space-y-4 px-1">
        <RangeField label="Platform width" value={settings.platformWidth} min={120} max={360} step={4} unit="px" onChange={(value) => patch("platformWidth", value)} />
        <RangeField label="Platform thickness" value={settings.platformThickness} min={8} max={34} step={1} unit="px" onChange={(value) => patch("platformThickness", value)} />
        <RangeField label="Vertical platform gap" value={settings.platformGap} min={90} max={240} step={5} unit="px" onChange={(value) => patch("platformGap", value)} />
        <RangeField label="Lane spread" value={settings.laneSpread} min={220} max={560} step={5} unit="px" onChange={(value) => patch("laneSpread", value)} />
        <RangeField label="Min horizontal jump" value={settings.minBounceDistance} min={8} max={140} step={2} unit="px" onChange={(value) => patch("minBounceDistance", value)} />
        <RangeField label="Platform tilt" value={settings.platformTilt} min={0} max={18} step={1} unit="°" onChange={(value) => patch("platformTilt", value)} />
        <RangeField label="Platform glow" value={settings.platformGlow} min={0} max={1.5} step={0.05} onChange={(value) => patch("platformGlow", value)} />
        <ToggleField label="Impact ripple" checked={settings.impactRipple} onChange={(value) => patch("impactRipple", value)} />
        <ToggleField label="Show beat numbers" checked={settings.showBeatLabels} onChange={(value) => patch("showBeatLabels", value)} />
      </AccordionContent></AccordionItem>

      <AccordionItem value="motion"><AccordionTrigger>Marble motion & camera</AccordionTrigger><AccordionContent className="space-y-4 px-1">
        <RangeField label="Bounce height" value={settings.bounceHeight} min={45} max={260} step={5} unit="px" onChange={(value) => patch("bounceHeight", value)} />
        <RangeField label="Arc curve" value={settings.curveIntensity} min={0} max={1.2} step={0.02} onChange={(value) => patch("curveIntensity", value)} />
        <RangeField label="Arc path length" value={settings.curvePathLength} min={0} max={1.2} step={0.02} onChange={(value) => patch("curvePathLength", value)} />
        <RangeField label="Camera vertical anchor" value={settings.cameraAnchor} min={0.2} max={0.55} step={0.01} onChange={(value) => patch("cameraAnchor", value)} />
        <RangeField label="Camera follow" value={settings.cameraSmoothing} min={0.03} max={0.65} step={0.01} onChange={(value) => patch("cameraSmoothing", value)} />
        <ToggleField label="Shape speed inside each beat" checked={settings.decoupleBallSpeed} onChange={(value) => patch("decoupleBallSpeed", value)} />
        <SelectField label="Acceleration mode" value={settings.accelerationMode} options={["none", "ease-in", "ease-out", "pulse"].map((value) => ({ value, label: value }))} onChange={(value) => patch("accelerationMode", value as StudioSettings["accelerationMode"])} />
        <RangeField label="Acceleration factor" value={settings.accelerationFactor} min={0.5} max={2.5} step={0.05} onChange={(value) => patch("accelerationFactor", value)} />
        <RangeField label="Acceleration rate" value={settings.accelerationRate} min={0.4} max={3} step={0.05} onChange={(value) => patch("accelerationRate", value)} />
      </AccordionContent></AccordionItem>

      <AccordionItem value="visual"><AccordionTrigger>Reactive visuals</AccordionTrigger><AccordionContent className="space-y-4 px-1">
        <ToggleField label="Impact pulse" checked={settings.pulseAnimation} onChange={(value) => patch("pulseAnimation", value)} />
        <ToggleField label="Marble glow" checked={settings.glowAnimation} onChange={(value) => patch("glowAnimation", value)} />
        <RangeField label="Impact sensitivity" value={settings.animationSensitivity} min={0} max={1.5} step={0.05} onChange={(value) => patch("animationSensitivity", value)} />
        <RangeField label="Particle density" value={settings.spectralDensity} min={0} max={1.5} step={0.05} onChange={(value) => patch("spectralDensity", value)} />
        <RangeField label="Trail length" value={settings.trailLength} min={0} max={48} step={1} onChange={(value) => patch("trailLength", value)} />
        <RangeField label="Collision particles" value={settings.particleCount} min={0} max={48} step={1} onChange={(value) => patch("particleCount", value)} />
        <RangeField label="Marble size" value={settings.ballSize} min={6} max={28} step={1} unit="px" onChange={(value) => patch("ballSize", value)} />
        <ColorField label="Grid / shell" value={settings.shellColor} onChange={(value) => patch("shellColor", value)} />
        <ColorField label="Neon start" value={settings.prismStart} onChange={(value) => patch("prismStart", value)} />
        <ColorField label="Neon end" value={settings.prismEnd} onChange={(value) => patch("prismEnd", value)} />
        <ColorField label="Background" value={settings.backgroundColor} onChange={(value) => patch("backgroundColor", value)} />
      </AccordionContent></AccordionItem>

      <AccordionItem value="sound"><AccordionTrigger>Marble sound</AccordionTrigger><AccordionContent className="space-y-4 px-1">
        <SelectField label="Hit synth" value={settings.synthPreset} options={["chime", "piano", "fm", "vibraphone", "bell"].map((value) => ({ value, label: value }))} onChange={(value) => patch("synthPreset", value as StudioSettings["synthPreset"])} />
        <RangeField label="Synth volume" value={settings.synthVolume} min={0} max={1} step={0.02} onChange={(value) => patch("synthVolume", value)} />
      </AccordionContent></AccordionItem>
    </Accordion>
  </div>;
}
