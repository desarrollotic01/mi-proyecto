import { useMemo, useState } from "react";

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const MESES     = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_C   = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DIAS_C    = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];

const ESTADO_STYLE = {
  PENDIENTE: { bg:"#dbeafe", border:"#93c5fd", text:"#1d4ed8", ico:"P" },
  EJECUTADO: { bg:"#dcfce7", border:"#86efac", text:"#15803d", ico:"✓" },
  CANCELADO: { bg:"#fed7aa", border:"#fdba74", text:"#c2410c", ico:"✕" },
  VENCIDO:   { bg:"#fee2e2", border:"#fca5a5", text:"#dc2626", ico:"!" },
};

const ESTADO_BADGE = {
  PENDIENTE: { bg:"#fef3c7", color:"#92400e" },
  EJECUTADO: { bg:"#d1fae5", color:"#065f46" },
  CANCELADO: { bg:"#ffedd5", color:"#7c2d12" },
  VENCIDO:   { bg:"#fee2e2", color:"#7f1d1d" },
};

const PERIODO_LABEL = {
  DIARIO:"Diario", SEMANAL:"Semanal", MENSUAL:"Mensual", BIMESTRAL:"Bimestral",
  TRIMESTRAL:"Trimestral", SEIS_MESES:"6 Meses", ANUAL:"Anual",
  CINCO_ANIOS:"5 Años", DIEZ_ANIOS:"10 Años",
};

const CRIT = {
  A:{ c:"#dc2626", bg:"#fef2f2", b:"#fca5a5" },
  B:{ c:"#d97706", bg:"#fff7ed", b:"#fdba74" },
  C:{ c:"#16a34a", bg:"#f0fdf4", b:"#86efac" },
};

// Dimensiones
const LEFT_W  = 380;
const ROW_H   = 70;
const H_TOP   = 32;  // altura fila agrupadora (meses / semanas)
const H_BOT   = 26;  // altura fila días / meses

// ─── UTILS ────────────────────────────────────────────────────────────────────
const sameDay   = (a,b) => a.toDateString() === b.toDateString();
const sameMonth = (a,b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth();
const dayKey    = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const monthKey  = (d) => `${d.getFullYear()}-${d.getMonth()}`;
const addDays   = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };

function daysRange(start, end) {
  const days=[]; const c=new Date(start); c.setHours(0,0,0,0);
  const e=new Date(end);   e.setHours(23,59,59,999);
  while(c<=e){ days.push(new Date(c)); c.setDate(c.getDate()+1); }
  return days;
}

function startOfMonday(d) {
  const r=new Date(d); r.setHours(0,0,0,0);
  const day=r.getDay(); // 0=Dom
  r.setDate(r.getDate() - (day===0?6:day-1));
  return r;
}

// ─── MINI CAMPO: label arriba, valor abajo ────────────────────────────────────
function Campo({ label, children, style }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:1, overflow:"hidden", ...style }}>
      <span style={{ fontSize:9, fontWeight:700, color:"#94a3b8", letterSpacing:"0.08em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
        {label}
      </span>
      <div style={{ fontSize:11, fontWeight:600, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", lineHeight:1.3 }}>
        {children || <span style={{ color:"#cbd5e1" }}>—</span>}
      </div>
    </div>
  );
}

// ─── COLUMNA IZQUIERDA DE CADA FILA ──────────────────────────────────────────
function GuiaCell({ guia }) {
  const prox  = guia.programaciones?.[0];
  const eProx = prox?.estado;
  const eBadge = eProx ? ESTADO_BADGE[eProx] : null;
  const cr = CRIT[guia.creticidad] || { c:"#64748b", bg:"#f8fafc", b:"#e2e8f0" };

  return (
    <div style={{
      width:LEFT_W, minWidth:LEFT_W, height:ROW_H,
      borderRight:"2px solid #e2e8f0",
      padding:"6px 12px",
      display:"grid",
      gridTemplateColumns:"1fr 1fr 1fr 1fr",
      gridTemplateRows:"1fr 1fr",
      gap:"4px 8px",
      overflow:"hidden",
      background:"inherit",
      alignItems:"start",
    }}>
      {/* Fila 1 */}
      <Campo label="N° Alerta">
        <span style={{ fontFamily:"monospace", fontSize:10, fontWeight:800, color:"#0f172a" }}>
          {guia.numeroAlerta}
        </span>
      </Campo>

      <Campo label="OV">
        {guia.ordenVenta}
      </Campo>

      <Campo label="Criticidad">
        <span style={{ fontWeight:800, color:cr.c, background:cr.bg, border:`1px solid ${cr.b}`, padding:"0 5px", borderRadius:4, fontSize:10 }}>
          {guia.creticidad || "—"}
        </span>
      </Campo>

      <Campo label="Activo">
        <span style={{ color: guia.periodoActivo ? "#16a34a" : "#94a3b8", fontWeight:700 }}>
          {guia.periodoActivo ? "● Sí" : "○ No"}
        </span>
      </Campo>

      {/* Fila 2 */}
      <Campo label="Producto / Equipo" style={{ gridColumn:"span 2" }}>
        {guia.producto || guia.equipo?.nombre}
      </Campo>

      <Campo label="Plan" style={{ gridColumn:"span 1" }}>
        {guia.planMantenimiento?.nombre}
      </Campo>

      <Campo label="Periodo / Estado">
        {eBadge ? (
          <span style={{ background:eBadge.bg, color:eBadge.color, padding:"0 5px", borderRadius:10, fontSize:10, fontWeight:700 }}>
            {eProx?.[0]+eProx?.slice(1).toLowerCase()}
          </span>
        ) : (
          PERIODO_LABEL[guia.periodo] || guia.periodo
        )}
      </Campo>
    </div>
  );
}

// ─── CABECERA FIJA (2 filas) ──────────────────────────────────────────────────
function GanttHeader({ groups, units, DAY_W, unitWidth }) {
  return (
    <>
      {/* Fila superior: grupos (meses, semanas, año) */}
      <div style={{ display:"flex", borderBottom:"1px solid #e2e8f0" }}>
        <div style={{ width:LEFT_W, minWidth:LEFT_W, height:H_TOP, background:"#f1f5f9", borderRight:"2px solid #e2e8f0", display:"flex", alignItems:"center", padding:"0 14px" }}>
          <span style={{ fontSize:10, fontWeight:700, color:"#64748b", letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Guía de Mantenimiento
          </span>
        </div>
        {groups.map(g => (
          <div key={g.key}
            style={{ width:g.span*(unitWidth||DAY_W), height:H_TOP, background:"#f1f5f9", borderRight:"1px solid #e2e8f0",
              display:"flex", alignItems:"center", paddingLeft:10,
              fontSize:11, fontWeight:700, color:"#334155", overflow:"hidden", whiteSpace:"nowrap",
            }}>
            {g.label}
          </div>
        ))}
      </div>

      {/* Fila inferior: unidades (días, meses) */}
      <div style={{ display:"flex", borderBottom:"2px solid #cbd5e1" }}>
        <div style={{ width:LEFT_W, minWidth:LEFT_W, height:H_BOT, background:"#f8fafc", borderRight:"2px solid #e2e8f0",
          display:"flex", alignItems:"center", padding:"0 14px" }}>
          <span style={{ fontSize:9, fontWeight:700, color:"#94a3b8", letterSpacing:"0.08em" }}>N° ALERTA · OV · PLAN</span>
        </div>
        {units.map(u => (
          <div key={u.key}
            style={{ width:unitWidth||DAY_W, minWidth:unitWidth||DAY_W, height:H_BOT,
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              background: u.isToday ? "#dbeafe" : u.isWeekend ? "#f8fafc" : "#fafafa",
              borderRight:"1px solid #f1f5f9",
              fontSize:9, fontWeight: u.isToday ? 800 : 500,
              color: u.isToday ? "#1d4ed8" : u.isWeekend ? "#94a3b8" : "#64748b",
              lineHeight:1.1,
            }}>
            {u.sub && <span style={{ fontSize:8, color: u.isToday?"#1d4ed8":"#94a3b8" }}>{u.sub}</span>}
            <span>{u.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── CELDA DE DÍA ─────────────────────────────────────────────────────────────
function DayCell({ prog, alert, isToday, isWeekend, DAY_W }) {
  const s = prog ? ESTADO_STYLE[prog.estado] : null;
  return (
    <div style={{ width:DAY_W, minWidth:DAY_W, height:ROW_H,
      display:"flex", alignItems:"center", justifyContent:"center",
      background: isToday ? "rgba(59,130,246,0.07)" : isWeekend ? "#fafafa" : "transparent",
      borderRight:"1px solid #f1f5f9", position:"relative", flexShrink:0,
    }}>
      {isToday && (
        <div style={{ position:"absolute", inset:0, borderLeft:"2px solid #3b82f6", opacity:0.3, pointerEvents:"none" }} />
      )}
      {prog && (
        <div title={`${prog.estado} — ${new Date(prog.fechaProgramada).toLocaleDateString("es-PE",{day:"2-digit",month:"short",year:"numeric"})}`}
          style={{ width:22, height:22, borderRadius:6, background:s.bg, border:`2px solid ${s.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:9, fontWeight:800, color:s.text, cursor:"default", zIndex:1,
          }}>
          {s.ico}
        </div>
      )}
      {!prog && alert && (
        <span title={`Alerta — ${new Date(alert.fechaProgramada).toLocaleDateString("es-PE")}`}
          style={{ fontSize:14, lineHeight:1, cursor:"default" }}>🔔</span>
      )}
    </div>
  );
}

// ─── CELDA DE MES (vista anual) ───────────────────────────────────────────────
function MonthCell({ progs, hasAlert, isNow, MONTH_W }) {
  return (
    <div style={{ width:MONTH_W, minWidth:MONTH_W, height:ROW_H,
      display:"flex", alignItems:"center", justifyContent:"center",
      flexWrap:"wrap", gap:3, padding:"4px",
      background: isNow ? "rgba(59,130,246,0.06)" : "transparent",
      borderRight:"1px solid #f1f5f9", position:"relative",
    }}>
      {isNow && <div style={{ position:"absolute", inset:0, borderLeft:"2px solid #3b82f6", opacity:0.25, pointerEvents:"none" }} />}
      {progs.map((p,i) => {
        const s = ESTADO_STYLE[p.estado];
        return (
          <div key={i} title={`${p.estado} — ${new Date(p.fechaProgramada).toLocaleDateString("es-PE")}`}
            style={{ width:18, height:18, borderRadius:4, background:s?.bg, border:`1.5px solid ${s?.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:8, fontWeight:800, color:s?.text,
            }}>
            {s?.ico}
          </div>
        );
      })}
      {progs.length===0 && hasAlert && (
        <span style={{ fontSize:14 }} title="Alerta">🔔</span>
      )}
    </div>
  );
}

// ─── VISTA SEMANAL ────────────────────────────────────────────────────────────
function VistaSemanal({ guias, offset, today }) {
  const DAY_W = 42;
  const base  = startOfMonday(today);
  const start = addDays(base, offset * 7);
  const end   = addDays(start, 55); // 8 semanas
  const days  = useMemo(() => daysRange(start, end), [start.toISOString()]);

  // Grupos: semanas
  const groups = useMemo(() => {
    const wks = []; let cur = null;
    days.forEach(d => {
      const mon = startOfMonday(d);
      const k   = mon.toISOString();
      if (!cur || cur.key !== k) {
        const sun = addDays(mon,6);
        cur = {
          key: k,
          label: `${d.getDate()} ${MESES_C[d.getMonth()]} — ${sun.getDate()} ${MESES_C[sun.getMonth()]}`,
          span: 1,
        };
        wks.push(cur);
      } else cur.span++;
    });
    return wks;
  }, [days]);

  // Unidades: días
  const units = useMemo(() => days.map(d => ({
    key: d.toISOString(),
    label: String(d.getDate()),
    sub: DIAS_C[d.getDay()],
    isToday: sameDay(d, today),
    isWeekend: d.getDay()===0 || d.getDay()===6,
  })), [days]);

  const rows = useMemo(() => guias.map(g => {
    const byDay={}, alertDay={};
    g.programaciones?.forEach(p => {
      byDay[dayKey(new Date(p.fechaProgramada))] = p;
      if(p.fechaAlertaCalculada) {
        const k=dayKey(new Date(p.fechaAlertaCalculada));
        if(!byDay[k]) alertDay[k]=p;
      }
    });
    return {guia:g, byDay, alertDay};
  }), [guias]);

  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ display:"inline-block", minWidth: LEFT_W + days.length*DAY_W }}>
        <GanttHeader groups={groups} units={units} DAY_W={DAY_W} />
        {rows.map(({guia, byDay, alertDay}, idx) => (
          <div key={guia.id} style={{ display:"flex", borderBottom:"1px solid #f1f5f9", background:idx%2===0?"#fff":"#fafcfe" }}>
            <GuiaCell guia={guia} />
            {days.map(d => (
              <DayCell key={d.toISOString()} DAY_W={DAY_W}
                prog={byDay[dayKey(d)]} alert={alertDay[dayKey(d)]}
                isToday={sameDay(d,today)} isWeekend={d.getDay()===0||d.getDay()===6}
              />
            ))}
          </div>
        ))}
        {rows.length===0 && <EmptyRow />}
      </div>
    </div>
  );
}

// ─── VISTA MENSUAL ────────────────────────────────────────────────────────────
function VistaMensual({ guias, offset, today }) {
  const DAY_W = 30;
  const start = useMemo(() => new Date(today.getFullYear(), today.getMonth()+offset, 1), [offset]);
  const end   = useMemo(() => new Date(start.getFullYear(), start.getMonth()+4, 0), [start]);
  const days  = useMemo(() => daysRange(start, end), [start.toISOString()]);

  const groups = useMemo(() => {
    const grps=[]; let cur=null;
    days.forEach(d => {
      const k=monthKey(d);
      if(!cur||cur.key!==k){
        cur={key:k, label:`${MESES[d.getMonth()]} ${d.getFullYear()}`, span:1};
        grps.push(cur);
      } else cur.span++;
    });
    return grps;
  }, [days]);

  const units = useMemo(() => days.map(d => ({
    key: d.toISOString(),
    label: String(d.getDate()),
    sub: null,
    isToday: sameDay(d,today),
    isWeekend: d.getDay()===0||d.getDay()===6,
  })), [days]);

  const rows = useMemo(() => guias.map(g => {
    const byDay={}, alertDay={};
    g.programaciones?.forEach(p => {
      byDay[dayKey(new Date(p.fechaProgramada))]=p;
      if(p.fechaAlertaCalculada){
        const k=dayKey(new Date(p.fechaAlertaCalculada));
        if(!byDay[k]) alertDay[k]=p;
      }
    });
    return {guia:g,byDay,alertDay};
  }), [guias]);

  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ display:"inline-block", minWidth: LEFT_W + days.length*DAY_W }}>
        <GanttHeader groups={groups} units={units} DAY_W={DAY_W} />
        {rows.map(({guia,byDay,alertDay},idx) => (
          <div key={guia.id} style={{ display:"flex", borderBottom:"1px solid #f1f5f9", background:idx%2===0?"#fff":"#fafcfe" }}>
            <GuiaCell guia={guia} />
            {days.map(d => (
              <DayCell key={d.toISOString()} DAY_W={DAY_W}
                prog={byDay[dayKey(d)]} alert={alertDay[dayKey(d)]}
                isToday={sameDay(d,today)} isWeekend={d.getDay()===0||d.getDay()===6}
              />
            ))}
          </div>
        ))}
        {rows.length===0 && <EmptyRow />}
      </div>
    </div>
  );
}

// ─── VISTA ANUAL ──────────────────────────────────────────────────────────────
function VistaAnual({ guias, offset, today }) {
  const MONTH_W = 76;
  const year    = today.getFullYear() + offset;
  const months  = useMemo(() => Array.from({length:12},(_,i)=>new Date(year,i,1)), [year]);

  const groups = [{ key:"year", label:`Año ${year}`, span:12 }];
  const units  = months.map(m => ({
    key: m.toISOString(),
    label: MESES_C[m.getMonth()],
    sub: null,
    isToday: sameMonth(m,today),
    isWeekend: false,
  }));

  const rows = useMemo(() => guias.map(g => {
    const byMonth={}, alertMonth={};
    g.programaciones?.forEach(p => {
      const k=monthKey(new Date(p.fechaProgramada));
      if(!byMonth[k]) byMonth[k]=[];
      byMonth[k].push(p);
      if(p.fechaAlertaCalculada){
        const ak=monthKey(new Date(p.fechaAlertaCalculada));
        if(!byMonth[ak]) alertMonth[ak]=true;
      }
    });
    return {guia:g,byMonth,alertMonth};
  }), [guias]);

  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ display:"inline-block", minWidth: LEFT_W + 12*MONTH_W }}>
        <GanttHeader groups={groups} units={units} DAY_W={MONTH_W} unitWidth={MONTH_W} />
        {rows.map(({guia,byMonth,alertMonth},idx) => (
          <div key={guia.id} style={{ display:"flex", borderBottom:"1px solid #f1f5f9", background:idx%2===0?"#fff":"#fafcfe" }}>
            <GuiaCell guia={guia} />
            {months.map(m => (
              <MonthCell key={m.toISOString()} MONTH_W={MONTH_W}
                progs={byMonth[monthKey(m)]||[]}
                hasAlert={!!alertMonth[monthKey(m)]}
                isNow={sameMonth(m,today)}
              />
            ))}
          </div>
        ))}
        {rows.length===0 && <EmptyRow />}
      </div>
    </div>
  );
}

function EmptyRow() {
  return (
    <div style={{ padding:"40px 0", textAlign:"center", color:"#94a3b8", fontSize:13 }}>
      No hay guías para mostrar en este período
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function GanttGuias({ guias = [] }) {
  const today = useMemo(() => new Date(), []);
  const [zoom,   setZoom]   = useState("mensual");
  const [offset, setOffset] = useState(0);

  const navLabel = { semanal:"semana", mensual:"mes", anual:"año" };

  return (
    <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden", fontFamily:"system-ui,-apple-system,sans-serif" }}>

      {/* ── Toolbar ── */}
      <div style={{ padding:"12px 18px", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", background:"#fff" }}>

        {/* Zoom */}
        <div style={{ display:"flex", background:"#f1f5f9", borderRadius:9, padding:3 }}>
          {[["semanal","Semanal"],["mensual","Mensual"],["anual","Anual"]].map(([z,lbl]) => (
            <button key={z} onClick={() => { setZoom(z); setOffset(0); }}
              style={{ padding:"5px 16px", borderRadius:7, border:"none", fontSize:12, fontWeight:700, cursor:"pointer", transition:"all 0.15s",
                background: zoom===z ? "#fff" : "transparent",
                color:      zoom===z ? "#0f172a" : "#64748b",
                boxShadow:  zoom===z ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Navegación */}
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <button onClick={() => setOffset(o=>o-1)}
            style={{ width:32, height:32, borderRadius:8, border:"1.5px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:14, color:"#475569", display:"flex", alignItems:"center", justifyContent:"center" }}>
            ‹
          </button>
          <button onClick={() => setOffset(0)}
            style={{ padding:"5px 14px", borderRadius:8, border:"1.5px solid #3b82f6", background:"#eff6ff", fontSize:12, fontWeight:700, color:"#2563eb", cursor:"pointer" }}>
            Hoy
          </button>
          <button onClick={() => setOffset(o=>o+1)}
            style={{ width:32, height:32, borderRadius:8, border:"1.5px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:14, color:"#475569", display:"flex", alignItems:"center", justifyContent:"center" }}>
            ›
          </button>
          <span style={{ fontSize:11, color:"#94a3b8" }}>← {navLabel[zoom]} →</span>
        </div>

        {/* Leyenda */}
        <div style={{ display:"flex", gap:10, alignItems:"center", marginLeft:"auto", flexWrap:"wrap" }}>
          {Object.entries(ESTADO_STYLE).map(([k,s]) => (
            <span key={k} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#64748b" }}>
              <span style={{ width:14, height:14, borderRadius:4, background:s.bg, border:`1.5px solid ${s.border}`, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:8, color:s.text, fontWeight:800 }}>{s.ico}</span>
              {k.charAt(0)+k.slice(1).toLowerCase()}
            </span>
          ))}
          <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#64748b" }}>
            <span>🔔</span> Alerta
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      {zoom==="semanal" && <VistaSemanal guias={guias} offset={offset} today={today} />}
      {zoom==="mensual" && <VistaMensual guias={guias} offset={offset} today={today} />}
      {zoom==="anual"   && <VistaAnual   guias={guias} offset={offset} today={today} />}

      {/* ── Footer ── */}
      <div style={{ padding:"8px 18px", borderTop:"1px solid #f1f5f9", background:"#fafafa", display:"flex", justifyContent:"space-between", fontSize:11, color:"#94a3b8" }}>
        <span>{guias.length} guía{guias.length!==1?"s":""}</span>
        <span>N° Alerta · OV · Producto · Plan · Periodo</span>
      </div>
    </div>
  );
}
