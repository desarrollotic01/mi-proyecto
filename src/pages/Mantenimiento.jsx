import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ModalMantenimiento from "../components/ModalMantenimiento";
import ModalMantenimientoView from "../components/inputs/ModalMantenimientoView";

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
        date: fecha,
        ov: aviso.ov,
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
    if (!destination) return;

    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];

    const sourceItems = Array.from(sourceCol.items);
    const destItems = Array.from(destCol.items);

    const [moved] = sourceItems.splice(source.index, 1);
    moved.estado = destination.droppableId;

    destItems.splice(destination.index, 0, moved);

    setColumns((prev) => ({
      ...prev,
      [source.droppableId]: { ...sourceCol, items: sourceItems },
      [destination.droppableId]: { ...destCol, items: destItems },
    }));

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
                      <Draggable
                        draggableId={item.id}
                        index={i}
                        key={item.id}
                      >
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
  className="p-3 mb-2 rounded-lg border bg-white shadow-sm cursor-pointer hover:bg-gray-50"
>

                            <div className="text-sm font-bold">
                              #{item.numeroAviso || "—"}
                            </div>
                            <div className="text-xs">{item.producto}</div>
                            <span
                              className={`inline-block mt-2 px-2 py-1 text-xs border rounded ${getEstadoBadge(
                                item.estado
                              )}`}
                            >
                              {ESTADOS_AV[item.estado]?.label}
                            </span>
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
          <th className="border px-3 py-2 text-left">OV</th>
          <th className="border px-3 py-2 text-left">Descripción</th>
          <th className="border px-3 py-2 text-left">Cliente</th>
          <th className="border px-3 py-2 text-left">Estado</th>
          <th className="border px-3 py-2 text-left">Fecha</th>
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
              <td className="border px-3 py-2">
                {item.ov || "—"}
              </td>
              <td className="border px-3 py-2">
                {item.descripcion || "—"}
              </td>
              <td className="border px-3 py-2">
                {item.cliente || "—"}
              </td>
              <td className="border px-3 py-2">
                <span
                  className={`px-2 py-1 rounded text-xs border ${getEstadoBadge(
                    item.estado
                  )}`}
                >
                  {ESTADOS_AV[item.estado]?.label}
                </span>
              </td>
              <td className="border px-3 py-2">
                {item.fechaAtencion || "—"}
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
    </div>
  );
}
