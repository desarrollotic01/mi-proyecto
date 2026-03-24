import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  FileText, User, Calendar, Wrench, Package, 
  CheckCircle, XCircle, Clock, FileCheck, Layers, MapPin, AlertTriangle, ChevronRight
} from "lucide-react";
import { ESTADOS_AV } from "../config/camposMantenimiento";

export default function MantenimientoKanban({
  filteredColumns,
  cardFields,
  columnOrder,
  setViewData,
  setViewStep,
  setViewOpen,
  cambiarEstado,
  abrirTratamiento,
  onDragEnd,
  equiposData = [],
  ordenesTrabajoData = [],
}) {
  
  const getColumnIcon = (colId) => {
    const icons = {
      CREADO: Clock,
      TRATADO: Wrench,
      CON_OT: FileText,
      RECHAZADO: XCircle,
      FINALIZADO: CheckCircle,
      FACTURADO: FileText, 
      FINALIZADO_SIN_FACTURACION: FileCheck,
    };
    return icons[colId] || FileText;
  };

  const getColumnColor = (colId) => {
    const colors = {
      CREADO: "bg-[#334155]", 
      TRATADO: "bg-[#2563eb]", 
      CON_OT: "bg-[#6d28d9]",  
      RECHAZADO: "bg-[#b91c1c]", 
      FINALIZADO: "bg-[#059669]", 
      FACTURADO: "bg-[#475569]", 
      FINALIZADO_SIN_FACTURACION: "bg-[#1e293b]", 
    };
    return colors[colId] || "bg-slate-500";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Alta: "bg-red-500/20 text-red-500 border border-red-500/30",
      Media: "bg-yellow-500/20 text-yellow-600 border border-yellow-500/30",
      Baja: "bg-green-500/20 text-green-600 border border-green-500/30",
    };
    return colors[priority] || "bg-slate-100 text-slate-500 border border-slate-200";
  };

  const getTargetKey = (obj) => {
    if (obj?.equipoId) return `E:${String(obj.equipoId)}`;
    if (obj?.ubicacionTecnicaId) return `U:${String(obj.ubicacionTecnicaId)}`;
    if (obj?.ubicacionId) return `U:${String(obj.ubicacionId)}`;
    return null;
  };

  const reorganizarColumnasPorOTs = (columns) => {
    const nuevasColumnas = {};
    Object.keys(columns).forEach((colId) => { nuevasColumnas[colId] = { items: [] }; });

    Object.values(columns).forEach((col) => {
      col.items.forEach((item) => {
        const otsDelAviso = ordenesTrabajoData.filter((ot) => String(ot.avisoId) === String(item.id));
        const targetsAviso = new Set();
        
        (item.equiposRelacion || []).forEach((rel) => {
          const key = getTargetKey(rel);
          if (key) targetsAviso.add(key);
        });
        (item.ubicacionesRelacion || []).forEach((rel) => {
          const key = getTargetKey(rel);
          if (key) targetsAviso.add(key);
        });

        if (!otsDelAviso.length) {
          nuevasColumnas[item.estado]?.items.push({
            ...item,
            _estadoReal: item.estado,
            _estadoOriginal: item.estado,
            _tieneOTs: false,
            _esParcial: false,
            _equiposPendientes: 0,
            _cantidadOTs: 0,
            _desglose: null,
          });
          return;
        }

        const targetsConOT = new Set();
        otsDelAviso.forEach((ot) => {
          (ot.equipos || []).forEach((targetOT) => {
            const key = getTargetKey(targetOT);
            if (key) targetsConOT.add(key);
          });
        });

        const totalTargetsAviso = targetsAviso.size;
        const cantidadTargetsConOT = targetsConOT.size;
        const equiposPendientes = Math.max(0, totalTargetsAviso - cantidadTargetsConOT);
        const estaCompleto = totalTargetsAviso > 0 && cantidadTargetsConOT >= totalTargetsAviso;
        const esParcial = cantidadTargetsConOT > 0 && cantidadTargetsConOT < totalTargetsAviso;

        const porEstado = {};
        otsDelAviso.forEach((ot) => {
          const estadoOT = ot.estado || "CREADO";
          porEstado[estadoOT] = (porEstado[estadoOT] || 0) + 1;
        });

        let columnaDestino = "TRATADO";
        if (totalTargetsAviso === 0) {
          columnaDestino = "CON_OT";
        } else if (estaCompleto) {
          columnaDestino = "CON_OT";
        } else if (esParcial) {
          columnaDestino = "TRATADO";
        }

        nuevasColumnas[columnaDestino]?.items.push({
          ...item,
          _estadoOriginal: item.estado,
          _estadoReal: columnaDestino,
          _tieneOTs: true,
          _esParcial: esParcial,
          _equiposPendientes: equiposPendientes,
          _cantidadOTs: otsDelAviso.length,
          _desglose: {
            total: otsDelAviso.length,
            porEstado,
            equiposConOT: cantidadTargetsConOT,
            equiposTotales: totalTargetsAviso,
            esMultiple: otsDelAviso.length > 1,
          },
        });
      });
    });

    return nuevasColumnas;
  };

  const columnasReorganizadas = reorganizarColumnasPorOTs(filteredColumns);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* MAGIA RESPONSIVE CONTENEDOR: 
          - Móvil/Tablet: scroll horizontal (overflow-x-auto) 
          - Desktop (lg): sin scroll (overflow-hidden) 
      */}
      <div className="flex w-full gap-3 pb-4 h-[calc(100dvh-130px)] lg:h-[calc(100vh-160px)] overflow-x-auto lg:overflow-hidden px-2 lg:px-1 snap-x snap-mandatory lg:snap-none">
        {Object.entries(columnasReorganizadas).map(([colId, col]) => {
          const Icon = getColumnIcon(colId);
          const bgColor = getColumnColor(colId);
          
          return (
            <Droppable droppableId={colId} key={colId}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  // MAGIA RESPONSIVE COLUMNA:
                  // - Móvil: 85% del ancho de la pantalla (w-[85vw])
                  // - Tablet: ancho fijo de 320px (md:w-[320px])
                  // - Desktop: se estira para llenar la pantalla equitativamente (lg:flex-1 lg:w-auto)
                  className={`flex flex-col rounded-2xl border transition-all h-full shrink-0 snap-center lg:snap-align-none
                    w-[85vw] md:w-[320px] lg:w-auto lg:flex-1 lg:min-w-0
                    ${snapshot.isDraggingOver ? "border-blue-500/50 bg-slate-50 shadow-inner" : "border-slate-200 bg-transparent"}
                  `}
                >
                  {/* HEADER */}
                  <div className={`p-2.5 md:p-3 rounded-t-xl ${bgColor} text-white flex items-center justify-between min-h-[60px] md:min-h-[72px] shrink-0 mx-[-1px] mt-[-1px]`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Icon size={14} className="text-white md:w-4 md:h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-[11px] md:text-xs lg:text-sm capitalize truncate">
                          {ESTADOS_AV[colId]?.label || colId}
                        </h3>
                        <span className="text-[9px] md:text-[10px] text-white/80 font-medium">
                          {col.items.length} {col.items.length === 1 ? 'guía' : 'guías'}
                        </span>
                      </div>
                    </div>
                    {/* Contador circular */}
                    <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-black/20 flex items-center justify-center text-[10px] md:text-xs font-bold shrink-0">
                      {col.items.length}
                    </div>
                  </div>

                  {/* CONTENEDOR DE TARJETAS */}
                  <div className="flex-1 min-h-0 p-2 md:p-2.5 space-y-3 overflow-y-auto rounded-b-xl border-x border-b border-slate-200 bg-slate-50/50">
                    {col.items.map((item, i) => {
                      const tieneDesglose = item._desglose && item._desglose.total > 1;
                      const esParcial = item._esParcial;
                      const estadoReal = item._estadoReal || item.estado;

                      return (
                        <Draggable draggableId={item.id} index={i} key={item.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => {
                                setViewData(item);
                                setViewStep(1);
                                setViewOpen(true);
                              }}
                              className={`bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-200 cursor-pointer group hover:scale-[1.01] hover:shadow-lg relative flex flex-col ${
                                snapshot.isDragging ? "shadow-2xl scale-[1.02] rotate-1 z-50 ring-2 ring-blue-400" : ""
                              }`}
                            >
                              <div className={`h-1 w-full ${bgColor}`} />

                              <div className="p-3 md:p-3.5 space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-mono text-slate-500 font-bold">#{item.numeroAviso}</span>
                                      {item.prioridad && (
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getPriorityColor(item.prioridad)}`}>
                                          {item.prioridad}
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-bold text-slate-800 text-xs md:text-sm leading-tight line-clamp-2">
                                      {item.cliente || "Sin cliente"}
                                    </p>
                                  </div>
                                  <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 shrink-0 mt-1 transition hidden sm:block" />
                                </div>

                                <div className="flex flex-col gap-1.5 pt-1">
                                  <div className="flex items-center gap-2">
                                    <Wrench size={12} className="text-slate-400 shrink-0" />
                                    <span className="text-[10px] md:text-xs text-slate-600 truncate">{item.tipoMantenimiento || "Sin tipo"}</span>
                                  </div>
                                  {item.ubicacionTecnica && (
                                    <div className="flex items-center gap-2">
                                      <MapPin size={12} className="text-slate-400 shrink-0" />
                                      <span className="text-[10px] md:text-xs text-slate-600 truncate">{item.ubicacionTecnica}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between px-2.5 py-1.5 md:py-2 rounded-xl bg-slate-50 border border-slate-100 mt-2">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar size={12} className="text-slate-500" />
                                    <span className="text-slate-600 text-[10px] md:text-xs font-medium">
                                      {item.fechaAtencion
                                        ? new Date(item.fechaAtencion).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })
                                        : "Sin fecha"}
                                    </span>
                                  </div>
                                  {tieneDesglose && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[9px] md:text-[10px] font-bold border border-purple-200">
                                      <Layers size={10} />
                                      {item._desglose.total} OTs
                                    </span>
                                  )}
                                </div>

                                {esParcial && (
                                  <div className="space-y-1 mt-2">
                                    <div className="flex items-center justify-between text-[9px] md:text-[10px] text-orange-600 font-bold">
                                      <span className="flex items-center gap-1">
                                        <AlertTriangle size={10} /> OT Parcial
                                      </span>
                                      <span>{item._desglose?.equiposConOT || 0}/{item._desglose?.equiposTotales || 0}</span>
                                    </div>
                                    <div className="h-1 bg-orange-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-orange-500 rounded-full transition-all"
                                        style={{ width: `${((item._desglose?.equiposConOT || 0) / (item._desglose?.equiposTotales || 1)) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="px-3 md:px-3.5 pb-3 md:pb-3.5 flex flex-wrap sm:flex-nowrap gap-2" onClick={(e) => e.stopPropagation()}>
                                {estadoReal === "CREADO" && (
                                  <button onClick={() => abrirTratamiento(item)} className="flex-1 py-1.5 md:py-2 bg-blue-50 text-blue-600 border border-blue-200 text-[10px] md:text-[11px] font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                                    Tratar
                                  </button>
                                )}
                                {estadoReal === "TRATADO" && (
                                  <button onClick={() => cambiarEstado(item, "CON_OT")} className="flex-1 py-1.5 md:py-2 bg-purple-50 text-purple-600 border border-purple-200 text-[10px] md:text-[11px] font-bold rounded-lg hover:bg-purple-600 hover:text-white transition-colors">
                                    Generar OT
                                  </button>
                                )}
                                {estadoReal === "CON_OT" && (
                                  <button onClick={() => cambiarEstado(item, "FINALIZADO")} className="flex-1 py-1.5 md:py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] md:text-[11px] font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-colors">
                                    Finalizar
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}

                    {provided.placeholder}

                    {col.items.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-col items-center justify-center h-full pt-10 pb-16 opacity-60">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
                          <Package size={24} className="text-slate-300 md:w-8 md:h-8" />
                        </div>
                        <p className="text-xs md:text-sm font-bold text-slate-500">Sin avisos</p>
                        <p className="text-[10px] md:text-xs mt-1 text-slate-400">Esta columna está vacía</p>
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
  );
}