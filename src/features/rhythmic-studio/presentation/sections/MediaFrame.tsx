import { ImageIcon } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { useSystemLang } from "@/hooks/use-system-lang";
import { mediaText } from "../../mediaI18n";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { RhythmicMediaAccordionItems } from "../../components/RhythmicMediaControls";
import { ControlFrame } from "../atoms/ControlFrame";

export function MediaFrame({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  return <ControlFrame title={mediaText(lang, "section.background")} icon={<ImageIcon className="h-4 w-4 text-primary" />} defaultOpen={false}>
    <Accordion type="multiple" defaultValue={["background"]}>
      <RhythmicMediaAccordionItems
        settings={studio.settings}
        patch={studio.patch}
        backgroundName={studio.backgroundName}
        importBackground={studio.importBackground}
        clearBackground={studio.clearBackground}
        lyricRaw={studio.lyricRaw}
        setLyricRaw={studio.setLyricRaw}
        lyricCount={studio.lyrics.length}
        lyricFormat={studio.lyricFormat}
        importLyrics={studio.importLyrics}
        applyLyrics={studio.applyLyrics}
        clearLyrics={studio.clearLyrics}
        showBackgroundPreset={false}
      />
    </Accordion>
  </ControlFrame>;
}
