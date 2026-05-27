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
    <Card className="min-w-0 overflow-hidden border-border/70 shadow-[0_16px_40px_rgba(15,23,42,0.22)]">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-start gap-2 text-base leading-7 sm:text-lg">
              <Bot className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <span>AI viết kịch bản</span>
            </CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Nếu có OPENAI_API_KEY trên server, tool gọi AI. Nếu chưa có, tool tự dựng bản nháp local để bạn vẫn duyệt được.
            </p>
          </div>
          <Button className="w-full shrink-0 sm:w-auto" onClick={studio.createScript} disabled={!studio.canGenerateScript}>
            <FileText className="mr-2 h-4 w-4" /> {studio.loading.script ? "Đang viết..." : "Tạo kịch bản"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_130px]">
          <div className="grid min-w-0 gap-2">
            <Label>Tên kênh / series</Label>
            <Input className="min-w-0" value={studio.channelName} onChange={(event) => studio.setChannelName(event.target.value)} />
          </div>
          <div className="grid min-w-0 gap-2">
            <Label>Độ dài phút</Label>
            <Input type="number" min={2} max={12} value={studio.durationMinutes} onChange={(event) => studio.setDurationMinutes(Number(event.target.value) || 6)} />
          </div>
        </div>
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          <div className="grid min-w-0 gap-2">
            <Label>Góc biên tập</Label>
            <Textarea className="min-h-24 min-w-0 resize-y leading-6" value={studio.angle} onChange={(event) => studio.setAngle(event.target.value)} />
          </div>
          <div className="grid min-w-0 gap-2">
            <Label>Phong cách giọng đọc / nhịp nói</Label>
            <Textarea className="min-h-24 min-w-0 resize-y leading-6" value={studio.voiceStyle} onChange={(event) => studio.setVoiceStyle(event.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant={studio.scriptResult?.engine === "openai" ? "default" : "secondary"}>
              Engine: {studio.scriptResult?.engine || "chưa tạo"}
            </Badge>
            <Badge variant="outline">{studio.script.trim().length.toLocaleString("vi-VN")} ký tự</Badge>
          </div>
          <Button className="w-full sm:ml-auto sm:w-auto" size="sm" variant="outline" onClick={copyScript} disabled={!studio.script.trim()}>
            <Copy className="mr-2 h-4 w-4" /> Copy script
          </Button>
        </div>

        <Textarea
          className="min-h-[280px] min-w-0 resize-y font-serif text-sm leading-7 sm:min-h-[360px] sm:text-base xl:min-h-[420px]"
          value={studio.script}
          onChange={(event) => studio.setScript(event.target.value)}
          placeholder="Kịch bản bản tin MU sẽ xuất hiện tại đây. Bạn có thể sửa trước khi tạo voice Piper."
        />

        {studio.scriptResult ? (
          <div className="grid min-w-0 gap-3 rounded-xl border border-border bg-muted/20 p-3 text-sm leading-6 sm:p-4">
            <div className="min-w-0">
              <p className="font-medium">Tiêu đề gợi ý</p>
              <p className="break-words text-muted-foreground">{studio.scriptResult.title}</p>
            </div>
            <div className="min-w-0">
              <p className="font-medium">Hashtag</p>
              <p className="break-words text-muted-foreground">{studio.scriptResult.hashtags.join(" ")}</p>
            </div>
            {studio.scriptResult.shorts.length ? (
              <div className="min-w-0">
                <p className="font-medium">Shorts gợi ý</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  {studio.scriptResult.shorts.map((short) => <li className="break-words" key={short.title}>{short.title}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
