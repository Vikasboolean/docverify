import { createContext, useContext, useEffect, useState } from "react";
import * as api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("docverify_token");
    const storedUser = localStorage.getItem("docverify_user");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // ignore corrupt cache
      }
    }
    setInitializing(false);
  }, []);

  async function signIn(credentials) {
    const { data } = await api.login(credentials);
    setUser(data.user);
    return data.user;
  }

  async function signUp(details) {
    const { data } = await api.register(details);
    setUser(data.user);
    return data.user;
  }

  function signOut() {
    api.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, initializing, isAuthenticated: !!user, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
