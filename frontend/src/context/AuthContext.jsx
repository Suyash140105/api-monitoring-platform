import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const TOKEN_KEY = "pulsemonitor_token";
const USER_KEY = "pulsemonitor_user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      }
    } else {
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const authFetch = useCallback(
    async (url, options = {}) => {
      const currentToken = localStorage.getItem(TOKEN_KEY);
      const headers = {
        ...(options.headers || {}),
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      };

      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        logout();
      }

      return response;
    },
    [logout]
  );

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    authFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
