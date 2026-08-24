import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSystemLang } from "@/hooks/use-system-lang";
import { RhythmicInspector } from "../components/RhythmicInspector";
import { RhythmicProjectsDialog } from "../components/RhythmicProjectsDialog";
import { RhythmicStage } from "../components/RhythmicStage";
import { useRhythmicStudioController } from "../hooks/useRhythmicStudioController";
import { layoutText } from "../layoutI18n";
import { RhythmicPresetControls, RhythmicWorkflowControls } from "./layouts/RhythmicControlColumns";
import { RhythmicWorkspaceHeader } from "./RhythmicWorkspaceHeader";
import "./rhythmic-production.css";

export const RhythmicStudioWorkspace = observer(function RhythmicStudioWorkspace() {
  const lang = useSystemLang();
  const studio = useRhythmicStudioController();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
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
        onSave={studio.saveProject}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[240px_minmax(420px,1fr)_360px]">
        <div className="min-w-0 xl:col-start-2 xl:row-start-1"><RhythmicStage studio={studio} /></div>
        <div className="min-w-0 xl:col-start-1 xl:row-start-1"><RhythmicPresetControls studio={studio} /></div>
        <div className="min-w-0 xl:col-start-3 xl:row-start-1"><RhythmicWorkflowControls studio={studio} /></div>
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
