import { useState, useMemo } from "react";
import {
  FileText, User, Calendar, AlertCircle, Wrench, Package,
  CheckCircle, XCircle, FileCheck, Inbox, MapPin, Mail, Phone,
  Building, Box, Hash, DollarSign, ChevronUp, ChevronDown as ChevronDownIcon, ChevronsUpDown,
} from "lucide-react";
import { ESTADOS_AV } from "../config/camposMantenimiento";

const PAGE_SIZE = 20;

export default function MantenimientoLista({
  filteredColumns,
  cardFields,
  columnOrder,
  cambiarEstado,
  abrirTratamiento,
  setViewData,
  setViewStep,
  setViewOpen,
  equiposData = [],
}) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("fecha");
  const [sortDir, setSortDir] = useState("desc");

  const avisos = useMemo(
    () => Object.values(filteredColumns).flatMap((col) => col.items),
    [filteredColumns]
  );

  const getEquipoData = (equipoId) =>
    equiposData.find((e) => e.id === equipoId || e.id === String(equipoId));

  const getPriorityColor = (priority) => {
    const colors = {
      Alta:  "bg-red-100 text-red-700 border-red-300",
      Media: "bg-yellow-100 text-yellow-700 border-yellow-300",
      Baja:  "bg-green-100 text-green-700 border-green-300",
    };
    return colors[priority] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const fieldIcons = {
    numeroAviso: FileText, tipoAviso: Package, cliente: User,
    fecha: Calendar, prioridad: AlertCircle, tipoMantenimiento: Wrench,
    equipo: Package, ordenVenta: Hash, centroCosto: DollarSign,
    producto: Box, ubicacionTecnica: MapPin, nombreContacto: User,
    correoContacto: Mail, numeroContacto: Phone, sede: Building,
  };

  const labels = {
    numeroAviso: "N° Aviso", tipoAviso: "Tipo", descripcion: "Descripción",
    descripcionResumida: "Resumen", cliente: "Cliente", equipo: "Equipo",
    estado: "Estado", fecha: "Fecha", prioridad: "Prioridad",
    solicitante: "Solicitante", tipoMantenimiento: "Tipo Mant.",
    ordenVenta: "O. Venta", centroCosto: "C. Costo", producto: "Producto",
    ordenCliente: "O. Cliente", almacen: "Almacén", sede: "Sede",
    nombreContacto: "Contacto", correoContacto: "Email",
    numeroContacto: "Teléfono", ubicacionTecnica: "Ubicación",
    direccionAtencion: "Dirección", supervisorAsignado: "Supervisor",
    estadoAviso: "Estado Aviso", documentos: "Docs", documentoFinal: "Doc Final",
  };

  const getColumnWidth = (key) => {
    const widths = {
      numeroAviso: "min-w-[150px]", tipoAviso: "min-w-[130px]",
      estado: "min-w-[140px]", prioridad: "min-w-[120px]",
      cliente: "min-w-[180px]", fecha: "min-w-[130px]",
      equipo: "min-w-[160px]", descripcion: "min-w-[240px]",
      descripcionResumida: "min-w-[200px]", solicitante: "min-w-[130px]",
      tipoMantenimiento: "min-w-[140px]", ordenVenta: "min-w-[110px]",
      centroCosto: "min-w-[110px]", producto: "min-w-[130px]",
      ordenCliente: "min-w-[110px]", almacen: "min-w-[110px]",
      sede: "min-w-[130px]", nombreContacto: "min-w-[150px]",
      correoContacto: "min-w-[170px]", numeroContacto: "min-w-[130px]",
      ubicacionTecnica: "min-w-[170px]", direccionAtencion: "min-w-[170px]",
      supervisorAsignado: "min-w-[150px]", documentos: "min-w-[90px]",
      documentoFinal: "min-w-[90px]",
    };
    return widths[key] || "min-w-[110px]";
  };

  /* ── Sorting ── */
  const SORTABLE = new Set(["numeroAviso", "cliente", "fecha", "prioridad", "estado", "tipoMantenimiento", "solicitante"]);

  const sortedAvisos = useMemo(() => {
    if (!sortKey || !SORTABLE.has(sortKey)) return avisos;
    return [...avisos].sort((a, b) => {
      const av = a[sortKey === "fecha" ? "fechaAtencion" : sortKey] ?? "";
      const bv = b[sortKey === "fecha" ? "fechaAtencion" : sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "es", { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [avisos, sortKey, sortDir]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(sortedAvisos.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = sortedAvisos.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = (key) => {
    if (!SORTABLE.has(key)) return;
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const SortIcon = ({ k }) => {
    if (!SORTABLE.has(k)) return null;
    if (sortKey !== k) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 opacity-50" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
      : <ChevronDownIcon className="w-3.5 h-3.5 text-blue-600" />;
  };

  const visibleKeys = columnOrder.filter((k) => cardFields[k]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      {/* ── Barra superior ── */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-gray-700">
          {sortedAvisos.length === 0
            ? "Sin resultados"
            : `${sortedAvisos.length} aviso${sortedAvisos.length !== 1 ? "s" : ""}${sortedAvisos.length > PAGE_SIZE ? ` — página ${safePage} de ${totalPages}` : ""}`
          }
        </p>
        <p className="text-xs text-gray-400">Haz clic en un encabezado de columna para ordenar</p>
      </div>

      {/* ── Tabla ── */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              {visibleKeys.map((key) => {
                const Icon = fieldIcons[key];
                const sortable = SORTABLE.has(key);
                return (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap ${getColumnWidth(key)} ${sortable ? "cursor-pointer hover:bg-gray-200 select-none" : ""}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {Icon && <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />}
                      <span className="truncate">{labels[key] || key}</span>
                      <SortIcon k={key} />
                    </div>
                  </th>
                );
              })}
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider sticky right-0 bg-gradient-to-r from-gray-50 to-gray-100 min-w-[160px] border-l-2 border-gray-200">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={visibleKeys.length + 1} className="px-6 py-12">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Inbox className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-semibold text-gray-500">No hay avisos para mostrar</p>
                    <p className="text-sm text-gray-400 mt-1">Prueba ajustando los filtros</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageItems.map((item, idx) => (
                <tr
                  key={item.id}
                  onClick={() => { setViewData(item); setViewStep(1); setViewOpen(true); }}
                  className={`cursor-pointer transition-colors hover:bg-blue-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  {visibleKeys.map((key) => (
                    <td key={key} className={`px-4 py-3 text-sm ${getColumnWidth(key)}`}>

                      {key === "numeroAviso" && (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-bold text-gray-900 truncate">#{item.numeroAviso}</span>
                        </div>
                      )}

                      {key === "tipoAviso" && (
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold border rounded-lg whitespace-nowrap ${item.tipoAviso === "mantenimiento" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                          {item.tipoAviso === "mantenimiento" ? "🔧 Mantenimiento" : item.tipoAviso ? `📦 ${item.tipoAviso}` : "—"}
                        </span>
                      )}

                      {key === "descripcion" && (
                        <span className="text-gray-700 line-clamp-2">{item.descripcion || "—"}</span>
                      )}

                      {key === "descripcionResumida" && (
                        <span className="text-gray-700 line-clamp-2">{item.descripcionResumida || "—"}</span>
                      )}

                      {key === "cliente" && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900 font-medium truncate">{item.cliente || "—"}</span>
                        </div>
                      )}

                      {key === "equipo" && (
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          {item.equipos && item.equipos.length > 0 ? (() => {
                            const primerEquipo = getEquipoData(item.equipos[0]);
                            return (
                              <span className="text-gray-700 truncate">
                                {primerEquipo ? primerEquipo.nombre : `${String(item.equipos[0]).slice(0, 8)}…`}
                                {item.equipos.length > 1 && (
                                  <span className="text-xs text-gray-400 ml-1">+{item.equipos.length - 1}</span>
                                )}
                              </span>
                            );
                          })() : <span className="text-gray-400">—</span>}
                        </div>
                      )}

                      {key === "estado" && (
                        <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold border rounded-lg whitespace-nowrap ${ESTADOS_AV[item.estado]?.badge || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {ESTADOS_AV[item.estado]?.label || item.estado || "—"}
                        </span>
                      )}

                      {key === "fecha" && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">
                            {item.fechaAtencion
                              ? new Date(item.fechaAtencion).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
                              : "—"}
                          </span>
                        </div>
                      )}

                      {key === "prioridad" && (
                        item.prioridad
                          ? <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold border rounded-lg whitespace-nowrap ${getPriorityColor(item.prioridad)}`}>
                              <AlertCircle className="w-3 h-3 mr-1" />{item.prioridad}
                            </span>
                          : <span className="text-gray-400">—</span>
                      )}

                      {key === "solicitante" && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{item.solicitante || "—"}</span>
                        </div>
                      )}

                      {key === "tipoMantenimiento" && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Wrench className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{item.tipoMantenimiento || "—"}</span>
                        </div>
                      )}

                      {key === "ordenVenta"        && <span className="text-gray-700 truncate">{item.ordenVenta || "—"}</span>}
                      {key === "centroCosto"       && <span className="text-gray-700 truncate">{item.centroCosto || "—"}</span>}
                      {key === "producto"          && <div className="flex items-center gap-2"><Box className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700 truncate">{item.producto || "—"}</span></div>}
                      {key === "ordenCliente"      && <span className="text-gray-700 truncate">{item.ordenCliente || "—"}</span>}
                      {key === "almacen"           && <span className="text-gray-700 truncate">{item.almacen || "—"}</span>}
                      {key === "sede"              && <div className="flex items-center gap-2"><Building className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700 truncate">{item.sede || "—"}</span></div>}
                      {key === "nombreContacto"    && <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700 truncate">{item.nombreContacto || "—"}</span></div>}
                      {key === "correoContacto"    && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700 truncate">{item.correoContacto || "—"}</span></div>}
                      {key === "numeroContacto"    && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700 truncate">{item.numeroContacto || "—"}</span></div>}
                      {key === "ubicacionTecnica"  && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700 truncate">{item.ubicacionTecnica || "—"}</span></div>}
                      {key === "direccionAtencion" && <span className="text-gray-700 truncate">{item.direccionAtencion || "—"}</span>}
                      {key === "supervisorAsignado"&& <span className="text-gray-700 truncate">{item.supervisorAsignado || "—"}</span>}
                      {key === "estadoAviso"       && <span className="text-gray-700 truncate">{item.estadoAviso || "—"}</span>}
                      {key === "documentos"        && <span className="text-gray-700">{item.documentos?.length || 0}</span>}
                      {key === "documentoFinal"    && <span className="text-gray-700">{item.documentoFinal ? "✓" : "—"}</span>}

                    </td>
                  ))}

                  {/* Acciones */}
                  <td
                    className={`px-4 py-3 sticky right-0 border-l border-gray-200 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2 justify-end">
                      {item.estado === "CREADO" && (
                        <>
                          <button
                            onClick={() => abrirTratamiento(item)}
                            className="px-3 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-semibold rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <Wrench className="w-3.5 h-3.5" />Tratar
                          </button>
                          <button
                            onClick={() => cambiarEstado(item, "RECHAZADO")}
                            className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                            title="Rechazar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {item.estado === "TRATADO" && (
                        <button
                          onClick={() => cambiarEstado(item, "CON_OT")}
                          className="px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <FileText className="w-3.5 h-3.5" />Generar OT
                        </button>
                      )}
                      {item.estado === "CON_OT" && (
                        <>
                          <button
                            onClick={() => cambiarEstado(item, "FINALIZADO")}
                            className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />Finalizar
                          </button>
                          <button
                            onClick={() => cambiarEstado(item, "FINALIZADO_SIN_FACTURACION")}
                            className="p-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                            title="Finalizar sin facturación"
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {item.estado === "FINALIZADO" && (
                        <button
                          onClick={() => cambiarEstado(item, "FACTURADO")}
                          className="px-3 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-semibold rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />Facturado
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ── */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-gray-500">
            Mostrando {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, sortedAvisos.length)} de {sortedAvisos.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >«</button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Anterior</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
              const p = start + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    p === safePage
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >{p}</button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Siguiente</button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >»</button>
          </div>
        </div>
      )}
    </div>
  );
}
