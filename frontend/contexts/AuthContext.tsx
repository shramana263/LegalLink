"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { API } from "@/lib/api";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  type?: "client" | "advocate" | "user"; // Include both possible fields
  userType?: "client" | "advocate" | "user";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  updateUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing session on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await API.Auth.getProfile();
        console.log("Auth profile response:", res.data);
        setUser(res.data);
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await API.Auth.signInEmail({ email, password });
      setUser(res.data.user);
      router.push("/feed");
      return res.data.user; // Return user data for further use if needed
    } catch (error) {
      alert("Invalid login credentials");
      setUser(null);
    } finally {
      setIsLoading(false);

    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Add logout API call here if available
      setUser(null);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await API.Auth.signUpEmail(data);
      setUser(res.data.user);
      router.push("/feed");
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      await API.Auth.updateUser(data);
      setUser((prev) => (prev ? { ...prev, ...data } : null));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, register, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Fetching data from the new location
const fetchData = async () => {
  const response = await fetch("/data/data.json");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data = await response.json();
  return data;
};
