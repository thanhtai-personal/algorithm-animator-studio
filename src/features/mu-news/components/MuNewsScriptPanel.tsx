import { ArrowRight, Bot, Copy, FileText, Mic2 } from "lucide-react";
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
              <span>Step 3 — Lên kịch bản theo ngôn ngữ hệ thống</span>
            </CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              AI viết script theo tin đã chọn. Bạn duyệt/sửa tại đây, sau đó tách thành nhiều đoạn voice cho Step 4.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button className="w-full sm:w-auto" variant="outline" onClick={studio.createScript} disabled={!studio.canGenerateScript}>
              <FileText className="mr-2 h-4 w-4" /> {studio.loading.script ? "Đang viết..." : "Viết lại"}
            </Button>
            <Button className="w-full sm:w-auto" onClick={studio.rebuildVoiceSegments} disabled={!studio.script.trim()}>
              <Mic2 className="mr-2 h-4 w-4" /> Tách voice
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_130px_180px]">
          <div className="grid min-w-0 gap-2">
            <Label>Tên kênh / series</Label>
            <Input className="min-w-0" value={studio.channelName} onChange={(event) => studio.setChannelName(event.target.value)} />
          </div>
          <div className="grid min-w-0 gap-2">
            <Label>Độ dài phút</Label>
            <Input type="number" min={2} max={12} value={studio.durationMinutes} onChange={(event) => studio.setDurationMinutes(Number(event.target.value) || 6)} />
          </div>
          <div className="grid min-w-0 gap-2">
            <Label>Ngôn ngữ script</Label>
            <Input value={studio.scriptLanguage} onChange={(event) => studio.setScriptLanguage(event.target.value)} placeholder="Tiếng Việt" />
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
            <Badge variant={studio.scriptResult?.engine === "openai" ? "default" : "secondary"}>Engine: {studio.scriptResult?.engine || "chưa tạo"}</Badge>
            <Badge variant="outline">{studio.script.trim().length.toLocaleString("vi-VN")} ký tự</Badge>
            <Badge variant="outline">{studio.voiceSegments.length} đoạn voice</Badge>
          </div>
          <Button className="w-full sm:ml-auto sm:w-auto" size="sm" variant="outline" onClick={copyScript} disabled={!studio.script.trim()}>
            <Copy className="mr-2 h-4 w-4" /> Copy script
          </Button>
        </div>

        <Textarea
          className="min-h-[360px] min-w-0 resize-y font-serif text-sm leading-7 sm:text-base xl:min-h-[52vh]"
          value={studio.script}
          onChange={(event) => studio.setScript(event.target.value)}
          placeholder="Kịch bản bản tin MU sẽ xuất hiện tại đây. Bạn có thể sửa trước khi tách voice."
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
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" onClick={studio.rebuildVoiceSegments} disabled={!studio.script.trim()}>
            Tách đoạn voice và sang Step 4 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
