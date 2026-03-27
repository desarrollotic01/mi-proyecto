import api from "../../../services/api";

export const guiaMantenimientoService = {
  getGuias,
  getGuiaById,
  createGuia,
  patchGuia, // Nombre estándar para actualizaciones parciales
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
// PATCH / UPDATE ESTADO
// =======================
// Esta es la función que usará el Kanban para mover las piezas
async function patchGuia(id, data) {
  try {
    const res = await api.patch(`/guia-mantenimiento/${id}`, data);
    return res.data;
  } catch (error) {
    console.error(`Error al actualizar guía ${id}:`, error);
    throw error;
  }
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