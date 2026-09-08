import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { adminLogin, adminMe } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    const token = localStorage.getItem("gp_admin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { admin } = await adminMe();
      setAdmin(admin);
    } catch {
      localStorage.removeItem("gp_admin_token");
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = async (password, email) => {
    let payload = {};
    if (typeof password === "object" && password !== null) {
      payload = password;
    } else if (email) {
      payload = { email, password };
    } else {
      payload = { password };
    }
    const { token, admin } = await adminLogin(payload);
    localStorage.setItem("gp_admin_token", token);
    setAdmin(admin);
    return admin;
  };

  const logout = () => {
    localStorage.removeItem("gp_admin_token");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
