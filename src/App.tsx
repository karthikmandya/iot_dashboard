import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DeviceDetail from "./pages/DeviceDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  const [transitionClass, setTransitionClass] = useState("route-enter");

  useEffect(() => {
    setTransitionClass("route-enter");
    const timeout = window.setTimeout(() => {
      setTransitionClass("route-enter route-enter-active");
    }, 24);
    return () => window.clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <div className={`route-stage ${transitionClass}`}>
      <Routes location={location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/device/:deviceId" element={<DeviceDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
