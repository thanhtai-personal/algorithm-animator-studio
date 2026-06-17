import { Bot, Home } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemLang } from "@/hooks/use-system-lang";
import AiVideoAgent from "./AiVideoAgent";
import Index from "./Index";

type ChannelMode = "agentic" | "manual";

type AlgorithmChannelPageProps = {
  initialMode?: ChannelMode;
};

export default function AlgorithmChannelPage({ initialMode = "manual" }: AlgorithmChannelPageProps) {
  const lang = useSystemLang();
  const [mode, setMode] = useState<ChannelMode>(initialMode);

  return (
    <main className="w-full space-y-4 px-4 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Home className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.28em]">
            {lang === "vi" ? "Kênh thuật toán" : "Algorithm channel"}
          </span>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lang === "vi" ? "Video thuật toán" : "Algorithm Video"}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {lang === "vi"
              ? "Một màn hình chung cho video thuật toán, tách 2 tab AI agentic và tạo thủ công ngay trong nội dung."
              : "A single algorithm video screen with AI agentic and manual creation split into content tabs."}
          </p>
        </div>
      </header>

      <Tabs value={mode} onValueChange={(value) => setMode(value as ChannelMode)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-[420px]">
          <TabsTrigger value="agentic"><Bot className="mr-2 h-4 w-4" />AI Agentic</TabsTrigger>
          <TabsTrigger value="manual"><Home className="mr-2 h-4 w-4" />Manual</TabsTrigger>
        </TabsList>
        <TabsContent value="agentic" className="mt-0">
          <AiVideoAgent
            lockedKind="algorithm"
            agentBadge="Algorithm Agent"
            pageTitle={{ en: "Algorithm AI Agentic", vi: "AI Agentic thuật toán" }}
            pageDescription={{ en: "Create algorithm videos with the local agent flow while keeping the module type locked to Algorithm.", vi: "Tạo video thuật toán bằng local agent, khóa module ở loại Algorithm." }}
          />
        </TabsContent>
        <TabsContent value="manual" className="mt-0">
          <Index />
        </TabsContent>
      </Tabs>
    </main>
  );
}
