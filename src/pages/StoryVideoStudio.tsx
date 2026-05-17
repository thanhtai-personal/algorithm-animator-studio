import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StoryExtractPanel } from "@/features/story-video/components/StoryExtractPanel";
import { StoryTopicPanel } from "@/features/story-video/components/StoryTopicPanel";
import { StoryVideoPanel } from "@/features/story-video/components/StoryVideoPanel";
import { StoryVoicePanel } from "@/features/story-video/components/StoryVoicePanel";
import { useStoryVideoStudio } from "@/features/story-video/useStoryVideoStudio";

export default function StoryVideoStudio() {
  const studio = useStoryVideoStudio();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="grid grid-cols-1 gap-4 p-4 2xl:grid-cols-[380px_1fr]">
        <aside className="space-y-4">
          <StoryTopicPanel studio={studio} />
          <StatusPanel studio={studio} />
        </aside>
        <section className="space-y-4">
          <StoryExtractPanel studio={studio} />
          <StoryVoicePanel studio={studio} />
          <StoryVideoPanel studio={studio} />
        </section>
      </main>
    </div>
  );
}

function StatusPanel({ studio }: { studio: ReturnType<typeof useStoryVideoStudio> }) {
  return (
    <Card className="space-y-3 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.30)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Trạng thái workflow</h2>
          <p className="text-xs text-muted-foreground">Text → Voice → Video → YouTube.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Tải lại
        </Button>
      </div>

      <div className="grid gap-2 text-sm">
        <StatusLine label="Piper models" value={studio.piperModels.length ? `${studio.piperModels.length} model` : "chưa tải"} />
        <StatusLine label="ElevenLabs" value={studio.elevenConfig?.hasApiKey ? "đã có API key" : "chưa cấu hình / chưa tải"} />
        <StatusLine label="Audio" value={studio.selectedAudio?.fileName || studio.audioResult?.fileName || "chưa tạo"} />
        <StatusLine label="Video" value={studio.videoResult?.video.fileName || "chưa tạo"} />
      </div>

      {studio.message ? (
        <div className="flex gap-2 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-100">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          <span>{studio.message}</span>
        </div>
      ) : null}
    </Card>
  );
}

function StatusLine(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
      <span className="text-muted-foreground">{props.label}</span>
      <span className="max-w-[180px] truncate font-medium">{props.value}</span>
    </div>
  );
}
