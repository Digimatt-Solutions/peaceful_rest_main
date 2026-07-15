import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth";
import MemorialDetail from "./pages/MemorialDetail";
import Overview from "./pages/dashboard/Overview";
import MyMemorials from "./pages/dashboard/MyMemorials";
import ObituaryManagement from "./pages/dashboard/ObituaryManagement";
import FamilyTree from "./pages/dashboard/FamilyTree";
import Condolences from "./pages/dashboard/Condolences";
import Fundraising from "./pages/dashboard/Fundraising";
import LifeMoments from "./pages/dashboard/LifeMoments";
import Anniversary from "./pages/dashboard/Anniversary";

import Community from "./pages/dashboard/Community";
import AccessControl from "./pages/dashboard/AccessControl";
import Oversight from "./pages/dashboard/Oversight";
import ActivityLogs from "./pages/dashboard/ActivityLogs";
import Profile from "./pages/dashboard/Profile";
import Settings from "./pages/dashboard/Settings";

const queryClient = new QueryClient();

// Toggle Quicksand-everywhere mode on body for all routes except landing + memorial detail.
const FontModeManager = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const preserveSerif = pathname === "/" || pathname.startsWith("/memorial/");
    document.body.classList.toggle("font-quicksand-all", !preserveSerif);
  }, [pathname]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <FontModeManager />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/memorial/:id" element={<MemorialDetail />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Overview />} />
              <Route path="memorials" element={<MyMemorials />} />
              <Route path="obituary" element={<ObituaryManagement />} />
              <Route path="family" element={<FamilyTree />} />
              <Route path="condolences" element={<Condolences />} />
              <Route path="fundraising" element={<Fundraising />} />
              <Route path="moments" element={<LifeMoments />} />
              <Route path="anniversary" element={<Anniversary />} />
              <Route path="community" element={<Community />} />
              <Route path="access" element={<AccessControl />} />
              <Route path="oversight" element={<Oversight />} />
              <Route path="activity" element={<ActivityLogs />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
