import { createContext, useContext, useEffect, useState } from "react";
import { loginRequest, meRequest } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // 🔥 SI NO HAY TOKEN, NO LLAMAMOS /me
    if (!token) {
      setLoading(false);
      return;
    }

    meRequest(token)
      .then((data) => {
        // data puede ser { user } o el user directo
        setUser(data.user || data);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (alias, password) => {
    const data = await loginRequest(alias, password);

    localStorage.setItem("token", data.token);
    setUser(data.usuario); // 🔥 AQUÍ SE SETEA EL USUARIO
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
