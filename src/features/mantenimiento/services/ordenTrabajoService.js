import api from "../../../services/api";

// Crear orden de trabajo
export const crearOrdenTrabajo = ( payload) =>
  api.post(`/orden-trabajo`, payload)
     .then(r => r.data);

// Obtener orden de trabajo de un aviso
export const getOrdenTrabajoByAviso = (avisoId) =>
  api.get(`/avisos/${avisoId}/ordenTrabajo`)
     .then(r => r.data);

export const getAllOrdenesTrabajo = () =>
  api.get(`/orden-trabajo`)
     .then(r => r.data);

export const getOrdenTrabajoById = (ordenId) =>
  api.get(`/orden-trabajo/${ordenId}`)
     .then(r => r.data);

export const updateEstadoOrdenTrabajo = (ordenId, nuevoEstado) =>
  api.patch(`/orden-trabajo/${ordenId}/estado`, { estado: nuevoEstado })
     .then(r => r.data);

export const getEquiposDisponiblesPorAviso = (avisoId) =>
  api.get(`/equipo-aviso/${avisoId}/equipos-disponibles`)
     .then(res => res.data);

export const liberarOrdenTrabajo = (ordenId) =>
  api.patch(`/orden-trabajo/${ordenId}/liberar`)
     .then(r => r.data);

export const getSolicitudesTratamientoPorOrdenTrabajo = (ordenId) =>
  api.get(`/orden-trabajo/${ordenId}/solicitudes-tratamiento`).then((r) => r.data);

export const updateOrdenTrabajoCompleta = async (id, data) => {
  try {
    const response = await api.patch(`/orden-trabajo/${id}/completa`, data);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar orden de trabajo completa:", error);
    throw error;
  }
};