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
const AlgorithmLongVideoPage = lazy(() => import("./pages/AlgorithmLongVideoPage.tsx"));
const MazePathfindingPage = lazy(() => import("./pages/MazePathfindingPage.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const GeneratedAssets = lazy(() => import("./pages/GeneratedAssets.tsx"));
const JobManagement = lazy(() => import("./pages/JobManagement.tsx"));
const LegalPage = lazy(() => import("./pages/LegalPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const TextToSpeech = lazy(() => import("./pages/TextToSpeech.tsx"));

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
                <Route path="/" element={<Navigate replace to="/algorithms" />} />
                <Route path="/algorithms" element={<AlgorithmChannelPage />} />
                <Route path="/algorithms/short" element={<AlgorithmChannelPage />} />
                <Route path="/algorithms/manual" element={<Navigate replace to="/algorithms" />} />
                <Route path="/algorithms/agentic" element={<Navigate replace to="/algorithms" />} />
                <Route path="/algorithms/maze" element={<MazePathfindingPage />} />
                <Route path="/algorithms/maze/manual" element={<Navigate replace to="/algorithms/maze" />} />
                <Route path="/algorithms/maze/agentic" element={<Navigate replace to="/algorithms/maze" />} />
                <Route path="/algorithms/video-long" element={<AlgorithmLongVideoPage />} />
                <Route path="/algorithms/video-long/manual" element={<Navigate replace to="/algorithms/video-long" />} />
                <Route path="/algorithms/video-long/agentic" element={<Navigate replace to="/algorithms/video-long" />} />
                <Route path="/maze-pathfinding" element={<Navigate replace to="/algorithms/maze" />} />
                <Route path="/algorithm-world" element={<Navigate replace to="/algorithms/maze" />} />
                <Route path="/long-content" element={<Navigate replace to="/algorithms/video-long" />} />
                <Route path="/text-to-speech" element={<TextToSpeech />} />
                <Route path="/assets" element={<GeneratedAssets />} />
                <Route path="/jobs" element={<JobManagement />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/providers" element={<Navigate replace to="/settings?tab=tools" />} />
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
