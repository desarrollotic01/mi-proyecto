import api from "../../../services/api";

export const getContactosPorCliente = (clienteId) =>
  api.get(`/contacto/cliente/${clienteId}`).then(res => res.data); 