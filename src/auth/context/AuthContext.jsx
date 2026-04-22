import { createContext, useContext, useEffect, useState } from "react";
import { loginRequest, meRequest, logoutRequest } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) { setLoading(false); return; }

      try {
        const data = await meRequest();
        const userData = data.data || data;
        const userPermisos = userData.rol?.permisos?.map(p => p.nombre) || [];

        setUser(userData);
        setPermisos(userPermisos);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setPermisos([]);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (usuario, contraseña) => {
    const data = await loginRequest(usuario, contraseña);
    localStorage.setItem("token", data.token);

    // Cargar perfil completo con permisos
    const me = await meRequest();
    const userData = me.data || me;
    const userPermisos = userData.rol?.permisos?.map(p => p.nombre) || [];

    setUser(userData);
    setPermisos(userPermisos);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = async () => {
    await logoutRequest();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPermisos([]);
  };

  // Verificar si el usuario tiene un permiso específico
  const hasPermiso = (permiso) => permisos.includes("all_access") || permisos.includes(permiso);

  return (
    <AuthContext.Provider value={{ user, permisos, loading, login, logout, hasPermiso }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
