import api from "../../../services/api";

export const guiaMantenimientoService = {
  getGuias,
  getGuiaById,
  createGuia,
  ejecutarProgramacion,
  cancelarProgramacion,
};

// =======================
// GET ALL
// =======================
function getGuias() {
  return api.get("/guia-mantenimiento").then((res) => {
    return Array.isArray(res.data) ? res.data : [];
  });
}

// =======================
// GET BY ID
// =======================
function getGuiaById(id) {
  return api.get(`/guia-mantenimiento/${id}`).then((res) => res.data);
}

// =======================
// CREATE
// =======================
function createGuia(payload) {
  return api.post("/guia-mantenimiento", payload).then((res) => res.data);
}

// =======================
// EJECUTAR PROGRAMACIÓN
// =======================
function ejecutarProgramacion(id, payload = {}) {
  return api
    .post(`/programaciones/${id}/ejecutar`, payload)
    .then((res) => res.data);
}

// =======================
// CANCELAR PROGRAMACIÓN
// =======================
function cancelarProgramacion(id, payload = {}) {
  return api
    .post(`/programaciones/${id}/cancelar`, payload)
    .then((res) => res.data);
}