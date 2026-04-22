// services/solicitudCompraService.js
import api from "../../../services/api";

export const updateSolicitudCompra = async (id, data) => {
  try {
    const response = await api.put(`/solicitudcompra/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar solicitud de compra:", error);
    throw error;    
  }
};

export const getSolicitudCompraById = async (id) => {
  try {
    const response = await api.get(`/solicitudcompra/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener solicitud de compra:", error);
    throw error;
  }
};

export const syncSolicitudCompraById = async (id) => {
  try {
    const response = await api.post(`/solicitudcompra/${id}/enviar-sap`);
    return response.data;
  } catch (error) {
    console.error("Error al sincronizar solicitud de compra con SAP:", error);
    throw error;
  }
};

export const createSolicitudCompra = async (data) => {
  try {
    const response = await api.post(`/solicitudcompra`, data);
    return response.data;
  } catch (error) {
    console.error("Error al crear solicitud de compra:", error);
    throw error;
  }
};