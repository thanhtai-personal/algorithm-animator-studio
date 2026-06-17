import { Bot, Sparkles } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemLang } from "@/hooks/use-system-lang";
import AiVideoAgent from "./AiVideoAgent";
import StoryReviewStudio from "./StoryReviewStudio";

type ChannelMode = "agentic" | "manual";

type StoryReviewChannelPageProps = {
  initialMode?: ChannelMode;
};

export default function StoryReviewChannelPage({ initialMode = "manual" }: StoryReviewChannelPageProps) {
  const lang = useSystemLang();
  const [mode, setMode] = useState<ChannelMode>(initialMode);

  return (
    <main className="w-full space-y-4 px-4 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.28em]">
            {lang === "vi" ? "Kênh truyện" : "Story channel"}
          </span>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lang === "vi" ? "Review truyện" : "Story Review"}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {lang === "vi"
              ? "Một màn review truyện duy nhất, bên trong tách tab AI agentic và tạo thủ công."
              : "One story review screen with AI agentic and manual production split into tabs."}
          </p>
        </div>
      </header>

      <Tabs value={mode} onValueChange={(value) => setMode(value as ChannelMode)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-[420px]">
          <TabsTrigger value="agentic"><Bot className="mr-2 h-4 w-4" />AI Agentic</TabsTrigger>
          <TabsTrigger value="manual"><Sparkles className="mr-2 h-4 w-4" />Manual</TabsTrigger>
        </TabsList>
        <TabsContent value="agentic" className="mt-0">
          <AiVideoAgent
            lockedKind="story"
            initialPresetId="story-review"
            lockedPresetId="story-review"
            autoPublishByDefault
            agentBadge="Story Review Agent"
            pageTitle={{ en: "Story Review AI Agentic", vi: "AI Agentic review truyện" }}
            pageDescription={{ en: "Generate low-spoiler story review videos with hook, recap, review angle, voice, render and metadata in one agent flow.", vi: "Tạo video review truyện ít spoil với hook, tóm tắt, góc đánh giá, voice, render và metadata trong một luồng agent." }}
          />
        </TabsContent>
        <TabsContent value="manual" className="mt-0">
          <StoryReviewStudio />
        </TabsContent>
      </Tabs>
    </main>
  );
}
