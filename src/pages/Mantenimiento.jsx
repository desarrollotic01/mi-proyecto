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
    title: aviso.numeroAviso, // 👈 AQUÍ
    date: fecha,
    backgroundColor: getEventColor("creado"),
    textColor: getEventTextColor("creado"),
  },
]);


    setModalOpen(false);
    setWizardStep(1);
    setSelectedDate(null);
    setFormData(initialFormData);
  };

  /* ================= DRAG ================= */
  const onDragEnd = ({ source, destination }) => {
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

  // 🟦 MISMA COLUMNA (reordenar)
  if (source.droppableId === destination.droppableId) {
    const items = Array.from(sourceCol.items);
    const [moved] = items.splice(source.index, 1);
    items.splice(destination.index, 0, moved);

    setColumns((prev) => ({
      ...prev,
      [source.droppableId]: {
        ...sourceCol,
        items,
      },
    }));
    return;
  }

  // 🟨 DIFERENTE COLUMNA
  const sourceItems = Array.from(sourceCol.items);
  const destItems = Array.from(destCol.items);

  const [moved] = sourceItems.splice(source.index, 1);
  moved.estado = destination.droppableId;

  destItems.splice(destination.index, 0, moved);

  setColumns((prev) => ({
    ...prev,
    [source.droppableId]: {
      ...sourceCol,
      items: sourceItems,
    },
    [destination.droppableId]: {
      ...destCol,
      items: destItems,
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
};


  useEffect(() => {
    if (activeTab === "calendario" && calendarRef.current) {
      calendarRef.current.getApi().changeView(calendarView);
    }
  }, [activeTab, calendarView]);

  /* ================= UI ================= */
  return (
    <div className="p-4">
      {/* NAV */}
      <div className="flex gap-4 mb-4 border-b pb-2">
        {["kanban", "lista", "calendario"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-2 font-semibold ${
              activeTab === t && "border-b-2 border-gray-600 text-gray-600"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}

        <button
          className="ml-auto px-4 py-2 rounded-md bg-gray-200"
          onClick={() => {
            setWizardStep(1);
            setSelectedDate(null);
            setModalOpen(true);
          }}
        >
          + Añadir aviso
        </button>
      </div>

      {/* ================= KANBAN ================= */}
      {activeTab === "kanban" && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-7 gap-3">
            {Object.entries(columns).map(([colId, col]) => (
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
      <div>
        <div className="text-[11px] text-gray-500 font-medium uppercase">
          N° Aviso
        </div>
        <div className="text-sm font-semibold text-gray-900">
          #{item.numeroAviso || "—"}
        </div>
      </div>

      {/* EQUIPO */}
      <div>
        <div className="text-[11px] text-gray-500 font-medium uppercase">
          Equipo / Maquinaria
        </div>
        <div className="text-xs text-gray-800">
          {item.equipos?.[0]?.nombre || item.producto || "—"}
        </div>
      </div>

      {/* CLIENTE */}
      <div>
        <div className="text-[11px] text-gray-500 font-medium uppercase">
          Cliente
        </div>
        <div className="text-xs text-gray-800">
          {item.cliente || "—"}
        </div>
      </div>

      {/* FECHA */}
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

      {/* ESTADO */}
      <div>
        <span
          className={`inline-block px-2 py-[2px] text-[11px] border rounded-sm ${getEstadoBadge(
            item.estado
          )}`}
        >
          {ESTADOS_AV[item.estado]?.label}
        </span>
      </div>

      {/* ✅ BOTÓN TRATAMIENTO (CORRECTO) */}
      {item.estado === "creado" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            abrirTratamiento(item);
          }}
          className="w-full bg-yellow-300 hover:bg-yellow-400 text-yellow-900 text-[11px] font-semibold py-1 rounded-sm"
        >
          Tratamiento
        </button>
      )}
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
          <th className="border px-3 py-2 text-left">Código Aviso</th>
    <th className="border px-3 py-2 text-left">Descripción</th>
    <th className="border px-3 py-2 text-left">Cliente</th>
    <th className="border px-3 py-2 text-left">Estado</th>
    <th className="border px-3 py-2 text-left">Fecha</th>
    <th className="border px-3 py-2 text-left">Tratamiento</th>
        </tr>
      </thead>
      <tbody>
        {Object.values(columns)
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
  {/* CÓDIGO AVISO */}
  <td className="border px-2 py-1 font-semibold">
    <span
      className={`px-2 py-[2px] rounded-sm text-xs border ${getEstadoBadge(
        item.estado
      )}`}
    >
      {item.numeroAviso}
    </span>
  </td>

  {/* DESCRIPCIÓN */}
  <td className="border px-2 py-1">
    {item.descripcion || "—"}
  </td>

  {/* CLIENTE */}
  <td className="border px-2 py-1">
    {item.cliente || "—"}
  </td>

  {/* ESTADO */}
  <td className="border px-2 py-1">
    {ESTADOS_AV[item.estado]?.label}
  </td>

  {/* FECHA */}
  <td className="border px-2 py-1">
    {item.fechaAtencion || "—"}
  </td>

  {/* TRATAMIENTO */}
  <td className="border px-2 py-1">
    {item.estado === "creado" ? (
      <span className="text-red-600 font-semibold text-xs">
        Pendiente
      </span>
    ) : (
      <span className="text-green-600 font-semibold text-xs">
        Tratado
      </span>
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
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={calendarView}
          locale={esLocale}
          events={calendarEvents}
          height="80vh"
          dateClick={(info) => {
            setSelectedDate(info.dateStr);
            setModalOpen(true);
          }}
        />
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

    </div>
  );
}
