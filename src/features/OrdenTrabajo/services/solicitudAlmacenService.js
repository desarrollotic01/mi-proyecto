// services/solicitudAlmacenService.js
import api from "../../../services/api";

export const updateSolicitudAlmacen = async (id, data) => {
  try {
    const response = await api.put(`/solicitudalmacen/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar solicitud de almacén:", error);
    throw error;
  }
};

export const getSolicitudAlmacenById = async (id) => {
  try {
    const response = await api.get(`/solicitudalmacen/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener solicitud de almacén:", error);
    throw error;
  }
};

export const getSolicitudesAlmacenAgrupadasParaSap = async ({
  tratamientoId,
  ordenTrabajoId,
  incluirGeneral = true,
  incluirIndividuales = true,
}) => {
  try {
    const response = await api.get(`/solicitudalmacen/agrupadas/sap`, {
      params: {
        tratamientoId,
        ordenTrabajoId,
        incluirGeneral,
        incluirIndividuales,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener solicitudes agrupadas para SAP:", error);
    throw error;
  }
};


export const createSolicitudAlmacen = async (data) => {
  try {
    const response = await api.post(`/solicitudalmacen`, data);
    return response.data;
  } catch (error) {
    console.error("Error al crear solicitud de almacén:", error);
    throw error;
  }
};

