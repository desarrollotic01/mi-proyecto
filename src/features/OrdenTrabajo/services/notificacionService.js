import api from "../../../services/api";

export const crearNotificacionService = async (data) => {
  const response = await api.post("/notificaciones", data);
  return response.data;
};

export const obtenerNotificacionService = async (id) => {
  const response = await api.get(`/notificaciones/${id}`);
  return response.data;
};

export const finalizarNotificacionService = async (id) => {
  const response = await api.patch(`/notificaciones/${id}/finalizar`);
  return response.data;
};

export const getNotificacionesByOT = (ordenTrabajoId) =>
  api.get(`/notificaciones/ot/${ordenTrabajoId}`).then(r => r.data);

export const abrirPdfNotificacion = async (id) => {
  try {
    const res = await api.get(`/notificaciones/${id}/pdf`, {
      responseType: "blob",
    });

    const file = new Blob([res.data], { type: "application/pdf" });
    const fileURL = URL.createObjectURL(file);
    window.open(fileURL, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(fileURL), 60_000);
  } catch (err) {
    try {
      const blob = err?.response?.data;
      if (blob instanceof Blob) {
        const text = await blob.text(); // <-- aquí está el error real
        console.error("PDF error body:", text);

        // intenta parsear JSON
        try {
          const json = JSON.parse(text);
          alert(json.message || json.error || text);
        } catch {
          alert(text);
        }
      } else {
        console.error(err);
        alert(err?.response?.data?.message || err.message || "Error abriendo PDF");
      }
    } catch (e) {
      console.error(err);
      alert("Error abriendo PDF");
    }
  }
};