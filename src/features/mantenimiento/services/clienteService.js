import api from "../../../services/api";

export const clienteService = {
  getClientes,
  getContactosByCliente,
  createCliente,
  updateCliente,
  deleteCliente,
};

function getClientes() {
  return api.get("/cliente").then((res) => {
    return Array.isArray(res.data) ? res.data : [];
  });
}

function getContactosByCliente(clienteId) {
  return api
    .get(`/cliente/${clienteId}/contactos`)
    .then((res) => res.data);
}

function createCliente(payload) {
  return api.post("/cliente", payload).then((res) => res.data);
}

function updateCliente(id, payload) {
  return api.put(`/cliente/${id}`, payload).then((res) => res.data);
}

function deleteCliente(id) {
  return api.delete(`/cliente/${id}`).then((res) => res.data);
}
