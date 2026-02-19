
import { useState } from "react";

/* ================= HELPERS ================= */

const formatDate = (isoDate) => {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getEstadoBadge = (estado) => {
  const badges = {
    "CREADO": "bg-blue-100 text-blue-800 border-blue-200",
    "LIBERADO": "bg-purple-100 text-purple-800 border-purple-200",
    "CIERRE_TECNICO": "bg-amber-100 text-amber-800 border-amber-200",
    "CERRADO": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "CANCELADO": "bg-red-100 text-red-800 border-red-200"
  };
  return badges[estado] || badges.CREADO;
};

/* ================= COLUMNS CONFIG ================= */

const COLUMNS_CONFIG = {
  numeroOT: { label: "N° Orden", default: true },
  descripcionGeneral: { label: "Descripción", default: true },
  estado: { label: "Estado", default: true },
  supervisorId: { label: "Supervisor", default: true },
  fechaProgramadaInicio: { label: "Inicio Programado", default: true },
  fechaProgramadaFin: { label: "Fin Programado", default: true },
  fechaInicioReal: { label: "Inicio Real", default: false },
  fechaFinReal: { label: "Fin Real", default: false },
  fechaCierre: { label: "Fecha Cierre", default: false },
  observaciones: { label: "Observaciones", default: false },
  avisoId: { label: "ID Aviso", default: false },
  tratamientoId: { label: "ID Tratamiento", default: false },
};

/* ================= COMPONENT ================= */

export default function ListaView({ ordenes, onViewOrden }) {
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("TODOS");
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  
  // Initialize visible columns
  const [visibleColumns, setVisibleColumns] = useState(() => 
    Object.keys(COLUMNS_CONFIG).reduce((acc, key) => {
      acc[key] = COLUMNS_CONFIG[key].default;
      return acc;
    }, {})
  );

  const [tempColumns, setTempColumns] = useState(visibleColumns);

  /* ================= FILTERING ================= */
  const filteredOrdenes = ordenes.filter(orden => {
    const matchesSearch = 
      !search ||
      orden.numeroOT?.toLowerCase().includes(search.toLowerCase()) ||
      orden.descripcionGeneral?.toLowerCase().includes(search.toLowerCase()) ||
      orden.supervisorId?.toLowerCase().includes(search.toLowerCase());

    const matchesEstado = 
      estadoFilter === "TODOS" || 
      orden.estado === estadoFilter;

    return matchesSearch && matchesEstado;
  });

  /* ================= COLUMN MANAGEMENT ================= */
  const handleApplyColumns = () => {
    setVisibleColumns(tempColumns);
    setShowColumnSelector(false);
  };

  const handleResetFilters = () => {
    setSearch("");
    setEstadoFilter("TODOS");
    const defaults = Object.keys(COLUMNS_CONFIG).reduce((acc, key) => {
      acc[key] = COLUMNS_CONFIG[key].default;
      return acc;
    }, {});
    setVisibleColumns(defaults);
    setTempColumns(defaults);
    setShowColumnSelector(false);
  };

  const estados = ["TODOS", "CREADO", "LIBERADO", "CIERRE_TECNICO", "CERRADO", "CANCELADO"];

  return (
    <div className="space-y-4">
      {/* FILTERS BAR */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap gap-3 items-center">
          {/* SEARCH */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Buscar por N° OT, descripción o supervisor..."
                className="
                  w-full px-4 py-2.5 pl-10
                  bg-white border-2 border-slate-200
                  rounded-xl
                  focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                  transition-all duration-200
                  placeholder:text-slate-400
                "
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
            </div>
          </div>

          {/* ESTADO FILTER */}
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="
              px-4 py-2.5
              bg-white border-2 border-slate-200
              rounded-xl
              focus:border-blue-500 focus:ring-4 focus:ring-blue-100
              transition-all duration-200
              font-medium text-slate-700
              cursor-pointer
            "
          >
            {estados.map(estado => (
              <option key={estado} value={estado}>
                {estado === "TODOS" ? "📊 Todos los Estados" : `${estado.replace(/_/g, ' ')}`}
              </option>
            ))}
          </select>

          {/* COLUMN SELECTOR */}
          <button
            onClick={() => {
              setTempColumns(visibleColumns);
              setShowColumnSelector(!showColumnSelector);
            }}
            className="
              px-4 py-2.5 rounded-xl font-semibold
              bg-white border-2 border-slate-200
              text-slate-700
              hover:border-blue-500 hover:text-blue-600
              transition-all duration-200
              whitespace-nowrap
            "
          >
            ⚙️ Columnas
          </button>

          {/* RESET */}
          <button
            onClick={handleResetFilters}
            className="
              px-4 py-2.5 rounded-xl font-semibold
              bg-red-50 border-2 border-red-200
              text-red-700
              hover:bg-red-100
              transition-all duration-200
              whitespace-nowrap
            "
          >
            🔄 Limpiar
          </button>
        </div>

        {/* COLUMN SELECTOR PANEL */}
        {showColumnSelector && (
          <div className="mt-4 p-4 bg-white rounded-xl border-2 border-slate-200 shadow-lg">
            <h3 className="font-bold text-slate-900 mb-3">Seleccionar Columnas</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              {Object.entries(COLUMNS_CONFIG).map(([key, config]) => (
                <label
                  key={key}
                  className="
                    flex items-center gap-2 p-2 rounded-lg
                    hover:bg-slate-50 cursor-pointer
                    transition-colors duration-200
                  "
                >
                  <input
                    type="checkbox"
                    checked={tempColumns[key]}
                    onChange={(e) => 
                      setTempColumns(prev => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="
                      w-4 h-4 rounded border-2 border-slate-300
                      text-blue-600 focus:ring-2 focus:ring-blue-500
                      cursor-pointer
                    "
                  />
                  <span className="text-sm text-slate-700 font-medium">
                    {config.label}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowColumnSelector(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyColumns}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RESULTS COUNT */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-slate-600">
          Mostrando <span className="font-bold text-slate-900">{filteredOrdenes.length}</span> de{" "}
          <span className="font-bold text-slate-900">{ordenes.length}</span> órdenes
        </p>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border-2 border-slate-200 shadow-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
              {Object.entries(COLUMNS_CONFIG).map(([key, config]) => 
                visibleColumns[key] && (
                  <th
                    key={key}
                    className="px-4 py-3 text-left font-bold uppercase tracking-wider text-xs border-r border-slate-600 last:border-r-0"
                  >
                    {config.label}
                  </th>
                )
              )}
              <th className="px-4 py-3 text-center font-bold uppercase tracking-wider text-xs">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredOrdenes.length === 0 ? (
              <tr>
                <td
                  colSpan={Object.values(visibleColumns).filter(Boolean).length + 1}
                  className="px-4 py-16 text-center"
                >
                  <div className="text-slate-400">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-lg font-medium">No se encontraron órdenes</p>
                    <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrdenes.map((orden, idx) => (
                <tr
                  key={orden.id}
                  className={`
                    border-b border-slate-100 transition-all duration-200
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                    hover:bg-blue-50
                  `}
                >
                  {visibleColumns.numeroOT && (
                    <td className="px-4 py-3 font-bold text-slate-900 border-r border-slate-100">
                      {orden.numeroOT || "—"}
                    </td>
                  )}
                  {visibleColumns.descripcionGeneral && (
                    <td className="px-4 py-3 text-slate-700 border-r border-slate-100 max-w-xs truncate">
                      {orden.descripcionGeneral || "—"}
                    </td>
                  )}
                  {visibleColumns.estado && (
                    <td className="px-4 py-3 border-r border-slate-100">
                      <span className={`
                        inline-block px-3 py-1 rounded-full text-xs font-bold border-2
                        ${getEstadoBadge(orden.estado)}
                      `}>
                        {orden.estado?.replace(/_/g, ' ')}
                      </span>
                    </td>
                  )}
                  {visibleColumns.supervisorId && (
                    <td className="px-4 py-3 text-slate-700 border-r border-slate-100">
                      {orden.supervisorId || "—"}
                    </td>
                  )}
                  {visibleColumns.fechaProgramadaInicio && (
                    <td className="px-4 py-3 text-slate-700 border-r border-slate-100">
                      {formatDate(orden.fechaProgramadaInicio)}
                    </td>
                  )}
                  {visibleColumns.fechaProgramadaFin && (
                    <td className="px-4 py-3 text-slate-700 border-r border-slate-100">
                      {formatDate(orden.fechaProgramadaFin)}
                    </td>
                  )}
                  {visibleColumns.fechaInicioReal && (
                    <td className="px-4 py-3 text-slate-700 border-r border-slate-100">
                      {formatDate(orden.fechaInicioReal)}
                    </td>
                  )}
                  {visibleColumns.fechaFinReal && (
                    <td className="px-4 py-3 text-slate-700 border-r border-slate-100">
                      {formatDate(orden.fechaFinReal)}
                    </td>
                  )}
                  {visibleColumns.fechaCierre && (
                    <td className="px-4 py-3 text-slate-700 border-r border-slate-100">
                      {formatDate(orden.fechaCierre)}
                    </td>
                  )}
                  {visibleColumns.observaciones && (
                    <td className="px-4 py-3 text-slate-700 border-r border-slate-100 max-w-xs truncate">
                      {orden.observaciones || "—"}
                    </td>
                  )}
                  {visibleColumns.avisoId && (
                    <td className="px-4 py-3 text-slate-700 border-r border-slate-100 font-mono text-xs">
                      {orden.avisoId ? orden.avisoId.substring(0, 8) + "..." : "—"}
                    </td>
                  )}
                  {visibleColumns.tratamientoId && (
                    <td className="px-4 py-3 text-slate-700 border-r border-slate-100 font-mono text-xs">
                      {orden.tratamientoId ? orden.tratamientoId.substring(0, 8) + "..." : "—"}
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onViewOrden(orden)}
                      className="
                        px-3 py-1.5 rounded-lg
                        bg-blue-600 text-white text-xs font-semibold
                        hover:bg-blue-700
                        transition-all duration-200
                        shadow-sm hover:shadow-md
                      "
                    >
                      👁️ Ver
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}