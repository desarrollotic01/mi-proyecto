// services/personalCorreoService.js
import api from "../../../services/api";

export const getPersonalCorreo = async () => {
  try {
    const response = await api.get("/personal-correo");
    return response.data;
  } catch (error) {
    console.error("Error al obtener contactos:", error);
    throw error;
  }
};

export const createPersonalCorreo = async (data) => {
  try {
    const response = await api.post("/personal-correo", data);
    return response.data;
  } catch (error) {
    console.error("Error al crear contacto:", error);
    throw error;
  }
};

export const deletePersonalCorreo = async (id) => {
  try {
    const response = await api.delete(`/personal-correo/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar contacto:", error);
    throw error;
  }
};