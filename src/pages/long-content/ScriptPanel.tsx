import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LongContentStudio } from "./useLongContentStudio";

export function ScriptPanel({ studio: s }: { studio: LongContentStudio }) {
  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-semibold">Kịch bản video</h2>
          <p className="text-xs text-muted-foreground">
            Text này là nguồn tạo voice-over và subtitle trong preview/export. Sửa xong hãy tạo lại voice nếu dùng Piper hoặc ElevenLabs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            {s.lang === "vi" ? "Tiếng Việt" : "English"}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={s.resetAllScriptScenes}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset toàn bộ
          </Button>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {s.scenes.map((scene, index) => {
          const active = s.timelineState.scene.id === scene.id;
          return (
            <div key={scene.id} className={`space-y-3 rounded-lg border p-3 ${active ? "border-emerald-400 bg-emerald-400/10" : "border-border bg-card/50"}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{index + 1}. {scene.kindLabel}</p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-muted-foreground">{scene.durationSec}s</span>
                  <Button type="button" size="sm" variant="ghost" onClick={() => s.resetScriptScene(scene.id)}>
                    Reset
                  </Button>
                </div>
              </div>

              <ScriptField
                label="Tiêu đề"
                value={scene.title}
                rows={2}
                onChange={(value) => s.updateScriptScene(scene.id, "title", value)}
              />
              <ScriptField
                label="Subtitle"
                value={scene.subtitle}
                rows={2}
                onChange={(value) => s.updateScriptScene(scene.id, "subtitle", value)}
              />
              <ScriptField
                label="Bullet hiển thị, mỗi dòng là một bullet"
                value={scene.bullets.join("\n")}
                rows={4}
                onChange={(value) => s.updateScriptScene(scene.id, "bulletsText", value)}
              />
              <ScriptField
                label="Voice-over narration"
                value={scene.narration}
                rows={5}
                onChange={(value) => s.updateScriptScene(scene.id, "narration", value)}
              />
            </div>
          );
        })}
      </div>
    </Card>
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
