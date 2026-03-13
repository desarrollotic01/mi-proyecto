import api from "../../../services/api";

export const rubroService = {
  getAll: async () => {
    const response = await api.get("/rubros");
    return response.data;
  },
};