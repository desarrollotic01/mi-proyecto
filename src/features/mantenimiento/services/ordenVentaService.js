import api from "../../../services/api";

export const ordenVentaService = {
  getAll: async () => {
    const response = await api.get("/ordenes-venta");
    return Array.isArray(response.data) ? response.data : [];
  },
};
