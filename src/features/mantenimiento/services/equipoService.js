import api from "../../../services/api";

export const equipoService = {
  getEquipos,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  getEquiposByClienteId,
  actualizarAdjuntosPortal,
  getEquipoById,
};

function getEquipos() {
  return api.get("/equipo").then(res => {
    return Array.isArray(res.data) ? res.data : [];
  });
}

function getEquipoById(id) {
  return api.get(`/equipo/${id}`).then(res => res.data);
}

function getEquiposByClienteId(clienteId) {
  return api.get(`/equipo/cliente/${clienteId}`).then((res) => {
    return Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data)
      ? res.data
      : [];
  });
}

  

function createEquipo(payload) {
  return api.post("/equipo", payload).then(res => res.data);
}

function updateEquipo(id, payload) {
  return api.put(`/equipo/${id}`, payload).then(res => res.data);
}

function deleteEquipo(id) {
  return api.delete(`/equipo/${id}`).then(res => res.data);
}


async function actualizarAdjuntosPortal(equipoId, adjuntosPortal) {
  const res = await api.put(`/equipo/${equipoId}/adjuntos-portal`, {
    adjuntosPortal,
  });
  return res.data?.data || res.data;
}