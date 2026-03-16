import api from "../../../services/api";

export const UbicacionTecnicaService = {
  getUbicacionTecnicas,
  createUbicacionTecnica,
  updateUbicacionTecnica,
  deleteUbicacionTecnica,
  getUbicacionesByClienteId,
};

function getUbicacionTecnicas() {
  return api.get("/ubicacion-tecnica").then(res => {
    return Array.isArray(res.data) ? res.data : [];
  });
}

function getUbicacionesByClienteId(clienteId) {
  return api.get(`/ubicacion-tecnica/cliente/${clienteId}`).then((res) => {
    return Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data)
      ? res.data
      : [];
  });
}


function createUbicacionTecnica(payload) {
  return api.post("/ubicacion-tecnica", payload).then(res => res.data);
}

function updateUbicacionTecnica(id, payload) {
  return api.put(`/ubicacion-tecnica/${id}`, payload).then(res => res.data);
}

function deleteUbicacionTecnica(id) {
  return api.delete(`/ubicacion-tecnica/${id}`).then(res => res.data);
}
