import api from "../../../services/api";

export const adjuntosService = {
  uploadArchivos: async (files) => {
    const formData = new FormData();

    for (let file of files) {
      formData.append("files", file);
    }

    const response = await api.post(
      "adjuntos/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
    // devuelve [{nombre,url,tipo}]
  },
};
