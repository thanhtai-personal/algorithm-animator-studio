import { SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSystemLang } from "@/hooks/use-system-lang";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { layoutText } from "../../layoutI18n";
import { RhythmicPresetControls, RhythmicWorkflowControls } from "./RhythmicControlColumns";

interface Props {
  studio: RhythmicStudioController;
}

export function RhythmicMobileControlDock({ studio }: Props) {
  const lang = useSystemLang();
  const sceneLabel = layoutText(lang, "lab.sceneDeck");
  const controlsLabel = layoutText(lang, "lab.inspector");

  return (
    <nav
      className="rhythmic-mobile-dock fixed inset-x-3 bottom-3 z-40 mx-auto grid max-w-md grid-cols-2 gap-2 rounded-2xl border border-white/15 bg-[#091018]/95 p-2 shadow-[0_18px_60px_rgba(0,0,0,.62)] backdrop-blur-xl md:hidden"
      aria-label={layoutText(lang, "lab.workflow")}
    >
      <Sheet>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" className="min-h-11 min-w-0 gap-2 border-amber-300/30 bg-amber-300/10 text-amber-100">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="truncate">{sceneLabel}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rhythmic-mobile-sheet h-[min(88dvh,760px)] overflow-hidden rounded-t-[24px] border-white/10 bg-[#101419] p-0 text-slate-100">
          <SheetHeader className="sr-only">
            <SheetTitle>{sceneLabel}</SheetTitle>
            <SheetDescription>{sceneLabel}</SheetDescription>
          </SheetHeader>
          <RhythmicPresetControls studio={studio} />
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button type="button" className="min-h-11 min-w-0 gap-2 bg-cyan-400 text-slate-950 hover:bg-cyan-300">
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span className="truncate">{controlsLabel}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rhythmic-mobile-sheet h-[min(88dvh,760px)] overflow-hidden rounded-t-[24px] border-white/10 bg-[#101419] p-0 text-slate-100">
          <SheetHeader className="sr-only">
            <SheetTitle>{controlsLabel}</SheetTitle>
            <SheetDescription>{controlsLabel}</SheetDescription>
          </SheetHeader>
          <RhythmicWorkflowControls studio={studio} />
        </SheetContent>
      </Sheet>
    </nav>
  );
}
