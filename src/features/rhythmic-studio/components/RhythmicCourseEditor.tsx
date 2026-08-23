import { ChevronLeft, ChevronRight, Eraser, Replace, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useSystemLang } from "@/hooks/use-system-lang";
import { layoutText } from "../layoutI18n";
import { rhythmicText, type RhythmicTextKey } from "../i18n";
import { COURSE_LONG_ITEMS, PLATFORM_STYLES, type CourseItemOverride, type CourseItemStyle } from "../types";
import { useMemo, useState } from "react";
import { PreviewChoiceGrid } from "../presentation/atoms/PreviewChoiceGrid";
import { CourseItemPreview } from "../presentation/atoms/RhythmicOptionPreviews";

const NEW_GLASS = new Set(["glass-borosilicate", "glass-tempered", "glass-frosted", "glass-acrylic", "glass-optic"]);

function itemLabel(lang: "vi" | "en", style: CourseItemStyle) {
  if ((COURSE_LONG_ITEMS as readonly string[]).includes(style)) return layoutText(lang, `item.${style}` as Parameters<typeof layoutText>[1]);
  if (NEW_GLASS.has(style)) return layoutText(lang, `platform.${style}` as Parameters<typeof layoutText>[1]);
  return rhythmicText(lang, `platformStyle.${style}` as RhythmicTextKey);
}

type Props = {
  nodeCount: number;
  selectedNodeIndex: number | null;
  overrides: CourseItemOverride[];
  onSelectNode: (index: number | null) => void;
  onApply: (style: CourseItemStyle, span: number) => void;
  onClearSelected: () => void;
  onClearAll: () => void;
};

export function RhythmicCourseEditor({ nodeCount, selectedNodeIndex, overrides, onSelectNode, onApply, onClearSelected, onClearAll }: Props) {
  const lang = useSystemLang();
  const t = (key: Parameters<typeof layoutText>[1], values?: Record<string, string | number>) => layoutText(lang, key, values);
  const [style, setStyle] = useState<CourseItemStyle>("glass-borosilicate");
  const [span, setSpan] = useState(1);
  const current = useMemo(() => selectedNodeIndex === null ? undefined : overrides.find((item) => selectedNodeIndex >= item.startIndex && selectedNodeIndex < item.startIndex + item.span), [overrides, selectedNodeIndex]);
  const allStyles = [...PLATFORM_STYLES, ...COURSE_LONG_ITEMS] as CourseItemStyle[];
  const maxSpan = Math.max(1, Math.min(12, nodeCount - (selectedNodeIndex ?? 0)));
  const previewOptions = allStyles.map((value) => ({ value, label: itemLabel(lang, value), preview: <CourseItemPreview style={value} /> }));

  return <div className="space-y-4">
    <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.05] p-3">
      <p className="text-sm font-semibold">{t("editor.title")}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("editor.subtitle")}</p>
    </div>

    <div className="rounded-xl border bg-muted/20 p-3">
      <p className="text-sm font-medium">{selectedNodeIndex === null ? t("editor.noSelection") : t("editor.selected", { index: selectedNodeIndex + 1, count: nodeCount })}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{t("editor.pickHint")}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" size="sm" variant="outline" disabled={selectedNodeIndex === null || selectedNodeIndex <= 0} onClick={() => onSelectNode(Math.max(0, (selectedNodeIndex ?? 1) - 1))}><ChevronLeft className="mr-1 h-4 w-4" />{t("editor.previous")}</Button>
        <Button type="button" size="sm" variant="outline" disabled={selectedNodeIndex === null || selectedNodeIndex >= nodeCount - 1} onClick={() => onSelectNode(Math.min(nodeCount - 1, (selectedNodeIndex ?? -1) + 1))}>{t("editor.next")}<ChevronRight className="ml-1 h-4 w-4" /></Button>
      </div>
    </div>

    {current && <div className="rounded-lg border border-primary/25 bg-primary/[0.04] px-3 py-2 text-xs text-muted-foreground">{t("editor.current", { style: itemLabel(lang, current.style), span: current.span })}</div>}

    <div className="max-h-[420px] overflow-y-auto pr-1">
      <PreviewChoiceGrid label={t("editor.item")} value={style} options={previewOptions} columns="grid-cols-2" onChange={(value) => setStyle(value as CourseItemStyle)} />
    </div>

    <div className="space-y-2">
      <div className="flex items-center justify-between"><Label className="text-xs text-muted-foreground">{t("editor.span")}</Label><span className="text-xs font-semibold tabular-nums">{Math.min(span, maxSpan)}</span></div>
      <Slider value={[Math.min(span, maxSpan)]} min={1} max={maxSpan} step={1} onValueChange={([value]) => setSpan(value)} />
    </div>

    <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-[11px] leading-4 text-muted-foreground">{t("editor.longHint")}</p>

    <div className="grid gap-2 sm:grid-cols-2">
      <Button type="button" disabled={selectedNodeIndex === null} onClick={() => onApply(style, Math.min(span, maxSpan))}><Replace className="mr-2 h-4 w-4" />{t("editor.apply")}</Button>
      <Button type="button" variant="outline" disabled={selectedNodeIndex === null || !current} onClick={onClearSelected}><Eraser className="mr-2 h-4 w-4" />{t("editor.clear")}</Button>
    </div>
    <Button type="button" variant="ghost" className="w-full text-muted-foreground" disabled={!overrides.length} onClick={onClearAll}><RotateCcw className="mr-2 h-4 w-4" />{t("editor.clearAll")}</Button>
  </div>;
}
