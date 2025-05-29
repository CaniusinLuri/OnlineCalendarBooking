import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/auth/protected-route";

// Pages
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Calendars from "@/pages/calendars";
import Bookings from "@/pages/bookings";
import Teams from "@/pages/teams";
import Settings from "@/pages/settings";
import Integrations from "@/pages/integrations";
import AdminUsers from "@/pages/admin/users";
import AdminSecurity from "@/pages/admin/security";
import AdminBlacklist from "@/pages/admin/blacklist";
import PublicBookingPage from "@/pages/public/booking-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/:userAlias.:pageAlias" component={PublicBookingPage} />
      
      {/* Protected routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/calendars">
        <ProtectedRoute>
          <Calendars />
        </ProtectedRoute>
      </Route>
      
      <Route path="/bookings">
        <ProtectedRoute>
          <Bookings />
        </ProtectedRoute>
      </Route>
      
      <Route path="/teams">
        <ProtectedRoute>
          <Teams />
        </ProtectedRoute>
      </Route>
      
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>

      <Route path="/integrations">
        <ProtectedRoute>
          <Integrations />
        </ProtectedRoute>
      </Route>
      
      {/* Super Admin routes */}
      <Route path="/admin/users">
        <ProtectedRoute requireSuperAdmin>
          <AdminUsers />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/security">
        <ProtectedRoute requireSuperAdmin>
          <AdminSecurity />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/blacklist">
        <ProtectedRoute requireSuperAdmin>
          <AdminBlacklist />
        </ProtectedRoute>
      </Route>
      
      {/* Default redirect to dashboard */}
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
