import { useState, useEffect, useMemo } from "react";
import { Download, FileSpreadsheet, Settings2, ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import api from "../../../services/api";
import { getUsuarios } from "../services/usuarioService";
import { getTrabajadores } from "../services/trabajadoresService";

const GROUP_LABELS = {
  aviso:  "Datos del Aviso",
  equipo: "Equipos y Ubicaciones Técnicas",
};

const ESTADOS_AV   = ["ABIERTO", "EN_PROCESO", "CERRADO", "CANCELADO"];
const TIPOS_MANT   = ["PREVENTIVO", "CORRECTIVO", "PREDICTIVO", "MEJORA", "INSPECCION"];
const PRIORIDADES  = ["ALTA", "MEDIA", "BAJA"];

export default function AvisosExcelExport({ avisos = [] }) {
  /* ── campos disponibles del backend ── */
  const [availableFields, setAvailableFields] = useState({ principal: { fields: [] }, equipos: { fields: [] } });
  const [loadingFields, setLoadingFields]     = useState(true);

  /* ── seleccionados por hoja ── */
  const [selectedPrincipal, setSelectedPrincipal] = useState(new Set());
  const [selectedEquipos,   setSelectedEquipos]   = useState(new Set());

  /* ── filtros ── */
  const [filters, setFilters] = useState({
    estadoAviso: "", tipoAviso: "", prioridad: "", tipoMantenimiento: "",
    fechaDesde: "", fechaHasta: "",
  });

  /* ── lookup maps ── */
  const [usuariosMap,    setUsuariosMap]    = useState({});
  const [trabajadoresMap, setTrabajadoresMap] = useState({});

  /* ── UI ── */
  const [showPrincipal, setShowPrincipal] = useState(true);
  const [showEquipos,   setShowEquipos]   = useState(true);
  const [showFilters,   setShowFilters]   = useState(false);
  const [showPreview,   setShowPreview]   = useState(true);
  const [activeSheet,   setActiveSheet]   = useState("principal");
  const [exporting,     setExporting]     = useState(false);

  // Cargar usuarios y trabajadores para resolución de nombres
  useEffect(() => {
    getUsuarios()
      .then((list) => {
        const map = {};
        list.forEach((u) => { map[u.id] = u.nombreApellido || ""; });
        setUsuariosMap(map);
      })
      .catch(() => {});

    getTrabajadores()
      .then((list) => {
        const map = {};
        list.forEach((t) => { map[t.id] = `${t.nombre || ""} ${t.apellido || ""}`.trim(); });
        setTrabajadoresMap(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get("/excel/aviso/fields")
      .then((res) => {
        setAvailableFields(res.data);
        setSelectedPrincipal(new Set((res.data?.principal?.fields || []).map((f) => f.key)));
        setSelectedEquipos(new Set((res.data?.equipos?.fields || []).map((f) => f.key)));
      })
      .catch(() => {})
      .finally(() => setLoadingFields(false));
  }, []);

  const principalFields = availableFields?.principal?.fields || [];
  const equiposFields   = availableFields?.equipos?.fields   || [];

  const toggle = (set, setter, key) => {
    setter((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };
  const selectAll   = (fields, setter) => setter(new Set(fields.map((f) => f.key)));
  const deselectAll = (setter) => setter(new Set());

  /* ── preview — filtra avisos por los filtros activos ── */
  const filteredAvisos = useMemo(() => {
    return avisos.filter((av) => {
      if (filters.estadoAviso      && av.estadoAviso      !== filters.estadoAviso)      return false;
      if (filters.tipoAviso        && av.tipoAviso        !== filters.tipoAviso)        return false;
      if (filters.prioridad        && av.prioridad        !== filters.prioridad)        return false;
      if (filters.tipoMantenimiento && av.tipoMantenimiento !== filters.tipoMantenimiento) return false;
      if (filters.fechaDesde && av.fechaAtencion) {
        if (new Date(av.fechaAtencion) < new Date(filters.fechaDesde)) return false;
      }
      if (filters.fechaHasta && av.fechaAtencion) {
        if (new Date(av.fechaAtencion) > new Date(filters.fechaHasta)) return false;
      }
      return true;
    });
  }, [avisos, filters]);

  /* ── columns a mostrar según pestaña activa ── */
  const currentFields   = activeSheet === "principal" ? principalFields : equiposFields;
  const currentSelected = activeSheet === "principal" ? selectedPrincipal : selectedEquipos;
  const previewCols     = currentFields.filter((f) => currentSelected.has(f.key));

  /* ── preview rows aplanadas ── */
  const previewRows = useMemo(() => {
    if (activeSheet === "principal") return filteredAvisos;
    // Para la hoja equipos: aplanar aviso × equipo/ubicacion
    const rows = [];
    filteredAvisos.forEach((av) => {
      const equipos    = (av.equiposRelacion   || []).map((ae) => ({ _av_numeroAviso: av.numeroAviso, _av_estadoAviso: av.estadoAviso, _av_ordenVenta: av.ordenVenta || "", _eq_tipo: "Equipo", _eq_codigo: ae.equipo?.codigo || "", _eq_nombre: ae.equipo?.nombre || "" }));
      const ubicaciones = (av.ubicacionesRelacion || []).map((au) => ({ _av_numeroAviso: av.numeroAviso, _av_estadoAviso: av.estadoAviso, _av_ordenVenta: av.ordenVenta || "", _eq_tipo: "Ubicación Técnica", _eq_codigo: au.ubicacion?.codigo || "", _eq_nombre: au.ubicacion?.nombre || "" }));
      const all = [...equipos, ...ubicaciones];
      if (all.length === 0) rows.push({ _av_numeroAviso: av.numeroAviso, _av_estadoAviso: av.estadoAviso, _av_ordenVenta: av.ordenVenta || "", _eq_tipo: "", _eq_codigo: "", _eq_nombre: "" });
      else rows.push(...all);
    });
    return rows;
  }, [filteredAvisos, activeSheet]);

  const resolveVal = (row, f) => {
    if (activeSheet === "principal") {
      if (f.key === "solicitante") {
        // 1) lookup map por UUID (más confiable)
        if (row.solicitanteId && usuariosMap[row.solicitanteId]) return usuariosMap[row.solicitanteId];
        // 2) objeto original preservado en transformarAviso
        const obj = row._solicitanteObj;
        if (obj && typeof obj === "object") return obj.nombreApellido || "";
        // 3) ya fue transformado a string
        if (typeof row.solicitante === "string" && row.solicitante) return row.solicitante;
        return "";
      }
      if (f.key === "creador") {
        // 1) lookup map por UUID
        if (row.creadoPor && usuariosMap[row.creadoPor]) return usuariosMap[row.creadoPor];
        // 2) objeto de asociación
        const obj = row._creadorObj || row.creador;
        if (obj && typeof obj === "object") return obj.nombreApellido || "";
        return "";
      }
      if (f.key === "supervisor") {
        // 1) lookup map de trabajadores por UUID
        if (row.supervisorId && trabajadoresMap[row.supervisorId]) return trabajadoresMap[row.supervisorId];
        // 2) objeto de asociación
        const obj = row._supervisorObj || row.supervisor;
        if (obj && typeof obj === "object")
          return `${obj.nombre || ""} ${obj.apellido || ""}`.trim();
        return "";
      }
      if (f.key === "cliente") return row.cliente || row.clienteData?.razonSocial || "";
      if (f.key === "pais")    return row.pais?.nombre || "";
      return row[f.key] ?? "";
    }
    // hoja equipos: campos con prefijo _
    return row[`_${f.key}`] ?? row[f.key] ?? "";
  };

  const fmtVal = (val) => {
    if (val === null || val === undefined || val === "") return "—";
    return String(val);
  };

  /* ── exportar ── */
  const handleExport = async () => {
    const hasPrincipal = selectedPrincipal.size > 0;
    const hasEquipos   = selectedEquipos.size > 0;
    if (!hasPrincipal && !hasEquipos) { alert("Selecciona al menos un campo para exportar."); return; }

    setExporting(true);
    try {
      const campos = {};
      if (hasPrincipal) campos.principal = [...selectedPrincipal];
      if (hasEquipos)   campos.equipos   = [...selectedEquipos];

      const params = new URLSearchParams({ campos: JSON.stringify(campos) });
      if (filters.estadoAviso)       params.append("estadoAviso",       filters.estadoAviso);
      if (filters.tipoAviso)         params.append("tipoAviso",         filters.tipoAviso);
      if (filters.prioridad)         params.append("prioridad",         filters.prioridad);
      if (filters.tipoMantenimiento) params.append("tipoMantenimiento", filters.tipoMantenimiento);
      if (filters.fechaDesde)        params.append("fechaDesde",        filters.fechaDesde);
      if (filters.fechaHasta)        params.append("fechaHasta",        filters.fechaHasta);

      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/excel/aviso/export?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Error al generar el Excel");

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `avisos_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al exportar: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loadingFields) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalSelected = selectedPrincipal.size + selectedEquipos.size;

  return (
    <div className="space-y-4">

      {/* Encabezado */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="bg-gradient-to-br from-violet-600 to-violet-700 p-2.5 rounded-xl shadow">
          <FileSpreadsheet className="text-white" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Exportar Excel — Avisos</h2>
          <p className="text-sm text-slate-500">
            {filteredAvisos.length} avisos · {totalSelected} columnas seleccionadas
          </p>
        </div>
      </div>

      {/* Campos */}
      <div className="space-y-3">

        {/* Hoja Principal */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button onClick={() => setShowPrincipal((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-violet-50 hover:bg-violet-100 transition">
            <div className="flex items-center gap-2">
              <Settings2 size={15} className="text-violet-600" />
              <span className="font-semibold text-violet-800 text-sm">Datos del Aviso (hoja principal)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                {selectedPrincipal.size}/{principalFields.length}
              </span>
            </div>
            {showPrincipal ? <ChevronUp size={16} className="text-violet-500" /> : <ChevronDown size={16} className="text-violet-500" />}
          </button>
          {showPrincipal && (
            <div className="p-4 bg-white">
              <div className="flex gap-2 mb-3">
                <button onClick={() => selectAll(principalFields, setSelectedPrincipal)}
                  className="text-xs px-3 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition font-medium">Todos</button>
                <button onClick={() => deselectAll(setSelectedPrincipal)}
                  className="text-xs px-3 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition font-medium">Ninguno</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {principalFields.map((f) => (
                  <label key={f.key} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={selectedPrincipal.has(f.key)}
                      onChange={() => toggle(selectedPrincipal, setSelectedPrincipal, f.key)}
                      className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                    <span className="text-sm text-slate-700 group-hover:text-violet-700 transition">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hoja Equipos */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button onClick={() => setShowEquipos((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 hover:bg-emerald-100 transition">
            <div className="flex items-center gap-2">
              <Settings2 size={15} className="text-emerald-600" />
              <span className="font-semibold text-emerald-800 text-sm">Equipos y Ubicaciones (hoja separada)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                {selectedEquipos.size}/{equiposFields.length}
              </span>
            </div>
            {showEquipos ? <ChevronUp size={16} className="text-emerald-500" /> : <ChevronDown size={16} className="text-emerald-500" />}
          </button>
          {showEquipos && (
            <div className="p-4 bg-white">
              <div className="flex gap-2 mb-3">
                <button onClick={() => selectAll(equiposFields, setSelectedEquipos)}
                  className="text-xs px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition font-medium">Todos</button>
                <button onClick={() => deselectAll(setSelectedEquipos)}
                  className="text-xs px-3 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition font-medium">Ninguno</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {equiposFields.map((f) => (
                  <label key={f.key} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={selectedEquipos.has(f.key)}
                      onChange={() => toggle(selectedEquipos, setSelectedEquipos, f.key)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm text-slate-700 group-hover:text-emerald-700 transition">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button onClick={() => setShowFilters((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-amber-600" />
            <span className="font-semibold text-amber-800 text-sm">Filtros de exportación</span>
            {Object.values(filters).some(Boolean) && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 border border-amber-300 font-bold">Activos</span>
            )}
          </div>
          {showFilters ? <ChevronUp size={16} className="text-amber-500" /> : <ChevronDown size={16} className="text-amber-500" />}
        </button>
        {showFilters && (
          <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Estado Aviso</label>
              <select value={filters.estadoAviso} onChange={(e) => setFilters((f) => ({ ...f, estadoAviso: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                <option value="">Todos</option>
                {ESTADOS_AV.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Prioridad</label>
              <select value={filters.prioridad} onChange={(e) => setFilters((f) => ({ ...f, prioridad: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                <option value="">Todas</option>
                {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Mantenimiento</label>
              <select value={filters.tipoMantenimiento} onChange={(e) => setFilters((f) => ({ ...f, tipoMantenimiento: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                <option value="">Todos</option>
                {TIPOS_MANT.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Atención desde</label>
              <input type="date" value={filters.fechaDesde} onChange={(e) => setFilters((f) => ({ ...f, fechaDesde: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Atención hasta</label>
              <input type="date" value={filters.fechaHasta} onChange={(e) => setFilters((f) => ({ ...f, fechaHasta: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="flex items-end">
              <button onClick={() => setFilters({ estadoAviso: "", tipoAviso: "", prioridad: "", tipoMantenimiento: "", fechaDesde: "", fechaHasta: "" })}
                className="text-xs px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition font-medium w-full">
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vista previa */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
          <button onClick={() => setShowPreview((v) => !v)} className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
            Vista previa — {filteredAvisos.length} avisos
            {showPreview ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
          </button>
          {/* Selector de hoja en preview */}
          <div className="flex gap-1 bg-white border border-slate-200 p-0.5 rounded-xl">
            {["principal", "equipos"].map((s) => (
              <button key={s} onClick={() => setActiveSheet(s)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${activeSheet === s ? "bg-violet-600 text-white" : "text-slate-500 hover:text-slate-700"}`}>
                {s === "principal" ? "Avisos" : "Equipos / Ubicaciones"}
              </button>
            ))}
          </div>
        </div>

        {showPreview && (
          <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
            {previewCols.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">Selecciona al menos un campo para ver la vista previa.</div>
            ) : previewRows.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No hay datos con los filtros actuales.</div>
            ) : (
              <table className="w-full text-xs border-collapse" style={{ minWidth: `${previewCols.length * 140}px` }}>
                <thead className="sticky top-0 z-10">
                  <tr>
                    {(() => {
                      const groups = [];
                      let cur = null, cnt = 0;
                      previewCols.forEach((f, idx) => {
                        if (f.group !== cur) { if (cur !== null) groups.push({ group: cur, count: cnt }); cur = f.group; cnt = 1; }
                        else cnt++;
                        if (idx === previewCols.length - 1) groups.push({ group: cur, count: cnt });
                      });
                      return groups.map((g, i) => (
                        <th key={i} colSpan={g.count}
                          className={`px-3 py-1.5 text-center font-bold text-xs uppercase tracking-wide border-b border-slate-300 ${g.group === "equipo" ? "bg-emerald-600 text-white" : "bg-violet-600 text-white"}`}>
                          {GROUP_LABELS[g.group] || g.group}
                        </th>
                      ));
                    })()}
                  </tr>
                  <tr>
                    {previewCols.map((f) => (
                      <th key={f.key} className={`px-3 py-2 text-left font-semibold whitespace-nowrap border-b-2 border-slate-300 ${f.group === "equipo" ? "bg-emerald-50 text-emerald-800" : "bg-violet-50 text-violet-800"}`}>
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, rIdx) => (
                    <tr key={rIdx} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${rIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                      {previewCols.map((f) => (
                        <td key={f.key} className="px-3 py-1.5 whitespace-nowrap text-slate-700 max-w-[200px] overflow-hidden text-ellipsis"
                          title={fmtVal(resolveVal(row, f))}>
                          {fmtVal(resolveVal(row, f))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          El Excel tendrá <strong>{filteredAvisos.length}</strong> avisos y <strong>{totalSelected}</strong> columnas distribuidas en hasta 2 hojas.
        </p>
        <button onClick={handleExport} disabled={exporting || totalSelected === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold shadow transition">
          {exporting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download size={16} />}
          {exporting ? "Generando…" : "Exportar Excel"}
        </button>
      </div>
    </div>
  );
}
