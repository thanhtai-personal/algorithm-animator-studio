import { LayoutGrid } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { layoutText } from "../../layoutI18n";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { RhythmicCourseEditor } from "../../components/RhythmicCourseEditor";
import { ControlFrame } from "../atoms/ControlFrame";

export function LayoutFrame({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  return <ControlFrame title={layoutText(lang, "tabs.layout")} icon={<LayoutGrid className="h-4 w-4 text-primary" />}>
    <RhythmicCourseEditor
      nodeCount={studio.timeline.length}
      selectedNodeIndex={studio.selectedNodeIndex}
      overrides={studio.courseOverrides}
      onSelectNode={studio.selectCourseNode}
      onApply={studio.applyCourseItem}
      onClearSelected={studio.clearSelectedCourseItem}
      onClearAll={studio.clearCourseLayout}
    />
  </ControlFrame>;
}
