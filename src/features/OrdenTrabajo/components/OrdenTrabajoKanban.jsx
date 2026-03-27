import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FileText, Calendar, User, Clock } from "lucide-react";
import ModalInformesNotificacion from "../modals/ModalInformesNotificacion";

/* ================= HELPERS (LÓGICA INTACTA) ================= */

const getCardColor = (estado) => {
  const colors = {
    creado: "bg-white border-blue-200 border-t-4 border-t-blue-500",
    liberado: "bg-white border-purple-200 border-t-4 border-t-purple-500",
    cierre_tecnico: "bg-white border-amber-200 border-t-4 border-t-amber-500",
    cerrado: "bg-white border-emerald-200 border-t-4 border-t-emerald-500",
    cancelado: "bg-white border-slate-200 border-t-4 border-t-slate-500",
  };
  return colors[estado] || "bg-white border-slate-200 border-t-4 border-t-slate-400";
};

const getColumnColor = (estado) => {
  const colors = {
    creado: "bg-blue-50 border-b border-blue-200 text-blue-700",
    liberado: "bg-purple-50 border-b border-purple-200 text-purple-700",
    cierre_tecnico: "bg-amber-50 border-b border-amber-200 text-amber-700",
    cerrado: "bg-emerald-50 border-b border-emerald-200 text-emerald-700",
    cancelado: "bg-rose-50 border-b border-rose-200 text-rose-700",
  };
  return colors[estado] || "bg-slate-50 border-b border-slate-200 text-slate-700";
};

const getColumnBg = (estado) => {
  return "bg-slate-50/40"; 
};

const formatDate = (isoDate) => {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const mapKanbanToEstado = (kanbanState) => {
  const mapping = {
    creado: "CREADO",
    liberado: "LIBERADO",
    cierre_tecnico: "CIERRE_TECNICO",
    cerrado: "CERRADO",
    cancelado: "CANCELADO",
  };
  return mapping[kanbanState] || "CREADO";
};

const getRegistroLabel = (registro, idx) => {
  if (registro?.equipoId) {
    return registro?.descripcionEquipo || registro?.equipo?.nombre || registro?.equipo?.codigo || `Equipo ${idx + 1}`;
  }
  if (registro?.ubicacionTecnicaId) {
    return registro?.descripcionUbicacion || registro?.ubicacionTecnica?.nombre || registro?.ubicacionTecnica?.codigo || `Ubicación técnica ${idx + 1}`;
  }
  return `Registro ${idx + 1}`;
};

/* ================= COMPONENT ================= */

export default function KanbanView({
  data,
  onUpdateEstado,
  onViewOrden,
  onLiberar,
  onAbrirCierreTecnico,
}) {
  const [otSeleccionadaInformes, setOtSeleccionadaInformes] = useState(null);

  const onDragEnd = ({ source, destination }) => {
    if (!destination) return;
    const sourceColumn = data[source.droppableId];
    if (source.droppableId === destination.droppableId) return;

    const movedOrden = sourceColumn.items[source.index];
    const nuevoEstado = mapKanbanToEstado(destination.droppableId);

    onUpdateEstado(movedOrden.id, nuevoEstado);
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        {/* 🚀 CONTENEDOR PRINCIPAL: lg:overflow-hidden quita el scroll en PC */}
        <div className="flex flex-nowrap overflow-x-auto lg:overflow-hidden gap-2 h-[calc(100vh-14rem)] pb-2 px-1">
          {Object.entries(data).map(([colId, col]) => (
            <Droppable droppableId={colId} key={colId}>
              {(provided, snapshot) => (
                <div
                  // 🚀 COLUMNAS RESPONSIVE: lg:flex-1 hace que se junten y quepan todas en PC
                  className={`
                    flex flex-col rounded-xl border transition-all duration-300 h-full
                    w-[85vw] flex-shrink-0 lg:flex-1 lg:min-w-0 lg:w-auto
                    ${snapshot.isDraggingOver ? "bg-slate-100 border-slate-300" : getColumnBg(colId)}
                  `}
                >
                  {/* HEADER (MÁS COMPACTO) */}
                  <div className={`p-3 rounded-t-xl flex items-center justify-between shadow-sm flex-shrink-0 ${getColumnColor(colId)}`}>
                    <h3 className="font-black text-[10px] md:text-xs uppercase tracking-wider truncate mr-1">
                      {col.name}
                    </h3>
                    <span className="bg-white/60 px-2 py-0.5 rounded-full text-[9px] font-black border border-current/10 shrink-0">
                      {col.items?.length || 0}
                    </span>
                  </div>

                  {/* CONTENEDOR DE TARJETAS */}
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="p-1.5 space-y-2 overflow-y-auto flex-1 custom-scrollbar"
                  >
                    {col.items?.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onViewOrden(item)}
                            className={`
                              relative p-2.5 rounded-lg border shadow-sm transition-all duration-200 cursor-move
                              ${getCardColor(colId)}
                              ${snapshot.isDragging ? "rotate-1 scale-[1.02] shadow-xl z-50 ring-2 ring-black/5" : "hover:shadow-md hover:-translate-y-0.5"}
                            `}
                          >
                            {/* CONTENIDO REDUCIDO PARA CABER MEJOR */}
                            <div className="space-y-2 pr-4">
                              <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">N° Orden</p>
                                <p className="text-[10px] font-black text-slate-900 truncate">#{item.numeroOT || "S/N"}</p>
                              </div>

                              <p className="text-[10px] text-slate-600 line-clamp-1 italic font-medium">
                                {item.descripcionGeneral || "Sin descripción"}
                              </p>

                              {/* CAJA DE DATOS MÁS COMPACTA */}
                              <div className="bg-slate-50/80 border border-slate-100 rounded p-1.5 space-y-1">
                                <div className="flex items-center justify-between text-[9px]">
                                  <span className="text-slate-400 font-bold uppercase truncate mr-1">👤 Sup.</span>
                                  <span className="text-slate-800 font-black truncate">{item.supervisorId || "—"}</span>
                                </div>
                                <div className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-200/50">
                                  <span className="text-slate-400 font-bold uppercase mr-1">📅 Inicio</span>
                                  <span className="text-slate-800 font-black shrink-0">{formatDate(item.fechaProgramadaInicio)}</span>
                                </div>
                              </div>

                              {/* BOTONES DE ACCIÓN (ESTILO CORPORATIVO) */}
                              <div className="pt-1">
                                {colId === "creado" && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onLiberar(item.id); }}
                                    className="w-full py-1 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-[9px] font-black rounded transition-all shadow-sm"
                                  >
                                    🚀 LIBERAR
                                  </button>
                                )}
                                {colId === "liberado" && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onAbrirCierreTecnico(item); }}
                                    className="w-full py-1 bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 text-[9px] font-black rounded transition-all shadow-sm"
                                  >
                                    ✅ CIERRE TÉCNICO
                                  </button>
                                )}
                                {colId === "cierre_tecnico" && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setOtSeleccionadaInformes(item); }}
                                    className="w-full py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[9px] font-black rounded transition-all shadow-sm flex items-center justify-center gap-1"
                                  >
                                    <FileText size={10} /> INFORMES
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {(!col.items || col.items.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-8 opacity-10 grayscale">
                        <FileText size={24} />
                        <p className="text-[8px] font-black uppercase mt-1">Vacío</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <ModalInformesNotificacion
        isOpen={!!otSeleccionadaInformes}
        onClose={() => setOtSeleccionadaInformes(null)}
        ordenTrabajoId={otSeleccionadaInformes?.id}
        numeroOT={otSeleccionadaInformes?.numeroOT}
      />
    </>
  );
}