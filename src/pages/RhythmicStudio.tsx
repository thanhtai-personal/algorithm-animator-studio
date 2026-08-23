import { useState } from "react";
import { FolderOpen, Info, Radio, Save, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RhythmicControlSections } from "@/features/rhythmic-studio/components/RhythmicControlSections";
import { RhythmicInspector } from "@/features/rhythmic-studio/components/RhythmicInspector";
import { RhythmicProjectsDialog } from "@/features/rhythmic-studio/components/RhythmicProjectsDialog";
import { RhythmicStage } from "@/features/rhythmic-studio/components/RhythmicStage";
import { rhythmicText } from "@/features/rhythmic-studio/i18n";
import { layoutText } from "@/features/rhythmic-studio/layoutI18n";
import { useRhythmicStudio } from "@/features/rhythmic-studio/useRhythmicStudio";
import { useSystemLang } from "@/hooks/use-system-lang";

export default function RhythmicStudio() {
  const lang = useSystemLang();
  const studio = useRhythmicStudio();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const t = (key: Parameters<typeof rhythmicText>[1]) => rhythmicText(lang, key);
  const lt = (key: Parameters<typeof layoutText>[1]) => layoutText(lang, key);

  return <main className="min-h-[calc(100dvh-65px)] p-3 md:p-5">
    <div className="mx-auto max-w-[1800px] space-y-4">
      <header className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Radio className="h-5 w-5" /></div><div><h1 className="text-xl font-bold tracking-tight">{t("page.title")}</h1><p className="text-sm text-muted-foreground">{t("page.subtitle")}</p></div></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setInfoOpen(true)}><Info className="mr-2 h-4 w-4" />{lt("page.info")}</Button>
          <Button variant="outline" onClick={() => setProjectsOpen(true)}><FolderOpen className="mr-2 h-4 w-4" />{t("page.projects")}</Button>
          <Button variant="outline" onClick={studio.randomize}><Shuffle className="mr-2 h-4 w-4" />{t("page.randomize")}</Button>
          <Button onClick={studio.saveProject}><Save className="mr-2 h-4 w-4" />{t("page.savePreset")}</Button>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(520px,1fr)]">
        <aside className="max-h-[calc(100dvh-165px)] overflow-y-auto rounded-2xl border bg-card/50 p-4">
          <RhythmicControlSections settings={studio.settings} source={studio.source} sourceInfo={studio.audioFileInfo} usableHits={studio.timeline.length} patch={studio.patch} loadBuiltin={studio.loadBuiltin} importMidi={studio.importMidi} importAudio={studio.importAudio} backgroundName={studio.backgroundName} importBackground={studio.importBackground} clearBackground={studio.clearBackground} lyricRaw={studio.lyricRaw} setLyricRaw={studio.setLyricRaw} lyricCount={studio.lyrics.length} lyricFormat={studio.lyricFormat} importLyrics={studio.importLyrics} applyLyrics={studio.applyLyrics} clearLyrics={studio.clearLyrics} selectedNodeIndex={studio.selectedNodeIndex} courseOverrides={studio.courseOverrides} onSelectNode={studio.selectCourseNode} onApplyCourseItem={studio.applyCourseItem} onClearSelectedCourseItem={studio.clearSelectedCourseItem} onClearCourseLayout={studio.clearCourseLayout} />
        </aside>
        <RhythmicStage studio={studio} />
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
}
