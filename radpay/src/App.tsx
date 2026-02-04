import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/dashboard/Users";
import Sims from "./pages/dashboard/Sims";
import Offers from "./pages/dashboard/Offers";
import Games from "./pages/dashboard/Games";
import DeliveryApps from "./pages/dashboard/DeliveryApps";
import Notifications from "./pages/dashboard/Notifications";
import Complaints from "./pages/dashboard/Complaints";
import Transactions from "./pages/dashboard/Transactions";
import Settings from "./pages/dashboard/Settings";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/users" element={<Users />} />
              <Route path="/dashboard/sims" element={<Sims />} />
              <Route path="/dashboard/offers" element={<Offers />} />
              <Route path="/dashboard/games" element={<Games />} />
              <Route path="/dashboard/delivery-apps" element={<DeliveryApps />} />
              <Route path="/dashboard/notifications" element={<Notifications />} />
              <Route path="/dashboard/complaints" element={<Complaints />} />
              <Route path="/dashboard/transactions" element={<Transactions />} />
              <Route path="/dashboard/settings" element={<Settings />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
