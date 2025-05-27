import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@shared/schema";
import { AuthState, getStoredAuth, setStoredAuth, clearStoredAuth, isTokenExpired } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const { token, user } = getStoredAuth();
      
      if (token && user && !isTokenExpired(token)) {
        try {
          // Verify token is still valid
          const response = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const currentUser = await response.json();
            setAuthState({
              user: currentUser,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Token is invalid, clear stored auth
            clearStoredAuth();
            setAuthState({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Auth verification failed:", error);
          clearStoredAuth();
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await response.json();
      
      setStoredAuth(data.token, data.user);
      setAuthState({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      const data = await response.json();
      
      setStoredAuth(data.token, data.user);
      setAuthState({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      toast({
        title: "Account created!",
        description: "Welcome to SmartCal. Your account has been created successfully.",
      });
    } catch (error) {
      console.error("Registration failed:", error);
      toast({
        title: "Registration failed",
        description: "Unable to create account. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    clearStoredAuth();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const updateUser = (userData: Partial<User>) => {
    if (authState.user) {
      const updatedUser = { ...authState.user, ...userData };
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
      
      // Update stored user data
      if (authState.token) {
        setStoredAuth(authState.token, updatedUser);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
