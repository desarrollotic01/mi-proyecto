import api from "../../../services/api";

export const familiaService = {
  getFamilias,
  getContactosByFamilia,
  createFamilia,
  updateFamilia,
  deleteFamilia,
};

function getFamilias() {
  return api.get("/familia").then((res) => {
    return Array.isArray(res.data) ? res.data : [];
  });
}

function getContactosByFamilia(familiaId) {
  return api
    .get(`/familia/${familiaId}/contactos`)
    .then((res) => res.data);
}

function createFamilia(payload) {
  return api.post("/familia", payload).then((res) => res.data);
}

function updateFamilia(id, payload) {
  return api.put(`/familia/${id}`, payload).then((res) => res.data);
}

function deleteFamilia(id) {
  return api.delete(`/familia/${id}`).then((res) => res.data);
}
