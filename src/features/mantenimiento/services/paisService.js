import api from "../../../services/api";

export const paisService = {
  getPaises,
  createPais,
  updatePais,
  deletePais,
};

function getPaises() {
  return api.get("/pais").then(res => {
    return Array.isArray(res.data) ? res.data : [];
  });
}
  

function createPais(payload) {
  return api.post("/pais", payload).then(res => res.data);
}

function updatePais(id, payload) {
  return api.put(`/pais/${id}`, payload).then(res => res.data);
}

function deletePais(id) {
  return api.delete(`/pais/${id}`).then(res => res.data);
}
