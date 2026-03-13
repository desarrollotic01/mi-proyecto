import api from "../../../services/api";

export const itemService = {
  getAll: async () => {
    const response = await api.get("/items");
    return response.data;
  },
};