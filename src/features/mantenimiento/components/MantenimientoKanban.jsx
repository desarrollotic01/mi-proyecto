import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  FileText, User, Calendar, Wrench, Package,
  CheckCircle, XCircle, Clock, FileCheck, Layers, MapPin,
  AlertTriangle, ChevronRight, Mail, Phone, Building, Box, Hash, DollarSign,
} from "lucide-react";
import { ESTADOS_AV } from "../config/camposMantenimiento";

/* ─── Etiquetas de campo (igual que MantenimientoLista) ─── */
const LABELS = {
  numeroAviso: "N° Aviso", tipoAviso: "Tipo Aviso", cliente: "Cliente",
  estado: "Estado", fecha: "Fecha", prioridad: "Prioridad",
  equipo: "Equipo", descripcion: "Descripción", descripcionResumida: "Resumen",
  solicitante: "Solicitante", tipoMantenimiento: "Tipo Mant.",
  ordenVenta: "O. Venta", centroCosto: "C. Costo", producto: "Producto",
  ordenCliente: "O. Cliente", almacen: "Almacén", sede: "Sede",
  nombreContacto: "Contacto", correoContacto: "Email",
  numeroContacto: "Teléfono", ubicacionTecnica: "Ubicación",
  direccionAtencion: "Dirección", supervisorAsignado: "Supervisor",
  estadoAviso: "Estado Aviso", documentos: "Docs", documentoFinal: "Doc Final",
};

const ICONS = {
  numeroAviso: FileText, tipoAviso: Package, cliente: User,
  fecha: Calendar, prioridad: AlertTriangle, equipo: Package,
  tipoMantenimiento: Wrench, ubicacionTecnica: MapPin,
  nombreContacto: User, correoContacto: Mail,
  numeroContacto: Phone, sede: Building, producto: Box,
  ordenVenta: Hash, centroCosto: DollarSign,
};

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
  /* ─── Campos visibles en el orden configurado (igual que Lista) ─── */
  const visibleKeys = columnOrder.filter((k) => cardFields[k]);

  const getPriorityColor = (p) => ({
    Alta:  "bg-red-500/20 text-red-600 border border-red-400/40",
    Media: "bg-yellow-500/20 text-yellow-700 border border-yellow-400/40",
    Baja:  "bg-green-500/20 text-green-700 border border-green-400/40",
  })[p] || "bg-slate-100 text-slate-500 border border-slate-200";

  const getColumnIcon = (colId) => ({
    CREADO: Clock, TRATADO: Wrench, CON_OT: FileText,
    RECHAZADO: XCircle, FINALIZADO: CheckCircle,
    FACTURADO: FileText, FINALIZADO_SIN_FACTURACION: FileCheck,
  })[colId] || FileText;

  const getColumnColor = (colId) => ({
    CREADO: "bg-[#334155]", TRATADO: "bg-[#2563eb]", CON_OT: "bg-[#6d28d9]",
    RECHAZADO: "bg-[#b91c1c]", FINALIZADO: "bg-[#059669]",
    FACTURADO: "bg-[#475569]", FINALIZADO_SIN_FACTURACION: "bg-[#1e293b]",
  })[colId] || "bg-slate-500";

  /* ─── Reagrupación por OTs ─── */
  const getTargetKey = (obj) => {
    if (obj?.equipoId) return `E:${obj.equipoId}`;
    if (obj?.ubicacionTecnicaId) return `U:${obj.ubicacionTecnicaId}`;
    if (obj?.ubicacionId) return `U:${obj.ubicacionId}`;
    return null;
  };

  const reorganizarColumnasPorOTs = (columns) => {
    const out = {};
    Object.keys(columns).forEach((k) => { out[k] = { items: [] }; });

    Object.values(columns).forEach((col) => {
      col.items.forEach((item) => {
        const otsDelAviso = ordenesTrabajoData.filter((ot) => String(ot.avisoId) === String(item.id));

        const targetsAviso = new Set();
        [...(item.equiposRelacion || []), ...(item.ubicacionesRelacion || [])].forEach((rel) => {
          const k = getTargetKey(rel); if (k) targetsAviso.add(k);
        });

        if (!otsDelAviso.length) {
          out[item.estado]?.items.push({ ...item, _estadoReal: item.estado, _tieneOTs: false, _esParcial: false, _cantidadOTs: 0, _desglose: null });
          return;
        }

        const targetsConOT = new Set();
        otsDelAviso.forEach((ot) => {
          (ot.equipos || []).forEach((t) => { const k = getTargetKey(t); if (k) targetsConOT.add(k); });
        });

        const total       = targetsAviso.size;
        const conOT       = targetsConOT.size;
        const esParcial   = conOT > 0 && conOT < total;
        const estaCompleto = total > 0 && conOT >= total;
        const columnaDestino = (total === 0 || estaCompleto) ? "CON_OT" : "TRATADO";

        const porEstado = {};
        otsDelAviso.forEach((ot) => { const e = ot.estado || "CREADO"; porEstado[e] = (porEstado[e] || 0) + 1; });

        out[columnaDestino]?.items.push({
          ...item, _estadoReal: columnaDestino, _tieneOTs: true, _esParcial: esParcial,
          _equiposPendientes: Math.max(0, total - conOT), _cantidadOTs: otsDelAviso.length,
          _desglose: { total: otsDelAviso.length, porEstado, equiposConOT: conOT, equiposTotales: total },
        });
      });
    });
    return out;
  };

  const columnasReorganizadas = reorganizarColumnasPorOTs(filteredColumns);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex w-full gap-3 pb-4 h-[calc(100dvh-130px)] lg:h-[calc(100vh-160px)] overflow-x-auto lg:overflow-hidden px-2 lg:px-1 snap-x snap-mandatory lg:snap-none">
        {Object.entries(columnasReorganizadas).map(([colId, col]) => {
          const Icon    = getColumnIcon(colId);
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
                  {/* Cabecera columna */}
                  <div className={`p-2.5 md:p-3 rounded-t-xl ${bgColor} text-white flex items-center justify-between min-h-[60px] md:min-h-[72px] shrink-0 mx-[-1px] mt-[-1px]`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Icon size={14} className="text-white" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-[11px] md:text-xs lg:text-sm capitalize truncate">
                          {ESTADOS_AV[colId]?.label || colId}
                        </h3>
                        <span className="text-[9px] md:text-[10px] text-white/80 font-medium">
                          {col.items.length} {col.items.length === 1 ? "guía" : "guías"}
                        </span>
                      </div>
                    </div>
                    <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-black/20 flex items-center justify-center text-[10px] md:text-xs font-bold shrink-0">
                      {col.items.length}
                    </div>
                  </div>

                  {/* Tarjetas */}
                  <div className="flex-1 min-h-0 p-2 md:p-2.5 space-y-3 overflow-y-auto rounded-b-xl border-x border-b border-slate-200 bg-slate-50/50">
                    {col.items.map((item, i) => {
                      const tieneDesglose = item._desglose && item._desglose.total > 1;
                      const esParcial     = item._esParcial;
                      const estadoReal    = item._estadoReal || item.estado;

                      return (
                        <Draggable draggableId={item.id} index={i} key={item.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => { setViewData(item); setViewStep(1); setViewOpen(true); }}
                              className={`bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-200 cursor-pointer group hover:scale-[1.01] hover:shadow-lg flex flex-col ${
                                snapshot.isDragging ? "shadow-2xl scale-[1.02] rotate-1 z-50 ring-2 ring-blue-400" : ""
                              }`}
                            >
                              <div className={`h-1 w-full ${bgColor}`} />

                              <div className="p-3 space-y-1.5">
                                {/* Renderiza TODOS los campos visibles en el orden configurado */}
                                {visibleKeys.map((key) => {
                                  /* Campos especiales con tratamiento propio */
                                  if (key === "numeroAviso") return (
                                    <div key={key} className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">N° Aviso</span>
                                        <span className="text-xs font-mono font-bold text-slate-800">{item.numeroAviso || "—"}</span>
                                      </div>
                                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 shrink-0 transition hidden sm:block" />
                                    </div>
                                  );

                                  if (key === "prioridad") return item.prioridad ? (
                                    <div key={key} className="flex items-center gap-1.5">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide w-[52px]">Prioridad</span>
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getPriorityColor(item.prioridad)}`}>
                                        {item.prioridad}
                                      </span>
                                    </div>
                                  ) : null;

                                  if (key === "estado") return (
                                    <div key={key} className="flex items-center gap-1.5">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide w-[52px]">Estado</span>
                                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${ESTADOS_AV[item.estado]?.badge || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                        {ESTADOS_AV[item.estado]?.label || item.estado}
                                      </span>
                                    </div>
                                  );

                                  if (key === "fecha") return (
                                    <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Fecha</span>
                                      <Calendar size={10} className="text-slate-400" />
                                      <span className="text-[10px] text-slate-600 font-medium">
                                        {item.fechaAtencion
                                          ? new Date(item.fechaAtencion).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })
                                          : "Sin fecha"}
                                      </span>
                                      {tieneDesglose && (
                                        <span className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[9px] font-bold border border-purple-200">
                                          <Layers size={9} />{item._desglose.total} OTs
                                        </span>
                                      )}
                                    </div>
                                  );

                                  if (key === "documentos") return item.documentos?.length ? (
                                    <FieldRow key={key} label="Docs" value={`${item.documentos.length} archivo(s)`} />
                                  ) : null;

                                  if (key === "documentoFinal") return item.documentoFinal ? (
                                    <FieldRow key={key} label="Doc Final" value="✓" />
                                  ) : null;

                                  /* Campo genérico */
                                  const val = item[key === "fecha" ? "fechaAtencion" : key];
                                  if (!val) return null;
                                  return (
                                    <FieldRow
                                      key={key}
                                      label={LABELS[key] || key}
                                      value={val}
                                      icon={ICONS[key]}
                                    />
                                  );
                                })}

                                {/* OT parcial (siempre visible si aplica) */}
                                {esParcial && (
                                  <div className="space-y-1 pt-1">
                                    <div className="flex items-center justify-between text-[9px] text-orange-600 font-bold">
                                      <span className="flex items-center gap-1"><AlertTriangle size={9} /> OT Parcial</span>
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

                              {/* Botones de acción */}
                              <div className="px-3 pb-3 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                                {estadoReal === "CREADO" && (
                                  <>
                                    <button onClick={() => abrirTratamiento(item)} className="flex-1 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                                      Tratar
                                    </button>
                                    <button onClick={() => cambiarEstado(item, "RECHAZADO")} className="px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                                      Rechazar
                                    </button>
                                  </>
                                )}
                                {estadoReal === "TRATADO" && (
                                  <button onClick={() => cambiarEstado(item, "CON_OT")} className="flex-1 py-1.5 bg-purple-50 text-purple-600 border border-purple-200 text-[10px] font-bold rounded-lg hover:bg-purple-600 hover:text-white transition-colors">
                                    Generar OT
                                  </button>
                                )}
                                {estadoReal === "CON_OT" && (
                                  <>
                                    <button onClick={() => cambiarEstado(item, "FINALIZADO")} className="flex-1 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-colors">
                                      Finalizar
                                    </button>
                                    <button onClick={() => cambiarEstado(item, "FINALIZADO_SIN_FACTURACION")} className="px-2 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold rounded-lg hover:bg-slate-600 hover:text-white transition-colors">
                                      Sin Fact.
                                    </button>
                                  </>
                                )}
                                {estadoReal === "FINALIZADO" && (
                                  <button onClick={() => cambiarEstado(item, "FACTURADO")} className="flex-1 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-colors">
                                    Facturar
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
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
                          <Package size={24} className="text-slate-300" />
                        </div>
                        <p className="text-xs font-bold text-slate-500">Sin avisos</p>
                        <p className="text-[10px] mt-1 text-slate-400">Esta columna está vacía</p>
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
