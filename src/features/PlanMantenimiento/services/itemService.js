import api from "../../../services/api";

export const itemService = {
  getAll: async () => {
    const response = await api.get("/items");
    return response.data;
  },

  // 🔥 NUEVO: obtener warehouses por item
  getWarehouses: async (itemCode) => {
    const response = await api.get(`/items/${itemCode}/warehouses`);
    return response.data;
  },
};

