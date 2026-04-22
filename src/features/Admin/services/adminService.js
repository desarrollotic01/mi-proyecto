import api from "../../../services/api";

// ─── USUARIOS ──────────────────────────────────────────────────────────────
export const getUsuarios = (page = 1, pageSize = 20, search = "") =>
  api.get("/usuario", { params: { page, pageSize, search } }).then(r => r.data);

export const createUsuario = (data) =>
  api.post("/usuario", data).then(r => r.data);

export const updateUsuario = (id, data) =>
  api.patch(`/usuario/${id}`, data).then(r => r.data);

export const deleteUsuario = (id) =>
  api.delete(`/usuario/${id}`).then(r => r.data);

export const getConectados = () =>
  api.get("/usuario/connected").then(r => r.data);

// ─── ROLES ─────────────────────────────────────────────────────────────────
export const getRoles = (page = 1, pageSize = 100, search = "") =>
  api.get("/admin/roles", { params: { page, pageSize, search } }).then(r => r.data);

export const getRolById = (id) =>
  api.get(`/admin/roles/${id}`).then(r => r.data);

export const createRol = (data) =>
  api.post("/admin/roles", data).then(r => r.data);

export const updateRol = (id, data) =>
  api.patch(`/admin/roles/${id}`, data).then(r => r.data);

export const deleteRol = (id) =>
  api.delete(`/admin/roles/${id}`).then(r => r.data);

// ─── PERMISOS ───────────────────────────────────────────────────────────────
export const getPermisos = (page = 1, pageSize = 200) =>
  api.get("/admin/permisos", { params: { page, pageSize } }).then(r => r.data);

export const createPermiso = (data) =>
  api.post("/admin/permisos", data).then(r => r.data);

export const updatePermiso = (id, data) =>
  api.patch(`/admin/permisos/${id}`, data).then(r => r.data);

export const deletePermiso = (id) =>
  api.delete(`/admin/permisos/${id}`).then(r => r.data);
