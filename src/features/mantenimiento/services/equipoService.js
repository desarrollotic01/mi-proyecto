import api from "../../../services/api";

export const equipoService = {
  getEquipos,
  createEquipo,
  updateEquipo,
  deleteEquipo,
};

function getEquipos() {
  return api.get("/equipo").then(res => {
    return Array.isArray(res.data) ? res.data : [];
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
