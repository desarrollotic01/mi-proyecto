import api from "../../../services/api";

/**
 * Abre el PDF de una Orden de Trabajo
 */
export const abrirPdfOrdenTrabajo = async (ordenTrabajoId) => {
  try {
    const res = await api.get(`/orden-pdf/${ordenTrabajoId}/pdf`, {
      responseType: "blob",
    });

    const file = new Blob([res.data], { type: "application/pdf" });
    const fileURL = URL.createObjectURL(file);

    // 👉 abre en nueva pestaña
    window.open(fileURL, "_blank", "noopener,noreferrer");

    // limpiar memoria
    setTimeout(() => URL.revokeObjectURL(fileURL), 60_000);

  } catch (err) {
    try {
      const blob = err?.response?.data;

      if (blob instanceof Blob) {
        const text = await blob.text();
        console.error("PDF error body:", text);

        // intentar parsear JSON
        try {
          const json = JSON.parse(text);
          alert(json.message || json.error || text);
        } catch {
          alert(text);
        }
      } else {
        console.error(err);
        alert(
          err?.response?.data?.message ||
          err.message ||
          "Error generando PDF de la OT"
        );
      }

    } catch (e) {
      console.error(err);
      alert("Error generando PDF de la OT");
    }
  }
};