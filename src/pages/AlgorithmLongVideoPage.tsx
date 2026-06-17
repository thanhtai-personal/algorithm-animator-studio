import { Bot, Video } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemLang } from "@/hooks/use-system-lang";
import AiVideoAgent from "./AiVideoAgent";
import LongContent from "./LongContent";

type ChannelMode = "agentic" | "manual";

type AlgorithmLongVideoPageProps = {
  initialMode?: ChannelMode;
};

export default function AlgorithmLongVideoPage({ initialMode = "manual" }: AlgorithmLongVideoPageProps) {
  const lang = useSystemLang();
  const [mode, setMode] = useState<ChannelMode>(initialMode);

  return (
    <main className="w-full space-y-4 px-4 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Video className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.28em]">
            {lang === "vi" ? "Kênh thuật toán" : "Algorithm channel"}
          </span>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lang === "vi" ? "Video thuật toán dài" : "Algorithm Long Video"}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {lang === "vi"
              ? "Một màn video thuật toán dài, bên trong tách tab AI agentic và dựng thủ công."
              : "One long-form algorithm video screen with AI agentic and manual production tabs."}
          </p>
        </div>
      </header>

      <Tabs value={mode} onValueChange={(value) => setMode(value as ChannelMode)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-[420px]">
          <TabsTrigger value="agentic"><Bot className="mr-2 h-4 w-4" />AI Agentic</TabsTrigger>
          <TabsTrigger value="manual"><Video className="mr-2 h-4 w-4" />Manual</TabsTrigger>
        </TabsList>
        <TabsContent value="agentic" className="mt-0">
          <AiVideoAgent
            lockedKind="algorithm"
            initialPresetId="algorithm-long"
            lockedPresetId="algorithm-long"
            agentBadge="Algorithm Long Agent"
            pageTitle={{ en: "Algorithm Long Video AI Agentic", vi: "AI Agentic video thuật toán dài" }}
            pageDescription={{ en: "Generate long-form algorithm explainers with chapter plan, script, voice, render and metadata in one agent flow.", vi: "Tạo video thuật toán dài với chapter plan, script, voice, render và metadata trong một luồng agent." }}
          />
        </TabsContent>
        <TabsContent value="manual" className="mt-0">
          <LongContent />
        </TabsContent>
      </Tabs>
    </main>
  );
}
