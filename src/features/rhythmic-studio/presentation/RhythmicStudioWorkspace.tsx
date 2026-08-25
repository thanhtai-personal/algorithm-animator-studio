import { useState, type CSSProperties } from "react";
import { observer } from "mobx-react-lite";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSystemLang } from "@/hooks/use-system-lang";
import { RhythmicInspector } from "../components/RhythmicInspector";
import { RhythmicProjectsDialog } from "../components/RhythmicProjectsDialog";
import { RhythmicStage } from "../components/RhythmicStage";
import { useRhythmicStudioController } from "../hooks/useRhythmicStudioController";
import { layoutText } from "../layoutI18n";
import { RhythmicPresetControls, RhythmicWorkflowControls } from "./layouts/RhythmicControlColumns";
import { RhythmicPanelResizeHandle } from "./layouts/RhythmicPanelResizeHandle";
import { useRhythmicPanelLayout } from "./layouts/rhythmicPanelLayout";
import { RhythmicWorkspaceHeader } from "./RhythmicWorkspaceHeader";
import "./rhythmic-production.css";

export const RhythmicStudioWorkspace = observer(function RhythmicStudioWorkspace() {
  const lang = useSystemLang();
  const studio = useRhythmicStudioController();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const panelLayout = useRhythmicPanelLayout();
  const lt = (key: Parameters<typeof layoutText>[1]) => layoutText(lang, key);

  return <main className="rhythmic-production min-h-[calc(100dvh-65px)] p-3 md:p-5">
    <div className="mx-auto max-w-[1920px] space-y-4">
      <RhythmicWorkspaceHeader
        status={studio.status}
        sourceName={studio.source.name}
        playing={studio.playing}
        onInfo={() => setInfoOpen(true)}
        onProjects={() => setProjectsOpen(true)}
        onRandomize={studio.randomize}
        onResetLayout={panelLayout.resetLayout}
        onSave={studio.saveProject}
      />

      <div
        className="rhythmic-workspace-grid grid items-start gap-4"
        style={{
          "--rhythmic-left-panel-width": `${panelLayout.layout.left}px`,
          "--rhythmic-right-panel-width": `${panelLayout.layout.right}px`,
        } as CSSProperties}
      >
        <div className="rhythmic-stage-column min-w-0"><RhythmicStage studio={studio} /></div>
        <div className="rhythmic-left-panel-column min-w-0"><RhythmicPresetControls studio={studio} /></div>
        <RhythmicPanelResizeHandle side="left" width={panelLayout.layout.left} active={panelLayout.activeSide === "left"} label={lt("layout.resizeLeft")} onBeginResize={panelLayout.beginResize} onResizeByPointerDelta={panelLayout.resizeByPointerDelta} />
        <RhythmicPanelResizeHandle side="right" width={panelLayout.layout.right} active={panelLayout.activeSide === "right"} label={lt("layout.resizeRight")} onBeginResize={panelLayout.beginResize} onResizeByPointerDelta={panelLayout.resizeByPointerDelta} />
        <div className="rhythmic-right-panel-column min-w-0"><RhythmicWorkflowControls studio={studio} /></div>
      </div>
    </div>

    <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
      <SheetContent side="right" className="w-[92vw] overflow-y-auto sm:max-w-md">
        <SheetHeader className="mb-4"><SheetTitle>{lt("drawer.title")}</SheetTitle><SheetDescription>{lt("drawer.description")}</SheetDescription></SheetHeader>
        <RhythmicInspector source={studio.source} sourceCount={studio.sourceEvents.length} usableCount={studio.timeline.length} durationMs={studio.durationMs} settings={studio.settings} projectName={studio.projectName} onProjectNameChange={studio.setProjectName} />
      </SheetContent>
    </Sheet>

    <RhythmicProjectsDialog open={projectsOpen} onOpenChange={setProjectsOpen} projects={studio.projects} onLoad={studio.loadProject} onDelete={studio.removeProject} />
    <audio ref={studio.audioElementRef} src={studio.audioUrl ?? undefined} preload="metadata" className="hidden" />
  </main>;
});
