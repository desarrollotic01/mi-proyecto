import { useState, useRef, useEffect } from "react";
import { ESTADOS_AV } from "../config/camposMantenimiento";
import {
  obtenerAvisos,
  crearAviso,
  actualizarEstadoAviso,
} from "../services/avisoServices";

export function useMantenimiento() {
  const calendarRef = useRef(null);

  /* ================= NAV ================= */
  const [activeTab, setActiveTab] = useState("kanban");
  const [calendarView, setCalendarView] = useState("dayGridMonth");

  /* ================= MODALS ================= */
  const [modalOpen, setModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewStep, setViewStep] = useState(1);

  const [tratamientoOpen, setTratamientoOpen] = useState(false);
  const [avisoTratamiento, setAvisoTratamiento] = useState(null);

  /* ================= FILTROS ================= */
  const [filters, setFilters] = useState({
    search: "",
    prioridad: "",
    tipoMantenimiento: "",
    solicitante: "",
  });

  /* ================= CONFIG ================= */
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
    tipoAviso: "mantenimiento",
    ordenVenta: "",
    centroCosto: "",
    numeroAviso: "",
    descripcionResumida: "",
    descripcion: "",
    prioridad: "",
    tipoMantenimiento: "",
    producto: "",
    fechaAtencion: "",
    cliente: "",
    ordenCliente: "",
    almacen: "",
    sede: "",
    nombreContacto: "",
    correoContacto: "",
    numeroContacto: "",
    ubicacionTecnica: "",
    direccionAtencion: "",
    solicitante: "",
    supervisorAsignado: "",
    equipos: [],
    documentos: [],
  };

  const [formData, setFormData] = useState(initialFormData);

  /* ================= DATA ================= */
  const [columns, setColumns] = useState(
    Object.keys(ESTADOS_AV).reduce((acc, key) => {
      acc[key] = { name: ESTADOS_AV[key].label, items: [] };
      return acc;
    }, {})
  );

  /* ================= HELPERS ================= */
  const getEstadoBadge = (estado) =>
    ESTADOS_AV[estado]?.badge ||
    "bg-gray-100 text-gray-700 border-gray-300";

  /* ================= LOAD AVISOS ================= */
const cargarAvisos = async () => {
  const avisos = await obtenerAvisos();

  // Creamos columnas vacías por estado
  const cols = Object.keys(ESTADOS_AV).reduce((acc, key) => {
    acc[key] = {
      name: ESTADOS_AV[key].label,
      items: [],
    };
    return acc;
  }, {});

  // Metemos cada aviso en su columna
  avisos.forEach((aviso) => {
    const estado = aviso.estadoAviso; // 👈 BACKEND

    if (cols[estado]) {
      cols[estado].items.push({
        ...aviso,
        estado, // 👈 FRONT NORMALIZADO
      });
    }
  });

  setColumns(cols);
};


  useEffect(() => {
    cargarAvisos();
  }, []);

  /* ================= CALENDAR ================= */
  useEffect(() => {
    if (activeTab === "calendario" && calendarRef.current) {
      calendarRef.current.getApi().changeView(calendarView);
    }
  }, [activeTab, calendarView]);

  /* ================= CRUD ================= */
  const handleSaveAll = async () => {
    const nuevo = await crearAviso(formData);
    await cargarAvisos();
    setModalOpen(false);
  };

  const cambiarEstado = async (aviso, nuevoEstado) => {
    await actualizarEstadoAviso(aviso.id, nuevoEstado);
    await cargarAvisos();
  };

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

    // actions
    handleSaveAll,
    cambiarEstado,

    // helpers
    getEstadoBadge,
  };
}
