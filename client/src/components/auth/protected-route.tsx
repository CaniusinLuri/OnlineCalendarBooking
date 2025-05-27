import { useAuth } from "@/hooks/use-auth";
import { isSuperAdmin } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireSuperAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireSuperAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        setLocation("/login");
        return;
      }

      if (requireSuperAdmin && !isSuperAdmin(user)) {
        setLocation("/dashboard");
        return;
      }
    }
  }, [isAuthenticated, user, isLoading, requireAuth, requireSuperAdmin, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireSuperAdmin && !isSuperAdmin(user)) {
    return null;
  }

  return <>{children}</>;
}
