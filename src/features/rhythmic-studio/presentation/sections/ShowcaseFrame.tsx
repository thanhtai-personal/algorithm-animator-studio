import { Boxes } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { INSTRUMENT_FAMILIES, INSTRUMENT_LAYOUTS, type InstrumentFamily, type InstrumentLayout } from "../../types";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { showcaseText } from "../../showcaseI18n";
import { ControlFrame } from "../atoms/ControlFrame";
import { SelectField } from "../atoms/ControlFields";

export function ShowcaseFrame({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  const t = (key: Parameters<typeof showcaseText>[1]) => showcaseText(lang, key);
  const s = studio.settings;
  return (
    <ControlFrame title={t("title")} subtitle={t("hint")} icon={<Boxes className="h-4 w-4 text-primary" />} defaultOpen={false}>
      <SelectField
        label={t("family")}
        value={s.instrumentFamily}
        options={INSTRUMENT_FAMILIES.map((value) => ({ value, label: t(`family.${value}` as Parameters<typeof showcaseText>[1]) }))}
        onChange={(value) => studio.patch("instrumentFamily", value as InstrumentFamily)}
      />
      <SelectField
        label={t("layout")}
        value={s.instrumentLayout}
        options={INSTRUMENT_LAYOUTS.map((value) => ({ value, label: t(`layout.${value}` as Parameters<typeof showcaseText>[1]) }))}
        onChange={(value) => studio.patch("instrumentLayout", value as InstrumentLayout)}
      />
    </ControlFrame>
  );
}
