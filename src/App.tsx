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
const AlgorithmWorld = lazy(() => import("./pages/AlgorithmWorld.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const GeneratedAssets = lazy(() => import("./pages/GeneratedAssets.tsx"));
const Index = lazy(() => import("./pages/Index.tsx"));
const LegalPage = lazy(() => import("./pages/LegalPage.tsx"));
const LongContent = lazy(() => import("./pages/LongContent.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const MuNewsStudio = lazy(() => import("./pages/MuNewsStudio.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const RuntimeSetup = lazy(() => import("./pages/RuntimeSetup.tsx"));
const StoryAuthorStudio = lazy(() => import("./pages/StoryAuthorStudio.tsx"));
const StoryReviewStudio = lazy(() => import("./pages/StoryReviewStudio.tsx"));
const StoryVideoStudio = lazy(() => import("./pages/StoryVideoStudio.tsx"));
const YoutubePublishing = lazy(() => import("./pages/YoutubePublishing.tsx"));

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
                <Route path="/" element={<Index />} />
                <Route path="/maze-pathfinding" element={<AlgorithmWorld />} />
                <Route path="/algorithm-world" element={<AlgorithmWorld />} />
                <Route path="/long-content" element={<LongContent />} />
                <Route path="/mu-news" element={<MuNewsStudio />} />
                <Route path="/story-author" element={<StoryAuthorStudio />} />
                <Route path="/story-review" element={<StoryReviewStudio />} />
                <Route path="/story-video" element={<StoryVideoStudio />} />
                <Route path="/assets" element={<GeneratedAssets />} />
                <Route path="/channel" element={<YoutubePublishing />} />
                <Route path="/social-publishing" element={<LegacyChannelRedirect />} />
                <Route path="/youtube-publishing" element={<LegacyChannelRedirect />} />
                <Route path="/youtube" element={<LegacyChannelRedirect />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/setup" element={<RuntimeSetup />} />
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
