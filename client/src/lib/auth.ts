import { User } from "@shared/schema";

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const getStoredAuth = (): { token: string | null; user: User | null } => {
  try {
    const token = localStorage.getItem("smartcal_token");
    const userStr = localStorage.getItem("smartcal_user");
    const user = userStr ? JSON.parse(userStr) : null;
    
    return { token, user };
  } catch (error) {
    console.error("Error reading auth from localStorage:", error);
    return { token: null, user: null };
  }
};

export const setStoredAuth = (token: string, user: User): void => {
  try {
    localStorage.setItem("smartcal_token", token);
    localStorage.setItem("smartcal_user", JSON.stringify(user));
  } catch (error) {
    console.error("Error storing auth in localStorage:", error);
  }
};

export const clearStoredAuth = (): void => {
  try {
    localStorage.removeItem("smartcal_token");
    localStorage.removeItem("smartcal_user");
  } catch (error) {
    console.error("Error clearing auth from localStorage:", error);
  }
};

export const isSuperAdmin = (user: User | null): boolean => {
  return user?.role === "super_admin";
};

export const hasRole = (user: User | null, role: string): boolean => {
  return user?.role === role;
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

export const getAuthHeaders = (token: string | null) => {
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};
