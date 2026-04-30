import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  FileText, User, Calendar, Wrench, Package, Clock,
  CheckCircle, XCircle, FileCheck, ChevronRight,
} from "lucide-react";
import ModalInformesNotificacion from "../modals/ModalInformesNotificacion";

/* ── Helpers ── */
const formatDate = (isoDate) => {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const getColumnIcon = (colId) =>
  ({ creado: Clock, liberado: ChevronRight, cierre_tecnico: Wrench, cerrado: CheckCircle, cancelado: XCircle }[colId] || FileText);

const getColumnColor = (colId) =>
  ({
    creado: "bg-[#334155]",
    liberado: "bg-[#6d28d9]",
    cierre_tecnico: "bg-[#b45309]",
    cerrado: "bg-[#059669]",
    cancelado: "bg-[#b91c1c]",
  }[colId] || "bg-slate-500");

const getCardBg = (colId) =>
  ({
    creado:         "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
    liberado:       "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
    cierre_tecnico: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200",
    cerrado:        "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200",
    cancelado:      "bg-gradient-to-br from-red-50 to-red-100 border-red-200",
  }[colId] || "bg-white border-gray-200");

const getTipoAvisoBadge = (tipo) =>
  ({
    mantenimiento: "bg-blue-100 text-blue-700 border-blue-200",
    instalacion:   "bg-emerald-100 text-emerald-700 border-emerald-200",
    venta:         "bg-purple-100 text-purple-700 border-purple-200",
  }[tipo] || "bg-gray-100 text-gray-600 border-gray-200");

const mapKanbanToEstado = (k) =>
  ({ creado: "CREADO", liberado: "LIBERADO", cierre_tecnico: "CIERRE_TECNICO", cerrado: "CERRADO", cancelado: "CANCELADO" }[k] || "CREADO");

const getRegistroLabel = (r, i) => {
  if (r?.equipoId) return r.descripcionEquipo || r.equipo?.nombre || r.equipo?.codigo || `Equipo ${i + 1}`;
  if (r?.ubicacionTecnicaId) return r.descripcionUbicacion || r.ubicacionTecnica?.nombre || `Ubicación ${i + 1}`;
  return `Registro ${i + 1}`;
};

/* ── FieldRow micro-component ── */
function FieldRow({ label, value, icon: Icon }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide shrink-0 w-[52px] mt-0.5 leading-tight">
        {label}
      </span>
      <div className="flex items-center gap-1 min-w-0">
        {Icon && <Icon size={10} className="text-slate-400 shrink-0" />}
        <span className="text-[10px] text-slate-700 truncate">{String(value)}</span>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function KanbanView({
  data,
  onUpdateEstado,
  onViewOrden,
  onLiberar,
  onAbrirCierreTecnico,
  cardFields,
}) {
  const cf = cardFields || {};
  const show = (key) => cf[key] !== false; // show by default if not explicitly false
  const [otSeleccionadaInformes, setOtSeleccionadaInformes] = useState(null);

  const onDragEnd = ({ source, destination }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;
    const movedOrden = data[source.droppableId].items[source.index];
    onUpdateEstado(movedOrden.id, mapKanbanToEstado(destination.droppableId));
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex w-full gap-3 pb-4 h-[calc(100dvh-130px)] lg:h-[calc(100vh-160px)] overflow-x-auto lg:overflow-hidden px-2 lg:px-1 snap-x snap-mandatory lg:snap-none">
          {Object.entries(data).map(([colId, col]) => {
            const Icon = getColumnIcon(colId);
            const bgColor = getColumnColor(colId);

            return (
              <Droppable droppableId={colId} key={colId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col rounded-2xl border transition-all h-full shrink-0 snap-center lg:snap-align-none
                      w-[85vw] md:w-[320px] lg:w-auto lg:flex-1 lg:min-w-0
                      ${snapshot.isDraggingOver ? "border-blue-500/50 bg-slate-50 shadow-inner" : "border-slate-200 bg-transparent"}`}
                  >
                    {/* Column header */}
                    <div className={`p-2.5 md:p-3 rounded-t-xl ${bgColor} flex items-center justify-between gap-2 flex-shrink-0`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-4 h-4 text-white/80 shrink-0" />
                        <h3 className="text-sm font-bold text-white truncate">{col.name}</h3>
                      </div>
                      <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                        {col.items?.length || 0}
                      </span>
                    </div>

                    {/* Cards */}
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="p-2 space-y-2 overflow-y-auto flex-1"
                      style={{ minHeight: "200px" }}
                    >
                      {col.items?.map((item, index) => (
                        <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                relative rounded-xl border-2 p-3 shadow-sm
                                transition-all duration-200 cursor-move
                                ${getCardBg(colId)}
                                ${snapshot.isDragging ? "shadow-2xl scale-[1.02] rotate-1 z-50 ring-2 ring-blue-400" : "hover:shadow-lg hover:-translate-y-0.5"}
                              `}
                            >
                              {/* View button */}
                              <button
                                onClick={(e) => { e.stopPropagation(); onViewOrden(item); }}
                                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-white/80 backdrop-blur-sm text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm hover:shadow-md transition-all flex items-center justify-center font-bold text-base"
                              >
                                ⋮
                              </button>

                              {/* Card body */}
                              <div className="space-y-2 pr-8">
                                {/* N° OT + tipo */}
                                <div className="flex items-start justify-between gap-2">
                                  {show("numeroOT") && (
                                    <div>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">N° Orden</p>
                                      <p className="text-xs font-black text-slate-900 bg-white/60 px-2 py-0.5 rounded-md inline-block font-mono">
                                        {item.numeroOT || "—"}
                                      </p>
                                    </div>
                                  )}
                                  {show("tipoAviso") && item.aviso?.tipoAviso && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getTipoAvisoBadge(item.aviso.tipoAviso)}`}>
                                      {item.aviso.tipoAviso.charAt(0).toUpperCase() + item.aviso.tipoAviso.slice(1)}
                                    </span>
                                  )}
                                </div>

                                {/* Descripción */}
                                {show("descripcionGeneral") && item.descripcionGeneral && (
                                  <p className="text-[10px] text-slate-700 line-clamp-2 leading-relaxed">
                                    {item.descripcionGeneral}
                                  </p>
                                )}

                                {/* Campos */}
                                <div className="space-y-1 pt-1">
                                  {show("supervisorId") && <FieldRow label="Superv." value={item.supervisorId} icon={User} />}
                                  {show("avisoNumero") && <FieldRow label="N° Aviso" value={item.aviso?.numeroAviso} icon={FileText} />}
                                  {show("estado") && <FieldRow label="Estado" value={
                                    item.estado === "CIERRE_TECNICO" ? "Cierre Técnico" :
                                    item.estado ? item.estado.charAt(0) + item.estado.slice(1).toLowerCase() : null
                                  } />}
                                </div>

                                {/* Registros */}
                                {show("registros") && item.equipos && item.equipos.length > 0 && (
                                  <div className="pt-1.5 border-t border-slate-200/60">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                                      Equipos / Ubic. ({item.equipos.length})
                                    </p>
                                    <div className="space-y-0.5">
                                      {item.equipos.slice(0, 2).map((r, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-700">
                                          <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                                          <span className="truncate">{getRegistroLabel(r, i)}</span>
                                        </div>
                                      ))}
                                      {item.equipos.length > 2 && (
                                        <p className="text-[9px] text-slate-400 italic ml-2.5">
                                          +{item.equipos.length - 2} más
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Fechas */}
                                {(show("fechaProgramadaInicio") || show("fechaProgramadaFin")) && (
                                  <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-200/60">
                                    {show("fechaProgramadaInicio") && (
                                      <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Inicio</p>
                                        <p className="text-[10px] font-semibold text-slate-800">{formatDate(item.fechaProgramadaInicio)}</p>
                                      </div>
                                    )}
                                    {show("fechaProgramadaFin") && (
                                      <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Fin</p>
                                        <p className="text-[10px] font-semibold text-slate-800">{formatDate(item.fechaProgramadaFin)}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {(show("fechaInicioReal") || show("fechaFinReal")) && (
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {show("fechaInicioReal") && (
                                      <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Inicio Real</p>
                                        <p className="text-[10px] font-semibold text-slate-800">{formatDate(item.fechaInicioReal)}</p>
                                      </div>
                                    )}
                                    {show("fechaFinReal") && (
                                      <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Fin Real</p>
                                        <p className="text-[10px] font-semibold text-slate-800">{formatDate(item.fechaFinReal)}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {show("observaciones") && item.observaciones && (
                                  <div className="pt-1 border-t border-slate-200/60">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Observaciones</p>
                                    <p className="text-[10px] text-slate-600 line-clamp-2">{item.observaciones}</p>
                                  </div>
                                )}

                                {/* Action buttons */}
                                <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                                  {colId === "creado" && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onLiberar(item.id); }}
                                      className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                                    >
                                      <span>🚀</span>
                                      <span>Liberar</span>
                                    </button>
                                  )}
                                  {colId === "liberado" && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onAbrirCierreTecnico(item); }}
                                      className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                                    >
                                      <span>✅</span>
                                      <span>Cierre Técnico</span>
                                    </button>
                                  )}
                                  {colId === "cierre_tecnico" && (
                                    <div className="flex gap-1.5 w-full">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); onUpdateEstado(item.id, "CERRADO"); }}
                                        className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                                      >
                                        <span>🔒</span>
                                        <span>Cerrar OT</span>
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setOtSeleccionadaInformes(item); }}
                                        className="py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                                      >
                                        <FileText className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}

                      {(!col.items || col.items.length === 0) && (
                        <div className="text-center py-10 text-slate-400">
                          <div className="text-3xl mb-2">📭</div>
                          <p className="text-xs font-medium">Sin órdenes</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      <ModalInformesNotificacion
        isOpen={!!otSeleccionadaInformes}
        onClose={() => setOtSeleccionadaInformes(null)}
        ordenTrabajoId={otSeleccionadaInformes?.id}
        numeroOT={otSeleccionadaInformes?.numeroOT}
        tipoAviso={otSeleccionadaInformes?.aviso?.tipoAviso}
      />
    </>
  );
}
