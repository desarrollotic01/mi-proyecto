
import api from "../../../services/api";

export const getViewConfig = (view) =>
  api.get(`/view-config/${view}`).then(r => r.data);

export const saveViewConfig = (view, data) =>
  api.put(`/view-config/${view}`, data).then(r => r.data);

// Reset SOLO filtros
export const resetViewConfig = (view) =>
  api.post(`/view-config/${view}/reset-filtros`).then(r => r.data);