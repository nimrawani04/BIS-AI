import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LowBandwidthProvider } from "@/hooks/useLowBandwidth";
import BISHome from "./pages/BISHome";
import BISChat from "./pages/BISChat";
import CertificationGuide from "./pages/CertificationGuide";
import StandardsExplorer from "./pages/StandardsExplorer";
import AboutBIS from "./pages/AboutBIS";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AdminCrawl from "./pages/AdminCrawl";
import RiskMapPage from "./pages/RiskMapPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LowBandwidthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/" element={<BISHome />} />
              <Route path="/chat" element={<BISChat />} />
              <Route path="/certification" element={<CertificationGuide />} />
              <Route path="/standards" element={<StandardsExplorer />} />
              <Route path="/about" element={<AboutBIS />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/risk-map" element={<RiskMapPage />} />
              <Route path="/admin/crawl" element={<AdminCrawl />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LowBandwidthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
