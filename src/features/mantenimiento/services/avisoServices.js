import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* =========================
   NORMALIZADOR
========================= */
const normalizarAviso = (aviso) => ({
  ...aviso,
  estado: aviso.estadoAviso, // 👈 CLAVE
});

/* =========================
   CRUD
========================= */
export const obtenerAvisos = async () => {
  const res = await api.get("/avisos");
  return res.data;
};


export const obtenerAvisosOrigenManual = async () => {
  const response = await api.get("/avisos/origen/manual");
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

export const obtenerAvisosOrigenGuia = async () => {
  const response = await api.get("/avisos/origen/guia");
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

export const crearAviso = async (payload) => {
  const isFormData = payload instanceof FormData;
  const config = isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
  const { data } = await api.post("/avisos", payload, config);
  return normalizarAviso(data);
};

export const actualizarEstadoAviso = async (id, estadoAviso) => {
  const { data } = await api.patch(`/avisos/${id}/estado`, {
    estadoAviso,
  });
  return normalizarAviso(data);
};
