import api from "../../../services/api";

// Crear tratamiento
export const createTratamiento = (avisoId, payload) =>
  api.post(`tratamiento/avisos/${avisoId}/tratamiento`, payload)
    .then((r) => r.data);

// Obtener tratamiento por aviso
export const getTratamientoByAviso = (avisoId) =>
  api.get(`tratamiento/avisos/${avisoId}/tratamiento`)
    .then((r) => r.data);

// Guardar cambios de un tratamiento existente
export const saveTratamientoDraft = (tratamientoId, payload) =>
  api.patch(`tratamiento/${tratamientoId}/guardar`, payload)
    .then((r) => r.data);