import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PublicWebBanner } from "./components/PublicWebBanner";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/AppLayout";
import { RuntimeSetupGate } from "@/components/RuntimeSetupGate";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { PageLoader } from "@/components/ui/system-loader";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();
const AlgorithmChannelPage = lazy(() => import("./pages/AlgorithmChannelPage.tsx"));
const AlgorithmWorld = lazy(() => import("./pages/AlgorithmWorld.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const GeneratedAssets = lazy(() => import("./pages/GeneratedAssets.tsx"));
const CommonVideoPage = lazy(() => import("./pages/CommonVideoPage.tsx"));
const JobManagement = lazy(() => import("./pages/JobManagement.tsx"));
const LegalPage = lazy(() => import("./pages/LegalPage.tsx"));
const LongContent = lazy(() => import("./pages/LongContent.tsx"));
const NewsChannelPage = lazy(() => import("./pages/NewsChannelPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const TextToSpeech = lazy(() => import("./pages/TextToSpeech.tsx"));
const StoryChannelPage = lazy(() => import("./pages/StoryChannelPage.tsx"));
const StoryAuthorStudio = lazy(() => import("./pages/StoryAuthorStudio.tsx"));
const StoryReviewStudio = lazy(() => import("./pages/StoryReviewStudio.tsx"));
const YoutubePublishing = lazy(() => import("./pages/YoutubePublishing.tsx"));
const YoutubeTools = lazy(() => import("./pages/YoutubeTools.tsx"));

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

const RouteFallback = () => (
  <main className="min-h-[calc(100dvh-65px)] text-muted-foreground">
    <PageLoader className="kai-route-loader" title="Loading" />
  </main>
);

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
                <Route path="/algorithms" element={<AlgorithmChannelPage />} />
                <Route path="/algorithms/agentic" element={<AlgorithmChannelPage initialMode="agentic" />} />
                <Route path="/algorithms/manual" element={<AlgorithmChannelPage initialMode="manual" />} />
                <Route path="/algorithms/short" element={<AlgorithmChannelPage initialMode="manual" />} />
                <Route path="/algorithms/maze" element={<AlgorithmWorld />} />
                <Route path="/algorithms/video-long" element={<LongContent />} />
                <Route path="/news/github-trending" element={<NewsChannelPage channel="github-trending" />} />
                <Route path="/news/github-trending/agentic" element={<NewsChannelPage channel="github-trending" initialMode="agentic" />} />
                <Route path="/news/github-trending/manual" element={<NewsChannelPage channel="github-trending" initialMode="manual" />} />
                <Route path="/news/football-commentary" element={<NewsChannelPage channel="football-commentary" />} />
                <Route path="/news/football-commentary/agentic" element={<NewsChannelPage channel="football-commentary" initialMode="agentic" />} />
                <Route path="/news/football-commentary/manual" element={<NewsChannelPage channel="football-commentary" initialMode="manual" />} />
                <Route path="/algorithms/github-trending" element={<Navigate replace to="/news/github-trending" />} />
                <Route path="/football/commentary/agentic" element={<Navigate replace to="/news/football-commentary/agentic" />} />
                <Route path="/football/commentary/manual" element={<Navigate replace to="/news/football-commentary/manual" />} />
                <Route path="/football/mu-news" element={<Navigate replace to="/news/football-commentary" />} />
                <Route path="/stories" element={<StoryChannelPage />} />
                <Route path="/stories/agentic" element={<StoryChannelPage initialMode="agentic" />} />
                <Route path="/stories/manual" element={<StoryChannelPage initialMode="manual" />} />
                <Route path="/stories/video" element={<StoryChannelPage initialMode="manual" />} />
                <Route path="/stories/create" element={<StoryAuthorStudio />} />
                <Route path="/stories/review" element={<StoryReviewStudio />} />
                <Route path="/videos" element={<CommonVideoPage />} />
                <Route path="/videos/agentic" element={<CommonVideoPage initialMode="agentic" />} />
                <Route path="/videos/manual" element={<CommonVideoPage initialMode="manual" />} />
                <Route path="/jobs" element={<JobManagement />} />
                <Route path="/maze-pathfinding" element={<Navigate replace to="/algorithms/maze" />} />
                <Route path="/algorithm-world" element={<Navigate replace to="/algorithms/maze" />} />
                <Route path="/long-content" element={<Navigate replace to="/algorithms/video-long" />} />
                <Route path="/github-trending" element={<Navigate replace to="/news/github-trending" />} />
                <Route path="/mu-news" element={<Navigate replace to="/news/football-commentary" />} />
                <Route path="/story-author" element={<Navigate replace to="/stories/create" />} />
                <Route path="/story-review" element={<Navigate replace to="/stories/review" />} />
                <Route path="/story-video" element={<Navigate replace to="/stories" />} />
                <Route path="/assets" element={<GeneratedAssets />} />
                <Route path="/providers" element={<Navigate replace to="/settings?tab=tools" />} />
                <Route path="/text-to-speech" element={<TextToSpeech />} />
                <Route path="/ai-video-agent" element={<Navigate replace to="/videos/agentic" />} />
                <Route path="/video-create" element={<Navigate replace to="/videos/manual" />} />
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
