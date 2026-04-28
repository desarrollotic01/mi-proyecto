import api from "../../../services/api";

export const sedeService = {
  async crearSede(payload) {
    const res = await api.post("/sede", payload);
    return res.data?.data || res.data;
  },

  async getSedesByClienteId(clienteId) {
    const res = await api.get(`/sede/cliente/${clienteId}`);
    return res.data?.data || res.data;
  },

  async asignarEquipos(sedeId, payload) {
    const res = await api.put(`/sede/${sedeId}/asignar-equipos`, payload);
    return res.data?.data || res.data;
  },

  async asignarUbicacionesTecnicas(sedeId, payload) {
    const res = await api.put(`/sede/${sedeId}/asignar-ubicaciones-tecnicas`, payload);
    return res.data?.data || res.data;
  },
};