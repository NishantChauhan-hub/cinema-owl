import React, { createContext, useState, useEffect } from "react";
import { apiFetch } from "../utils";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("cinemaowl_token");
    if (token) {
      apiFetch("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(data => {
          if (data && data.email) {
            setUser(data);
          } else {
            localStorage.removeItem("cinemaowl_token");
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("cinemaowl_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("cinemaowl_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
