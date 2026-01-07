import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ModalMantenimiento from "../components/ModalMantenimiento";
import ModalMantenimientoView from "../components/inputs/ModalMantenimientoView";
import ModalTratamiento from "../components/inputs/ModalTratamiento";
import ModalConfiguracionCampos from "../components/ModalConfiguracionCampos";
import "../styles/fullcalendar.css";

/* ================= ESTADOS AV ================= */
const ESTADOS_AV = {
  creado: {
    label: "Creado",
    color: "#e5e7eb",
    text: "#374151",
    badge: "bg-gray-200 text-gray-800 border-gray-300",
  },
  tratado: {
    label: "Tratado",
    color: "#fde68a",
    text: "#78350f",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  "con OT": {
    label: "Con OT",
    color: "#bfdbfe",
    text: "#1e3a8a",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
  },
  rechazado: {
    label: "Rechazado",
    color: "#fecaca",
    text: "#7f1d1d",
    badge: "bg-red-100 text-red-800 border-red-300",
  },
  finalizado: {
    label: "Finalizado",
    color: "#bbf7d0",
    text: "#14532d",
    badge: "bg-green-100 text-green-800 border-green-300",
  },
  facturado: {
    label: "Facturado",
    color: "#ddd6fe",
    text: "#4c1d95",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
  },
  "finalizado sin facturacion": {
    label: "Finalizado sin facturación",
    color: "#e0e7ff",
    text: "#312e81",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
};

export default function Mantenimiento() {
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
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [searchCodigo, setSearchCodigo] = useState("");

  const [tratamientoOpen, setTratamientoOpen] = useState(false);
  const [avisoTratamiento, setAvisoTratamiento] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    prioridad: "",
    tipoMantenimiento: "",
    solicitante: "",
  });

  /* ================= CONFIGURACIÓN TARJETAS ================= */
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

  // Estado para el orden de las columnas
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


    // 🔥 CAMPOS QUE USA EL MODAL
    equipos: [],
    ubicacionTecnica: "",
    prioridad: "",
    solicitante: "",
    tipoMantenimiento: "",
    direccionAtencion: "",
  };


  const [formData, setFormData] = useState(initialFormData);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((p) => ({ ...p, [name]: files[0] }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const abrirTratamiento = (item) => {
    setAvisoTratamiento(item);
    setTratamientoOpen(true);
  };
  const guardarTratamiento = (tratamiento) => {
    if (!avisoTratamiento) return;

    const actualizado = {
      ...avisoTratamiento,
      tratamiento,
      estado: "tratado",
    };

    setColumns((prev) => {
      const nuevo = {};

      Object.keys(prev).forEach((k) => {
        nuevo[k] = {
          ...prev[k],
          items: prev[k].items.filter(
            (i) => i.id !== avisoTratamiento.id
          ),
        };
      });

      nuevo.tratado = {
        ...nuevo.tratado,
        items: [...nuevo.tratado.items, actualizado],
      };

      return nuevo;
    });

    // calendario
    setCalendarEvents((prev) =>
      prev.map((ev) =>
        ev.id === avisoTratamiento.id
          ? {
            ...ev,
            backgroundColor: ESTADOS_AV.tratado.color,
            textColor: ESTADOS_AV.tratado.text,
          }
          : ev
      )
    );

    setTratamientoOpen(false);
    setAvisoTratamiento(null);
  };
  const cambiarEstado = (item, nuevoEstado) => {
    setColumns((prev) => {
      const nuevo = {};

      Object.keys(prev).forEach((k) => {
        nuevo[k] = {
          ...prev[k],
          items: prev[k].items.filter((i) => i.id !== item.id),
        };
      });

      nuevo[nuevoEstado].items.push({
        ...item,
        estado: nuevoEstado,
      });

      return nuevo;
    });

    setCalendarEvents((prev) =>
      prev.map((ev) =>
        ev.id === item.id
          ? {
            ...ev,
            backgroundColor: getEventColor(nuevoEstado),
            textColor: getEventTextColor(nuevoEstado),
          }
          : ev
      )
    );
  };



  /* ================= DATA ================= */
  const [columns, setColumns] = useState(
    Object.keys(ESTADOS_AV).reduce((acc, key) => {
      acc[key] = { name: ESTADOS_AV[key].label, items: [] };
      return acc;
    }, {})
  );

  const [calendarEvents, setCalendarEvents] = useState([]);

  // Función para filtrar las columnas dinámicamente
  const getFilteredColums = () => {
    const newColumns = {};
    Object.keys(columns).forEach((key) => {
      newColumns[key] = {
        ...columns[key],
        items: columns[key].items.filter((item) => {
          const searchLower = filters.search.toLowerCase();

          // Filtro de texto (busca varios campos)
          const matchSearch =
            !filters.search ||
            item.numeroAviso?.toLowerCase().includes(searchLower) ||
            item.descripcion?.toLowerCase().includes(searchLower) ||
            item.cliente?.toLowerCase().includes(searchLower) ||
            item.producto?.toLowerCase().includes(searchLower);

          // Filtros específicos
          const matchPrioridad = !filters.prioridad || item.prioridad === filters.prioridad;
          const matchTipo = !filters.tipoMantenimiento || item.tipoMantenimiento === filters.tipoMantenimiento;
          const matchSolicitante = !filters.solicitante || item.solicitante?.toLowerCase().includes(filters.solicitante.toLowerCase());

          return matchSearch && matchPrioridad && matchTipo && matchSolicitante;
        }),
      };
    });
    return newColumns;
  };

  const filteredColumns = getFilteredColums();

  // Obtener todos los IDs visibles en las columnas filtradas
  const visibleIds = new Set(
    Object.values(filteredColumns).flatMap((col) =>
      col.items.map((item) => item.id)
    )
  );

  // Construir eventos dinámicamente desde los avisos filtrados
  // Esto asegura que siempre tengan los datos actualizados (cliente, equipo, etc.)
  const filteredCalendarEvents = Object.values(filteredColumns)
    .flatMap((col) => col.items)
    .map((item) => ({
      id: item.id,
      title:item.numeroAviso,
      date: item.fechaAtencion || new Date().toISOString().slice(0, 10),
      backgroundColor: ESTADOS_AV[item.estado]?.color,
      textColor: ESTADOS_AV[item.estado]?.text,
      extendedProps: { ...item },
    }));

  /* ================= HELPERS ================= */
  const getEventColor = (estado) =>
    ESTADOS_AV[estado]?.color || "#e5e7eb";

  const getEventTextColor = (estado) =>
    ESTADOS_AV[estado]?.text || "#374151";

  const getEstadoBadge = (estado) =>
    ESTADOS_AV[estado]?.badge ||
    "bg-gray-100 text-gray-700 border-gray-300";

  /* ================= GUARDAR ================= */
  const handleSaveAll = () => {
    const aviso = {
      id: Date.now().toString(),
      ...formData,
      estado: "creado",
    };

    setColumns((prev) => ({
      ...prev,
      creado: {
        ...prev.creado,
        items: [...prev.creado.items, aviso],
      },
    }));

    const fecha =
      formData.fechaAtencion ||
      selectedDate ||
      new Date().toISOString().slice(0, 10);

    setCalendarEvents((prev) => [
      ...prev,
      {
        id: aviso.id,
        title: aviso.numeroAviso, 
        date: fecha,
        backgroundColor: getEventColor("creado"),
        textColor: getEventTextColor("creado"),
        extendedProps: { ...aviso },
      },
    ]);


    setModalOpen(false);
    setWizardStep(1);
    setSelectedDate(null);
    setFormData(initialFormData);
  };

  /* ================= DRAG ================= */
  const onDragEnd = ({ source, destination, draggableId }) => {
    // ❌ Si no hay destino
    if (!destination) return;

    // ✅ MISMA COLUMNA + MISMA POSICIÓN → NO HACER NADA
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];

    //Encontrar el índice real en la lista completa usando el ID
    const sourceIndex = sourceCol.items.findIndex(i => i.id === draggableId);
    if (sourceIndex === -1) return; // Seguridad

    const sourceItems = Array.from(sourceCol.items);
    const [moved] = sourceItems.splice(sourceIndex, 1);

    // 🟦 MISMA COLUMNA (reordenar)
    if (source.droppableId === destination.droppableId) {
      // Misma columna: reinsertar en la nueva posición
      // Nota: Al filtrar, el reordenamiento visual puede ser confuso, 
      // pero esto mantiene la consistencia de datos.
      sourceItems.splice(destination.index, 0, moved);

      setColumns((prev) => ({
        ...prev,
        [source.droppableId]: {
          ...sourceCol,
          items: sourceItems
        },
      }));

    } else {
      // 🟨 DIFERENTE COLUMNA
      moved.estado = destination.droppableId;
      const destItems = Array.from(destCol.items);
      destItems.splice(destination.index, 0, moved);

      setColumns((prev) => ({
        ...prev,
        [source.droppableId]: {
          ...sourceCol,
          items: sourceItems,
        },
        [destination.droppableId]: {
          ...destCol,
          items: destItems
        },
      }));

      // 🔄 Actualizar calendario
      setCalendarEvents((prev) =>
        prev.map((ev) =>
          ev.id === moved.id
            ? {
              ...ev,
              backgroundColor: getEventColor(moved.estado),
              textColor: getEventTextColor(moved.estado),
            }
            : ev
        )
      );

    }

  };


  useEffect(() => {
    if (activeTab === "calendario" && calendarRef.current) {
      calendarRef.current.getApi().changeView(calendarView);
    }
  }, [activeTab, calendarView]);

  // Renderizado personalizado para la celda del día
  const renderDayCellContent = (arg) => {

    const offset = arg.date.getTimezoneOffset();
    const safeDate = new Date(arg.date.getTime() - (offset * 60 * 1000));
    const cellDateStr = safeDate.toISOString().split("T")[0];

    const hasEvents = filteredCalendarEvents.some((ev) => {
      return ev.date === cellDateStr || ev.start === cellDateStr;
    });

    return (
      <div className="relative w-full h-8" 
          >
        {hasEvents && (
        <button
          className="absolute left-0 top-0 bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wide font-bold shadow-sm transition-colors z-50 cursor-pointer"
          style={{ marginTop: '2px', marginLeft: '2px' }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            // Ajuste de Zona Horaria para obtener la fecha correcta (YYYY-MM-DD)
            const offset = arg.date.getTimezoneOffset();
            const safeDate = new Date(arg.date.getTime() - (offset * 60 * 1000));
            const dateStr = safeDate.toISOString().split("T")[0];

            // 1. Establecer la fecha directamente en el formulario
            setFormData({
              ...initialFormData,
              fechaAtencion: dateStr
            });
            
            // 2. Establecer estados auxiliares
            setSelectedDate(dateStr);
            setWizardStep(1);
            setModalOpen(true);
          }}
          title="Añadir aviso aquí"
        >
          Añadir
        </button>
        )}
        
        <span className="absolute right-0 top-0 text-sm font-semibold text-gray-700 pointer-events-none select-none mr-1 mt-1">
          {arg.dayNumberText}
        </span>
      </div>
    );
  };

  // Función para renderizar el contenido de cada evento en el calendario
  const renderEventContent = (eventInfo) => {
    const { extendedProps } = eventInfo.event;

    return(
      <div className="flex flex-col gap-[2px] overflow-hidden text-[10px] leading-tight p-0.5 h-full">
        {/* Siempre mostramos el N° Aviso si está configurado, o por defecto el título */}
        {cardFields.numeroAviso &&(
          <div className="font-bold">{eventInfo.event.title}</div>
        )}

        {cardFields.equipo && (extendedProps.equipos?.[0]?.nombre || extendedProps.producto) && (
          <div className="italic truncate opacity-90">
            {extendedProps.equipos?.[0]?.nombre || extendedProps.producto}
          </div> 
        )}

        {cardFields.cliente && extendedProps.cliente && (
          <div className="truncate">{extendedProps.cliente}</div>
        )}

        {cardFields.prioridad && extendedProps.prioridad && (
          <div>Prioridad: {extendedProps.prioridad}</div>
        )}

        {cardFields.tipoMantenimiento && extendedProps.tipoMantenimiento && (
          <div>{extendedProps.tipoMantenimiento}</div>
        )}

        {cardFields.solicitante && extendedProps.solicitante &&(
          <div>Soli. : {extendedProps.solicitante}</div>
        )}

        {cardFields.descripcion && extendedProps.descripcion && (
          <div className="truncate opacity-75">{extendedProps.descripcion}</div>
        )}

        {/* Estado siempre visible como pequeña marca si no está seleccionado en campos */}
        {cardFields.estado && (
          <div className="mt-auto pt-1">
            <span className="bg-white/30 px-1 rounded text-[9px]">
            {ESTADOS_AV[extendedProps.estado]?.label}
            </span>
          </div>  
        )}
      </div>
    );
  };




  /* ================= UI ================= */
  return (
    <div className="p-4">
      {/* NAV */}
      <div className="flex gap-4 mb-4 border-b pb-2">
        {["kanban", "lista", "calendario"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-2 font-semibold ${activeTab === t && "border-b-2 border-gray-600 text-gray-600"
              }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}

        <button
          className="ml-auto px-4 py-2 rounded-md bg-gray-200 flex items-center gap-2"
          onClick={() => setConfigOpen(true)}
        >
          ⚙️ Configurar
        </button>

        <button
          className="px-4 py-2 rounded-md bg-gray-200"
          onClick={() => {
            setWizardStep(1);
            setSelectedDate(null);
            setModalOpen(true);
          }}
        >
          + Añadir aviso
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-3 rounded-md shadow-sm mb-4 border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Buscador General */}
        <input
          type="text"
          placeholder="🔍 Buscar (N° Aviso, Cliente, Equipo...)"
          className="border p-2 rounded text-sm w-full"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />

        {/* Filtro Prioridad */}
        <select
          className="border p-2 rounded text-sm w-full"
          value={filters.prioridad}
          onChange={(e) => setFilters({ ...filters, prioridad: e.target.value })}
        >
          <option value="">Todas las prioridades</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </select>

        {/* Filtro Tipo Mantenimiento */}
        <select
          className="border p-2 rounded text-sm w-full"
          value={filters.tipoMantenimiento}
          onChange={(e) => setFilters({ ...filters, tipoMantenimiento: e.target.value })}
        >
          <option value="">Todos los tipos</option>
          <option value="Preventivo">Preventivo</option>
          <option value="Correctivo">Correctivo</option>
          <option value="Predictivo">Predictivo</option>
        </select>

        {/* Filtro Solicitante */}
        <input
          type="text"
          placeholder="Solicitante..."
          className="border p-2 rounded text-sm w-full"
          value={filters.solicitante}
          onChange={(e) => setFilters({ ...filters, solicitante: e.target.value })}
        />
      </div>

      {/* ================= KANBAN ================= */}
      {activeTab === "kanban" && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-7 gap-3">
            {Object.entries(filteredColumns).map(([colId, col]) => (
              <Droppable droppableId={colId} key={colId}>
                {(p) => (
                  <div
                    ref={p.innerRef}
                    {...p.droppableProps}
                    className="p-3 rounded-lg border bg-gray-50"
                  >
                    <h3 className="font-semibold mb-2">{col.name}</h3>

                    {col.items.map((item, i) => (
                      <Draggable draggableId={item.id} index={i} key={item.id}>
                        {(p) => (
                          <div
                            ref={p.innerRef}
                            {...p.draggableProps}
                            {...p.dragHandleProps}
                            onClick={() => {
                              setViewData(item);
                              setViewStep(1);
                              setViewOpen(true);
                            }}
                            className="p-2 mb-2 border rounded-sm bg-white shadow-sm cursor-pointer hover:bg-gray-50 text-xs space-y-2"
                          >
                            {/* N° AVISO */}
                            {cardFields.numeroAviso && (
                              <div>
                                <div className="text-[11px] text-gray-500 font-medium uppercase">
                                  N° Aviso
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
                                  #{item.numeroAviso || "—"}
                                </div>
                              </div>
                            )}

                            {/* EQUIPO */}
                            {cardFields.equipo && (
                              <div>
                                <div className="text-[11px] text-gray-500 font-medium uppercase">
                                  Equipo / Maquinaria
                                </div>
                                <div className="text-xs text-gray-800">
                                  {item.equipos?.[0]?.nombre || item.producto || "—"}
                                </div>
                              </div>
                            )}

                            {/* CLIENTE */}
                            {cardFields.cliente && (
                              <div>
                                <div className="text-[11px] text-gray-500 font-medium uppercase">
                                  Cliente
                                </div>
                                <div className="text-xs text-gray-800">
                                  {item.cliente || "—"}
                                </div>
                              </div>
                            )}

                            {/* FECHA */}
                            {cardFields.fecha && (
                              <div>
                                <div className="text-[11px] text-gray-500 font-medium uppercase">
                                  Fecha
                                </div>
                                <div className="text-xs text-gray-800">
                                  {item.fechaAtencion
                                    ? new Date(item.fechaAtencion).toLocaleDateString("es-PE")
                                    : "—"}
                                </div>
                              </div>
                            )}

                            {/* DESCRIPCIÓN (NUEVO) */}
                            {cardFields.descripcion && (
                              <div>
                                <div className="text-[11px] text-gray-500 font-medium uppercase">
                                  Descripción
                                </div>
                                <div className="text-xs text-gray-800 truncate">
                                  {item.descripcion || "—"}
                                </div>
                              </div>
                            )}

                            {/* PRIORIDAD (NUEVO) */}
                            {cardFields.prioridad && (
                              <div>
                                <div className="text-[11px] text-gray-500 font-medium uppercase">
                                  Prioridad
                                </div>
                                <div className="text-xs text-gray-800">
                                  {item.prioridad || "—"}
                                </div>
                              </div>
                            )}

                            {/* SOLICITANTE (NUEVO) */}
                            {cardFields.solicitante && (
                              <div>
                                <div className="text-[11px] text-gray-500 font-medium uppercase">
                                  Solicitante
                                </div>
                                <div className="text-xs text-gray-800">
                                  {item.solicitante || "—"}
                                </div>
                              </div>
                            )}

                            {/* TIPO MANTENIMIENTO (NUEVO) */}
                            {cardFields.tipoMantenimiento && (
                              <div>
                                <div className="text-[11px] text-gray-500 font-medium uppercase">
                                  Tipo Mant.
                                </div>
                                <div className="text-xs text-gray-800">
                                  {item.tipoMantenimiento || "—"}
                                </div>
                              </div>
                            )}

                            {/* ESTADO */}
                            {cardFields.estado && (
                              <div>
                                <span
                                  className={`inline-block px-2 py-[2px] text-[11px] border rounded-sm ${getEstadoBadge(
                                    item.estado
                                  )}`}
                                >
                                  {ESTADOS_AV[item.estado]?.label}
                                </span>
                              </div>
                            )}

                            {/* ✅ BOTÓN TRATAMIENTO (CORRECTO) */}
                            {/* ===== ACCIONES POR ESTADO ===== */}
                            <div className="space-y-1 pt-1">

                              {/* CREADO */}
                              {item.estado === "creado" && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      abrirTratamiento(item);
                                    }}
                                    className="w-full bg-yellow-300 hover:bg-yellow-400 text-yellow-900 text-[11px] font-semibold py-1 rounded-sm"
                                  >
                                    Tratar AV
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cambiarEstado(item, "rechazado");
                                    }}
                                    className="w-full bg-red-300 hover:bg-red-400 text-red-900 text-[11px] font-semibold py-1 rounded-sm"
                                  >
                                    Rechazar
                                  </button>
                                </>
                              )}

                              {/* TRATADO */}
                              {item.estado === "tratado" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cambiarEstado(item, "con OT");
                                  }}
                                  className="w-full bg-blue-300 hover:bg-blue-400 text-blue-900 text-[11px] font-semibold py-1 rounded-sm"
                                >
                                  Generar OT
                                </button>
                              )}

                              {/* CON OT */}
                              {item.estado === "con OT" && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cambiarEstado(item, "finalizado");
                                    }}
                                    className="w-full bg-green-300 hover:bg-green-400 text-green-900 text-[11px] font-semibold py-1 rounded-sm"
                                  >
                                    Finalizado
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cambiarEstado(item, "finalizado sin facturacion");
                                    }}
                                    className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 text-[11px] font-semibold py-1 rounded-sm"
                                  >
                                    Finalizado sin Fact.
                                  </button>
                                </>
                              )}

                            </div>

                          </div>
                        )}
                      </Draggable>

                    ))}
                    {p.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
      {/* ================= LISTA ================= */}
      {activeTab === "lista" && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                {/* Renderizar encabezados dinámicamente según el orden */}
                {columnOrder.map((key) => {
                  if (!cardFields[key]) return null; // Si está oculto, no renderizar

                  const labels = {
                    numeroAviso: "Código Aviso",
                    descripcion: "Descripción",
                    cliente: "Cliente",
                    equipo: "Equipo",
                    estado: "Estado",
                    fecha: "Fecha",
                    prioridad: "Prioridad",
                    solicitante: "Solicitante",
                    tipoMantenimiento: "Tipo Mant.",
                  };

                  return (
                    <th key={key} className="border px-3 py-2 text-left">
                      {labels[key]}
                    </th>
                  );
                })}
                {/* Columna fija de acciones */}
                <th className="border px-3 py-2 text-left">
                  Siguiente Proceso
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.values(filteredColumns)
                .flatMap((col) => col.items)
                .map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setViewData(item);
                      setViewStep(1);
                      setViewOpen(true);
                    }}
                  >
                    {/* Renderizar celdas dinámicamente según el orden */}
                    {columnOrder.map((key) => {
                      if (!cardFields[key]) return null;

                      return (
                        <td key={key} className="border px-2 py-1">
                          {/* Lógica de renderizado por campo */}
                          {key === "numeroAviso" && (
                            <span
                              className={`px-2 py-[2px] rounded-sm text-xs border ${getEstadoBadge(
                                item.estado
                              )}`}
                            >
                              {item.numeroAviso}
                            </span>
                          )}
                          {key === "descripcion" && (item.descripcion || "—")}
                          {key === "cliente" && (item.cliente || "—")}
                          {key === "equipo" &&
                            (item.equipos?.[0]?.nombre ||
                              item.producto ||
                              "—")}
                          {key === "estado" && ESTADOS_AV[item.estado]?.label}
                          {key === "fecha" &&
                            (item.fechaAtencion
                              ? new Date(item.fechaAtencion).toLocaleDateString(
                                  "es-PE"
                                )
                              : "—")}
                          {key === "prioridad" && (item.prioridad || "—")}
                          {key === "solicitante" && (item.solicitante || "—")}
                          {key === "tipoMantenimiento" &&
                            (item.tipoMantenimiento || "—")}
                        </td>
                      );
                    })}

                    {/* Columna fija de acciones (sin cambios) */}
                    <td
                      className="border px-2 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.estado === "creado" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirTratamiento(item)}
                            className="bg-yellow-300 hover:bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded"
                          >
                            Tratar AV
                          </button>
                          <button
                            onClick={() => cambiarEstado(item, "rechazado")}
                            className="bg-red-300 hover:bg-red-400 text-red-900 text-xs font-semibold px-2 py-1 rounded"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                      {item.estado === "tratado" && (
                        <button
                          onClick={() => cambiarEstado(item, "con OT")}
                          className="bg-blue-300 hover:bg-blue-400 text-blue-900 text-xs font-semibold px-2 py-1 rounded"
                        >
                          Generar OT
                        </button>
                      )}
                      {item.estado === "con OT" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => cambiarEstado(item, "finalizado")}
                            className="bg-green-300 hover:bg-green-400 text-green-900 text-xs font-semibold px-2 py-1 rounded"
                          >
                            Finalizar
                          </button>
                          <button
                            onClick={() =>
                              cambiarEstado(item, "finalizado sin facturacion")
                            }
                            className="bg-gray-300 hover:bg-gray-400 text-gray-900 text-xs font-semibold px-2 py-1 rounded"
                          >
                            Sin Fact.
                          </button>
                        </div>
                      )}
                      {(item.estado === "finalizado" ||
                        item.estado === "finalizado sin facturacion" ||
                        item.estado === "rechazado") && (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}


      {/* ================= CALENDARIO ================= */}
      {activeTab === "calendario" && (
        <div className="flex flex-col h-[80vh]">
          <div className="flex justify-start mb-2 gap-2">
            <button
              onClick={() => {
                setCalendarView("dayGridMonth");
                if (calendarRef.current){
                  calendarRef.current.getApi().changeView("dayGridMonth");
                }
              }}
              className={`px-3 py-1 text-sm rounded border ${
                calendarView === "dayGridMonth"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => {
                setCalendarView("dayGridWeek");
                if (calendarRef.current){
                  calendarRef.current.getApi().changeView("dayGridWeek");
                }
              }}
              className={`px-3 py-1 text-sm rounded border ${
                calendarView === "dayGridWeek"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Semana
            </button>
          </div>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={calendarView}
            locale={esLocale}
            events={filteredCalendarEvents}
            height="80vh"
            
            dayCellContent={renderDayCellContent}
            eventContent={renderEventContent}
          />
        </div>
      )}

      {/* ================= MODALES ================= */}
      <ModalMantenimiento
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        handleSaveAll={handleSaveAll}
        estados={Object.keys(ESTADOS_AV)}
        listaAvisos={Object.values(columns).flatMap((col) => col.items)}
      />

      <ModalMantenimientoView
        isOpen={viewOpen}
        data={viewData}
        wizardStep={viewStep}
        setWizardStep={setViewStep}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
      />
      <ModalTratamiento
        isOpen={tratamientoOpen}
        aviso={avisoTratamiento}
        onClose={() => {
          setTratamientoOpen(false);
          setAvisoTratamiento(null);
        }}
        onGuardar={guardarTratamiento}
      />

      <ModalConfiguracionCampos
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
        fields={cardFields}
        setFields={setCardFields}
        order={columnOrder}
        setOrder={setColumnOrder}
      />

    </div>
  );
}
