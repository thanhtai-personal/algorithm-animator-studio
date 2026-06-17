import { Bot, Github, Newspaper } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemLang } from "@/hooks/use-system-lang";
import AiVideoAgent from "./AiVideoAgent";
import GithubTrendingVideo from "./GithubTrendingVideo";
import MuNewsStudio from "./MuNewsStudio";

type NewsChannelPageProps = {
  channel: "github-trending" | "football-commentary";
  initialMode?: "agentic" | "manual";
};

const CHANNEL_TEXT = {
  "github-trending": {
    icon: Github,
    title: { en: "GitHub Trend Video", vi: "Video GitHub trend" },
    description: {
      en: "News-style channel for GitHub trending repositories with agentic and manual creation modes.",
      vi: "Kênh tin tức GitHub trending với hai mode tạo AI agentic và thủ công.",
    },
  },
  "football-commentary": {
    icon: Newspaper,
    title: { en: "Football Commentary", vi: "Bình luận bóng đá" },
    description: {
      en: "News-style football commentary channel with agentic and manual production modes.",
      vi: "Kênh tin tức bình luận bóng đá với hai mode sản xuất AI agentic và thủ công.",
    },
  },
};

export default function NewsChannelPage({ channel, initialMode = "manual" }: NewsChannelPageProps) {
  const lang = useSystemLang();
  const [mode, setMode] = useState(initialMode);
  const text = CHANNEL_TEXT[channel];
  const Icon = text.icon;

  return (
    <main className="w-full space-y-4 px-4 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Icon className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.28em]">{lang === "vi" ? "Kênh tin tức" : "News channel"}</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{text.title[lang]}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{text.description[lang]}</p>
        </div>
      </header>

      <Tabs value={mode} onValueChange={(value) => setMode(value as typeof mode)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-[420px]">
          <TabsTrigger value="agentic"><Bot className="mr-2 h-4 w-4" />AI Agentic</TabsTrigger>
          <TabsTrigger value="manual"><Icon className="mr-2 h-4 w-4" />Manual</TabsTrigger>
        </TabsList>
        <TabsContent value="agentic" className="mt-0">
          {channel === "github-trending" ? (
            <AiVideoAgent
              lockedKind="algorithm"
              initialPresetId="github-trending"
              lockedPresetId="github-trending"
              agentBadge="GitHub News Agent"
              pageTitle={{ en: "GitHub Trend AI Agentic", vi: "AI Agentic GitHub trend" }}
              pageDescription={{ en: "Generate news-style GitHub trending videos with the local agent flow.", vi: "Tạo video tin tức GitHub trending bằng local agent flow." }}
            />
          ) : (
            <AiVideoAgent
              lockedKind="football"
              initialPresetId="mu-news"
              lockedPresetId="mu-news"
              agentBadge="Football News Agent"
              pageTitle={{ en: "Football Commentary AI Agentic", vi: "AI Agentic bình luận bóng đá" }}
              pageDescription={{ en: "Generate football commentary videos with voice, music, render and publish queue in one agent flow.", vi: "Tạo video bình luận bóng đá với voice, nhạc nền, render và publish queue trong một luồng agent." }}
            />
          )}
        </TabsContent>
        <TabsContent value="manual" className="mt-0">
          {channel === "github-trending" ? <GithubTrendingVideo /> : <MuNewsStudio />}
        </TabsContent>
      </Tabs>
    </main>
  );
}
