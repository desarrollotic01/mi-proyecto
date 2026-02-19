import api from "../../../services/api";

// Crear tratamiento (con o sin solicitud)
export const createTratamiento = (avisoId, payload) =>
  api.post(`tratamiento/avisos/${avisoId}/tratamiento`, payload)
     .then(r => r.data);

// Obtener tratamiento de un aviso
export const getTratamientoByAviso = (avisoId) =>
  api.get(`tratamiento/avisos/${avisoId}/tratamiento`)
     .then(r => r.data);
