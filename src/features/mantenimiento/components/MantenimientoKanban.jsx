import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  FileText, User, Calendar, AlertCircle, Wrench, Package, 
  CheckCircle, XCircle, Clock, FileCheck, MapPin, Phone, Mail,
  Briefcase, DollarSign, Layers, AlertTriangle
} from "lucide-react";
import { ESTADOS_AV } from "../config/camposMantenimiento";
import React, { useMemo } from "react";

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
      FINALIZADO: CheckCircle,
      FINALIZADO_SIN_FACTURACION: FileCheck,
      RECHAZADO: XCircle,
    };
    return icons[colId] || FileText;
  };

  // 🎨 CABECERAS: Fondo pastel sutil, texto del color principal
  const getColumnHeaderStyle = (colId) => {
    const styles = {
      CREADO: "bg-blue-50 text-blue-700 border-b border-blue-100",
      TRATADO: "bg-amber-50 text-amber-700 border-b border-amber-100",
      CON_OT: "bg-violet-50 text-violet-700 border-b border-violet-100",
      FINALIZADO: "bg-emerald-50 text-emerald-700 border-b border-emerald-100",
      FINALIZADO_SIN_FACTURACION: "bg-slate-50 text-slate-700 border-b border-slate-200",
      RECHAZADO: "bg-rose-50 text-rose-700 border-b border-rose-100",
    };
    return styles[colId] || "bg-slate-50 text-slate-700 border-b border-slate-200";
  };

  // 🎨 TARJETAS CORPORATIVAS: Fondo blanco, borde superior grueso (border-t-4)
  const getCardOutlineStyle = (estadoReal) => {
    const styles = {
      CREADO: "bg-white border border-blue-200 border-t-4 border-t-blue-500 hover:border-blue-300",
      TRATADO: "bg-white border border-amber-200 border-t-4 border-t-amber-500 hover:border-amber-300",
      CON_OT: "bg-white border border-violet-200 border-t-4 border-t-violet-500 hover:border-violet-300",
      FINALIZADO: "bg-white border border-emerald-200 border-t-4 border-t-emerald-500 hover:border-emerald-300",
      FINALIZADO_SIN_FACTURACION: "bg-white border border-slate-200 border-t-4 border-t-slate-400 hover:border-slate-300",
      RECHAZADO: "bg-white border border-rose-200 border-t-4 border-t-rose-500 hover:border-rose-300",
    };
    return styles[estadoReal] || "bg-white border border-slate-200 border-t-4 border-t-slate-400";
  };

  // 🎨 BADGES ESTILO GHOST (Transparentes con borde de color)
  const getPriorityGhostColor = (priority) => {
    const colors = {
      Alta: "bg-transparent border border-rose-300 text-rose-600",
      Media: "bg-transparent border border-amber-300 text-amber-600",
      Baja: "bg-transparent border border-emerald-300 text-emerald-600",
    };
    return colors[priority] || "bg-transparent border border-slate-300 text-slate-600";
  };

  const getEquipoData = (equipoId) => {
    return equiposData.find(e => e.id === equipoId);
  };

  const DesgloseEstados = ({ desglose }) => {
    if (!desglose || !desglose.esMultiple) return null;

    return (
      <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <Layers className="w-3 h-3" />
          <span>Desglose ({desglose.total} OTs)</span>
        </div>
        
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(desglose.porEstado).map(([estado, cantidad]) => (
            <div 
              key={estado}
              className={`flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] bg-slate-50 border border-slate-100`}
            >
              <span className="font-semibold text-slate-600 truncate">{ESTADOS_AV[estado]?.label}</span>
              <span className="font-bold text-slate-800 ml-1">{cantidad}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getTargetKey = (obj) => {
    if (obj?.equipoId) return `E:${String(obj.equipoId)}`;
    if (obj?.ubicacionTecnicaId) return `U:${String(obj.ubicacionTecnicaId)}`;
    if (obj?.ubicacionId) return `U:${String(obj.ubicacionId)}`;
    return null;
  };

  const reorganizarColumnasPorOTs = (columns) => {
    const nuevasColumnas = {};

    Object.keys(columns).forEach((colId) => {
      nuevasColumnas[colId] = { items: [] };
    });

    Object.values(columns).forEach((col) => {
      col.items.forEach((item) => {
        const otsDelAviso = ordenesTrabajoData.filter(
          (ot) => String(ot.avisoId) === String(item.id)
        );

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

        const estaCompleto =
          totalTargetsAviso > 0 && cantidadTargetsConOT >= totalTargetsAviso;

        const esParcial =
          cantidadTargetsConOT > 0 && cantidadTargetsConOT < totalTargetsAviso;

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
      {/* Contenedor principal sin scroll en PC */}
      <div className="w-full flex flex-nowrap gap-2 md:gap-3 h-[calc(100vh-200px)] items-start overflow-x-auto lg:overflow-hidden snap-x snap-mandatory pb-2 px-1">
        {Object.entries(columnasReorganizadas).map(([colId, col]) => {
          const Icon = getColumnIcon(colId);
          const headerClasses = getColumnHeaderStyle(colId);
          
          return (
            <Droppable droppableId={colId} key={colId}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  // Columnas se comprimen equitativamente en PC
                  className={`flex flex-col rounded-xl transition-colors h-full w-[85vw] flex-shrink-0 snap-center lg:flex-1 lg:min-w-0 lg:w-auto ${
                    snapshot.isDraggingOver
                      ? "bg-slate-50 ring-2 ring-slate-200"
                      : "bg-white border border-slate-100 shadow-sm"
                  }`}
                >
                  {/* CABECERA DE COLUMNA: Outline/Pastel */}
                  <div className={`px-3 py-2.5 md:px-3.5 md:py-3 rounded-t-xl ${headerClasses} flex-shrink-0`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Icon className="w-4 h-4 flex-shrink-0 opacity-70" strokeWidth={2.5} />
                        <h3 className="font-bold text-xs md:text-sm truncate uppercase tracking-tight">
                          {ESTADOS_AV[colId]?.label}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 bg-white rounded-full text-[10px] md:text-xs font-bold shadow-sm border border-black/5 ml-2">
                        {col.items.length}
                      </span>
                    </div>
                  </div>

                  {/* TARJETAS */}
                  <div className="flex-1 p-2 md:p-2.5 space-y-2 md:space-y-3 overflow-y-auto bg-slate-50/50">
                    {col.items.map((item, i) => {
                      const tieneDesglose = item._desglose && item._desglose.total > 1;
                      const esParcial = item._esParcial;
                      const estadoReal = item._estadoReal || item.estado;
                      const cardStyle = getCardOutlineStyle(estadoReal);

                      return (
                        <Draggable
                          draggableId={item.id}
                          index={i}
                          key={item.id}
                        >
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
                              // TARJETA CORPORATIVA: Borde superior grueso
                              className={`${cardStyle} rounded-xl shadow-sm transition-all duration-200 cursor-pointer group relative flex flex-col ${
                                snapshot.isDragging ? "shadow-xl scale-[1.02] rotate-1 ring-4 ring-black/5 z-50" : "hover:shadow-md"
                              }`}
                            >
                              {/* Indicador de OT múltiple */}
                              {tieneDesglose && (
                                <div className="absolute -top-3 -right-2 bg-white text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[9px] md:text-[10px] font-bold shadow-sm flex items-center gap-1 z-10">
                                  <Layers className="w-2.5 h-2.5" />
                                  {item._desglose.total} OTs
                                </div>
                              )}

                              {/* CONTENIDO DE LA TARJETA */}
                              <div className="flex-1 p-2.5 md:p-3 space-y-2">
                                {/* Encabezado de la Tarjeta (ID y Cliente) */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800 text-[11px] md:text-xs truncate">
                                      #{item.numeroAviso}
                                    </span>
                                    {/* Prioridad Ghost */}
                                    {item.prioridad && (
                                      <span className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded ${getPriorityGhostColor(item.prioridad)}`}>
                                        {item.prioridad}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-start gap-1.5">
                                    <User className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-[10px] md:text-[11px] text-slate-500 font-medium line-clamp-2">
                                      {item.cliente || "Sin cliente"}
                                    </span>
                                  </div>
                                </div>

                                {/* Caja interna gris (Caja de Datos Internos) */}
                                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 space-y-1.5">
                                  {columnOrder.map((key) => {
                                    if (!cardFields[key] || ["numeroAviso", "cliente", "prioridad"].includes(key)) return null;

                                    switch (key) {
                                      case "fecha":
                                        return (
                                          <div key={key} className="flex items-center justify-between text-[10px] md:text-[11px]">
                                            <span className="text-slate-400 flex items-center gap-1">
                                              <Calendar className="w-3 h-3" /> Fecha
                                            </span>
                                            <span className="text-slate-700 font-medium">
                                              {item.fechaAtencion ? new Date(item.fechaAtencion).toLocaleDateString("es-PE", { day: "2-digit", month: "short" }) : "-"}
                                            </span>
                                          </div>
                                        );

                                      case "solicitante":
                                        return item.solicitante ? (
                                          <div key={key} className="flex items-center justify-between text-[10px] md:text-[11px]">
                                            <span className="text-slate-400 flex items-center gap-1">
                                              <User className="w-3 h-3" /> Solic.
                                            </span>
                                            <span className="text-slate-700 font-medium truncate max-w-[100px]">{item.solicitante}</span>
                                          </div>
                                        ) : null;

                                      case "tipoMantenimiento":
                                        return item.tipoMantenimiento ? (
                                          <div key={key} className="flex items-center justify-between text-[10px] md:text-[11px]">
                                            <span className="text-slate-400 flex items-center gap-1">
                                              <Wrench className="w-3 h-3" /> Tipo
                                            </span>
                                            <span className="text-slate-700 font-medium truncate">{item.tipoMantenimiento}</span>
                                          </div>
                                        ) : null;

                                      case "tipoAviso":
                                        return (
                                          <div key={key} className="flex items-center gap-1 mt-1">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border bg-transparent ${item.tipoAviso === "mantenimiento" ? "text-slate-600 border-slate-300" : "text-emerald-600 border-emerald-300"}`}>
                                              {item.tipoAviso === "mantenimiento" ? "🔧 Mant." : "📦 Inst."}
                                            </span>
                                          </div>
                                        );

                                      case "equipo":
                                        if (!item.equiposRelacion || item.equiposRelacion.length === 0) return null;
                                        const primerEquipoRel = item.equiposRelacion[0];
                                        const primerEquipo = primerEquipoRel?.equipo;
                                        return primerEquipo ? (
                                          <div key={key} className="flex items-center justify-between text-[10px] md:text-[11px] pt-1 border-t border-slate-200/60 mt-1">
                                            <span className="text-slate-400 flex items-center gap-1">
                                              <Package className="w-3 h-3" /> Equipo
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <span className="text-slate-700 font-medium truncate max-w-[80px]">{primerEquipo.nombre}</span>
                                              {item.equiposRelacion.length > 1 && (
                                                <span className="text-[9px] text-slate-500 bg-slate-200 px-1 rounded-full font-bold">
                                                  +{item.equiposRelacion.length - 1}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ) : null;

                                      case "descripcionResumida":
                                        return item.descripcionResumida ? (
                                          <div key={key} className="text-[10px] text-slate-500 line-clamp-2 italic pt-1">
                                            "{item.descripcionResumida}"
                                          </div>
                                        ) : null;

                                      default: {
                                        if (!item[key]) return null;
                                        const contenido = typeof item[key] === 'object' ? JSON.stringify(item[key]) : item[key];
                                        return (
                                          <div key={key} className="text-[10px] md:text-[11px] text-slate-500 truncate">
                                            {contenido}
                                          </div>
                                        );
                                      }
                                    }
                                  })}
                                </div>

                                <DesgloseEstados desglose={item._desglose} />

                                {/* OT PARCIAL */}
                                {esParcial && (
                                  <div className="pt-2 border-t border-slate-100 mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                                        <span className="text-[9px] md:text-[10px] font-bold text-amber-600">
                                          OT Parcial
                                        </span>
                                      </div>
                                      <span className="px-1 py-0.5 bg-transparent border border-amber-200 text-amber-600 rounded text-[9px] font-bold">
                                        {item._equiposPendientes} pend.
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                      <div 
                                        className="bg-amber-400 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${((item._desglose?.equiposConOT || 0) / (item._desglose?.equiposTotales || 1)) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* BOTONES DE ACCIÓN: Estilo Outline/Ghost adaptado al borde */}
                              <div
                                className="px-2.5 pb-2.5 md:px-3 md:pb-3 flex flex-col xl:flex-row flex-wrap gap-1.5 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {estadoReal === "CREADO" && (
                                  <>
                                    <button
                                      onClick={() => abrirTratamiento(item)}
                                      className="flex-1 px-2 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 text-[10px] md:text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 truncate shadow-sm"
                                    >
                                      <Wrench className="w-3 h-3 flex-shrink-0" /> Tratar
                                    </button>
                                    <button
                                      onClick={() => cambiarEstado(item, "RECHAZADO")}
                                      className="flex-1 px-2 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-[10px] md:text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 truncate shadow-sm"
                                    >
                                      <XCircle className="w-3 h-3 flex-shrink-0" /> Rechazar
                                    </button>
                                  </>
                                )}

                                {estadoReal === "TRATADO" && (
                                  <button
                                    onClick={() => cambiarEstado(item, "CON_OT")}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-300 text-[10px] md:text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 truncate shadow-sm"
                                  >
                                    <FileText className="w-3 h-3 flex-shrink-0" /> Generar OT
                                  </button>
                                )}
{estadoReal === "CON_OT" && (
                                  <>
                                    <button
                                      onClick={() => cambiarEstado(item, "FINALIZADO")}
                                      className="flex-1 px-2 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 text-[10px] md:text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 truncate shadow-sm"
                                    >
                                      <CheckCircle className="w-3 h-3 flex-shrink-0" /> Finalizar
                                    </button>

                                    {/* Aquí está de vuelta el botón Sin Facturación */}
                                    <button
                                      onClick={() => cambiarEstado(item, "FINALIZADO_SIN_FACTURACION")}
                                      className="flex-1 px-2 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400 text-[10px] md:text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 truncate shadow-sm"
                                    >
                                      <FileCheck className="w-3 h-3 flex-shrink-0" /> Sin Fact.
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}

                    {provided.placeholder}

                    {/* EMPTY STATE */}
                    {col.items.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                        <Package className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-xs font-bold uppercase tracking-wider">Vacío</p>
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