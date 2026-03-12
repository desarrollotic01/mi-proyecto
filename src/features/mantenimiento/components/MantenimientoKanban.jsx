import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  FileText, User, Calendar, AlertCircle, Wrench, Package, 
  CheckCircle, XCircle, Clock, FileCheck, MapPin, Phone, Mail,
  Briefcase, DollarSign, Layers, Link2, AlertTriangle
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
      FINALIZADO: CheckCircle,
      FINALIZADO_SIN_FACTURACION: FileCheck,
      RECHAZADO: XCircle,
    };
    return icons[colId] || FileText;
  };

  const getColumnColor = (colId) => {
    const colors = {
      CREADO: "from-blue-500 to-blue-600",
      TRATADO: "from-yellow-500 to-yellow-600",
      CON_OT: "from-purple-500 to-purple-600",
      FINALIZADO: "from-green-500 to-green-600",
      FINALIZADO_SIN_FACTURACION: "from-gray-500 to-gray-600",
      RECHAZADO: "from-red-500 to-red-600",
    };
    return colors[colId] || "from-gray-500 to-gray-600";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Alta: "bg-red-100 text-red-700 border-red-300",
      Media: "bg-yellow-100 text-yellow-700 border-yellow-300",
      Baja: "bg-green-100 text-green-700 border-green-300",
    };
    return colors[priority] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getEquipoData = (equipoId) => {
    return equiposData.find(e => e.id === equipoId);
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

  Object.keys(columns).forEach((colId) => {
    nuevasColumnas[colId] = { items: [] };
  });

  Object.values(columns).forEach((col) => {
    col.items.forEach((item) => {
      const otsDelAviso = ordenesTrabajoData.filter(
        (ot) => String(ot.avisoId) === String(item.id)
      );

      // Targets reales del aviso
      const targetsAviso = new Set();

      (item.equiposRelacion || []).forEach((rel) => {
        const key = getTargetKey(rel);
        if (key) targetsAviso.add(key);
      });

      (item.ubicacionesRelacion || []).forEach((rel) => {
        const key = getTargetKey(rel);
        if (key) targetsAviso.add(key);
      });

      // Si no tiene OTs, se queda en su estado real
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

      // Targets cubiertos por las OTs
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

      // Si hay al menos una OT y cubre todos los targets => CON_OT
      // Si hay OT parcial => TRATADO
      // Si por alguna razón no se pudo calcular targets del aviso, al menos mostrar CON_OT
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 h-[calc(100vh-200px)] items-start gap-4 h-[calc(100vh-200px)]">
        {Object.entries(columnasReorganizadas).map(([colId, col]) => {
          const Icon = getColumnIcon(colId);
          const gradient = getColumnColor(colId);
          
          return (
            <Droppable droppableId={colId} key={colId}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex flex-col rounded-2xl transition-all shadow-lg h-full ${
                    snapshot.isDraggingOver
                      ? "bg-blue-50 ring-2 ring-blue-400"
                      : "bg-white border-2 border-slate-200"
                  }`}
                >
                  {/* HEADER DE COLUMNA */}
                  <div className={`p-5 rounded-t-2xl bg-gradient-to-br ${gradient} text-white shadow-md flex-shrink-0`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/25 rounded-xl backdrop-blur-sm border border-white/30">
                          <Icon className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <h3 className="font-bold text-base">
                          {ESTADOS_AV[colId]?.label}
                        </h3>
                      </div>
                      <span className="px-3 py-1.5 bg-white/25 rounded-full text-sm font-bold backdrop-blur-sm border border-white/30">
                        {col.items.length}
                      </span>
                    </div>
                  </div>

                  {/* TARJETAS */}
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
                    {col.items.map((item, i) => {
                      const tieneDesglose = item._desglose && item._desglose.total > 1;
                      const esParcial = item._esParcial;
                      const estadoReal = item._estadoReal || item.estado;

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
                              className={`bg-white rounded-xl border-2 shadow-md transition-all duration-200 cursor-pointer group relative flex flex-col ${
                                snapshot.isDragging
                                  ? "border-blue-500 shadow-2xl scale-105 rotate-1 ring-4 ring-blue-200"
                                  : tieneDesglose
                                  ? "border-purple-300 hover:border-purple-400 hover:shadow-xl"
                                  : esParcial
                                  ? "border-orange-300 hover:border-orange-400 hover:shadow-xl"
                                  : "border-slate-200 hover:border-blue-300 hover:shadow-lg"
                              }`}
                            >
                              {/* Indicador de OT múltiple */}
                              {tieneDesglose && (
                                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full px-2.5 py-1 text-xs font-bold shadow-lg border-2 border-white flex items-center gap-1">
                                  <Layers className="w-3 h-3" />
                                  {item._desglose.total} OTs
                                </div>
                              )}

                              {/* CARD CONTENT */}
                              <div className="flex-1 p-4 space-y-3">
                                {/* CONTENIDO DINÁMICO */}
                                {columnOrder.map((key) => {
                                  if (!cardFields[key]) return null;

                                  switch (key) {
                                    case "numeroAviso":
                                      return (
                                        <div key={key} className="flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-blue-600" />
                                          <span className="font-bold text-slate-900 text-lg">
                                            #{item.numeroAviso}
                                          </span>
                                        </div>
                                      );

                                    case "cliente":
                                      return (
                                        <div key={key} className="flex items-start gap-2">
                                          <User className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                          <span className="text-sm text-slate-700 font-medium line-clamp-2">
                                            {item.cliente || "Sin cliente"}
                                          </span>
                                        </div>
                                      );

                                    case "estado":
                                      return (
                                        <span
                                          key={key}
                                          className={`inline-flex items-center px-3 py-1.5 text-xs font-bold border-2 rounded-lg shadow-sm ${
                                            ESTADOS_AV[estadoReal]?.badge
                                          }`}
                                        >
                                          {ESTADOS_AV[estadoReal]?.label}
                                        </span>
                                      );

                                    case "fecha":
                                      return (
                                        <div key={key} className="flex items-center gap-2 text-sm text-slate-600">
                                          <Calendar className="w-4 h-4" />
                                          <span>
                                            {item.fechaAtencion
                                              ? new Date(item.fechaAtencion).toLocaleDateString("es-PE", {
                                                  day: "2-digit",
                                                  month: "short",
                                                })
                                              : "Sin fecha"}
                                          </span>
                                        </div>
                                      );

                                    case "prioridad":
                                      return item.prioridad ? (
                                        <div key={key} className="flex items-center gap-2">
                                          <AlertCircle className="w-4 h-4 text-slate-400" />
                                          <span
                                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border-2 ${getPriorityColor(
                                              item.prioridad
                                            )}`}
                                          >
                                            {item.prioridad}
                                          </span>
                                        </div>
                                      ) : null;

                                    case "solicitante":
                                      return item.solicitante ? (
                                        <div key={key} className="text-xs text-slate-600 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
                                          <User className="w-3 h-3" />
                                          {item.solicitante}
                                        </div>
                                      ) : null;

                                    case "tipoMantenimiento":
                                      return item.tipoMantenimiento ? (
                                        <div key={key} className="flex items-center gap-1.5">
                                          <Wrench className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-xs text-slate-700 font-medium">
                                            {item.tipoMantenimiento}
                                          </span>
                                        </div>
                                      ) : null;

                                    case "tipoAviso":
                                      return (
                                        <div key={key} className="flex items-center gap-1">
                                          <span
                                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border-2 ${
                                              item.tipoAviso === "mantenimiento"
                                                ? "bg-blue-50 text-blue-700 border-blue-300"
                                                : "bg-green-50 text-green-700 border-green-300"
                                            }`}
                                          >
                                            {item.tipoAviso === "mantenimiento" ? "🔧 Mantenimiento" : "📦 Instalación"}
                                          </span>
                                        </div>
                                      );

                                    case "equipo":
                                      if (!item.equiposRelacion || item.equiposRelacion.length === 0) return null;
                                      
                                      const primerEquipoRel = item.equiposRelacion[0];
                                      const primerEquipo = primerEquipoRel?.equipo;
                                      
                                      return primerEquipo ? (
                                        <div key={key} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded-lg">
                                          <Package className="w-3.5 h-3.5 text-slate-500" />
                                          <span className="text-xs text-slate-700 font-medium line-clamp-1">
                                            {primerEquipo.nombre}
                                          </span>
                                          {item.equiposRelacion.length > 1 && (
                                            <span className="text-xs text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-full ml-auto font-bold">
                                              +{item.equiposRelacion.length - 1}
                                            </span>
                                          )}
                                        </div>
                                      ) : null;

                                    case "ordenVenta":
                                      return item.ordenVenta ? (
                                        <div key={key} className="flex items-center gap-1.5">
                                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-xs text-slate-600">
                                            <span className="font-bold">OV:</span> {item.ordenVenta}
                                          </span>
                                        </div>
                                      ) : null;

                                    case "centroCosto":
                                      return item.centroCosto ? (
                                        <div key={key} className="flex items-center gap-1.5">
                                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-xs text-slate-600">
                                            <span className="font-bold">CC:</span> {item.centroCosto}
                                          </span>
                                        </div>
                                      ) : null;

                                    case "producto":
                                      return item.producto ? (
                                        <div key={key} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
                                          <Package className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-xs text-slate-700 line-clamp-1">
                                            {item.producto}
                                          </span>
                                        </div>
                                      ) : null;

                                    case "descripcionResumida":
                                      return item.descripcionResumida ? (
                                        <div key={key} className="text-sm text-slate-700 line-clamp-2 italic border-l-4 border-blue-400 pl-3 py-1 bg-blue-50 rounded-r">
                                          {item.descripcionResumida}
                                        </div>
                                      ) : null;

                                    case "ubicacionTecnica":
                                      return item.ubicacionTecnica ? (
                                        <div key={key} className="flex items-center gap-1.5">
                                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-xs text-slate-600 line-clamp-1">
                                            {item.ubicacionTecnica}
                                          </span>
                                        </div>
                                      ) : null;

                                    case "nombreContacto":
                                      return item.nombreContacto ? (
                                        <div key={key} className="flex items-center gap-1.5">
                                          <User className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-xs text-slate-600">
                                            {item.nombreContacto}
                                          </span>
                                        </div>
                                      ) : null;

                                    case "correoContacto":
                                      return item.correoContacto ? (
                                        <div key={key} className="flex items-center gap-1.5">
                                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-xs text-slate-600 truncate">
                                            {item.correoContacto}
                                          </span>
                                        </div>
                                      ) : null;

                                    case "numeroContacto":
                                      return item.numeroContacto ? (
                                        <div key={key} className="flex items-center gap-1.5">
                                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-xs text-slate-600">
                                            {item.numeroContacto}
                                          </span>
                                        </div>
                                      ) : null;

                                    default:
                                      return item[key] ? (
                                        <div key={key} className="text-xs text-slate-600">
                                          {item[key]}
                                        </div>
                                      ) : null;
                                  }
                                })}

                                {/* DESGLOSE DE ESTADOS */}
                                <DesgloseEstados desglose={item._desglose} />

                                {/* BADGE DE ORDEN PARCIAL con barra de progreso */}
                                {esParcial && (
                                  <div className="pt-3 border-t border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 -mx-4 -mb-4 px-4 pb-3 rounded-b-xl mt-auto">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                                        <span className="text-xs font-bold text-orange-800">
                                          Orden de Trabajo Parcial
                                        </span>
                                      </div>
                                      <span className="px-2 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-bold">
                                        {item._equiposPendientes} pendiente{item._equiposPendientes !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    <div className="w-full bg-orange-200 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className="bg-orange-600 h-full rounded-full transition-all duration-300"
                                        style={{ 
                                          width: `${((item._desglose?.equiposConOT || 0) / (item._desglose?.equiposTotales || 1)) * 100}%` 
                                        }}
                                      />
                                    </div>
                                    <div className="text-xs text-orange-700 mt-1 text-center font-medium">
                                      {item._desglose?.equiposConOT || 0} de {item._desglose?.equiposTotales || 0} equipos con OT
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* BOTONES DE ACCIÓN */}
                              <div
                                className="px-4 pb-4 flex gap-2 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {estadoReal === "CREADO" && (
                                  <>
                                    <button
                                      onClick={() => abrirTratamiento(item)}
                                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-bold rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                                    >
                                      <Wrench className="w-4 h-4" />
                                      Tratar
                                    </button>

                                    <button
                                      onClick={() => cambiarEstado(item, "RECHAZADO")}
                                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Rechazar
                                    </button>
                                  </>
                                )}

                                {estadoReal === "TRATADO" && (
                                  <button
                                    onClick={() => cambiarEstado(item, "CON_OT")}
                                    className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                                  >
                                    <FileText className="w-4 h-4" />
                                    Generar OT
                                  </button>
                                )}

                                {estadoReal === "CON_OT" && (
                                  <>
                                    <button
                                      onClick={() => cambiarEstado(item, "FINALIZADO")}
                                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Finalizar
                                    </button>

                                    <button
                                      onClick={() => cambiarEstado(item, "FINALIZADO_SIN_FACTURACION")}
                                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-slate-500 to-slate-600 text-white text-xs font-bold rounded-lg hover:from-slate-600 hover:to-slate-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                                    >
                                      <FileCheck className="w-4 h-4" />
                                      Sin Fact.
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
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <div className="bg-slate-100 rounded-2xl p-6 mb-4">
                          <Package className="w-16 h-16 opacity-30" />
                        </div>
                        <p className="text-sm font-bold">Sin avisos</p>
                        <p className="text-xs text-slate-400 mt-1">Esta columna está vacía</p>
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