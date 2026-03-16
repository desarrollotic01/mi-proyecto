import axios from "axios";

// 👉 URL DEL BACKEND (ej: http://localhost:4000)
const API_URL = import.meta.env.VITE_API_URL || "http://76.13.68.123:4000";

const api = axios.create({
  baseURL: API_URL,
});

// 👉 INTERCEPTOR PARA TOKEN
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;