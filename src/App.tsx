import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DeviceDetail from "./pages/DeviceDetail";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const AUTH_STORAGE_KEY = "snug-hub-authenticated";

const RequireAuth = ({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: JSX.Element;
}) => {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

const AnimatedRoutes = ({
  isAuthenticated,
  onLogin,
  onLogout,
}: {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
}) => {
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
        <Route path="/login" element={<Login isAuthenticated={isAuthenticated} onLogin={onLogin} />} />
        <Route
          path="/"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <Dashboard onLogout={onLogout} />
            </RequireAuth>
          }
        />
        <Route
          path="/device/:deviceId"
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <DeviceDetail />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY) === "true");

  const handleLogin = () => {
    localStorage.setItem(AUTH_STORAGE_KEY, "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes isAuthenticated={isAuthenticated} onLogin={handleLogin} onLogout={handleLogout} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
