import { AlertCircle, BookOpen, CheckCircle2, Clapperboard, FileText, Mic2, RefreshCcw, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewRenderPanel } from "@/features/story-review/components/ReviewRenderPanel";
import { ReviewScenesPanel } from "@/features/story-review/components/ReviewScenesPanel";
import { ReviewScriptPanel } from "@/features/story-review/components/ReviewScriptPanel";
import { ReviewStoryPanel } from "@/features/story-review/components/ReviewStoryPanel";
import type { StoryReviewStepId } from "@/features/story-review/types";
import { useStoryReviewStudio } from "@/features/story-review/useStoryReviewStudio";
import { AuthProfile, getCurrentProfile, isSuperAdminProfile } from "@/lib/auth";

const STEPS: { id: StoryReviewStepId; label: string; shortLabel: string; icon: typeof BookOpen }[] = [
  { id: "story", label: "1. Truyện & nguồn", shortLabel: "Truyện", icon: BookOpen },
  { id: "script", label: "2. Lời thoại", shortLabel: "Script", icon: FileText },
  { id: "scenes", label: "3. Phân cảnh Veo3", shortLabel: "Veo3", icon: Clapperboard },
  { id: "render", label: "4. Ghép video", shortLabel: "Video", icon: Video },
];

export default function StoryReviewStudio() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const canGenerateVideo = isSuperAdminProfile(profile);

  useEffect(() => {
    let cancelled = false;
    getCurrentProfile()
      .then((nextProfile) => {
        if (!cancelled) setProfile(isSuperAdminProfile(nextProfile) ? nextProfile : null);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const studio = useStoryReviewStudio({
    requireVideoGenerationAccess: () => {
      if (canGenerateVideo) return true;
      navigate("/auth", { replace: false, state: { from: "/story-review" } });
      return false;
    },
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <main className="mx-auto grid w-full max-w-[1780px] grid-cols-1 gap-3 px-3 py-3 sm:gap-4 sm:px-4 lg:p-5 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-3 sm:space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card className="overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-950/45 via-background to-background shadow-[0_16px_40px_rgba(15,23,42,0.28)]">
            <CardHeader className="space-y-3 p-4 sm:p-5">
              <CardTitle className="flex items-start gap-2 text-lg leading-7 sm:text-xl">
                <Mic2 className="mt-0.5 h-5 w-5 shrink-0 text-purple-300" />
                <span>Video review truyện</span>
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Studio 4 step: chọn truyện/nguồn → prompt lời thoại → prompt Veo3 → ghép clip/ảnh thành video.
              </p>
            </CardHeader>
            <CardContent className="grid gap-2 p-4 pt-0 text-sm sm:p-5 sm:pt-0">
              <StatusLine label="Truyện" value={studio.draft.storyTitle || "chưa nhập"} />
              <StatusLine label="Nguồn" value={studio.draft.sourceName || "chưa nhập"} />
              <StatusLine label="Lời thoại" value={studio.draft.reviewScript ? `${studio.draft.reviewScript.length.toLocaleString("vi-VN")} ký tự` : "chưa có"} />
              <StatusLine label="Phân cảnh" value={`${studio.scenesWithFiles}/${studio.scenes.length} file`} />
              <StatusLine label="Audio" value={studio.audioFile?.name || "tùy chọn"} />
              <StatusLine label="Video" value={studio.videoResult?.video.fileName || "chưa ghép"} />
              <Button className="mt-1 w-full" variant="outline" onClick={() => window.location.reload()}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Tải lại
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-muted/20">
            <CardContent className="grid gap-2 p-3 sm:p-4">
              {STEPS.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => studio.setActiveStep(step.id)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${studio.activeStep === step.id ? "border-purple-500/60 bg-purple-500/10 text-foreground" : "border-border bg-background/50 text-muted-foreground hover:bg-muted"}`}
                >
                  <step.icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{step.label}</span>
                  {getStepDone(studio, step.id) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : null}
                </button>
              ))}
            </CardContent>
          </Card>

          {studio.message ? (
            <Alert className="whitespace-pre-line border-purple-500/40 bg-purple-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Thông báo</AlertTitle>
              <AlertDescription className="break-words">{studio.message}</AlertDescription>
            </Alert>
          ) : null}
        </aside>

        <section className="min-w-0">
          <Tabs value={studio.activeStep} onValueChange={(value) => studio.setActiveStep(value as StoryReviewStepId)} className="min-w-0">
            <div className="sticky top-0 z-20 -mx-3 mb-3 border-b border-border bg-background/95 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
              <TabsList className="grid h-auto w-full grid-cols-4 gap-1 overflow-x-auto rounded-xl p-1">
                {STEPS.map((step) => (
                  <TabsTrigger key={step.id} value={step.id} className="min-w-0 flex-col gap-1 px-2 py-2 text-xs sm:flex-row sm:text-sm">
                    <step.icon className="h-4 w-4 shrink-0" />
                    <span className="hidden truncate sm:inline">{step.label}</span>
                    <span className="truncate sm:hidden">{step.shortLabel}</span>
                    {getStepDone(studio, step.id) ? <Badge className="hidden h-5 px-1.5 text-[10px] md:inline-flex" variant="outline">OK</Badge> : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="story" className="mt-0"><ReviewStoryPanel studio={studio} /></TabsContent>
            <TabsContent value="script" className="mt-0"><ReviewScriptPanel studio={studio} /></TabsContent>
            <TabsContent value="scenes" className="mt-0"><ReviewScenesPanel studio={studio} /></TabsContent>
            <TabsContent value="render" className="mt-0"><ReviewRenderPanel studio={studio} /></TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}

function StatusLine(props: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
      <span className="min-w-0 text-muted-foreground">{props.label}</span>
      <span className="min-w-0 max-w-[150px] truncate text-right font-medium sm:max-w-[180px]">{props.value}</span>
    </div>
  );
}

function getStepDone(studio: ReturnType<typeof useStoryReviewStudio>, step: StoryReviewStepId) {
  if (step === "story") return Boolean(studio.draft.storyTitle.trim() && studio.draft.sourceNotes.trim());
  if (step === "script") return studio.draft.reviewScript.trim().length > 0;
  if (step === "scenes") return studio.scenes.length > 0;
  return Boolean(studio.videoResult?.video.videoUrl);
}
