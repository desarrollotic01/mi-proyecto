// src/features/mantenimiento/hooks/useMantenimiento.jsx
import { useState, useRef, useEffect } from "react";
import { ESTADOS_AV } from "../config/camposMantenimiento";

export function useMantenimiento() {
  const calendarRef = useRef(null);

  /* ================= NAV ================= */
  const [activeTab, setActiveTab] = useState("kanban");
  const [calendarView, setCalendarView] = useState("dayGridMonth");

  /* ================= MODAL ================= */
  const [modalOpen, setModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);

  /* ================= VIEW ================= */
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewStep, setViewStep] = useState(1);

  /* ================= FILTROS ================= */
  const [tratamientoOpen, setTratamientoOpen] = useState(false);
  const [avisoTratamiento, setAvisoTratamiento] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    prioridad: "",
    tipoMantenimiento: "",
    solicitante: "",
  });

  /* ================= CONFIG TARJETAS ================= */
  const [configOpen, setConfigOpen] = useState(false);
  const [cardFields, setCardFields] = useState({
    numeroAviso: true,
    equipo: true,
    cliente: true,
    fecha: true,
    estado: true,
    descripcion: false,
    prioridad: false,
    solicitante: false,
    tipoMantenimiento: false,
  });

  const [columnOrder, setColumnOrder] = useState([
    "numeroAviso",
    "descripcion",
    "cliente",
    "equipo",
    "estado",
    "fecha",
    "prioridad",
    "solicitante",
    "tipoMantenimiento",
  ]);

  /* ================= FORM ================= */
  const initialFormData = {
    numeroAviso: "",
    descripcion: "",
    producto: "",
    cliente: "",
    ordenCliente: "",
    fechaAtencion: "",
    estado: "creado",
    equipos: [],
    ubicacionTecnica: "",
    prioridad: "",
    solicitante: "",
    tipoMantenimiento: "",
    direccionAtencion: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  /* ================= DATA ================= */
  const [columns, setColumns] = useState(
    Object.keys(ESTADOS_AV).reduce((acc, key) => {
      acc[key] = { name: ESTADOS_AV[key].label, items: [] };
      return acc;
    }, {})
  );

  const [calendarEvents, setCalendarEvents] = useState([]);

  /* ================= HELPERS ================= */
  const getEventColor = (estado) =>
    ESTADOS_AV[estado]?.color || "#e5e7eb";

  const getEventTextColor = (estado) =>
    ESTADOS_AV[estado]?.text || "#374151";

  const getEstadoBadge = (estado) =>
    ESTADOS_AV[estado]?.badge ||
    "bg-gray-100 text-gray-700 border-gray-300";

  /* ================= EFFECT ================= */
  useEffect(() => {
    if (activeTab === "calendario" && calendarRef.current) {
      calendarRef.current.getApi().changeView(calendarView);
    }
  }, [activeTab, calendarView]);

  return {
    // refs
    calendarRef,

    // nav
    activeTab,
    setActiveTab,
    calendarView,
    setCalendarView,

    // modals
    modalOpen,
    setModalOpen,
    wizardStep,
    setWizardStep,
    selectedDate,
    setSelectedDate,

    viewOpen,
    setViewOpen,
    viewData,
    setViewData,
    viewStep,
    setViewStep,

    tratamientoOpen,
    setTratamientoOpen,
    avisoTratamiento,
    setAvisoTratamiento,

    // filtros
    filters,
    setFilters,

    // config
    configOpen,
    setConfigOpen,
    cardFields,
    setCardFields,
    columnOrder,
    setColumnOrder,

    // form
    formData,
    setFormData,
    initialFormData,

    // data
    columns,
    setColumns,
    calendarEvents,
    setCalendarEvents,

    // helpers
    getEventColor,
    getEventTextColor,
    getEstadoBadge,
  };
}
