import api from "../../../services/api";

export const getSolicitudesAlmacen = (page = 1, pageSize = 20, search = "") =>
  api.get("/solicitudalmacen", { params: { page, pageSize, search } }).then(r => r.data);

export const getSolicitudesCompra = (page = 1, pageSize = 20, search = "") =>
  api.get("/solicitudCompra", { params: { page, pageSize, search } }).then(r => r.data);
