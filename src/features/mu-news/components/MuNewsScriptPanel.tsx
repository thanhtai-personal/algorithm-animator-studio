import { Bot, Copy, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { useMuNewsStudio } from "../useMuNewsStudio";

export function MuNewsScriptPanel({ studio }: { studio: ReturnType<typeof useMuNewsStudio> }) {
  async function copyScript() {
    await navigator.clipboard?.writeText(studio.script || "");
  }

  return (
    <Card className="border-border/70 shadow-[0_16px_40px_rgba(15,23,42,0.22)]">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-red-400" /> AI viết kịch bản
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Nếu có OPENAI_API_KEY trên server, tool gọi AI. Nếu chưa có, tool tự dựng bản nháp local để bạn vẫn duyệt được.</p>
          </div>
          <Button onClick={studio.createScript} disabled={!studio.canGenerateScript}>
            <FileText className="mr-2 h-4 w-4" /> {studio.loading.script ? "Đang viết..." : "Tạo kịch bản"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-[1fr_130px]">
          <div className="grid gap-2">
            <Label>Tên kênh / series</Label>
            <Input value={studio.channelName} onChange={(event) => studio.setChannelName(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Độ dài phút</Label>
            <Input type="number" min={2} max={12} value={studio.durationMinutes} onChange={(event) => studio.setDurationMinutes(Number(event.target.value) || 6)} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Góc biên tập</Label>
          <Textarea className="min-h-20" value={studio.angle} onChange={(event) => studio.setAngle(event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Phong cách giọng đọc / nhịp nói</Label>
          <Textarea className="min-h-20" value={studio.voiceStyle} onChange={(event) => studio.setVoiceStyle(event.target.value)} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={studio.scriptResult?.engine === "openai" ? "default" : "secondary"}>
            Engine: {studio.scriptResult?.engine || "chưa tạo"}
          </Badge>
          <Badge variant="outline">{studio.script.trim().length.toLocaleString("vi-VN")} ký tự</Badge>
          <Button size="sm" variant="outline" onClick={copyScript} disabled={!studio.script.trim()}>
            <Copy className="mr-2 h-4 w-4" /> Copy script
          </Button>
        </div>

        <Textarea
          className="min-h-[380px] font-serif text-base leading-7"
          value={studio.script}
          onChange={(event) => studio.setScript(event.target.value)}
          placeholder="Kịch bản bản tin MU sẽ xuất hiện tại đây. Bạn có thể sửa trước khi tạo voice Piper."
        />

        {studio.scriptResult ? (
          <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-3 text-sm">
            <div>
              <p className="font-medium">Tiêu đề gợi ý</p>
              <p className="text-muted-foreground">{studio.scriptResult.title}</p>
            </div>
            <div>
              <p className="font-medium">Hashtag</p>
              <p className="text-muted-foreground">{studio.scriptResult.hashtags.join(" ")}</p>
            </div>
            {studio.scriptResult.shorts.length ? (
              <div>
                <p className="font-medium">Shorts gợi ý</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  {studio.scriptResult.shorts.map((short) => <li key={short.title}>{short.title}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
