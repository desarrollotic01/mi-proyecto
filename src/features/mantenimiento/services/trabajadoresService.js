import api from "../../../services/api";

export function getTrabajadores(rol) {
  return api.get("/trabajador", {
    params: rol ? { rol } : {},
  }).then(res => Array.isArray(res.data) ? res.data : []);
}

export function getTrabajadorById(id) {
  return api.get(`/trabajador/${id}`).then(res => res.data);
}

export function createTrabajador(payload) {
  return api.post("/trabajador", payload).then(res => res.data);
}

export function updateTrabajador(id, payload) {
  return api.put(`/trabajador/${id}`, payload).then(res => res.data);
}

export function deleteTrabajador(id) {
  return api.delete(`/trabajador/${id}`).then(res => res.data);
}


export const trabajadorService = {
  getTrabajadores,
  getTrabajadorById,
  createTrabajador,
  updateTrabajador,
  deleteTrabajador,
};