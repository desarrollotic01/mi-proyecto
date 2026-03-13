import { useState, useRef, useEffect } from "react";
import { ESTADOS_AV } from "../config/camposMantenimiento";

import {
  obtenerAvisos,
  crearAviso,
  actualizarEstadoAviso,
  obtenerAvisosOrigenManual,
  obtenerAvisosOrigenGuia,
} from "../services/avisoServices";
import { getAllOrdenesTrabajo } from "../services/ordenTrabajoService";

import {
  getViewConfig,
  saveViewConfig,
  resetViewConfig,
} from "../services/UserViewConfigService";

import { createTratamiento } from "../services/tratamientoService";
import { crearOrdenTrabajo } from "../services/ordenTrabajoService";
import { getOrdenTrabajoById } from "../services/ordenTrabajoService";

/* ================= MAPAS ESTADO ================= */
const ESTADO_KEY_MAP = {
  creado: "CREADO",
  tratado: "TRATADO",
  "con OT": "CON_OT",
  rechazado: "RECHAZADO",
  finalizado: "FINALIZADO",
  facturado: "FACTURADO",
  "finalizado sin facturacion": "FINALIZADO_SIN_FACTURACION",
};

const ESTADO_BACK_MAP = Object.fromEntries(
  Object.entries(ESTADO_KEY_MAP).map(([k, v]) => [v, k])
);

/* ================= DEFAULT CONFIG ================= */
const DEFAULT_FIELDS = {
  numeroAviso: true,
  cliente: true,
  tipoAviso: true,
  estado: true,
  fecha: true,
  equipo: true,
  descripcion: true,
  prioridad: true,
  solicitante: true,
  tipoMantenimiento: true,
  ordenVenta: true,
  centroCosto: true,
  producto: true,
  ordenCliente: true,
  almacen: true,
  sede: true,
  nombreContacto: true,
  correoContacto: true,
  numeroContacto: true,
  ubicacionTecnica: true,
  direccionAtencion: true,
  supervisorAsignado: true,
  estadoAviso: true,
  documentos: true,
  documentoFinal: true,
  descripcionResumida: true,
};

const DEFAULT_ORDER = [
  "numeroAviso",
  "tipoAviso",
  "cliente",
  "estado",
  "fecha",
  "prioridad",
  "equipo",
  "tipoMantenimiento",
  "descripcionResumida",
  "descripcion",
  "solicitante",
  "ordenVenta",
  "centroCosto",
  "producto",
  "ordenCliente",
  "almacen",
  "sede",
  "nombreContacto",
  "correoContacto",
  "numeroContacto",
  "ubicacionTecnica",
  "direccionAtencion",
  "supervisorAsignado",
  "estadoAviso",
  "documentos",
  "documentoFinal",
];

export function useMantenimiento() {
  const calendarRef = useRef(null);

  /* ================= NAV ================= */
  const [activeTab, setActiveTab] = useState("kanban");
  const [calendarView, setCalendarView] = useState("dayGridMonth");

  /* ================= MODALES ================= */
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewStep, setViewStep] = useState(1);


  /* ================= WIZARD OT ================= */
const [equiposSeleccionadosOT, setEquiposSeleccionadosOT] = useState([]);
const [equiposProcesadosOT, setEquiposProcesadosOT] = useState([]);
const [indiceEquipoActual, setIndiceEquipoActual] = useState(0);


  const [tratamientoOpen, setTratamientoOpen] = useState(false);
  const [avisoTratamiento, setAvisoTratamiento] = useState(null);

  const [ordenTrabajoOpen, setOrdenTrabajoOpen] = useState(false);
  const [avisoOrdenTrabajo, setAvisoOrdenTrabajo] = useState(null);
/* ================= ORDENES DE TRABAJO ================= */
const [ordenesTrabajoCompletas, setOrdenesTrabajoCompletas] = useState([]);

  /* ================= FILTROS ================= */
  const [filters, setFilters] = useState({
    search: "",
    prioridad: "",
    tipoMantenimiento: "",
    solicitante: "",
  });

  /* ================= CONFIG ================= */
  const [configOpen, setConfigOpen] = useState(false);
  const [cardFields, setCardFields] = useState(DEFAULT_FIELDS);
  const [columnOrder, setColumnOrder] = useState(DEFAULT_ORDER);

  /* ================= FORM AVISO ================= */
  const initialFormData = {
    tipoAviso: "mantenimiento",
    numeroAviso: "",
    descripcionResumida: "",
    descripcion: "",
    prioridad: "",
    tipoMantenimiento: "",
    producto: "",
    fechaAtencion: "",
    cliente: "",
    solicitante: "",
    equipos: [],
    documentos: [],
  };

  const [formData, setFormData] = useState(initialFormData);


  const abrirOrdenTrabajo = async (ordenId) => {
  try {
    const ot = await getOrdenTrabajoById(ordenId);
    setOrdenTrabajoSeleccionada(ot);
    setOrdenTrabajoViewOpen(true);
  } catch (error) {
    console.error("Error cargando OT:", error);
  }
};
  /* ================= DATA ================= */
  const [columns, setColumns] = useState(() =>
    Object.keys(ESTADOS_AV).reduce((acc, k) => {
      acc[k] = { name: ESTADOS_AV[k].label, items: [] };
      return acc;
    }, {})
  );

  /* ================= HELPERS ================= */
  const getEstadoBadge = (estadoBack) => {
    const key = ESTADO_KEY_MAP[estadoBack];
    return ESTADOS_AV[key]?.badge;
  };

  const cargarOrdenesTrabajo = async () => {
  try {
    const ots = await getAllOrdenesTrabajo();
    setOrdenesTrabajoCompletas(ots || []);
  } catch (error) {
    console.error("Error cargando órdenes de trabajo:", error);
    setOrdenesTrabajoCompletas([]);
  }
};


  // 🆕 FUNCIÓN PARA TRANSFORMAR AVISOS DEL BACKEND
  const transformarAviso = (aviso) => {
    return {
      ...aviso,
      // 🔄 Transformar equiposRelacion → equipos (array de IDs)
      equipos: aviso.equiposRelacion?.map(rel => rel.equipoId) || [],
      // Mantener el original por si se necesita
      equiposRelacionOriginal: aviso.equiposRelacion,
      // 🔄 Transformar solicitante si viene como objeto
      solicitante: aviso.solicitante?.nombreApellido || aviso.solicitante || "",
      // 🔄 Asegurarse que el cliente sea string (razón social)
      cliente: aviso.cliente?.razonSocial || aviso.cliente || "",
    };
  };

  /* ================= LOAD AVISOS ================= */
 const cargarAvisos = async () => {
  try {
    const response = await obtenerAvisosOrigenManual();
    const avisos = Array.isArray(response) ? response : [];

    const cols = Object.keys(ESTADOS_AV).reduce((acc, k) => {
      acc[k] = { name: ESTADOS_AV[k].label, items: [] };
      return acc;
    }, {});

    avisos.forEach((aviso) => {
      const key = ESTADO_KEY_MAP[aviso.estadoAviso];
      if (!key) return;

      const avisoTransformado = transformarAviso(aviso);
      cols[key].items.push({ ...avisoTransformado, estado: key });
    });

    setColumns(cols);
  } catch (error) {
    console.error("Error cargando avisos:", error);

    const cols = Object.keys(ESTADOS_AV).reduce((acc, k) => {
      acc[k] = { name: ESTADOS_AV[k].label, items: [] };
      return acc;
    }, {});

    setColumns(cols);
  }
};

  useEffect(() => {
    cargarAvisos();
    cargarOrdenesTrabajo();
  }, []);

  /* ================= LOAD VIEW CONFIG ================= */
  useEffect(() => {
    const cargarConfigVista = async () => {
      try {
        const config = await getViewConfig(activeTab);
        if (config) {
          setCardFields(config.cardFields);
          setColumnOrder(config.columnOrder);
          setFilters(config.filters);
        } else {
          setCardFields(DEFAULT_FIELDS);
          setColumnOrder(DEFAULT_ORDER);
        }
      } catch {
        setCardFields(DEFAULT_FIELDS);
        setColumnOrder(DEFAULT_ORDER);
      }
    };

    cargarConfigVista();
  }, [activeTab]);




  /* ================= CALENDAR ================= */
  useEffect(() => {
    if (activeTab === "calendario" && calendarRef.current) {
      calendarRef.current.getApi().changeView(calendarView);
    }
  }, [activeTab, calendarView]);

  

  /* ================= CRUD AVISO ================= */
  const handleSaveAll = async () => {
    await crearAviso(formData);
    await cargarAvisos();
    setModalOpen(false);
  };

  const cambiarEstado = async (aviso, nuevoEstadoFront) => {
    // Si el nuevo estado es CON_OT, abrir el modal de Orden de Trabajo
    if (nuevoEstadoFront === "CON_OT") {
      setAvisoOrdenTrabajo(aviso);
      
      return;
    }

    const nuevoEstadoBack = ESTADO_BACK_MAP[nuevoEstadoFront];
    if (!nuevoEstadoBack) return;
    await actualizarEstadoAviso(aviso.id, nuevoEstadoBack);
    await cargarAvisos();
  };

  /* ================= CONFIG ACTIONS ================= */
  const guardarConfigVista = async () => {
    await saveViewConfig(activeTab, {
      cardFields,
      columnOrder,
      filters,
    });
    setConfigOpen(false);
  };

  const resetConfigVista = async () => {
    await resetViewConfig(activeTab);
    setCardFields(DEFAULT_FIELDS);
    setColumnOrder(DEFAULT_ORDER);
    setFilters({
      search: "",
      prioridad: "",
      tipoMantenimiento: "",
      solicitante: "",
    });
  };

  /* ================= TRATAMIENTO ================= */
  const abrirTratamiento = (aviso) => {
    setAvisoTratamiento(aviso);
    setTratamientoOpen(true);
  };

  const guardarTratamiento = async (tratamientoData) => {
    await createTratamiento(tratamientoData);
    await cargarAvisos();
    setTratamientoOpen(false);
    setAvisoTratamiento(null);
  };

  /* ================= ORDEN DE TRABAJO ================= */
 const guardarOrdenTrabajo = async (payload) => {
  try {
    // 👉 Guardar en backend
    const nuevaOT = await crearOrdenTrabajo(payload);

    // 👉 Actualizar estado local correcto
    setOrdenesTrabajoCompletas(prev => [...prev, nuevaOT]);

    // 👉 Limpiar aviso activo
    setAvisoOrdenTrabajo(null);

    // (opcional pero recomendado)
    await cargarAvisos();

  } catch (error) {
    console.error("Error guardando OT:", error);
  }
};



const iniciarOTs = (equipos) => {
  setEquiposSeleccionadosOT(equipos);
  setEquiposProcesadosOT([]); 
  setIndiceEquipoActual(0);
  setOrdenTrabajoOpen(true);
};


  /* ================= DRAG AND DROP ================= */
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Si no hay destino o es el mismo lugar, no hacer nada
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Actualizar estado localmente primero (optimistic update)
    const newColumns = { ...columns };
    const sourceItems = Array.from(newColumns[source.droppableId].items);
    const [movedItem] = sourceItems.splice(source.index, 1);
    
    const destItems = source.droppableId === destination.droppableId 
      ? sourceItems 
      : Array.from(newColumns[destination.droppableId].items);
    
    destItems.splice(destination.index, 0, movedItem);

    newColumns[source.droppableId].items = sourceItems;
    newColumns[destination.droppableId].items = destItems;
    
    setColumns(newColumns);

    // Actualizar en el backend
    try {
      const nuevoEstadoBack = ESTADO_BACK_MAP[destination.droppableId];
      if (nuevoEstadoBack) {
        await actualizarEstadoAviso(draggableId, nuevoEstadoBack);
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      // Recargar para revertir cambios si falla
      await cargarAvisos();
    }
  };

  /* ================= RETURN ================= */
  return {
    calendarRef,

    activeTab,
    setActiveTab,
    calendarView,
    setCalendarView,

    modalOpen,
    setModalOpen,

    viewOpen,
    setViewOpen,
    viewData,
    setViewData,
    viewStep,
    setViewStep,

    tratamientoOpen,
    avisoTratamiento,
    abrirTratamiento,
    setTratamientoOpen,
    setAvisoTratamiento,
    guardarTratamiento,

    ordenTrabajoOpen,
    avisoOrdenTrabajo,
    setOrdenTrabajoOpen,
    setAvisoOrdenTrabajo,
    guardarOrdenTrabajo,
    ordenesTrabajoCompletas,


    filters,
    setFilters,

    configOpen,
    setConfigOpen,
    cardFields,
    setCardFields,
    columnOrder,
    setColumnOrder,

    formData,
    setFormData,

    columns,

    handleSaveAll,
    cambiarEstado,

    getEstadoBadge,

    guardarConfigVista,
    resetConfigVista,

    onDragEnd, // 🆕 Agregar onDragEnd al return
    transformarAviso, // 🆕 Exportar por si se necesita

    
    equiposSeleccionadosOT,
    setEquiposSeleccionadosOT,
    equiposProcesadosOT,
    setEquiposProcesadosOT,
    indiceEquipoActual,
    setIndiceEquipoActual,  
    abrirOrdenTrabajo,

  };
} 