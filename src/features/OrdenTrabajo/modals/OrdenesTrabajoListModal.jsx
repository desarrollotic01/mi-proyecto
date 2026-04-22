import React, { useState, useMemo, useCallback, useEffect } from "react";
import { getTrabajadorById } from "../../mantenimiento/services/trabajadoresService";
// ↑ Ajusta la ruta del import según tu estructura de carpetas

/* ═══════════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-PE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

/* ─── Badge genérico ──────────────────────────────────────────────── */
const ESTADO = {
  CREADO:         { bg:"#DBEAFE", fg:"#1E40AF", t:"Creado" },
  LIBERADO:       { bg:"#D1FAE5", fg:"#065F46", t:"Liberado" },
  EN_EJECUCION:   { bg:"#FEF3C7", fg:"#92400E", t:"En ejecución" },
  CERRADO:        { bg:"#E5E7EB", fg:"#374151", t:"Cerrado" },
  CANCELADO:      { bg:"#FEE2E2", fg:"#991B1B", t:"Cancelado" },
  PENDIENTE:      { bg:"#FFEDD5", fg:"#9A3412", t:"Pendiente" },
  EN_PROCESO:     { bg:"#DBEAFE", fg:"#1E40AF", t:"En proceso" },
  COMPLETADO:     { bg:"#D1FAE5", fg:"#065F46", t:"Completado" },
  CIERRE_TECNICO: { bg:"#FDE68A", fg:"#78350F", t:"Cierre técnico" },
};
const PRIORIDAD = {
  CRITICA:{ bg:"#FAE8FF", fg:"#6B21A8" }, ALTA:{ bg:"#FEE2E2", fg:"#991B1B" },
  MEDIA:{ bg:"#FFEDD5", fg:"#9A3412" }, BAJA:{ bg:"#D1FAE5", fg:"#065F46" },
};
const TIPO_TRAB = {
  CAMBIO:{ bg:"#DBEAFE", fg:"#1E40AF" }, REPARACION:{ bg:"#FEE2E2", fg:"#991B1B" },
  INSPECCION:{ bg:"#FAE8FF", fg:"#6B21A8" }, LIMPIEZA:{ bg:"#CCFBF1", fg:"#115E59" },
};
const ROL_L = {
  tecnico_mecanico:"Téc. Mecánico", tecnico_electrico:"Téc. Eléctrico",
  operario_de_mantenimiento:"Op. Mantenimiento",
};

const Pill = ({ map, value }) => {
  const s = (map||{})[value] || { bg:"#F3F4F6", fg:"#6B7280" };
  return (
    <span style={{ display:"inline-block", padding:"2px 9px", borderRadius:"10px", fontSize:"10.5px",
      fontWeight:600, background:s.bg, color:s.fg, whiteSpace:"nowrap" }}>
      {s.t || value || "—"}
    </span>
  );
};

/* ─── Icons ───────────────────────────────────────────────────────── */
const Chev = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
    style={{ transition:"transform .15s", transform: open ? "rotate(90deg)" : "rotate(0)" }}>
    <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SearchIco = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);
const ClipIco = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
  </svg>
);

/* ─── Adjuntos inline ─────────────────────────────────────────────── */
const Adjuntos = ({ list }) => {
  if (!list?.length) return <span style={{ color:"#CBD5E1", fontSize:"11px" }}>—</span>;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"3px" }}>
      {list.map((a,i) => (
        <a key={a.id||i} href={a.url||a.ruta||"#"} target="_blank" rel="noopener noreferrer"
          style={{ display:"inline-flex", alignItems:"center", gap:"3px", padding:"1px 7px",
            borderRadius:"5px", background:"#F0F9FF", color:"#0369A1", fontSize:"10.5px",
            fontWeight:500, textDecoration:"none", border:"1px solid #BAE6FD" }}>
          <ClipIco/>{a.nombreArchivo||a.nombre||`Archivo ${i+1}`}
        </a>
      ))}
    </div>
  );
};

/* ─── Trabajadores inline ─────────────────────────────────────────── */
const Trabajadores = ({ list }) => {
  if (!list?.length) return <span style={{ color:"#CBD5E1", fontSize:"11px" }}>—</span>;
  const sorted = [...list].sort((a,b) => (b.esEncargado?1:0) - (a.esEncargado?1:0));
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"3px" }}>
      {sorted.map((t) => {
        const enc = t.esEncargado;
        return (
          <span key={t.id} style={{
            display:"inline-flex", alignItems:"center", gap:"3px",
            padding:"2px 8px", borderRadius:"6px", fontSize:"10.5px",
            fontWeight: enc ? 700 : 500,
            background: enc ? "#FEF3C7" : "#EEF2FF",
            color: enc ? "#92400E" : "#3730A3",
            border: enc ? "1.5px solid #F59E0B" : "1px solid #C7D2FE",
          }}>
            {enc && <span style={{ fontSize:"7.5px", background:"#F59E0B", color:"#fff",
              padding:"1px 4px", borderRadius:"3px", fontWeight:800 }}>★ ENC</span>}
            {t.trabajador?.nombre} {t.trabajador?.apellido}
            <span style={{ fontSize:"9.5px", opacity:.6 }}>
              ({ROL_L[t.trabajador?.rol]||t.trabajador?.rol})
            </span>
          </span>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════════════════════ */

const S = {
  th: (extra) => ({
    padding:"7px 10px", textAlign:"left", fontWeight:700, fontSize:"10px",
    color:"#475569", textTransform:"uppercase", letterSpacing:".5px",
    whiteSpace:"nowrap", borderBottom:"2px solid #E2E8F0",
    position:"sticky", top:0, zIndex:5, ...extra,
  }),
  td: {
    padding:"7px 10px", fontSize:"12px", color:"#1E293B",
    borderBottom:"1px solid #F1F5F9", verticalAlign:"middle",
  },
  tdMuted: {
    padding:"7px 10px", fontSize:"11px", color:"#64748B",
    borderBottom:"1px solid #F1F5F9", verticalAlign:"middle",
    maxWidth:"220px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN VIEW
   ═══════════════════════════════════════════════════════════════════════════════ */

const OrdenesTrabajoListView = ({
  ordenes = [],
  onSelectEquipo,
  onSelectUbicacion,
  onSelectOT,
}) => {
  const [expandedOTs, setExpandedOTs] = useState(new Set());
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("TODOS");
  const [supervisorNames, setSupervisorNames] = useState({});

  /* ─── Cargar nombres de supervisores ─────────────────── */
  useEffect(() => {
    const ids = [...new Set(ordenes.map(o => o.supervisorId).filter(Boolean))];
    const missing = ids.filter(id => !supervisorNames[id]);
    if (missing.length === 0) return;

    let cancelled = false;
    Promise.all(
      missing.map(id =>
        getTrabajadorById(id)
          .then(data => ({ id, name: `${data.nombre || ""} ${data.apellido || ""}`.trim() }))
          .catch(() => ({ id, name: `ID: ${id.slice(0, 8)}…` }))
      )
    ).then(results => {
      if (cancelled) return;
      setSupervisorNames(prev => {
        const next = { ...prev };
        results.forEach(r => { next[r.id] = r.name; });
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [ordenes]);

  const toggle = useCallback((setter, id) => {
    setter(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedOTs(new Set(ordenes.map(o => o.id)));
    const ids = new Set();
    ordenes.forEach(o => o.equipos?.forEach(e => ids.add(e.id)));
    setExpandedItems(ids);
  }, [ordenes]);

  const collapseAll = useCallback(() => { setExpandedOTs(new Set()); setExpandedItems(new Set()); }, []);

  /* ─── Filter ─────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return ordenes.filter(ot => {
      if (filterEstado !== "TODOS" && ot.estado !== filterEstado) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const m1 = ot.numeroOT?.toLowerCase().includes(q) || ot.descripcionGeneral?.toLowerCase().includes(q);
        const m2 = ot.equipos?.some(e =>
          e.equipo?.nombre?.toLowerCase().includes(q) || e.equipo?.codigo?.toLowerCase().includes(q) ||
          e.ubicacionTecnica?.nombre?.toLowerCase().includes(q) || e.ubicacionTecnica?.codigo?.toLowerCase().includes(q)
        );
        const m3 = ot.equipos?.some(e => e.trabajadores?.some(t =>
          t.trabajador?.nombre?.toLowerCase().includes(q) || t.trabajador?.apellido?.toLowerCase().includes(q) || t.trabajador?.dni?.includes(q)
        ));
        if (!m1 && !m2 && !m3) return false;
      }
      return true;
    });
  }, [ordenes, search, filterEstado]);

  const totEq = useMemo(() => filtered.reduce((a,o) => a + (o.equipos?.length||0), 0), [filtered]);
  const totAct = useMemo(() => filtered.reduce((a,o) => a + (o.equipos?.reduce((b,e) => b+(e.actividades?.length||0),0)||0), 0), [filtered]);
  const estados = useMemo(() => [...new Set(ordenes.map(o => o.estado))].sort(), [ordenes]);

  const supName = (id) => supervisorNames[id] || (id ? "Cargando…" : "—");

  return (
    <>
      <style>{`
        .otv2-wrap { font-family:'Segoe UI',system-ui,-apple-system,sans-serif; display:flex; flex-direction:column }
        .otv2-scroll { flex:1; overflow:auto; border:1px solid #E2E8F0; border-radius:8px }
        .otv2-scroll::-webkit-scrollbar { width:5px; height:5px }
        .otv2-scroll::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:3px }
        .otv2-table { width:100%; border-collapse:collapse }
        .otv2-btn { padding:6px 13px; border:1px solid #E2E8F0; border-radius:7px; background:#fff; font-size:11.5px; color:#475569; cursor:pointer; font-weight:500; transition:all .12s; font-family:inherit; display:inline-flex; align-items:center; gap:4px }
        .otv2-btn:hover { background:#EEF2FF; border-color:#C7D2FE; color:#4338CA }
        .otv2-search { flex:1; min-width:200px; padding:7px 12px 7px 32px; border:1px solid #E2E8F0; border-radius:7px; font-size:12.5px; outline:none; color:#334155; background:#fff; font-family:inherit; transition:all .12s }
        .otv2-search:focus { border-color:#818CF8; box-shadow:0 0 0 3px rgba(129,140,248,.12) }
        .otv2-select { padding:7px 10px; border:1px solid #E2E8F0; border-radius:7px; font-size:11.5px; color:#334155; background:#fff; cursor:pointer; outline:none; font-family:inherit }
        .otv2-ot-toggle { cursor:pointer; user-select:none }
        .otv2-ot-toggle:hover { background:#F8FAFC !important }
        .otv2-eq-row:hover { background:#F5FAF8 !important }
        .otv2-act-row:hover { background:#FAF8FF !important }
      `}</style>

      <div className="otv2-wrap">
        {/* ─── TOOLBAR ─────────────────────────────────── */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px", flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:"200px" }}>
            <div style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)" }}><SearchIco/></div>
            <input className="otv2-search" placeholder="Buscar N° OT, equipo, ubicación, trabajador, DNI…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="otv2-select" value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
            <option value="TODOS">Estado: Todos</option>
            {estados.map(e => <option key={e} value={e}>{ESTADO[e]?.t||e}</option>)}
          </select>
          <button className="otv2-btn" onClick={expandAll}>⊞ Expandir</button>
          <button className="otv2-btn" onClick={collapseAll}>⊟ Colapsar</button>
        </div>

        {/* ─── MAIN TABLE ──────────────────────────────── */}
        <div className="otv2-scroll">
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"56px", color:"#94A3B8", fontSize:"13px" }}>
              No se encontraron órdenes de trabajo
            </div>
          ) : (
            filtered.map(ot => {
              const otOpen = expandedOTs.has(ot.id);
              const eqCount = ot.equipos?.length || 0;

              return (
                <div key={ot.id} style={{ borderBottom:"2px solid #E2E8F0" }}>

                  {/* ══════════════════════════════════════════════════
                     OT — CABECERA + FILA
                     ══════════════════════════════════════════════════ */}
                  <table className="otv2-table">
                    <thead>
                      <tr style={{ background:"#EEF2FF" }}>
                        <th style={S.th({ width:"36px", background:"#EEF2FF" })}></th>
                        <th style={S.th({ background:"#EEF2FF" })}>N° OT</th>
                        <th style={S.th({ background:"#EEF2FF" })}>Estado</th>
                        <th style={S.th({ background:"#EEF2FF" })}>Supervisor</th>
                        <th style={S.th({ background:"#EEF2FF" })}>Descripción</th>
                        <th style={S.th({ background:"#EEF2FF" })}>Desc. Detallada</th>
                        <th style={S.th({ background:"#EEF2FF" })}>Inicio Prog.</th>
                        <th style={S.th({ background:"#EEF2FF" })}>Fin Prog.</th>
                        <th style={S.th({ background:"#EEF2FF" })}>Observaciones</th>
                        <th style={S.th({ background:"#EEF2FF" })}>Adjuntos</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="otv2-ot-toggle"
                        style={{ background: otOpen ? "#FAFAFF" : "#fff", borderLeft:"4px solid #6366F1" }}
                        onClick={() => toggle(setExpandedOTs, ot.id)}>
                        <td style={S.td}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                            width:"22px", height:"22px", borderRadius:"5px", border:"1px solid #E2E8F0",
                            background:"#fff", color:"#64748B" }}>
                            <Chev open={otOpen}/>
                          </div>
                        </td>
                        <td style={{ ...S.td, fontWeight:700 }}>
                          <span style={{ color:"#4338CA", cursor:"pointer" }}
                            onClick={e => { e.stopPropagation(); onSelectOT?.(ot); }}>
                            {ot.numeroOT}
                          </span>
                          <div style={{ fontSize:"10px", color:"#94A3B8", fontWeight:400 }}>{ot.tipoMantenimiento}</div>
                        </td>
                        <td style={S.td}><Pill map={ESTADO} value={ot.estado}/></td>
                        <td style={S.td}><span style={{ fontWeight:600, fontSize:"11.5px" }}>{supName(ot.supervisorId)}</span></td>
                        <td style={S.tdMuted} title={ot.descripcionGeneral}>{ot.descripcionGeneral || "—"}</td>
                        <td style={S.tdMuted} title={ot.descripcionDetallada}>{ot.descripcionDetallada || "—"}</td>
                        <td style={{ ...S.td, fontSize:"11px" }}>{fmtDate(ot.fechaProgramadaInicio)}</td>
                        <td style={{ ...S.td, fontSize:"11px" }}>{fmtDate(ot.fechaProgramadaFin)}</td>
                        <td style={S.tdMuted} title={ot.observaciones}>
                          {ot.observaciones ? <span style={{ fontStyle:"italic" }}>{ot.observaciones}</span> : "—"}
                        </td>
                        <td style={S.td}><Adjuntos list={ot.adjuntos}/></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* ══════════════════════════════════════════════════
                     EQUIPOS / UBICACIONES — CABECERA + FILAS
                     ══════════════════════════════════════════════════ */}
                  {otOpen && eqCount > 0 && (
                    <div style={{ marginLeft:"20px", borderLeft:"3px solid #10B981" }}>
                      <table className="otv2-table">
                        <thead>
                          <tr style={{ background:"#ECFDF5" }}>
                            <th style={S.th({ width:"36px", background:"#ECFDF5" })}></th>
                            <th style={S.th({ background:"#ECFDF5" })}>Tipo</th>
                            <th style={S.th({ background:"#ECFDF5" })}>Código</th>
                            <th style={S.th({ background:"#ECFDF5" })}>Nombre</th>
                            <th style={S.th({ background:"#ECFDF5" })}>Descripción del Trabajo</th>
                            <th style={S.th({ background:"#ECFDF5" })}>Prioridad</th>
                            <th style={S.th({ background:"#ECFDF5" })}>Estado</th>
                            <th style={S.th({ background:"#ECFDF5" })}>Inicio Prog.</th>
                            <th style={S.th({ background:"#ECFDF5" })}>Fin Prog.</th>
                            <th style={S.th({ background:"#ECFDF5" })}>Trabajadores</th>
                            <th style={S.th({ background:"#ECFDF5" })}>Adjuntos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ot.equipos.map(item => {
                            const eq = item.equipo;
                            const ub = item.ubicacionTecnica;
                            const isUb = !!ub && !eq;
                            const nombre = isUb ? (ub?.nombre||"Ubic. Técnica") : (eq?.nombre||"Equipo");
                            const codigo = isUb ? (ub?.codigo||"—") : (eq?.codigo||"—");
                            const actCount = item.actividades?.length || 0;
                            const itemOpen = expandedItems.has(item.id);

                            return (
                              <React.Fragment key={item.id}>
                                <tr className="otv2-eq-row"
                                  style={{ cursor: actCount > 0 ? "pointer" : "default",
                                    background: isUb ? "#FFFBEB" : "#fff",
                                    borderLeft: isUb ? "3px solid #F59E0B" : "none" }}
                                  onClick={() => actCount > 0 && toggle(setExpandedItems, item.id)}>
                                  <td style={S.td}>
                                    {actCount > 0 && (
                                      <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                                        width:"20px", height:"20px", borderRadius:"4px", border:"1px solid #E2E8F0",
                                        background:"#fff", color:"#64748B" }}>
                                        <Chev open={itemOpen}/>
                                      </div>
                                    )}
                                  </td>
                                  <td style={S.td}>
                                    <span style={{
                                      padding:"2px 7px", borderRadius:"4px", fontSize:"9.5px", fontWeight:700,
                                      textTransform:"uppercase",
                                      background: isUb ? "#FEF3C7" : "#ECFDF5",
                                      color: isUb ? "#92400E" : "#065F46",
                                    }}>
                                      {isUb ? "UBIC" : "EQUIPO"}
                                    </span>
                                  </td>
                                  <td style={{ ...S.td, fontWeight:600 }}>
                                    <span style={{ color:"#059669", cursor:"pointer" }}
                                      onClick={e => {
                                        e.stopPropagation();
                                        if (isUb) onSelectUbicacion?.(ub, ot);
                                        else onSelectEquipo?.(eq, ot);
                                      }}>
                                      {codigo}
                                    </span>
                                  </td>
                                  <td style={S.td}>{nombre}</td>
                                  <td style={S.tdMuted} title={item.descripcionEquipo}>{item.descripcionEquipo || "—"}</td>
                                  <td style={S.td}><Pill map={PRIORIDAD} value={item.prioridad}/></td>
                                  <td style={S.td}><Pill map={ESTADO} value={item.estadoEquipo}/></td>
                                  <td style={{ ...S.td, fontSize:"11px" }}>{fmtDate(item.fechaInicioProgramada)}</td>
                                  <td style={{ ...S.td, fontSize:"11px" }}>{fmtDate(item.fechaFinProgramada)}</td>
                                  <td style={S.td}><Trabajadores list={item.trabajadores}/></td>
                                  <td style={S.td}><Adjuntos list={item.adjuntos}/></td>
                                </tr>

                                {/* ══════════════════════════════════════
                                   ACTIVIDADES — CABECERA + FILAS
                                   ══════════════════════════════════════ */}
                                {itemOpen && actCount > 0 && (
                                  <tr>
                                    <td colSpan={11} style={{ padding:0 }}>
                                      <div style={{ marginLeft:"24px", borderLeft:"3px solid #8B5CF6" }}>
                                        <table className="otv2-table">
                                          <thead>
                                            <tr style={{ background:"#F5F3FF" }}>
                                              <th style={S.th({ background:"#F5F3FF" })}>N°</th>
                                              <th style={S.th({ background:"#F5F3FF" })}>Sistema</th>
                                              <th style={S.th({ background:"#F5F3FF" })}>Subsistema</th>
                                              <th style={S.th({ background:"#F5F3FF" })}>Componente</th>
                                              <th style={S.th({ background:"#F5F3FF" })}>Tarea</th>
                                              <th style={S.th({ background:"#F5F3FF" })}>Tipo Trabajo</th>
                                              <th style={S.th({ background:"#F5F3FF" })}>Estado</th>
                                              <th style={S.th({ background:"#F5F3FF" })}>Dur. Estimada</th>
                                              <th style={S.th({ background:"#F5F3FF" })}>Dur. Real</th>
                                              <th style={S.th({ background:"#F5F3FF" })}>Rol Técnico</th>
                                              <th style={S.th({ background:"#F5F3FF" })}>Cant. Téc.</th>
                                              <th style={S.th({ background:"#F5F3FF" })}>Origen</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {item.actividades.map((act, idx) => (
                                              <tr key={act.id} className="otv2-act-row" style={{ background:"#FAFAFF" }}>
                                                <td style={{ ...S.td, fontWeight:600, color:"#6D28D9", fontSize:"11px" }}>{idx+1}</td>
                                                <td style={S.td}>{act.sistema}</td>
                                                <td style={S.td}>{act.subsistema}</td>
                                                <td style={S.td}>{act.componente}</td>
                                                <td style={{ ...S.tdMuted, maxWidth:"200px" }} title={act.tarea}>{act.tarea}</td>
                                                <td style={S.td}><Pill map={TIPO_TRAB} value={act.tipoTrabajo}/></td>
                                                <td style={S.td}><Pill map={ESTADO} value={act.estado}/></td>
                                                <td style={{ ...S.td, fontSize:"11px" }}>
                                                  {act.duracionEstimadaValor} {act.unidadDuracion}
                                                  <span style={{ color:"#94A3B8", fontSize:"10px" }}> ({act.duracionEstimadaMin}m)</span>
                                                </td>
                                                <td style={{ ...S.td, fontSize:"11px" }}>
                                                  {act.duracionRealValor ? `${act.duracionRealValor} ${act.unidadDuracionReal}` : "—"}
                                                </td>
                                                <td style={{ ...S.td, fontSize:"11px" }}>{ROL_L[act.rolTecnico]||act.rolTecnico}</td>
                                                <td style={{ ...S.td, fontSize:"11px", textAlign:"center" }}>{act.cantidadTecnicos}</td>
                                                <td style={{ ...S.td, fontSize:"11px" }}>{act.origen}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ─── FOOTER ──────────────────────────────────── */}
        <div style={{ padding:"10px 0", display:"flex", justifyContent:"space-between", fontSize:"11.5px", color:"#64748B" }}>
          <div>
            <strong>{filtered.length}</strong> OTs · <strong>{totEq}</strong> equipos/ubic. · <strong>{totAct}</strong> actividades
          </div>
          <span style={{ color:"#94A3B8", fontSize:"10.5px" }}>Click en fila para expandir · Click en código para detalle</span>
        </div>
      </div>
    </>
  );
};

export default OrdenesTrabajoListView;