import { Bot, Map } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemLang } from "@/hooks/use-system-lang";
import AiVideoAgent from "./AiVideoAgent";
import AlgorithmWorld from "./AlgorithmWorld";

type ChannelMode = "agentic" | "manual";

type MazePathfindingPageProps = {
  initialMode?: ChannelMode;
};

export default function MazePathfindingPage({ initialMode = "manual" }: MazePathfindingPageProps) {
  const lang = useSystemLang();
  const [mode, setMode] = useState<ChannelMode>(initialMode);

  return (
    <main className="w-full space-y-4 px-4 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Map className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.28em]">
            {lang === "vi" ? "Kênh thuật toán" : "Algorithm channel"}
          </span>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lang === "vi" ? "Tìm đường mê cung" : "Maze Pathfinding"}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {lang === "vi"
              ? "Một màn hình mê cung duy nhất, bên trong tách tab AI agentic và tạo thủ công."
              : "One maze pathfinding screen with AI agentic and manual creation split into tabs."}
          </p>
        </div>
      </header>

      <Tabs value={mode} onValueChange={(value) => setMode(value as ChannelMode)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-[420px]">
          <TabsTrigger value="agentic"><Bot className="mr-2 h-4 w-4" />AI Agentic</TabsTrigger>
          <TabsTrigger value="manual"><Map className="mr-2 h-4 w-4" />Manual</TabsTrigger>
        </TabsList>
        <TabsContent value="agentic" className="mt-0">
          <AiVideoAgent
            lockedKind="algorithm"
            initialPresetId="maze-pathfinding"
            lockedPresetId="maze-pathfinding"
            autoPublishByDefault
            agentBadge="Maze Agent"
            pageTitle={{ en: "Maze Pathfinding AI Agentic", vi: "AI Agentic tìm đường mê cung" }}
            pageDescription={{ en: "Generate maze race/pathfinding videos with script, visuals, voice, render and publish queue in one agent flow.", vi: "Tạo video đua mê cung/tìm đường với script, visual, voice, render và publish queue trong một luồng agent." }}
          />
        </TabsContent>
        <TabsContent value="manual" className="mt-0">
          <AlgorithmWorld />
        </TabsContent>
      </Tabs>
    </main>
  );
}
