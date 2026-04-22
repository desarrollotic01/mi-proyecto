import api from "../../services/api";

// Login → POST /login/signin
export const loginRequest = async (usuario, contraseña) => {
  const res = await api.post("/login/signin", { usuario, contraseña });
  return res.data;
};

// Mi usuario (el interceptor ya agrega el token) → GET /usuario/me
export const meRequest = async () => {
  const res = await api.get("/usuario/me");
  return res.data;
};

// Logout → GET /login/logout
export const logoutRequest = async () => {
  try {
    await api.get("/login/logout");
  } catch (_) {
    // Si falla igual limpiamos local
  }
};
