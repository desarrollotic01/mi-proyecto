import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  FileText, User, Calendar, AlertCircle, Wrench, Package, 
  CheckCircle, XCircle, Clock, FileCheck, MapPin, Phone, Mail,
  Briefcase, DollarSign, Layers, AlertTriangle
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
      CREADO: FileText,
      TRATADO: FileCheck,
      CON_OT: Wrench,
      FINALIZADO: CheckCircle,
      FINALIZADO_SIN_FACTURACION: Briefcase,
      RECHAZADO: XCircle,
    };
    return icons[colId] || FileText;
  };

  // Colores exactos de tu imagen
  const getColumnColor = (colId) => {
    const colors = {
      CREADO: "bg-[#334155]", // Gris oscuro
      TRATADO: "bg-[#2563eb]", // Azul
      CON_OT: "bg-[#6d28d9]",  // Morado
      FINALIZADO: "bg-[#059669]", // Verde
      FINALIZADO_SIN_FACTURACION: "bg-[#d97706]", // Naranja/Marrón
      RECHAZADO: "bg-[#b91c1c]", // Rojo
    };
    return colors[colId] || "bg-slate-500";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Alta: "bg-red-100 text-red-700 border-red-300",
      Media: "bg-yellow-100 text-yellow-700 border-yellow-300",
      Baja: "bg-green-100 text-green-700 border-green-300",
    };
    return colors[priority] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const DesgloseEstados = ({ desglose }) => {
    if (!desglose || !desglose.esMultiple) return null;

    return (
      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Layers className="w-3 h-3" />
          <span>Desglose de OTs ({desglose.total})</span>
        </div>
        
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(desglose.porEstado).map(([estado, cantidad]) => (
            <div 
              key={estado}
              className={`flex items-center justify-between px-2 py-1 rounded text-xs ${
                ESTADOS_AV[estado]?.badge || 'bg-gray-100 text-gray-700'
              }`}
            >
              <span className="font-semibold">{ESTADOS_AV[estado]?.label}</span>
              <span className="font-bold">{cantidad}</span>
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
      {/* AQUÍ ESTÁ LA MAGIA DEL LAYOUT:
        - Quitamos overflow-x-auto
        - Usamos flex y w-full para que ocupe todo el ancho
        - Usamos gap-3 o gap-4 para separarlas 
      */}
      <div className="flex w-full gap-4 pb-4 px-2 h-[calc(100vh-160px)]">
        {Object.entries(columnasReorganizadas).map(([colId, col]) => {
          const Icon = getColumnIcon(colId);
          const bgColor = getColumnColor(colId);
          
          // Truncamos el título para que se vea como en tu imagen (Ej: "Cre...", "Tra...")
          const labelCompleto = ESTADOS_AV[colId]?.label || colId;
          const labelCorto = labelCompleto.substring(0, 3) + "...";
          
          return (
            <Droppable droppableId={colId} key={colId}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  // flex-1 hace que las columnas se repartan el espacio equitativamente sin necesidad de hacer scroll
                  className={`flex flex-col flex-1 min-w-0 rounded-2xl bg-white border-2 border-slate-100 transition-all shadow-sm ${
                    snapshot.isDraggingOver ? "ring-2 ring-blue-300" : ""
                  }`}
                >
                  {/* HEADER IDÉNTICO A LA IMAGEN */}
                  <div className={`p-3 rounded-t-xl ${bgColor} text-white flex items-center justify-between`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-base capitalize tracking-wide truncate" title={labelCompleto}>
                          {labelCorto}
                        </h3>
                        <span className="text-[10px] text-white/80 font-medium">
                          {col.items.length} {col.items.length === 1 ? 'guía' : 'guías'}
                        </span>
                      </div>
                    </div>
                    {/* Contador Circular */}
                    <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {col.items.length}
                    </div>
                  </div>

                  {/* CONTENEDOR DE TARJETAS */}
                  <div className="flex-1 min-h-[150px] p-3 space-y-3 overflow-y-auto">
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
                              className={`bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-200 cursor-pointer group relative flex flex-col ${
                                snapshot.isDragging
                                  ? "border-blue-500 shadow-2xl scale-[1.02] rotate-1 z-50"
                                  : tieneDesglose
                                  ? "hover:border-purple-300 hover:shadow-md"
                                  : esParcial
                                  ? "hover:border-orange-300 hover:shadow-md"
                                  : "hover:border-blue-300 hover:shadow-md"
                              }`}
                            >
                              {tieneDesglose && (
                                <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full px-2.5 py-1 text-xs font-bold shadow-lg border-2 border-white flex items-center gap-1 z-10">
                                  <Layers className="w-3 h-3" />
                                  {item._desglose.total} OTs
                                </div>
                              )}

                              <div className="flex-1 p-3 space-y-2.5">
                                {columnOrder.map((key) => {
                                  if (!cardFields[key]) return null;

                                  switch (key) {
                                    case "numeroAviso":
                                      return (
                                        <div key={key} className="flex items-center gap-2">
                                          <span className="font-bold text-slate-800 text-sm">
                                            #{item.numeroAviso}
                                          </span>
                                        </div>
                                      );

                                    case "cliente":
                                      return (
                                        <div key={key} className="text-xs text-slate-600 font-medium line-clamp-2">
                                          {item.cliente || "Sin cliente"}
                                        </div>
                                      );

                                    case "estado":
                                      return (
                                        <span key={key} className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold border rounded ${ESTADOS_AV[estadoReal]?.badge}`}>
                                          {ESTADOS_AV[estadoReal]?.label}
                                        </span>
                                      );

                                    case "fecha":
                                      return (
                                        <div key={key} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                          <Calendar className="w-3 h-3" />
                                          <span>
                                            {item.fechaAtencion
                                              ? new Date(item.fechaAtencion).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })
                                              : "Sin fecha"}
                                          </span>
                                        </div>
                                      );

                                    default:
                                      return item[key] ? <div key={key} className="text-[11px] text-slate-500 truncate">{item[key]}</div> : null;
                                  }
                                })}

                                <DesgloseEstados desglose={item._desglose} />
                              </div>

                              {/* BOTONES DE ACCIÓN (Ajustados para caber en columnas más estrechas) */}
                              <div className="px-3 pb-3 flex flex-col gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                {estadoReal === "CREADO" && (
                                  <>
                                    <button onClick={() => abrirTratamiento(item)} className="w-full py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700 transition-colors">
                                      Tratar
                                    </button>
                                  </>
                                )}
                                {estadoReal === "TRATADO" && (
                                  <button onClick={() => cambiarEstado(item, "CON_OT")} className="w-full py-1.5 bg-purple-600 text-white text-[10px] font-bold rounded hover:bg-purple-700 transition-colors">
                                    Generar OT
                                  </button>
                                )}
                                {estadoReal === "CON_OT" && (
                                  <>
                                    <button onClick={() => cambiarEstado(item, "FINALIZADO")} className="w-full py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded hover:bg-emerald-700 transition-colors">
                                      Finalizar
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

                    {/* ESTADO VACÍO IDÉNTICO A LA IMAGEN */}
                    {col.items.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-col items-center justify-center h-full pt-10 pb-20">
                        <div className="w-[60px] h-[60px] border border-slate-200 rounded-2xl flex items-center justify-center mb-3">
                          <Package className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                        </div>
                        <p className="text-[#94a3b8] text-xs font-medium">Sin guías</p>
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