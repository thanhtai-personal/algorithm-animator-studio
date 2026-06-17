import { Bot, Film } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemLang } from "@/hooks/use-system-lang";
import AiVideoAgent from "./AiVideoAgent";
import VideoCreate from "./VideoCreate";

type ChannelMode = "agentic" | "manual";

type CommonVideoPageProps = {
  initialMode?: ChannelMode;
};

export default function CommonVideoPage({ initialMode = "agentic" }: CommonVideoPageProps) {
  const lang = useSystemLang();
  const [mode, setMode] = useState<ChannelMode>(initialMode);

  return (
    <main className="w-full space-y-4 px-4 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Film className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.28em]">
            {lang === "vi" ? "Video chung" : "Common video"}
          </span>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lang === "vi" ? "Tạo video chung" : "Common Video Create"}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {lang === "vi"
              ? "Một màn hình tạo video chung, tách tab AI agentic và thủ công; tab agentic vẫn khóa ở loại Custom."
              : "One common video screen with AI agentic and manual tabs; the agentic tab remains locked to Custom mode."}
          </p>
        </div>
      </header>

      <Tabs value={mode} onValueChange={(value) => setMode(value as ChannelMode)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-[420px]">
          <TabsTrigger value="agentic"><Bot className="mr-2 h-4 w-4" />AI Agentic</TabsTrigger>
          <TabsTrigger value="manual"><Film className="mr-2 h-4 w-4" />Manual</TabsTrigger>
        </TabsList>
        <TabsContent value="agentic" className="mt-0">
          <AiVideoAgent
            lockedKind="generic"
            autoPublishByDefault
            agentBadge="Custom Agent"
            pageTitle={{ en: "Common Video AI Agentic", vi: "AI Agentic video chung" }}
            pageDescription={{ en: "Common agentic video creation is locked to Custom mode; the video type picker is hidden here.", vi: "Màn hình tạo video common với agentic được khóa ở loại Custom, không còn chọn video type." }}
          />
        </TabsContent>
        <TabsContent value="manual" className="mt-0">
          <VideoCreate />
        </TabsContent>
      </Tabs>
    </main>
  );
}
