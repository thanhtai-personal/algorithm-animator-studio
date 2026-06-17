import { Bot, Clapperboard } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemLang } from "@/hooks/use-system-lang";
import AiVideoAgent from "./AiVideoAgent";
import StoryVideoStudio from "./StoryVideoStudio";

type ChannelMode = "agentic" | "manual";

type StoryChannelPageProps = {
  initialMode?: ChannelMode;
};

export default function StoryChannelPage({ initialMode = "manual" }: StoryChannelPageProps) {
  const lang = useSystemLang();
  const [mode, setMode] = useState<ChannelMode>(initialMode);

  return (
    <main className="w-full space-y-4 px-4 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Clapperboard className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.28em]">
            {lang === "vi" ? "Kênh truyện" : "Story channel"}
          </span>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lang === "vi" ? "Video truyện" : "Story Video"}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {lang === "vi"
              ? "Một menu video truyện duy nhất, bên trong tách tab AI agentic và tạo thủ công."
              : "One story video menu item with AI agentic and manual production split into tabs."}
          </p>
        </div>
      </header>

      <Tabs value={mode} onValueChange={(value) => setMode(value as ChannelMode)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-[420px]">
          <TabsTrigger value="agentic"><Bot className="mr-2 h-4 w-4" />AI Agentic</TabsTrigger>
          <TabsTrigger value="manual"><Clapperboard className="mr-2 h-4 w-4" />Manual</TabsTrigger>
        </TabsList>
        <TabsContent value="agentic" className="mt-0">
          <AiVideoAgent
            lockedKind="story"
            agentBadge="Story Agent"
            pageTitle={{ en: "Story AI Agentic", vi: "AI Agentic truyện" }}
            pageDescription={{ en: "Create story videos with the local agent while keeping the module type locked to Story.", vi: "Tạo video truyện bằng local agent, khóa module ở loại Story." }}
          />
        </TabsContent>
        <TabsContent value="manual" className="mt-0">
          <StoryVideoStudio />
        </TabsContent>
      </Tabs>
    </main>
  );
}
