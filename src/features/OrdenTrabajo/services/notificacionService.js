import api from "../../../services/api";

export const crearNotificacionService = async (data) => {
  const response = await api.post("/notificaciones", data);
  return response.data;
};

export const obtenerNotificacionService = async (id) => {
  const response = await api.get(`/notificaciones/${id}`);
  return response.data;
};

export const finalizarNotificacionService = async (id) => {
  const response = await api.patch(`/notificaciones/${id}/finalizar`);
  return response.data;
};
