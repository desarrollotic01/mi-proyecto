import api from "../../../services/api";

export const portalClienteService = {
  generarLink,
  listarLinks,
  desactivarLink,
  obtenerAcceso,
};

function generarLink(clienteId, payload = {}) {
  return api
    .post(`/portal-cliente/generar-link/${clienteId}`, payload)
    .then((res) => res.data?.data || res.data);
}

function listarLinks(clienteId) {
  return api.get(`/portal-cliente/links/${clienteId}`).then((res) => {
    return Array.isArray(res.data)
      ? res.data
      : (res.data?.links || res.data?.data || []);
  });
}

function desactivarLink(id) {
  return api
    .patch(`/portal-cliente/desactivar/${id}`)
    .then((res) => res.data?.data || res.data);
}

function obtenerAcceso(token) {
  return api
    .get(`/portal-cliente/acceso/${token}`)
    .then((res) => res.data?.data || res.data);
}