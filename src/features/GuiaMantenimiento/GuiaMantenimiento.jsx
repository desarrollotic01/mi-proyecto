import { useEffect, useState, useCallback } from "react";
import { guiaMantenimientoService } from "./services/guiaMantenimientoService";
import ModalCrearGuiaMantenimiento from "./Components/ModalCrearGuiaMantenimiento";

// ─── HELPERS ───────────────────────────────────────────────────────────────
const ESTADO_CFG = {
  PENDIENTE: { label: "Pendiente", dot: "#f59e0b", bg: "#fef3c7", color: "#92400e" },
  EJECUTADO: { label: "Ejecutado", dot: "#10b981", bg: "#d1fae5", color: "#065f46" },
  CANCELADO: { label: "Cancelado", dot: "#f97316", bg: "#ffedd5", color: "#7c2d12" },
  VENCIDO: { label: "Vencido", dot: "#ef4444", bg: "#fee2e2", color: "#7f1d1d" },
};

const CRIT_CFG = {
  A: { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" },
  B: { bg: "#fff7ed", color: "#ea580c", border: "#fdba74" },
  C: { bg: "#f0fdf4", color: "#16a34a", border: "#86efac" },
};

const PERIODO_LABEL = {
  DIARIO: "Diario", SEMANAL: "Semanal", MENSUAL: "Mensual", BIMESTRAL: "Bimestral",
  TRIMESTRAL: "Trimestral", SEIS_MESES: "6 Meses", ANUAL: "Anual",
  CINCO_ANIOS: "5 Años", DIEZ_ANIOS: "10 Años",
};

const fmt = (iso) => new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
const fmtDT = (iso) => new Date(iso).toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function Badge({ estado }) {
  const c = ESTADO_CFG[estado] || { label: estado, dot: "#94a3b8", bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: c.bg, color: c.color, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot }} />{c.label}
    </span>
  );
}

function CritBadge({ v }) {
  const c = CRIT_CFG[v] || { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };
  return <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, padding: "1px 7px", borderRadius: 4, fontSize: 11, fontWeight: 800 }}>{v}</span>;
}

// ─── DETALLE MODAL ──────────────────────────────────────────────────────────
function DetalleModal({ guia, onClose, onReload }) {
  const [data, setData] = useState(null);
  const [actioning, setActioning] = useState(null);

  useEffect(() => {
    guiaMantenimientoService.getGuiaById(guia.id).then(setData).catch(console.error);
  }, [guia.id]);

  const ejecutar = async (id) => {
    setActioning(id);
    try {
      await guiaMantenimientoService.ejecutarProgramacion(id);
      onReload(); onClose();
    } finally { setActioning(null); }
  };

  const cancelar = async (id) => {
    setActioning(id);
    try {
      await guiaMantenimientoService.cancelarProgramacion(id);
      onReload(); onClose();
    } finally { setActioning(null); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,0.72)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 660, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 30px 70px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div style={{ padding: "22px 26px 18px", background: "linear-gradient(135deg,#0f172a,#1e293b)", borderRadius: "16px 16px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", margin: "0 0 5px" }}>GUÍA DE MANTENIMIENTO</p>
              <h2 style={{ color: "#fff", margin: 0, fontSize: 20, fontFamily: "monospace", letterSpacing: "0.04em" }}>{guia.numeroAlerta}</h2>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8", width: 30, height: 30, borderRadius: 7, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <CritBadge v={guia.creticidad} />
            <span style={{ background: "rgba(59,130,246,0.18)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.25)", padding: "2px 10px", borderRadius: 5, fontSize: 11, fontWeight: 700 }}>
              {PERIODO_LABEL[guia.periodo] || guia.periodo}
            </span>
            <span style={{ background: guia.periodoActivo ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)", color: guia.periodoActivo ? "#6ee7b7" : "#fca5a5", border: `1px solid ${guia.periodoActivo ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, padding: "2px 10px", borderRadius: 5, fontSize: 11, fontWeight: 700 }}>
              {guia.periodoActivo ? "● Activo" : "○ Inactivo"}
            </span>
          </div>
        </div>

        {!data ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Cargando…</div>
        ) : (
          <div style={{ padding: "22px 26px" }}>
            {/* Info grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                ["Equipo", data.equipo?.nombre, `${data.equipo?.marca || ""} ${data.equipo?.modelo || ""}`.trim()],
                ["Serie / Placa", data.equipo?.serie, data.equipo?.idPlaca],
                ["Plan", data.planMantenimiento?.nombre, data.planMantenimiento?.codigoPlan],
                ["Frecuencia Plan", data.planMantenimiento?.frecuencia],
                ["Sede", data.equipo?.sede],
                ["Orden de Venta", data.ordenVenta],
                ["Inicio Alerta", fmtDT(data.fechaInicioAlerta)],
                ["Descripción", data.descripcion],
              ].map(([label, value, sub]) => (
                <div key={label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "10px 12px" }}>
                  <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em" }}>{label.toUpperCase()}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{value || "—"}</p>
                  {sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{sub}</p>}
                </div>
              ))}
            </div>

            {/* Programaciones */}
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>
              PROGRAMACIONES ({data.programaciones?.length || 0})
            </p>
            {data.programaciones?.map((p, i) => (
              <div key={p.id} style={{ padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#475569" }}>{i + 1}</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{fmtDT(p.fechaProgramada)}</p>
                      {p.comentario && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{p.comentario}</p>}
                    </div>
                  </div>
                  <Badge estado={p.estado} />
                </div>

                {(p.estado === "PENDIENTE" || p.estado === "VENCIDO") && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button onClick={() => ejecutar(p.id)} disabled={!!actioning} style={{ padding: "6px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: actioning === p.id ? 0.6 : 1 }}>
                      {actioning === p.id ? "…" : "✓ Ejecutar"}
                    </button>
                    <button onClick={() => cancelar(p.id)} disabled={!!actioning} style={{ padding: "6px 14px", background: "#f97316", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: actioning === p.id ? 0.6 : 1 }}>
                      ✕ Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────
const COLS = [
  { key: "numeroAlerta", label: "N° Alerta", w: 150 },
  { key: "ordenVenta", label: "OV", w: 100 },
  { key: "producto", label: "Producto / Equipo", w: 200 },
  { key: "planNombre", label: "Plan", w: 180 },
  { key: "periodo", label: "Periodo", w: 100 },
  { key: "creticidad", label: "Crit.", w: 70 },
  { key: "proximaFecha", label: "Próx. Fecha", w: 120 },
  { key: "estadoProx", label: "Estado", w: 110 },
  { key: "fechaInicioAlerta", label: "Inicio Alerta", w: 120 },
  { key: "periodoActivo", label: "Activo", w: 70 },
];

export default function GuiaMantenimientoPage() {
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("fechaInicioAlerta");
  const [sortDir, setSortDir] = useState("desc");
  const [filterCrit, setFilterCrit] = useState("all");
  const [filterEstado, setFilterEstado] = useState("all");

  const loadGuias = useCallback(async () => {
    try {
      setLoading(true);
      const data = await guiaMantenimientoService.getGuias();
      setGuias(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGuias(); }, [loadGuias]);

  // Normalizar datos para la tabla
  const rows = guias.map(g => {
    const prox = g.programaciones?.[0];
    return {
      ...g,
      planNombre: g.planMantenimiento?.nombre || "—",
      proximaFecha: prox?.fechaProgramada || null,
      estadoProx: prox?.estado || "—",
      _raw: g,
    };
  });

  // Filtros
  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.numeroAlerta?.toLowerCase().includes(q) || r.producto?.toLowerCase().includes(q) || r.ordenVenta?.toLowerCase().includes(q) || r.planNombre?.toLowerCase().includes(q);
    const matchC = filterCrit === "all" || r.creticidad === filterCrit;
    const matchE = filterEstado === "all" || r.estadoProx === filterEstado;
    return matchQ && matchC && matchE;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortCol], bv = b[sortCol];
    if (!av) return 1; if (!bv) return -1;
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const toggleSort = (key) => {
    if (sortCol === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(key); setSortDir("asc"); }
  };

  const stats = {
    total: guias.length,
    pendientes: guias.filter(g => g.programaciones?.some(p => p.estado === "PENDIENTE")).length,
    vencidas: guias.filter(g => g.programaciones?.some(p => p.estado === "VENCIDO")).length,
    ejecutadas: guias.filter(g => g.programaciones?.every(p => p.estado === "EJECUTADO")).length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <style>{`
        * { box-sizing:border-box; }
        .gam-th { cursor:pointer; user-select:none; }
        .gam-th:hover { background:#eef2f7 !important; }
        .gam-row:hover td { background:#f0f7ff !important; }
        .gam-row { cursor:pointer; }
        .gam-cell { padding:0 12px; height:42px; vertical-align:middle; border-bottom:1px solid #f1f5f9; font-size:13px; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .gam-hcell { padding:0 12px; height:36px; vertical-align:middle; text-align:left; font-size:11px; font-weight:700; color:#64748b; letter-spacing:0.06em; background:#f8fafc; border-bottom:2px solid #e2e8f0; white-space:nowrap; }
        input:focus, select:focus { outline:none; border-color:#3b82f6 !important; box-shadow:0 0 0 3px rgba(59,130,246,0.12); }
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px}
      `}</style>

      {/* Top bar */}
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "18px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", margin: "0 0 3px" }}>SISTEMA DE MANTENIMIENTO</p>
            <h1 style={{ color: "#fff", margin: 0, fontSize: 20, fontWeight: 700 }}>Guías de Mantenimiento</h1>
          </div>
          <button onClick={() => setOpenModal(true)} style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            ＋ Nueva Guía
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "22px 28px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
          {[
            { label: "Total", value: stats.total, icon: "📋", c: "#3b82f6", bg: "#eff6ff" },
            { label: "Pendientes", value: stats.pendientes, icon: "⏳", c: "#d97706", bg: "#fffbeb" },
            { label: "Vencidas", value: stats.vencidas, icon: "🔴", c: "#dc2626", bg: "#fef2f2" },
            { label: "Ejecutadas", value: stats.ejecutadas, icon: "✅", c: "#059669", bg: "#ecfdf5" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 11, padding: "14px 16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.value}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px 12px 0 0", padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", borderBottom: "1px solid #f1f5f9" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alerta, producto, OV, plan…"
              style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7, border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", color: "#1e293b" }} />
          </div>

          {/* Filtro creticidad */}
          <div style={{ display: "flex", gap: 4 }}>
            {[["all", "Todas"], ["A", "Crit. A"], ["B", "Media B"], ["C", "Baja C"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilterCrit(v)} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: filterCrit === v ? "none" : "1.5px solid #e2e8f0", background: filterCrit === v ? "#0f172a" : "#fff", color: filterCrit === v ? "#fff" : "#64748b", transition: "all 0.15s" }}>{l}</button>
            ))}
          </div>

          {/* Filtro estado */}
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
            style={{ padding: "7px 28px 7px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#475569", background: "#fff", cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
            <option value="all">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EJECUTADO">Ejecutado</option>
            <option value="VENCIDO">Vencido</option>
            <option value="CANCELADO">Cancelado</option>
          </select>

          <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8" }}><strong style={{ color: "#475569" }}>{sorted.length}</strong> de {guias.length} guías</span>
        </div>

        {/* Grid / Tabla tipo Excel */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0 0 12px 12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                {COLS.map(c => <col key={c.key} style={{ width: c.w }} />)}
                <col style={{ width: 90 }} />
              </colgroup>
              <thead>
                <tr>
                  {COLS.map(c => (
                    <th key={c.key} className="gam-hcell gam-th" onClick={() => toggleSort(c.key)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {c.label}
                        {sortCol === c.key && <span style={{ fontSize: 10, color: "#3b82f6" }}>{sortDir === "asc" ? "▲" : "▼"}</span>}
                      </div>
                    </th>
                  ))}
                  <th className="gam-hcell" style={{ textAlign: "center" }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={COLS.length + 1} style={{ padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      Cargando guías…
                    </div>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </td></tr>
                ) : sorted.length === 0 ? (
                  <tr><td colSpan={COLS.length + 1} style={{ padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                    No se encontraron guías con los filtros actuales
                  </td></tr>
                ) : sorted.map((r, idx) => (
                  <tr key={r.id} className="gam-row" onClick={() => setSelected(r._raw)}
                    style={{ background: idx % 2 === 0 ? "#fff" : "#fafbfc" }}>

                    {/* N° Alerta */}
                    <td className="gam-cell">
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "#1e293b" }}>{r.numeroAlerta}</span>
                    </td>

                    {/* OV */}
                    <td className="gam-cell">
                      <span style={{ fontSize: 12, color: "#475569" }}>{r.ordenVenta}</span>
                    </td>

                    {/* Producto */}
                    <td className="gam-cell">
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>{r.producto}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis" }}>{r._raw.equipo?.marca} {r._raw.equipo?.modelo}</p>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="gam-cell">
                      <span style={{ fontSize: 12, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{r.planNombre}</span>
                    </td>

                    {/* Periodo */}
                    <td className="gam-cell">
                      <span style={{ background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        {PERIODO_LABEL[r.periodo] || r.periodo}
                      </span>
                    </td>

                    {/* creticidad */}
                    <td className="gam-cell" style={{ textAlign: "center" }}>
                      <CritBadge v={r.creticidad} />
                    </td>

                    {/* Próxima fecha */}
                    <td className="gam-cell">
                      <span style={{ fontSize: 12, color: "#475569" }}>{r.proximaFecha ? fmt(r.proximaFecha) : "—"}</span>
                    </td>

                    {/* Estado */}
                    <td className="gam-cell">
                      {r.estadoProx !== "—" ? <Badge estado={r.estadoProx} /> : <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>}
                    </td>

                    {/* Inicio alerta */}
                    <td className="gam-cell">
                      <span style={{ fontSize: 12, color: "#475569" }}>{fmt(r.fechaInicioAlerta)}</span>
                    </td>

                    {/* Activo */}
                    <td className="gam-cell" style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 16 }}>{r.periodoActivo ? "✅" : "⭕"}</span>
                    </td>

                    {/* Acción */}
                    <td className="gam-cell" style={{ textAlign: "center" }}>
                      <button onClick={e => { e.stopPropagation(); setSelected(r._raw); }}
                        style={{ background: "#0f172a", color: "#fff", border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        Ver →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {!loading && sorted.length > 0 && (
            <div style={{ padding: "8px 16px", borderTop: "1px solid #f1f5f9", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                Mostrando <strong style={{ color: "#475569" }}>{sorted.length}</strong> guías
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                Click en cualquier fila para ver el detalle
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selected && <DetalleModal guia={selected} onClose={() => setSelected(null)} onReload={loadGuias} />}
      <ModalCrearGuiaMantenimiento isOpen={openModal} onClose={() => setOpenModal(false)} onCreated={loadGuias} />
    </div>
  );
}