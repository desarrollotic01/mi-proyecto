import { useState, useEffect, useMemo } from "react";
import { Download, FileSpreadsheet, Settings2, ChevronDown, ChevronUp, Filter, Tag, X, Search } from "lucide-react";
import api from "../../../services/api";

/* ─── Labels amigables para los campos ──────────────────── */
const GROUP_LABELS = {
  aviso:  "Datos del Aviso",
  ot:     "Datos de la Orden de Trabajo",
  equipo: "Datos del Equipo / Ubicación Técnica",
};

/* ─── Opciones de filtro ─────────────────────────────────── */
const ESTADOS_OT = ["CREADO", "LIBERADO", "CIERRE_TECNICO", "CERRADO", "CANCELADO"];
const TIPOS_MANT  = ["PREVENTIVO", "CORRECTIVO", "PREDICTIVO", "MEJORA", "INSPECCION"];

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
export default function OrdenTrabajoExcelExport({ ordenes = [] }) {
  /* ─── Estado de campos disponibles ─── */
  const [availableFields, setAvailableFields] = useState({ plano: { label: "", fields: [] } });
  const [loadingFields, setLoadingFields] = useState(true);

  /* ─── Campos seleccionados { plano: Set<key> } ─── */
  const [selectedAviso, setSelectedAviso] = useState(new Set());
  const [selectedOT,    setSelectedOT]    = useState(new Set());
  const [selectedEquip, setSelectedEquip] = useState(new Set());

  /* ─── Filtros de exportación ─── */
  const [filters, setFilters] = useState({
    estado: "",
    tipoMantenimiento: "",
    fechaDesde: "",
    fechaHasta: "",
  });

  /* ─── Filtro por equipo ─── */
  const [equiposFiltro,   setEquiposFiltro]   = useState(new Set()); // Set de códigos seleccionados
  const [showEquipoModal, setShowEquipoModal] = useState(false);

  /* ─── UI ─── */
  const [showAvisoFields, setShowAvisoFields] = useState(true);
  const [showOTFields,    setShowOTFields]    = useState(true);
  const [showEquipFields, setShowEquipFields] = useState(true);
  const [showFilters,     setShowFilters]     = useState(false);
  const [showPreview,     setShowPreview]     = useState(true);
  const [exporting,       setExporting]       = useState(false);

  /* ─── Cargar campos disponibles del backend ─── */
  useEffect(() => {
    api.get("/excel/ordenTrabajo/fields")
      .then((res) => {
        setAvailableFields(res.data);
        // Seleccionar todos por defecto
        const planoFields = res.data?.plano?.fields || [];
        setSelectedAviso(new Set(
          planoFields.filter((f) => f.group === "aviso").map((f) => f.key)
        ));
        setSelectedOT(new Set(
          planoFields.filter((f) => f.group === "ot").map((f) => f.key)
        ));
        setSelectedEquip(new Set(
          planoFields.filter((f) => f.group === "equipo").map((f) => f.key)
        ));
      })
      .catch(() => {})
      .finally(() => setLoadingFields(false));
  }, []);

  const planoFields  = availableFields?.plano?.fields || [];
  const avisoFields  = planoFields.filter((f) => f.group === "aviso");
  const otFields     = planoFields.filter((f) => f.group === "ot");
  const equipFields  = planoFields.filter((f) => f.group === "equipo");

  /* ─── Toggle individual ─── */
  const toggle = (set, setter, key) => {
    setter((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  /* ─── Seleccionar / deseleccionar todo ─── */
  const selectAll   = (fields, setter) => setter(new Set(fields.map((f) => f.key)));
  const deselectAll = (setter) => setter(new Set());

  /* ─── Campos seleccionados combinados ─── */
  const allSelected = useMemo(
    () => [...selectedAviso, ...selectedOT, ...selectedEquip],
    [selectedAviso, selectedOT, selectedEquip]
  );

  /* ─── Lista única de equipos disponibles (para el modal de filtro) ─── */
  const todosEquipos = useMemo(() => {
    const map = new Map();
    ordenes.forEach((ot) => {
      (ot.equipos || []).forEach((eq) => {
        const isUb = !!eq.ubicacionTecnica && !eq.equipo;
        const codigo = isUb ? (eq.ubicacionTecnica?.codigo || "") : (eq.equipo?.codigo || "");
        const nombre = isUb ? (eq.ubicacionTecnica?.nombre || "") : (eq.equipo?.nombre || "");
        const tipo   = isUb ? "Ubicación Técnica" : "Equipo";
        if (codigo && !map.has(codigo)) {
          map.set(codigo, { codigo, nombre, tipo });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [ordenes]);

  /* ─── Vista previa (flat: OT × equipo) ─── */
  const previewRows = useMemo(() => {
    const rows = [];
    const filtered = ordenes.filter((ot) => {
      if (filters.estado           && ot.estado            !== filters.estado)           return false;
      if (filters.tipoMantenimiento && ot.tipoMantenimiento !== filters.tipoMantenimiento) return false;
      if (filters.fechaDesde && ot.fechaProgramadaInicio) {
        if (new Date(ot.fechaProgramadaInicio) < new Date(filters.fechaDesde)) return false;
      }
      if (filters.fechaHasta && ot.fechaProgramadaInicio) {
        if (new Date(ot.fechaProgramadaInicio) > new Date(filters.fechaHasta)) return false;
      }
      return true;
    });

    filtered.forEach((ot) => {
      (ot.equipos || []).forEach((eq) => {
        const isUb = !!eq.ubicacionTecnica && !eq.equipo;
        // Aplicar filtro por equipo si hay seleccionados
        if (equiposFiltro.size > 0) {
          const codigo = isUb ? (eq.ubicacionTecnica?.codigo || "") : (eq.equipo?.codigo || "");
          if (!equiposFiltro.has(codigo)) return;
        }
        rows.push({
          ot_numeroOT:              ot.numeroOT,
          ot_estado:                ot.estado,
          ot_tipoMantenimiento:     ot.tipoMantenimiento,
          ot_supervisor:            ot.supervisor
                                      ? `${ot.supervisor.nombre || ""} ${ot.supervisor.apellido || ""}`.trim()
                                      : (ot._supervisorNombre || "—"),
          ot_fechaProgramadaInicio: ot.fechaProgramadaInicio,
          ot_fechaProgramadaFin:    ot.fechaProgramadaFin,
          ot_observaciones:         ot.observaciones,
          ot_descripcionGeneral:    ot.descripcionGeneral,
          ot_descripcionDetallada:  ot.descripcionDetallada,
          eq_tipo:                  isUb ? "Ubicación Técnica" : "Equipo",
          eq_nombre:                isUb ? (eq.ubicacionTecnica?.nombre || "") : (eq.equipo?.nombre || ""),
          eq_codigo:                isUb ? (eq.ubicacionTecnica?.codigo || "") : (eq.equipo?.codigo || ""),
          eq_descripcionEquipo:     eq.descripcionEquipo || "",
          eq_prioridad:             eq.prioridad || "",
          eq_fechaInicioProgramada: eq.fechaInicioProgramada || "",
          eq_fechaFinProgramada:    eq.fechaFinProgramada || "",
        });
      });
    });
    return rows;
  }, [ordenes, filters, equiposFiltro]);

  /* ─── Columnas a mostrar en preview ─── */
  const previewCols = planoFields.filter((f) => allSelected.includes(f.key));

  /* ─── Exportar (backend) ─── */
  const handleExport = async () => {
    if (allSelected.length === 0) {
      alert("Selecciona al menos un campo para exportar.");
      return;
    }
    if (previewRows.length === 0) {
      alert("No hay filas con los filtros actuales.");
      return;
    }
    setExporting(true);
    try {
      const campos = JSON.stringify({ plano: allSelected });
      const params = new URLSearchParams({ campos });
      if (filters.estado)            params.append("estado",            filters.estado);
      if (filters.tipoMantenimiento) params.append("tipoMantenimiento", filters.tipoMantenimiento);
      if (filters.fechaDesde)        params.append("fechaDesde",        filters.fechaDesde);
      if (filters.fechaHasta)        params.append("fechaHasta",        filters.fechaHasta);
      if (equiposFiltro.size > 0)    params.append("equipoCodigos",     [...equiposFiltro].join(","));

      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/excel/ordenTrabajo/export?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Error al generar el Excel");

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `ordenes_trabajo_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al exportar: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  /* ─── Formato fecha corto ─── */
  const fmtD = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const fmtVal = (val, key) => {
    if (val === null || val === undefined || val === "") return "—";
    if (key?.includes("fecha") || key?.includes("Fecha")) return fmtD(val);
    return String(val);
  };

  if (loadingFields) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Encabezado ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-2.5 rounded-xl shadow">
          <FileSpreadsheet className="text-white" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Exportar Excel — Órdenes de Trabajo</h2>
          <p className="text-sm text-slate-500">
            {previewRows.length} filas (OT × equipos) · {allSelected.length} columnas seleccionadas
          </p>
        </div>
      </div>

      {/* ── Configuración de campos ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Aviso fields */}
        <div className="border border-slate-200 rounded-xl overflow-hidden lg:col-span-2">
          <button
            onClick={() => setShowAvisoFields((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-violet-50 hover:bg-violet-100 transition"
          >
            <div className="flex items-center gap-2">
              <Settings2 size={15} className="text-violet-600" />
              <span className="font-semibold text-violet-800 text-sm">{GROUP_LABELS.aviso}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                {selectedAviso.size}/{avisoFields.length}
              </span>
            </div>
            {showAvisoFields ? <ChevronUp size={16} className="text-violet-500" /> : <ChevronDown size={16} className="text-violet-500" />}
          </button>

          {showAvisoFields && (
            <div className="p-4 bg-white">
              <div className="flex gap-2 mb-3">
                <button onClick={() => selectAll(avisoFields, setSelectedAviso)}
                  className="text-xs px-3 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition font-medium">
                  Todos
                </button>
                <button onClick={() => deselectAll(setSelectedAviso)}
                  className="text-xs px-3 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition font-medium">
                  Ninguno
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {avisoFields.map((f) => (
                  <label key={f.key} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedAviso.has(f.key)}
                      onChange={() => toggle(selectedAviso, setSelectedAviso, f.key)}
                      className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-violet-700 transition">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* OT fields */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowOTFields((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 transition"
          >
            <div className="flex items-center gap-2">
              <Settings2 size={15} className="text-indigo-600" />
              <span className="font-semibold text-indigo-800 text-sm">{GROUP_LABELS.ot}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                {selectedOT.size}/{otFields.length}
              </span>
            </div>
            {showOTFields ? <ChevronUp size={16} className="text-indigo-500" /> : <ChevronDown size={16} className="text-indigo-500" />}
          </button>

          {showOTFields && (
            <div className="p-4 bg-white">
              <div className="flex gap-2 mb-3">
                <button onClick={() => selectAll(otFields, setSelectedOT)}
                  className="text-xs px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition font-medium">
                  Todos
                </button>
                <button onClick={() => deselectAll(setSelectedOT)}
                  className="text-xs px-3 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition font-medium">
                  Ninguno
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {otFields.map((f) => (
                  <label key={f.key} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedOT.has(f.key)}
                      onChange={() => toggle(selectedOT, setSelectedOT, f.key)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-indigo-700 transition">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Equipment fields */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowEquipFields((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 hover:bg-emerald-100 transition"
          >
            <div className="flex items-center gap-2">
              <Settings2 size={15} className="text-emerald-600" />
              <span className="font-semibold text-emerald-800 text-sm">{GROUP_LABELS.equipo}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                {selectedEquip.size}/{equipFields.length}
              </span>
            </div>
            {showEquipFields ? <ChevronUp size={16} className="text-emerald-500" /> : <ChevronDown size={16} className="text-emerald-500" />}
          </button>

          {showEquipFields && (
            <div className="p-4 bg-white">
              <div className="flex gap-2 mb-3">
                <button onClick={() => selectAll(equipFields, setSelectedEquip)}
                  className="text-xs px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition font-medium">
                  Todos
                </button>
                <button onClick={() => deselectAll(setSelectedEquip)}
                  className="text-xs px-3 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition font-medium">
                  Ninguno
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {equipFields.map((f) => (
                  <label key={f.key} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedEquip.has(f.key)}
                      onChange={() => toggle(selectedEquip, setSelectedEquip, f.key)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-emerald-700 transition">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Filtros ────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition"
        >
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-amber-600" />
            <span className="font-semibold text-amber-800 text-sm">Filtros de exportación</span>
            {(filters.estado || filters.tipoMantenimiento || filters.fechaDesde || filters.fechaHasta || equiposFiltro.size > 0) && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 border border-amber-300 font-bold">
                Activos
              </span>
            )}
          </div>
          {showFilters ? <ChevronUp size={16} className="text-amber-500" /> : <ChevronDown size={16} className="text-amber-500" />}
        </button>

        {showFilters && (
          <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Estado OT</label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters((f) => ({ ...f, estado: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Todos</option>
                {ESTADOS_OT.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Mantenimiento</label>
              <select
                value={filters.tipoMantenimiento}
                onChange={(e) => setFilters((f) => ({ ...f, tipoMantenimiento: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Todos</option>
                {TIPOS_MANT.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Inicio Prog. desde</label>
              <input
                type="date"
                value={filters.fechaDesde}
                onChange={(e) => setFilters((f) => ({ ...f, fechaDesde: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Inicio Prog. hasta</label>
              <input
                type="date"
                value={filters.fechaHasta}
                onChange={(e) => setFilters((f) => ({ ...f, fechaHasta: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {/* Filtro por Equipo */}
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Filtrar por Equipo</label>
              <button
                onClick={() => setShowEquipoModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                <Tag size={14} className="text-amber-600" />
                {equiposFiltro.size === 0
                  ? "Seleccionar equipos…"
                  : `${equiposFiltro.size} equipo${equiposFiltro.size > 1 ? "s" : ""} seleccionado${equiposFiltro.size > 1 ? "s" : ""}`}
              </button>
              {equiposFiltro.size > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {[...equiposFiltro].map((cod) => {
                    const eq = todosEquipos.find((e) => e.codigo === cod);
                    return (
                      <span key={cod} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs border border-amber-200">
                        {eq ? `${eq.codigo} — ${eq.nombre}` : cod}
                        <button
                          onClick={() => setEquiposFiltro((prev) => { const next = new Set(prev); next.delete(cod); return next; })}
                          className="hover:text-red-600 transition ml-0.5"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="col-span-full flex justify-end">
              <button
                onClick={() => { setFilters({ estado: "", tipoMantenimiento: "", fechaDesde: "", fechaHasta: "" }); setEquiposFiltro(new Set()); setSelectedAviso(new Set()); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Vista previa ───────────────────────────────────── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowPreview((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition"
        >
          <span className="font-semibold text-slate-700 text-sm">
            Vista previa — {previewRows.length} filas
          </span>
          {showPreview ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </button>

        {showPreview && (
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            {previewCols.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Selecciona al menos un campo para ver la vista previa.
              </div>
            ) : previewRows.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No hay datos con los filtros actuales.
              </div>
            ) : (
              <table className="w-full text-xs border-collapse" style={{ minWidth: `${previewCols.length * 140}px` }}>
                <thead className="sticky top-0 z-10">
                  {/* Fila de grupo */}
                  <tr>
                    {(() => {
                      const groups = [];
                      let currentGroup = null;
                      let count = 0;
                      previewCols.forEach((f, idx) => {
                        if (f.group !== currentGroup) {
                          if (currentGroup !== null) groups.push({ group: currentGroup, count });
                          currentGroup = f.group;
                          count = 1;
                        } else {
                          count++;
                        }
                        if (idx === previewCols.length - 1) groups.push({ group: currentGroup, count });
                      });
                      return groups.map((g, i) => (
                        <th key={i} colSpan={g.count}
                          className={`px-3 py-1.5 text-center font-bold text-xs uppercase tracking-wide border-b border-slate-300 ${
                            g.group === "aviso"
                              ? "bg-violet-600 text-white"
                              : g.group === "ot"
                              ? "bg-indigo-600 text-white"
                              : "bg-emerald-600 text-white"
                          }`}>
                          {GROUP_LABELS[g.group] || g.group}
                        </th>
                      ));
                    })()}
                  </tr>
                  {/* Fila de cabeceras */}
                  <tr>
                    {previewCols.map((f) => (
                      <th key={f.key}
                        className={`px-3 py-2 text-left font-semibold whitespace-nowrap border-b-2 border-slate-300 ${
                          f.group === "aviso"
                            ? "bg-violet-50 text-violet-800"
                            : f.group === "ot"
                            ? "bg-indigo-50 text-indigo-800"
                            : "bg-emerald-50 text-emerald-800"
                        }`}>
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, rIdx) => (
                    <tr key={rIdx}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        rIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }`}>
                      {previewCols.map((f) => (
                        <td key={f.key}
                          className="px-3 py-1.5 whitespace-nowrap text-slate-700 max-w-[200px] overflow-hidden text-ellipsis"
                          title={fmtVal(row[f.key], f.key)}>
                          {fmtVal(row[f.key], f.key)}
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

      {/* ── Footer con botón de exportar ───────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          El Excel generado tendrá <strong>{previewRows.length}</strong> filas y <strong>{allSelected.length}</strong> columnas.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting || allSelected.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold shadow transition"
        >
          {exporting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {exporting ? "Generando…" : "Exportar Excel"}
        </button>
      </div>

      {/* ── Modal de selección de equipos ──────────────────── */}
      {showEquipoModal && (
        <ModalSeleccionEquipos
          todos={todosEquipos}
          seleccionados={equiposFiltro}
          onCambiar={setEquiposFiltro}
          onClose={() => setShowEquipoModal(false)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MODAL SELECCIÓN DE EQUIPOS
   ═══════════════════════════════════════════════════════════ */
function ModalSeleccionEquipos({ todos, seleccionados, onCambiar, onClose }) {
  const [busqueda, setBusqueda] = useState("");

  const equiposFiltrados = useMemo(() => {
    if (!busqueda.trim()) return todos;
    const q = busqueda.toLowerCase();
    return todos.filter(
      (e) => e.codigo.toLowerCase().includes(q) || e.nombre.toLowerCase().includes(q)
    );
  }, [todos, busqueda]);

  const toggleEquipo = (codigo) => {
    onCambiar((prev) => {
      const next = new Set(prev);
      next.has(codigo) ? next.delete(codigo) : next.add(codigo);
      return next;
    });
  };

  const seleccionarTodos = () => onCambiar(new Set(equiposFiltrados.map((e) => e.codigo)));
  const limpiarTodos     = () => onCambiar(new Set());

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-amber-600" />
            <h3 className="font-bold text-slate-800">Filtrar por Equipo</h3>
            {seleccionados.size > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
                {seleccionados.size} seleccionado{seleccionados.size > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Buscador */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              type="text"
              placeholder="Buscar por código o nombre…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={seleccionarTodos} className="text-xs px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition font-medium">
              Seleccionar todos ({equiposFiltrados.length})
            </button>
            <button onClick={limpiarTodos} className="text-xs px-3 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition font-medium">
              Limpiar selección
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-1">
          {equiposFiltrados.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Sin resultados para "{busqueda}"</p>
          ) : (
            equiposFiltrados.map((eq) => (
              <label key={eq.codigo} className="flex items-center gap-3 cursor-pointer group py-1.5 px-2 rounded-lg hover:bg-amber-50 transition">
                <input
                  type="checkbox"
                  checked={seleccionados.has(eq.codigo)}
                  onChange={() => toggleEquipo(eq.codigo)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-500 mr-1.5">{eq.codigo}</span>
                  <span className="text-sm text-slate-700 group-hover:text-amber-800 transition">{eq.nombre}</span>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">{eq.tipo}</span>
              </label>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={limpiarTodos} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition font-medium">
            Limpiar
          </button>
          <button onClick={onClose} className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow transition">
            Aplicar filtro
          </button>
        </div>
      </div>
    </div>
  );
}
