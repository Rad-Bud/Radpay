import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
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
import Financials from "./pages/dashboard/Financials";
import RechargeBalance from "./pages/dashboard/RechargeBalance";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Unauthorized from "./pages/Unauthorized";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <LanguageProvider>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* Users - Super Admin & Wholesaler */}
                  <Route element={<ProtectedRoute allowedRoles={['super_admin', 'wholesaler']} />}>
                    <Route path="/dashboard/users" element={<Users />} />
                  </Route>

                  {/* Super Admin Only */}
                  <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                    <Route path="/dashboard/sims" element={<Sims />} />
                    <Route path="/dashboard/offers" element={<Offers />} />
                    <Route path="/dashboard/games" element={<Games />} />
                    <Route path="/dashboard/delivery-apps" element={<DeliveryApps />} />
                  </Route>

                  {/* All Authenticated Users */}
                  <Route path="/dashboard/financials" element={<Financials />} />
                  <Route path="/dashboard/notifications" element={<Notifications />} />
                  <Route path="/dashboard/complaints" element={<Complaints />} />
                  <Route path="/dashboard/transactions" element={<Transactions />} />
                  <Route path="/dashboard/recharge-balance" element={<RechargeBalance />} />
                  <Route path="/dashboard/settings" element={<Settings />} />
                </Route>

                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </LanguageProvider>
);

export default App;
