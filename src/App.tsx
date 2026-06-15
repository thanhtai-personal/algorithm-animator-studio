import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PublicWebBanner } from "./components/PublicWebBanner";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/AppLayout";
import { RuntimeSetupGate } from "@/components/RuntimeSetupGate";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSystemLang } from "@/hooks/use-system-lang";
import { text } from "@/lib/i18n";

const queryClient = new QueryClient();
const AiVideoAgent = lazy(() => import("./pages/AiVideoAgent.tsx"));
const AlgorithmWorld = lazy(() => import("./pages/AlgorithmWorld.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const GeneratedAssets = lazy(() => import("./pages/GeneratedAssets.tsx"));
const Index = lazy(() => import("./pages/Index.tsx"));
const LegalPage = lazy(() => import("./pages/LegalPage.tsx"));
const LongContent = lazy(() => import("./pages/LongContent.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const MuNewsStudio = lazy(() => import("./pages/MuNewsStudio.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const TextToSpeech = lazy(() => import("./pages/TextToSpeech.tsx"));
const StoryAuthorStudio = lazy(() => import("./pages/StoryAuthorStudio.tsx"));
const StoryReviewStudio = lazy(() => import("./pages/StoryReviewStudio.tsx"));
const StoryVideoStudio = lazy(() => import("./pages/StoryVideoStudio.tsx"));
const YoutubePublishing = lazy(() => import("./pages/YoutubePublishing.tsx"));
const YoutubeTools = lazy(() => import("./pages/YoutubeTools.tsx"));
const VideoCreate = lazy(() => import("./pages/VideoCreate.tsx"));

function shouldUseVercelAnalytics() {
  const configured = String(import.meta.env.VITE_VERCEL_ANALYTICS || "").toLowerCase();
  if (configured === "true") return true;
  if (configured === "false") return false;
  if (typeof window === "undefined" || !import.meta.env.PROD) return false;

  return window.location.hostname.endsWith(".vercel.app");
}

const AnalyticsTracker = () => {
  const location = useLocation();
  const path = `${location.pathname}${location.search}${location.hash}`;

  if (!shouldUseVercelAnalytics()) return null;

  return <Analytics mode="production" route={location.pathname} path={path} />;
};

const RouteFallback = () => {
  const lang = useSystemLang();
  return (
    <main className="grid min-h-[60vh] place-items-center px-4 text-sm font-medium text-muted-foreground">
      {text(lang, "Loading...", "Đang tải...")}
    </main>
  );
};

const LegacyChannelRedirect = () => {
  const location = useLocation();
  return <Navigate replace to={`/channel${location.search}${location.hash}`} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="kai-studio.theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsTracker />
          <PublicWebBanner />
          <RuntimeSetupGate>
            <AppLayout>
              <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/privacy" element={<LegalPage type="privacy" />} />
                <Route path="/term" element={<LegalPage type="terms" />} />
                <Route path="/terms" element={<LegalPage type="terms" />} />
                <Route path="/" element={<Navigate replace to="/text-to-speech" />} />
                <Route path="/algorithms/short" element={<Index />} />
                <Route path="/algorithms/maze" element={<AlgorithmWorld />} />
                <Route path="/algorithms/video-long" element={<LongContent />} />
                <Route path="/stories/video" element={<StoryVideoStudio />} />
                <Route path="/stories/create" element={<StoryAuthorStudio />} />
                <Route path="/stories/review" element={<StoryReviewStudio />} />
                <Route path="/football/mu-news" element={<MuNewsStudio />} />
                <Route path="/maze-pathfinding" element={<Navigate replace to="/algorithms/maze" />} />
                <Route path="/algorithm-world" element={<Navigate replace to="/algorithms/maze" />} />
                <Route path="/long-content" element={<Navigate replace to="/algorithms/video-long" />} />
                <Route path="/mu-news" element={<Navigate replace to="/football/mu-news" />} />
                <Route path="/story-author" element={<Navigate replace to="/stories/create" />} />
                <Route path="/story-review" element={<Navigate replace to="/stories/review" />} />
                <Route path="/story-video" element={<Navigate replace to="/stories/video" />} />
                <Route path="/assets" element={<GeneratedAssets />} />
                <Route path="/text-to-speech" element={<TextToSpeech />} />
                <Route path="/ai-video-agent" element={<AiVideoAgent />} />
                <Route path="/video-create" element={<VideoCreate />} />
                <Route path="/youtube-tools" element={<YoutubeTools />} />
                <Route path="/channel" element={<YoutubePublishing />} />
                <Route path="/social-publishing" element={<LegacyChannelRedirect />} />
                <Route path="/youtube-publishing" element={<LegacyChannelRedirect />} />
                <Route path="/youtube" element={<LegacyChannelRedirect />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/setup" element={<Navigate replace to="/settings?tab=health" />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </AppLayout>
          </RuntimeSetupGate>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
