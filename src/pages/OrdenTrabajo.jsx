import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ModalOrdenTrabajo from "../components/inputs/ModalOrdenTrabajo";
import ModalOrdenTrabajoView from "../components/inputs/ModalOrdenTrabajoView";

import "../styles/fullcalendar.css";

/* ================= HELPERS ================= */

const addOneDay = (dateTime) => {
  if (!dateTime) return null;
  const d = new Date(dateTime);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
};

const getEventColor = (estado) => {
  switch (estado) {
    case "created": return "#bfdbfe";
    case "review": return "#fde68a";
    case "done": return "#bbf7d0";
    default: return "#e5e7eb";
  }
};

const getEventTextColor = (estado) => {
  switch (estado) {
    case "created": return "#1e3a8a";
    case "review": return "#78350f";
    case "done": return "#14532d";
    default: return "#374151";
  }
};

const getCardColor = (estado) => {
  switch (estado) {
    case "created": return "bg-blue-100 border-blue-300";
    case "review": return "bg-yellow-100 border-yellow-300";
    case "done": return "bg-green-100 border-green-300";
    default: return "bg-gray-100 border-gray-300";
  }
};

/* ================= COMPONENT ================= */

export default function OrdenTrabajo() {

const LISTA_COLUMNS_OT = {
  numeroAviso: "N° Aviso",
  descripcionOT: "Descripción OT",
  descripcionDetalladaOT: "Descripción Detallada",
  equipoVendido: "Equipo Vendido",
  equipoAtendido: "Equipo Atendido",
  equipoAlsud: "Equipo ALSUD",
  tipoOT: "Tipo OT",
  prioridad: "Prioridad",
  inicioProgramado: "Inicio Programado",
  finProgramado: "Fin Programado",
  claveControl: "Clave Control",
  numeroOT: "N° OT",
  cliente: "Cliente",
  personalAsignado: "Personal Asignado",
  cantidadTecnicos: "Cantidad Técnicos",
  empresaAsignada: "Empresa Asignada",
  materialesAsignados: "Materiales Asignados",
  supervisorResponsable: "Supervisor",
  inicioReal: "Inicio Real",
  finReal: "Fin Real",
  personalDesignadoReal: "Personal Real",
  empresasAsignadasReal: "Empresas Reales",
  materialesUtilizados: "Materiales Utilizados",
  estadoOT: "Estado OT",
};

const DEFAULT_VISIBLE_COLUMNS_OT = [
  "numeroAviso",
  "cliente",
  "inicioProgramado",
  "finProgramado",
];

  const calendarRef = useRef(null);

  /* ================= NAV ================= */
  const [activeTab, setActiveTab] = useState("kanban");
  const [calendarView, setCalendarView] = useState("dayGridMonth");

  /* ================= MODAL ================= */
  const [modalOpen, setModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
// ===== MODAL VISTA =====
const [viewOpen, setViewOpen] = useState(false);
const [viewData, setViewData] = useState(null);
const [viewStep, setViewStep] = useState(1);

  /* ================= DATA ================= */
const [estadoFilter, setEstadoFilter] = useState("all");
const [listaSearch, setListaSearch] = useState("");
const [showFilters, setShowFilters] = useState(false);

const buildDefaultCols = () =>
  Object.keys(LISTA_COLUMNS_OT).reduce((acc, key) => {
    acc[key] =
      key === "numeroAviso" ||
      DEFAULT_VISIBLE_COLUMNS_OT.includes(key);
    return acc;
  }, {});

const [visibleCols, setVisibleCols] = useState(buildDefaultCols);
const [pendingCols, setPendingCols] = useState(buildDefaultCols);


const addOneDayDate = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};


  const initialFormData = {
    numeroAviso: "",
    descripcionOT: "",
    descripcionDetalladaOT: "",
    equipoVendido: "",
    equipoAtendido: "",
    equipoAlsud: "",
    tipoOT: "",
    prioridad: "",
    inicioProgramado: "",
    finProgramado: "",
    claveControl: "",
    numeroOT: "",
    cliente: "",
    personalAsignado: "",
    cantidadTecnicos: "",
    empresaAsignada: "",
    materialesAsignados: "",
    supervisorResponsable: "",
    inicioReal: "",
    finReal: "",
    personalDesignadoReal: "",
    empresasAsignadasReal: "",
    materialesUtilizados: "",
    estadoOT: "",
    documentosCargados: null,
    datosAdjuntos: null,
  };

  const [formData, setFormData] = useState(initialFormData);

  const [columns, setColumns] = useState({
    created: { name: "Creado", items: [] },
    review: { name: "En Revisión", items: [] },
    done: { name: "Finalizado", items: [] },
  });

  const [calendarEvents, setCalendarEvents] = useState([]);

  /* ================= SAVE ================= */

  const handleSaveAll = () => {
    const id = Date.now().toString();

    const ot = {
      id,
      ...formData,
      estado: "created",
    };

    // Kanban
    setColumns((prev) => ({
      ...prev,
      created: {
        ...prev.created,
        items: [...prev.created.items, ot],
      },
    }));

   setCalendarEvents((prev) => [
  ...prev,
  {
    id,
    title: `#${formData.numeroAviso || "—"}`,
    start:formData.inicioProgramado,
end: addOneDayDate(formData.finProgramado),
    allDay: true,
    numeroAviso: formData.numeroAviso,
    estado: "created",
    backgroundColor: getEventColor("created"),
    textColor: getEventTextColor("created"),
  },
]);


    setModalOpen(false);
    setFormData(initialFormData);
    setWizardStep(1);
  };

  /* ================= DRAG ================= */

 const onDragEnd = ({ source, destination }) => {
  if (!destination) return;

  // MISMA COLUMNA → solo reordenar
  if (source.droppableId === destination.droppableId) {
    const col = columns[source.droppableId];
    const items = Array.from(col.items);
    const [moved] = items.splice(source.index, 1);
    items.splice(destination.index, 0, moved);

    setColumns((prev) => ({
      ...prev,
      [source.droppableId]: { ...col, items },
    }));
    return;
  }

  // CAMBIO DE COLUMNA
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

  // sincronizar color calendario
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
        {["kanban","lista", "calendario"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 font-semibold ${
              activeTab === tab && "border-b-2 border-gray-600 text-gray-600"
            }`}
          >
            {tab === "kanban" ? "Estados" : tab === "lista" ? "Lista" : "Calendario"}
          </button>


        ))}

        <button
          className="ml-auto px-4 py-2 rounded-md bg-gray-200 shadow-sm"
          onClick={() => {
            setWizardStep(1);
            setModalOpen(true);
          }}
        >
          + Nueva OT
        </button>
      </div>

      {/* ================= KANBAN ================= */}
      {activeTab === "kanban" && (
  <DragDropContext onDragEnd={onDragEnd}>
    <div className="grid grid-cols-3 gap-4">
      {Object.entries(columns).map(([colId, col]) => (
        <Droppable droppableId={colId} key={colId}>
          {(p) => (
            <div
              ref={p.innerRef}
              {...p.droppableProps}
              className="p-4 rounded-xl border shadow-sm bg-gray-50"
            >
              <h3 className="font-semibold mb-3">{col.name}</h3>

              {col.items.map((item, i) => (
                <Draggable key={item.id} draggableId={item.id} index={i}>
                  {(p) => (
                    <div
                      ref={p.innerRef}
                      {...p.draggableProps}
                      {...p.dragHandleProps}
                      className={`relative p-4 mb-3 rounded-xl border shadow-sm space-y-3 ${getCardColor(item.estado)}`}
                    >
                      {/* BOTÓN 3 PUNTITOS */}
                      <button
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                        onClick={(e) => {
                          e.stopPropagation(); // evita drag
                          setViewData(item);
                          setViewStep(1);
                          setViewOpen(true);
                        }}
                      >
                        ⋮
                      </button>

                      {/* N° AVISO */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">
                          N° Aviso
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {item.numeroAviso || "—"}
                        </p>
                      </div>

                      {/* INICIO PROGRAMADO */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">
                          Inicio Programado
                        </p>
                        <p className="text-sm text-gray-800">
                          {item.inicioProgramado
                            ? item.inicioProgramado
                                .split("-")
                                .reverse()
                                .join("/")
                            : "—"}
                        </p>
                      </div>

                      {/* FIN PROGRAMADO */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">
                          Fin Programado
                        </p>
                        <p className="text-sm text-gray-800">
                          {item.finProgramado
                            ? item.finProgramado
                                .split("-")
                                .reverse()
                                .join("/")
                            : "—"}
                        </p>
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
  <>
    {/* BUSCADOR */}
    <div className="flex gap-3 mb-3">
      <input
        className="border p-2 rounded shadow-sm"
        placeholder="Buscar OT o Cliente"
        value={listaSearch}
        onChange={(e) => setListaSearch(e.target.value)}
      />
    </div>

    {/* FILTROS */}
    <div className="flex items-center gap-3 mb-3">
      <button
  onClick={() => {
    setPendingCols(visibleCols);
    setShowFilters(!showFilters);
  }}
  className="px-3 py-1 rounded-md bg-gray-200 shadow-sm text-sm"
>
  Filtros
</button>

<button
  onClick={() => {
    const defaults = buildDefaultCols();
    setVisibleCols(defaults);
    setPendingCols(defaults);
    setListaSearch("");
    setShowFilters(false);
  }}
  className="px-3 py-1 rounded-md bg-red-100 text-red-700 shadow-sm text-sm"
>
  Restablecer
</button>



     {showFilters && (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3 border rounded-lg bg-gray-50 text-sm">

    {Object.entries(LISTA_COLUMNS_OT).map(([key, label]) => (
      <label key={key} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={pendingCols[key]}
          disabled={key === "numeroAviso"}
          onChange={() =>
            setPendingCols((p) => ({ ...p, [key]: !p[key] }))
          }
        />
        {label}
      </label>
    ))}

    {/* BOTÓN OK */}
    <div className="col-span-full flex justify-end mt-2">
      <button
        onClick={() => {
          setVisibleCols(pendingCols);
          setShowFilters(false);
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded-md"
      >
        OK
      </button>
    </div>

  </div>
)}

    </div>


    {/* TABLA */}
    <table className="w-full text-sm border shadow-sm">
      <thead className="bg-gray-100">
        <tr>
          {Object.entries(LISTA_COLUMNS_OT).map(
            ([key, label]) =>
              visibleCols[key] && (
                <th key={key} className="border p-2">
                  {label}
                </th>
              )
          )}
        </tr>
      </thead>

      <tbody>
        {Object.values(columns)
          .flatMap((c) => c.items)
          .filter(
            (ot) =>
              !listaSearch ||
              ot.numeroAviso?.includes(listaSearch) ||
              ot.cliente?.toLowerCase().includes(listaSearch.toLowerCase())
          )
          .map((ot) => (
            <tr key={ot.id}>
              {Object.keys(LISTA_COLUMNS_OT).map(
                (key) =>
                  visibleCols[key] && (
                    <td key={key} className="border p-2">
                      {key.includes("inicio") || key.includes("fin")
  ? ot[key]
    ? ot[key].split("-").reverse().join("/")
    : "—"
  : ot[key] || "—"}

                    </td>
                  )
              )}
            </tr>
          ))}
      </tbody>
    </table>
  </>
)}


      {/* ================= CALENDARIO ================= */}
      {activeTab === "calendario" && (
        <>
          <div className="flex gap-2 mb-3">
            {["dayGridMonth", "dayGridWeek"].map((v) => (
              <button
                key={v}
                onClick={() => setCalendarView(v)}
                className={`px-3 py-1 rounded shadow-sm ${
                  calendarView === v
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                {v === "dayGridMonth" ? "Mes" : "Semana"}
              </button>
            ))}
          </div>

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={calendarView}
            locale={esLocale}
            events={calendarEvents}
            height="80vh"
            eventDidMount={(info) => {
              if (info.view.type !== "dayGridWeek") return;

              const start = info.event.start;
              const end = info.event.end;
              const days = (end - start) / (1000 * 60 * 60 * 24);

              if (days > 3) {
                info.el.style.display = "none";

                const endDate = end.toISOString().slice(0, 10);

                setTimeout(() => {
                  const cell = document.querySelector(
                    `[data-date="${endDate}"]`
                  );
                  if (!cell) return;

                  const badge = document.createElement("div");
                  badge.style.background = info.event.backgroundColor;
                  badge.style.color = info.event.textColor;
                  badge.style.fontSize = "11px";
                  badge.style.padding = "2px 6px";
                  badge.style.borderRadius = "6px";
                  badge.style.marginTop = "2px";

                  cell.appendChild(badge);
                }, 0);
              }
            }}
          />
        </>
      )}

      {/* ================= MODAL ================= */}
      <ModalOrdenTrabajo
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        wizardStep={wizardStep}
        setWizardStep={setWizardStep}
        formData={formData}
        handleInputChange={(e) =>
          setFormData({ ...formData, [e.target.name]: e.target.value })
        }
        handleSaveAll={handleSaveAll}
      />
      <ModalOrdenTrabajoView
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
