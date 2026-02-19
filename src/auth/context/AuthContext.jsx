import { createContext, useContext, useEffect, useState } from "react";
import { loginRequest, meRequest } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // 🔐 Siempre validar token en backend
        const data = await meRequest(token);
        const userData = data.user || data.usuario || data;

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (error) {
        // ❌ Token inválido o expirado
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (alias, password) => {
    const data = await loginRequest(alias, password);

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.usuario));

    setUser(data.usuario);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
