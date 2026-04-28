import { useState, useMemo } from "react";
import {
  FileText, User, Calendar, Wrench,
  CheckCircle, Clock, Hash, ChevronUp, ChevronDown as ChevronDownIcon, ChevronsUpDown,
  Pencil, Bell,
} from "lucide-react";

const PAGE_SIZE = 20;

/* ── Helpers ── */
const formatDate = (isoDate) => {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const getTipoAvisoBadge = (tipo) => {
  const map = {
    mantenimiento: "bg-blue-100 text-blue-700 border-blue-300",
    instalacion:   "bg-emerald-100 text-emerald-700 border-emerald-300",
    venta:         "bg-purple-100 text-purple-700 border-purple-300",
  };
  return map[tipo] || "bg-gray-100 text-gray-700 border-gray-300";
};

const getEstadoBadge = (estado) => {
  const map = {
    CREADO:         "bg-blue-100 text-blue-800 border-blue-300",
    LIBERADO:       "bg-purple-100 text-purple-800 border-purple-300",
    CIERRE_TECNICO: "bg-amber-100 text-amber-800 border-amber-300",
    CERRADO:        "bg-emerald-100 text-emerald-800 border-emerald-300",
    CANCELADO:      "bg-red-100 text-red-800 border-red-300",
  };
  return map[estado] || "bg-gray-100 text-gray-800 border-gray-300";
};

const getEstadoLabel = (estado) => {
  const map = {
    CREADO: "Creado", LIBERADO: "Liberado",
    CIERRE_TECNICO: "Cierre Técnico", CERRADO: "Cerrado", CANCELADO: "Cancelado",
  };
  return map[estado] || estado;
};

const getRegistroLabel = (r, i) => {
  if (r?.equipoId) return r.descripcionEquipo || r.equipo?.nombre || r.equipo?.codigo || `Equipo ${i + 1}`;
  if (r?.ubicacionTecnicaId) return r.descripcionUbicacion || r.ubicacionTecnica?.nombre || r.ubicacionTecnica?.codigo || `Ubicación ${i + 1}`;
  return `Registro ${i + 1}`;
};

/* ── Column metadata (label + icon for header, sortable flag) ── */
const COLUMNS_META = {
  numeroOT:              { label: "N° Orden",      icon: Hash,         sortable: true  },
  estado:                { label: "Estado",         icon: Clock,        sortable: true  },
  tipoAviso:             { label: "Tipo Aviso",     icon: FileText,     sortable: true  },
  descripcionGeneral:    { label: "Descripción",    icon: FileText,     sortable: false },
  supervisorId:          { label: "Supervisor",     icon: User,         sortable: true  },
  registros:             { label: "Equipos/Ubs.",   icon: Wrench,       sortable: false },
  fechaProgramadaInicio: { label: "Inicio Prog.",   icon: Calendar,     sortable: true  },
  fechaProgramadaFin:    { label: "Fin Prog.",      icon: Calendar,     sortable: true  },
  fechaInicioReal:       { label: "Inicio Real",    icon: Calendar,     sortable: true  },
  fechaFinReal:          { label: "Fin Real",       icon: Calendar,     sortable: true  },
  fechaCierre:           { label: "Fecha Cierre",   icon: CheckCircle,  sortable: true  },
  avisoNumero:           { label: "N° Aviso",       icon: FileText,     sortable: false },
  observaciones:         { label: "Observaciones",  icon: FileText,     sortable: false },
};

export const OT_DEFAULT_FIELDS = {
  numeroOT: true, estado: true, tipoAviso: true, descripcionGeneral: true,
  supervisorId: true, registros: true, fechaProgramadaInicio: true,
  fechaProgramadaFin: true, fechaInicioReal: false, fechaFinReal: false,
  fechaCierre: false, avisoNumero: false, observaciones: false,
};

export const OT_DEFAULT_ORDER = Object.keys(OT_DEFAULT_FIELDS);

/* ── Main component ── */
export default function OrdenTrabajoLista({
  ordenes = [],
  onViewOrden,
  onEditarOT,
  onEditarNotificacion,
  cardFields,
  columnOrder,
}) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("numeroOT");
  const [sortDir, setSortDir] = useState("desc");

  // Fall back to defaults if parent hasn't wired up config yet
  const visibleFields = cardFields || OT_DEFAULT_FIELDS;
  const colOrder = columnOrder || OT_DEFAULT_ORDER;

  const handleSort = (key) => {
    if (!COLUMNS_META[key]?.sortable) return;
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const sorted = useMemo(() => {
    if (!sortKey || !COLUMNS_META[sortKey]?.sortable) return ordenes;
    return [...ordenes].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "es", { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [ordenes, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Only show columns that exist in COLUMNS_META AND are enabled AND appear in order
  const visibleKeys = colOrder.filter((k) => COLUMNS_META[k] && visibleFields[k]);

  const SortIcon = ({ k }) => {
    if (!COLUMNS_META[k]?.sortable) return null;
    if (sortKey !== k) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 opacity-50" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3.5 h-3.5 text-blue-300" />
      : <ChevronDownIcon className="w-3.5 h-3.5 text-blue-300" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-gray-700">
          {sorted.length === 0
            ? "Sin resultados"
            : `${sorted.length} orden${sorted.length !== 1 ? "es" : ""}${sorted.length > PAGE_SIZE ? ` — página ${safePage} de ${totalPages}` : ""}`}
        </p>
        <p className="text-xs text-gray-400">Haz clic en un encabezado para ordenar · Usa ⚙️ Configurar del encabezado para cambiar columnas</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              {visibleKeys.map((key) => {
                const cfg = COLUMNS_META[key];
                const Icon = cfg.icon;
                return (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap min-w-[130px] ${cfg.sortable ? "cursor-pointer hover:bg-gray-200 select-none" : ""}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {Icon && <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />}
                      <span className="truncate">{cfg.label}</span>
                      <SortIcon k={key} />
                    </div>
                  </th>
                );
              })}
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[80px]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={visibleKeys.length + 1} className="px-4 py-16 text-center">
                  <div className="text-gray-400">
                    <div className="text-5xl mb-3">📭</div>
                    <p className="text-base font-medium">No se encontraron órdenes</p>
                    <p className="text-sm mt-1">Ajusta los filtros de búsqueda</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageItems.map((orden, idx) => {
                const registros = orden.equipos || [];
                return (
                  <tr
                    key={orden.id}
                    className={`border-b border-gray-100 transition-colors hover:bg-blue-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    {visibleFields.numeroOT && colOrder.includes("numeroOT") && (
                      <td className="px-4 py-3 font-bold text-gray-900">
                        <span className="font-mono text-sm">{orden.numeroOT || "—"}</span>
                      </td>
                    )}
                    {visibleFields.estado && colOrder.includes("estado") && (
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getEstadoBadge(orden.estado)}`}>
                          {getEstadoLabel(orden.estado)}
                        </span>
                      </td>
                    )}
                    {visibleFields.tipoAviso && colOrder.includes("tipoAviso") && (
                      <td className="px-4 py-3">
                        {orden.aviso?.tipoAviso ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getTipoAvisoBadge(orden.aviso.tipoAviso)}`}>
                            {orden.aviso.tipoAviso.charAt(0).toUpperCase() + orden.aviso.tipoAviso.slice(1)}
                          </span>
                        ) : "—"}
                      </td>
                    )}
                    {visibleFields.descripcionGeneral && colOrder.includes("descripcionGeneral") && (
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate text-sm">
                        {orden.descripcionGeneral || "—"}
                      </td>
                    )}
                    {visibleFields.supervisorId && colOrder.includes("supervisorId") && (
                      <td className="px-4 py-3 text-gray-700 text-sm">{orden.supervisorId || "—"}</td>
                    )}
                    {visibleFields.registros && colOrder.includes("registros") && (
                      <td className="px-4 py-3">
                        {registros.length === 0 ? (
                          <span className="text-gray-400 text-xs">Sin registros</span>
                        ) : (
                          <div className="space-y-0.5">
                            {registros.slice(0, 2).map((r, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                <span className="truncate max-w-[130px]">{getRegistroLabel(r, i)}</span>
                              </div>
                            ))}
                            {registros.length > 2 && (
                              <span className="text-xs text-gray-400 italic">+{registros.length - 2} más</span>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                    {visibleFields.fechaProgramadaInicio && colOrder.includes("fechaProgramadaInicio") && (
                      <td className="px-4 py-3 text-gray-700 text-sm">{formatDate(orden.fechaProgramadaInicio)}</td>
                    )}
                    {visibleFields.fechaProgramadaFin && colOrder.includes("fechaProgramadaFin") && (
                      <td className="px-4 py-3 text-gray-700 text-sm">{formatDate(orden.fechaProgramadaFin)}</td>
                    )}
                    {visibleFields.fechaInicioReal && colOrder.includes("fechaInicioReal") && (
                      <td className="px-4 py-3 text-gray-700 text-sm">{formatDate(orden.fechaInicioReal)}</td>
                    )}
                    {visibleFields.fechaFinReal && colOrder.includes("fechaFinReal") && (
                      <td className="px-4 py-3 text-gray-700 text-sm">{formatDate(orden.fechaFinReal)}</td>
                    )}
                    {visibleFields.fechaCierre && colOrder.includes("fechaCierre") && (
                      <td className="px-4 py-3 text-gray-700 text-sm">{formatDate(orden.fechaCierre)}</td>
                    )}
                    {visibleFields.avisoNumero && colOrder.includes("avisoNumero") && (
                      <td className="px-4 py-3 text-gray-700 text-sm font-mono">
                        {orden.aviso?.numeroAviso || "—"}
                      </td>
                    )}
                    {visibleFields.observaciones && colOrder.includes("observaciones") && (
                      <td className="px-4 py-3 text-gray-700 text-sm max-w-[200px] truncate">
                        {orden.observaciones || "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewOrden(orden)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md"
                        >
                          Ver
                        </button>
                        {orden.estado === "CREADO" && onEditarOT && (
                          <button
                            onClick={() => onEditarOT(orden)}
                            className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-all"
                            title="Editar OT"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {onEditarNotificacion && (
                          <button
                            onClick={() => onEditarNotificacion(orden)}
                            className="p-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 hover:bg-purple-100 transition-all"
                            title="Editar notificación"
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            Página <span className="font-bold text-gray-900">{safePage}</span> de{" "}
            <span className="font-bold text-gray-900">{totalPages}</span>
          </p>
          <div className="flex gap-1">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ←
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, safePage - 2)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    p === safePage
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
