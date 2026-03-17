import { useState } from 'react';

export const usePDFReport = (clientes = [], paises = []) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfData, setPdfData] = useState(null);

  const handleOpenPDF = (item) => {
    // Buscamos la data enriquecida una sola vez aquí
    const cli = (Array.isArray(clientes) ? clientes : []).find(c => String(c.id) === String(item.clienteId));
    const pFound = (Array.isArray(paises) ? paises : []).find(p => String(p.id) === String(item.paisId));

    setPdfData({
      ...item,
      nombreClienteEnriquecido: cli?.razonSocial || cli?.nombre || "Sin Cliente",
      nombrePaisEnriquecido: pFound?.nombre || "-"
    });
    setPdfOpen(true);
  };

  return {
    pdfOpen,
    pdfData,
    setPdfOpen,
    handleOpenPDF
  };
};
