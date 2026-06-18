import { createContext, useContext, useState, useEffect } from "react";
import { getHome, logoutApi } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHome()
      .then(setUser)
      .catch(() => setUser({ role: "guest" }))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await logoutApi();
    setUser({ role: "guest" });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);