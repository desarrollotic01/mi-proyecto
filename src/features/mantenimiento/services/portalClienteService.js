import api from "../../../services/api";

export const portalClienteService = {
  generarLink,
  listarLinks,
  desactivarLink,
  obtenerAcceso,
};

// FÍJATE EN LAS COMILLAS INVERTIDAS ( ` ) EN LAS RUTAS
function generarLink(clienteId, payload = {}) {
  return api.post(`/portal-cliente/generar-link/${clienteId}`, payload).then((res) => res.data);
}

function listarLinks(clienteId) {
  return api.get(`/portal-cliente/links/${clienteId}`).then((res) => {
    return Array.isArray(res.data) ? res.data : (res.data?.links || res.data?.data || []);
  });
}

function desactivarLink(id) {
  return api.patch(`/portal-cliente/desactivar/${id}`).then((res) => res.data);
}

// Este GET debe ser a la ruta /acceso/:token que es pública en el back
function obtenerAcceso(token) {
  return api.get(`/portal-cliente/acceso/${token}`).then((res) => res.data);
}