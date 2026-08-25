import { useId } from "react";
import { Image, Subtitles, Trash2, Upload } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSystemLang } from "@/hooks/use-system-lang";
import { BACKGROUND_PRESETS, type StudioSettings } from "../types";
import type { LyricFormat } from "../lib/lyrics";
import { mediaText, type MediaTextKey } from "../mediaI18n";
import { PreviewChoiceGrid } from "../presentation/atoms/PreviewChoiceGrid";
import { BackgroundPresetPreview } from "../presentation/atoms/RhythmicOptionPreviews";

type Patch = <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => void;

type Props = {
  settings: StudioSettings;
  patch: Patch;
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
  showBackgroundPreset?: boolean;
};

function RangeField({ label, value, min, max, step, unit = "", onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (value: number) => void }) {
  const shown = Number.isInteger(step) ? value : value.toFixed(step < 0.1 ? 2 : 1);
  return <div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label className="text-xs text-muted-foreground">{label}</Label><span className="text-xs font-semibold tabular-nums">{shown}{unit}</span></div><Slider value={[value]} min={min} max={max} step={step} onValueChange={([next]) => onChange(next)} /></div>;
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

function FileCard({ icon: Icon, title, hint, accept, onFile }: { icon: typeof Image; title: string; hint: string; accept: string; onFile: (file: File) => Promise<void> }) {
  const inputId = useId();
  return <label htmlFor={inputId} className="group flex cursor-pointer items-center gap-3 rounded-xl border bg-background/65 px-3 py-3 transition hover:border-primary/50 hover:bg-primary/[0.04]">
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="block truncate text-[11px] text-muted-foreground">{hint}</span></span>
    <Upload className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
    <input id={inputId} className="sr-only" type="file" accept={accept} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void onFile(file); }} />
  </label>;
}

export function RhythmicMediaAccordionItems(props: Props) {
  const lang = useSystemLang();
  const t = (key: MediaTextKey, values?: Record<string, string | number>) => mediaText(lang, key, values);
  const backgroundOptions = BACKGROUND_PRESETS.map((value) => ({ value, label: t(`background.${value}` as MediaTextKey), preview: <BackgroundPresetPreview preset={value} /> }));
  const lyricStyles = (["karaoke", "minimal", "boxed"] as const).map((value) => ({ value, label: t(`lyrics.style.${value}` as MediaTextKey) }));
  const lyricPositions = (["top", "middle", "bottom"] as const).map((value) => ({ value, label: t(`lyrics.position.${value}` as MediaTextKey) }));

  return <>
    <AccordionItem value="background"><AccordionTrigger>{t("section.background")}</AccordionTrigger><AccordionContent className="space-y-4 px-1">
      {props.showBackgroundPreset !== false && <div className="max-h-[360px] overflow-y-auto pr-1"><PreviewChoiceGrid label={t("background.preset")} value={props.settings.backgroundPreset} options={backgroundOptions} columns="grid-cols-2" onChange={(value) => props.patch("backgroundPreset", value as StudioSettings["backgroundPreset"])} /></div>}
      <ColorField label={t("background.color")} value={props.settings.backgroundColor} onChange={(value) => props.patch("backgroundColor", value)} />
      <RangeField label={t("background.motion")} value={props.settings.backgroundMotion} min={0} max={1.5} step={0.05} onChange={(value) => props.patch("backgroundMotion", value)} />
      <FileCard icon={Image} title={props.backgroundName ? t("background.replace") : t("background.upload")} hint={t("background.uploadHint")} accept="image/png,image/jpeg,image/webp" onFile={props.importBackground} />
      <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">{props.backgroundName ? t("background.current", { name: props.backgroundName }) : t("background.none")}</p>
      {props.backgroundName && <><SelectField label={t("background.fit")} value={props.settings.backgroundImageFit} options={[{ value: "cover", label: t("background.fit.cover") }, { value: "contain", label: t("background.fit.contain") }]} onChange={(value) => props.patch("backgroundImageFit", value as StudioSettings["backgroundImageFit"])} /><RangeField label={t("background.opacity")} value={props.settings.backgroundImageOpacity} min={0.2} max={1} step={0.02} onChange={(value) => props.patch("backgroundImageOpacity", value)} /><RangeField label={t("background.blur")} value={props.settings.backgroundImageBlur} min={0} max={20} step={1} unit="px" onChange={(value) => props.patch("backgroundImageBlur", value)} /><Button type="button" size="sm" variant="outline" onClick={props.clearBackground}><Trash2 className="mr-2 h-4 w-4" />{t("background.remove")}</Button></>}
    </AccordionContent></AccordionItem>

    <AccordionItem value="lyrics"><AccordionTrigger>{t("section.lyrics")}</AccordionTrigger><AccordionContent className="space-y-4 px-1">
      <ToggleField label={t("lyrics.enabled")} checked={props.settings.lyricsEnabled} onChange={(value) => props.patch("lyricsEnabled", value)} />
      <FileCard icon={Subtitles} title={t("lyrics.upload")} hint={t("lyrics.uploadHint")} accept=".lrc,.srt,.txt,text/plain,application/x-subrip" onFile={props.importLyrics} />
      <div className="space-y-2"><Label className="text-xs text-muted-foreground">{t("lyrics.manual")}</Label><Textarea value={props.lyricRaw} onChange={(event) => props.setLyricRaw(event.target.value)} rows={6} placeholder={t("lyrics.placeholder")} /><p className="text-[11px] leading-4 text-muted-foreground">{t("lyrics.manualHint")}</p></div>
      <div className="flex flex-wrap gap-2"><Button type="button" size="sm" onClick={props.applyLyrics}>{t("lyrics.apply")}</Button><Button type="button" size="sm" variant="outline" onClick={props.clearLyrics}>{t("lyrics.clear")}</Button></div>
      <p className="text-xs text-muted-foreground">{props.lyricCount ? t("lyrics.loaded", { count: props.lyricCount, format: (props.lyricFormat ?? "plain").toUpperCase() }) : t("lyrics.empty")}</p>
      <SelectField label={t("lyrics.style")} value={props.settings.lyricStyle} options={lyricStyles} onChange={(value) => props.patch("lyricStyle", value as StudioSettings["lyricStyle"])} />
      <SelectField label={t("lyrics.position")} value={props.settings.lyricPosition} options={lyricPositions} onChange={(value) => props.patch("lyricPosition", value as StudioSettings["lyricPosition"])} />
      <RangeField label={t("lyrics.fontSize")} value={props.settings.lyricFontSize} min={22} max={64} step={1} unit="px" onChange={(value) => props.patch("lyricFontSize", value)} />
      <ColorField label={t("lyrics.color")} value={props.settings.lyricColor} onChange={(value) => props.patch("lyricColor", value)} />
      <ColorField label={t("lyrics.accent")} value={props.settings.lyricAccentColor} onChange={(value) => props.patch("lyricAccentColor", value)} />
      <RangeField label={t("lyrics.shadow")} value={props.settings.lyricShadow} min={0} max={1} step={0.05} onChange={(value) => props.patch("lyricShadow", value)} />
      <ToggleField label={t("lyrics.showNext")} checked={props.settings.lyricShowNext} onChange={(value) => props.patch("lyricShowNext", value)} />
    </AccordionContent></AccordionItem>
  </>;
}
