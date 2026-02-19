// Estados VISUALES (UI)
export const ESTADOS_AV = {
  CREADO: {
    label: "Creado",
    color: "#e5e7eb",
    text: "#374151",
    badge: "bg-gray-200 text-gray-800 border-gray-300",
  },
  TRATADO: {
    label: "Tratado",
    color: "#fde68a",
    text: "#78350f",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  CON_OT: {
    label: "Con OT",
    color: "#bfdbfe",
    text: "#1e3a8a",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
  },
  RECHAZADO: {
    label: "Rechazado",
    color: "#fecaca",
    text: "#7f1d1d",
    badge: "bg-red-100 text-red-800 border-red-300",
  },
  FINALIZADO: {
    label: "Finalizado",
    color: "#bbf7d0",
    text: "#14532d",
    badge: "bg-green-100 text-green-800 border-green-300",
  },
  FACTURADO: {
    label: "Facturado",
    color: "#ddd6fe",
    text: "#4c1d95",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
  },
  FINALIZADO_SIN_FACTURACION: {
    label: "Finalizado sin facturación",
    color: "#e0e7ff",
    text: "#312e81",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
};

// MAPEO BACKEND → UI (ESTO ES CLAVE)
export const ESTADO_KEY_MAP = {
  creado: "CREADO",
  tratado: "TRATADO",
  "con OT": "CON_OT",
  rechazado: "RECHAZADO",
  finalizado: "FINALIZADO",
  facturado: "FACTURADO",
  "finalizado sin facturacion": "FINALIZADO_SIN_FACTURACION",
};
