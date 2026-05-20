import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PublicWebBanner } from "./components/PublicWebBanner";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppHeader } from "@/components/AppHeader";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AlgorithmWorld from "./pages/AlgorithmWorld.tsx";
import Auth from "./pages/Auth.tsx";
import Index from "./pages/Index.tsx";
import LongContent from "./pages/LongContent.tsx";
import NotFound from "./pages/NotFound.tsx";
import Settings from "./pages/Settings.tsx";
import StoryVideoStudio from "./pages/StoryVideoStudio.tsx";
import YoutubePublishing from "./pages/YoutubePublishing.tsx";

const queryClient = new QueryClient();

const AnalyticsTracker = () => {
  const location = useLocation();
  const path = `${location.pathname}${location.search}${location.hash}`;

  return <Analytics mode="production" route={location.pathname} path={path} />;
};

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
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/algorithm-world" element={<AlgorithmWorld />} />
            <Route path="/long-content" element={<LongContent />} />
            <Route path="/story-video" element={<StoryVideoStudio />} />
            <Route path="/social-publishing" element={<YoutubePublishing />} />
            <Route path="/youtube-publishing" element={<YoutubePublishing />} />
            <Route path="/youtube" element={<YoutubePublishing />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
