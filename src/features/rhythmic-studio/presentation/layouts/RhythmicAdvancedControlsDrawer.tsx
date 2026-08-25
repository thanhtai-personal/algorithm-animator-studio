import { ArrowRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemLang } from "@/hooks/use-system-lang";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { layoutText } from "../../layoutI18n";
import { LayoutFrame } from "../sections/LayoutFrame";
import { MediaFrame } from "../sections/MediaFrame";
import { MotionFrame } from "../sections/MotionFrame";
import { SoundFrame } from "../sections/SoundFrame";
import { SourceFrame } from "../sections/SourceFrame";
import { ShowcaseFrame } from "../sections/ShowcaseFrame";
import { TerrainFrame } from "../sections/TerrainFrame";
import { VisualFrame } from "../sections/VisualFrame";

const tabClass = "h-9 min-w-0 px-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 data-[state=active]:bg-amber-300 data-[state=active]:text-slate-950";

export function RhythmicAdvancedControlsDrawer({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();

  return <Sheet>
    <SheetTrigger asChild>
      <Button type="button" variant="outline" className="mt-3 h-auto w-full justify-between border-cyan-400/25 bg-cyan-400/[0.06] px-3 py-2.5 text-left hover:border-cyan-300/55 hover:bg-cyan-300/10">
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-300/10 text-cyan-300">
            <Settings2 className="h-4 w-4" />
          </span>
          <span className="truncate">{layoutText(lang, "panel.advancedTitle")}</span>
        </span>
        <ArrowRight className="h-4 w-4 text-cyan-300" />
      </Button>
    </SheetTrigger>

    <SheetContent side="right" className="w-[min(94vw,500px)] max-w-none overflow-hidden border-white/10 bg-[#101419] p-0 sm:max-w-[500px]">
      <div className="flex h-full min-h-0 flex-col">
        <SheetHeader className="shrink-0 border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.12),transparent_58%)] px-5 py-5 pr-12">
          <SheetTitle className="flex items-center gap-2 text-base text-slate-100">
            <Settings2 className="h-4 w-4 text-cyan-300" />
            {layoutText(lang, "panel.advancedTitle")}
          </SheetTitle>
          <SheetDescription className="text-xs leading-5 text-slate-400">
            {layoutText(lang, "panel.advancedHint")}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="source" className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-white/10 bg-[#101419] p-2">
            <TabsList className="grid h-10 w-full grid-cols-4 bg-black/30 p-0.5">
              <TabsTrigger className={tabClass} value="source">{layoutText(lang, "lab.tabSource")}</TabsTrigger>
              <TabsTrigger className={tabClass} value="build">{layoutText(lang, "lab.tabBuild")}</TabsTrigger>
              <TabsTrigger className={tabClass} value="look">{layoutText(lang, "lab.tabLook")}</TabsTrigger>
              <TabsTrigger className={tabClass} value="finish">{layoutText(lang, "lab.tabFinish")}</TabsTrigger>
            </TabsList>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 rhythmic-scrollbar">
            <TabsContent value="source" className="m-0"><SourceFrame studio={studio} /></TabsContent>
            <TabsContent value="build" className="m-0 space-y-3">
              <ShowcaseFrame studio={studio} />
              <TerrainFrame studio={studio} />
              <LayoutFrame studio={studio} />
            </TabsContent>
            <TabsContent value="look" className="m-0 space-y-3">
              <MotionFrame studio={studio} />
              <VisualFrame studio={studio} />
            </TabsContent>
            <TabsContent value="finish" className="m-0 space-y-3">
              <SoundFrame studio={studio} />
              <MediaFrame studio={studio} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </SheetContent>
  </Sheet>;
}
