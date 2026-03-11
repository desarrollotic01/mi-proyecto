import api from "../../../services/api";

export const planMantenimientoService = {
  getPlanes,
  getPlanById,
  getPlanesByEquipo,
  getPlanesByUbicacionTecnica,
  createPlan,
};

function getPlanes() {
  return api.get("/plan-mantenimiento").then((res) => {
    return Array.isArray(res.data) ? res.data : [];
  });
}

function getPlanById(id) {
  return api.get(`/plan-mantenimiento/${id}`).then((res) => res.data);
}

function getPlanesByEquipo(equipoId) {
  return api
    .get(`/plan-mantenimiento/equipo/${equipoId}`)
    .then((res) => (Array.isArray(res.data) ? res.data : []));
}

function getPlanesByUbicacionTecnica(ubicacionTecnicaId) {
  return api
    .get(`/plan-mantenimiento/ubicacion-tecnica/${ubicacionTecnicaId}`)
    .then((res) => (Array.isArray(res.data) ? res.data : []));
}

function createPlan(payload) {
  return api.post("/plan-mantenimiento", payload).then((res) => res.data);
}