import { createContext, useContext, useEffect, useState } from "react";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  useEffect(() => {
    setRefreshToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc1MDgwMTYwOSwiaWF0IjoxNzQ4MjA5NjA5LCJqdGkiOiJjM2NmYjM2MDJkMDI0M2MzODdlZDZmNDFjMmRlMzIzYSIsInVzZXJfaWQiOjJ9.nvME4o0qPBuM-wbpJOiArUqGOk3L2Th-1owk3evbrhU");
  }, []);

  useEffect(() => {
    const refreshAccessToken = async () => {
      if (!refreshToken) return;
      try {
        const response = await fetch("http://127.0.0.1:8000/user/token/refresh/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        const data = await response.json();

        if (response.ok && data.access) {
          setAccessToken(data.access);
        } else {
          throw new Error("Refresh failed");
        }
      } catch (err) {
        console.error("Token refresh error:", err);
        setAccessToken(null);
      }
    };

    refreshAccessToken(); 
    const interval = setInterval(refreshAccessToken, 5 * 60 * 1000); 

    return () => clearInterval(interval);
  }, [refreshToken]);

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, setRefreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
