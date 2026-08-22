import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSystemLang } from "@/hooks/use-system-lang";
import { rhythmicText, type RhythmicTextKey } from "../i18n";
import type { AudioSourceMeta, StudioSettings } from "../types";

export function RhythmicInspector({ source, sourceCount, usableCount, durationMs, settings, projectName, onProjectNameChange }: { source: AudioSourceMeta; sourceCount: number; usableCount: number; durationMs: number; settings: StudioSettings; projectName: string; onProjectNameChange: (value: string) => void }) {
  const lang = useSystemLang();
  const t = (key: RhythmicTextKey, values?: Record<string, string | number>) => rhythmicText(lang, key, values);
  const truthKey: RhythmicTextKey = source.type === "midi" ? "inspector.truthMidi" : source.type === "audio" ? "inspector.truthAudio" : "inspector.truthBuiltin";
  const sourceKey = `source.${source.type}` as RhythmicTextKey;

  return <div className="space-y-3">
    <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t("inspector.title")}</CardTitle></CardHeader><CardContent className="space-y-4">
      <div><p className="text-xs text-muted-foreground">{t("inspector.platforms")}</p><p className="text-4xl font-black tracking-tight">{usableCount}</p><p className="text-xs text-muted-foreground">{t("inspector.fromEvents", { count: sourceCount })}</p></div>
      <div className="grid grid-cols-2 gap-2 text-sm"><Metric label={t("inspector.duration")} value={`${(durationMs / 1000).toFixed(1)}s`} /><Metric label={t("inspector.playback")} value={`${settings.playbackSpeed.toFixed(2)}×`} /><Metric label={t("inspector.bounce")} value={`${settings.bounceHeight}px`} /><Metric label={t("inspector.source")} value={t(sourceKey)} /></div>
    </CardContent></Card>
    <InfoCard title={t("inspector.courseTitle")} body={t("inspector.courseBody")} />
    <InfoCard title={t("inspector.truthTitle")} body={t(truthKey)} />
    <InfoCard title={t("inspector.exportTitle")} body={t("inspector.exportBody")} />
    <div className="flex gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p className="text-xs leading-5 text-muted-foreground"><b className="text-foreground">{t("inspector.tipTitle")}</b> {t("inspector.tipBody")}</p></div>
    <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">{t("inspector.projectName")}</label><Input value={projectName} onChange={(event) => onProjectNameChange(event.target.value)} /></div>
  </div>;
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return <Card><CardContent className="space-y-2 p-4"><p className="text-sm font-semibold">{title}</p><p className="text-xs leading-5 text-muted-foreground">{body}</p></CardContent></Card>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-muted/20 p-2"><p className="text-[11px] text-muted-foreground">{label}</p><p className="truncate font-semibold">{value}</p></div>;
}
