import api from "../../../services/api";
// ajusta a tu baseURL

export const sapCatalogosService = {
  async getRubros() {
    const res = await api.get("/sap/rubros");
    return res.data;
  },

  async getPaquetes() {
    const res = await api.get("/sap/paquetes");
    return res.data;
  },
};