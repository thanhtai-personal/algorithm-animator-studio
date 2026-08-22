import { useState } from "react";
import { FolderOpen, Radio, Save, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RhythmicControls } from "@/features/rhythmic-studio/components/RhythmicControls";
import { RhythmicInspector } from "@/features/rhythmic-studio/components/RhythmicInspector";
import { RhythmicProjectsDialog } from "@/features/rhythmic-studio/components/RhythmicProjectsDialog";
import { RhythmicStage } from "@/features/rhythmic-studio/components/RhythmicStage";
import { useRhythmicStudio } from "@/features/rhythmic-studio/useRhythmicStudio";

export default function RhythmicStudio() {
  const studio = useRhythmicStudio();
  const [projectsOpen, setProjectsOpen] = useState(false);
  return <main className="min-h-[calc(100dvh-65px)] p-3 md:p-5">
    <div className="mx-auto max-w-[1800px] space-y-4">
      <header className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Radio className="h-5 w-5" /></div><div><h1 className="text-xl font-bold tracking-tight">Rhythmic Studio</h1><p className="text-sm text-muted-foreground">MIDI/audio → collisions → vertical rhythmic video</p></div></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setProjectsOpen(true)}><FolderOpen className="mr-2 h-4 w-4" />Projects</Button><Button variant="outline" onClick={studio.randomize}><Shuffle className="mr-2 h-4 w-4" />Randomize</Button><Button onClick={studio.saveProject}><Save className="mr-2 h-4 w-4" />Save preset</Button></div></header>
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(420px,1fr)_280px]">
        <aside className="max-h-[calc(100dvh-165px)] overflow-y-auto rounded-2xl border bg-card/50 p-4"><RhythmicControls settings={studio.settings} source={studio.source} sourceInfo={studio.audioFileInfo} usableHits={studio.timeline.length} patch={studio.patch} loadBuiltin={studio.loadBuiltin} importMidi={studio.importMidi} importAudio={studio.importAudio} /></aside>
        <RhythmicStage studio={studio} />
        <aside className="max-h-[calc(100dvh-165px)] overflow-y-auto"><RhythmicInspector source={studio.source} sourceCount={studio.sourceEvents.length} usableCount={studio.timeline.length} durationMs={studio.durationMs} settings={studio.settings} projectName={studio.projectName} onProjectNameChange={studio.setProjectName} /></aside>
      </div>
    </div>
    <RhythmicProjectsDialog open={projectsOpen} onOpenChange={setProjectsOpen} projects={studio.projects} onLoad={studio.loadProject} onDelete={studio.removeProject} />
    <audio ref={studio.audioElementRef} src={studio.audioUrl ?? undefined} preload="auto" className="hidden" />
  </main>;
}
