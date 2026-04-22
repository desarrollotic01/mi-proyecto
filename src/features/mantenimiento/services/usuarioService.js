import api from "../../../services/api";

export function getUsuarios() {
  return api.get("/usuario/selector").then((res) =>
    Array.isArray(res.data?.data) ? res.data.data : []
  );
}

export function getUsuarioById(id) {
  return api.get(`/usuario/${id}`).then((res) => res.data);
}
