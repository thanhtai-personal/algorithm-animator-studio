import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PublicWebBanner } from "./components/PublicWebBanner";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppHeader } from "@/components/AppHeader";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();
const AlgorithmWorld = lazy(() => import("./pages/AlgorithmWorld.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const GeneratedAssets = lazy(() => import("./pages/GeneratedAssets.tsx"));
const Index = lazy(() => import("./pages/Index.tsx"));
const LongContent = lazy(() => import("./pages/LongContent.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const StoryVideoStudio = lazy(() => import("./pages/StoryVideoStudio.tsx"));
const YoutubePublishing = lazy(() => import("./pages/YoutubePublishing.tsx"));

const AnalyticsTracker = () => {
  const location = useLocation();
  const path = `${location.pathname}${location.search}${location.hash}`;

  return <Analytics mode="production" route={location.pathname} path={path} />;
};

const RouteFallback = () => (
  <main className="grid min-h-[60vh] place-items-center px-4 text-sm font-medium text-muted-foreground">
    Loading...
  </main>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="algoshorts.theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsTracker />
          <PublicWebBanner />
          <AppHeader />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route path="/maze-pathfinding" element={<AlgorithmWorld />} />
              <Route path="/algorithm-world" element={<AlgorithmWorld />} />
              <Route path="/long-content" element={<LongContent />} />
              <Route path="/story-video" element={<StoryVideoStudio />} />
              <Route path="/assets" element={<GeneratedAssets />} />
              <Route path="/social-publishing" element={<YoutubePublishing />} />
              <Route path="/youtube-publishing" element={<YoutubePublishing />} />
              <Route path="/youtube" element={<YoutubePublishing />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
