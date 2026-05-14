import { ArrowLeft, BookOpen, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { LongContentStudio } from "./useLongContentStudio";

type Scene = LongContentStudio["scenes"][number];

export function ScriptPanel({ studio: s }: { studio: LongContentStudio }) {
  const [open, setOpen] = useState(false);
  const activeIndex = s.scenes.findIndex((scene) => scene.id === s.timelineState.scene.id);
  const nearbyScenes = useMemo(() => {
    const safeIndex = Math.max(0, activeIndex);
    return s.scenes.slice(Math.max(0, safeIndex - 1), Math.min(s.scenes.length, safeIndex + 2));
  }, [activeIndex, s.scenes]);

  return (
    <>
      <Card className="space-y-4 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-semibold">Noi dung dang phat</h2>
            <p className="text-xs text-muted-foreground">
              Chi hien scene hien tai va noi dung lan can theo preview. Mo full script de sua toan bo kich ban.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              {s.lang === "vi" ? "Tieng Viet" : "English"}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
              <BookOpen className="mr-2 h-3.5 w-3.5" /> Xem full
            </Button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {nearbyScenes.map((scene) => (
            <SceneSummary
              key={scene.id}
              scene={scene}
              index={s.scenes.findIndex((item) => item.id === scene.id)}
              active={s.timelineState.scene.id === scene.id}
            />
          ))}
        </div>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[min(1120px,calc(100vw-1.5rem))] max-w-none overflow-y-auto p-0 sm:max-w-none">
          <div className="sticky top-0 z-10 border-b bg-background/95 px-5 py-4 backdrop-blur">
            <SheetHeader className="space-y-3">
              <div className="flex items-start justify-between gap-4 pr-8">
                <div>
                  <SheetTitle>Full kich ban video</SheetTitle>
                  <SheetDescription>
                    Sua text tai day roi quay lai preview. Voice-over va export se dung noi dung da chinh.
                  </SheetDescription>
                </div>
                <SheetClose asChild>
                  <Button type="button" variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Quay lai
                  </Button>
                </SheetClose>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  {s.lang === "vi" ? "Tieng Viet" : "English"}
                </span>
                <Button type="button" size="sm" variant="outline" onClick={s.resetAllScriptScenes}>
                  <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset toan bo
                </Button>
              </div>
            </SheetHeader>
          </div>

          <div className="grid gap-3 p-5 lg:grid-cols-2">
            {s.scenes.map((scene, index) => (
              <SceneEditor
                key={scene.id}
                studio={s}
                scene={scene}
                index={index}
                active={s.timelineState.scene.id === scene.id}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function SceneSummary({ scene, index, active }: { scene: Scene; index: number; active: boolean }) {
  return (
    <div className={`space-y-2 rounded-lg border p-3 ${active ? "border-emerald-400 bg-emerald-400/10" : "border-border bg-card/50"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{index + 1}. {scene.kindLabel}</p>
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-muted-foreground">{scene.durationSec}s</span>
      </div>
      <p className="text-sm font-medium">{scene.title}</p>
      <p className="line-clamp-2 text-xs text-muted-foreground">{scene.subtitle}</p>
      <p className="line-clamp-3 text-xs leading-relaxed">{scene.narration}</p>
    </div>
  );
}

function SceneEditor(props: { studio: LongContentStudio; scene: Scene; index: number; active: boolean }) {
  const { studio: s, scene, index, active } = props;
  return (
    <div className={`space-y-3 rounded-lg border p-3 ${active ? "border-emerald-400 bg-emerald-400/10" : "border-border bg-card/50"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{index + 1}. {scene.kindLabel}</p>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-muted-foreground">{scene.durationSec}s</span>
          <Button type="button" size="sm" variant="ghost" onClick={() => s.resetScriptScene(scene.id)}>
            Reset
          </Button>
        </div>
      </div>

      <ScriptField label="Tieu de" value={scene.title} rows={2} onChange={(value) => s.updateScriptScene(scene.id, "title", value)} />
      <ScriptField label="Subtitle" value={scene.subtitle} rows={2} onChange={(value) => s.updateScriptScene(scene.id, "subtitle", value)} />
      <ScriptField label="Bullet hien thi, moi dong la mot bullet" value={scene.bullets.join("\n")} rows={4} onChange={(value) => s.updateScriptScene(scene.id, "bulletsText", value)} />
      <ScriptField label="Data input cho animation, nhap so cach nhau bang dau phay" value={scene.dataSet?.join(", ") ?? ""} rows={2} onChange={(value) => s.updateScriptScene(scene.id, "dataSetText", value)} />
      <ScriptField label="Voice-over narration" value={scene.narration} rows={5} onChange={(value) => s.updateScriptScene(scene.id, "narration", value)} />
    </div>
  );
}

function ScriptField(props: { label: string; value: string; rows: number; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{props.label}</Label>
      <Textarea
        value={props.value}
        rows={props.rows}
        className="min-h-0 resize-y text-sm leading-relaxed"
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}
