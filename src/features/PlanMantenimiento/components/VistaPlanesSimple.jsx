import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Loader2, AlertCircle, Paperclip, X, ExternalLink, Package } from "lucide-react";
import { planMantenimientoService } from "../../PlanMantenimiento/services/planMantenimientoService";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const val = (x) => (x === null || x === undefined || x === "" ? "—" : String(x));
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("es-PE"); } catch { return val(d); } };
const pickArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.planes)) return res.planes;
  return [];
};

// ─── BADGE ───────────────────────────────────────────────────────────────────
const BADGE_MAP = {
  PREVENTIVO: "bg-blue-100 text-blue-700 border-blue-200",
  CORRECTIVO: "bg-red-100 text-red-700 border-red-200",
  PREDICTIVO: "bg-violet-100 text-violet-700 border-violet-200",
  LIMPIEZA:   "bg-cyan-100 text-cyan-700 border-cyan-200",
  REVISION:   "bg-violet-100 text-violet-700 border-violet-200",
  INSPECCION: "bg-yellow-100 text-yellow-700 border-yellow-200",
  TRIMESTRAL: "bg-indigo-100 text-indigo-700 border-indigo-200",
  MENSUAL:    "bg-teal-100 text-teal-700 border-teal-200",
  ANUAL:      "bg-purple-100 text-purple-700 border-purple-200",
  POR_HORAS:  "bg-orange-100 text-orange-700 border-orange-200",
  CHECKLIST:  "bg-amber-100 text-amber-700 border-amber-200",
  INFORME:    "bg-slate-100 text-slate-600 border-slate-200",
  MANO_OBRA:  "bg-orange-100 text-orange-700 border-orange-200",
  MATERIAL:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  SERVICIO:   "bg-purple-100 text-purple-700 border-purple-200",
};
function Badge({ label }) {
  if (!label || label === "—") return <span className="text-gray-300 text-[10px]">—</span>;
  const cls = BADGE_MAP[label] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${cls} whitespace-nowrap`}>{label}</span>;
}

// ─── MODAL ITEMS ─────────────────────────────────────────────────────────────
function ModalItems({ items, titulo, onClose }) {
  const rc = {
    MANO_OBRA: "bg-orange-100 text-orange-700 border-orange-200",
    MATERIAL:  "bg-emerald-100 text-emerald-700 border-emerald-200",
    SERVICIO:  "bg-purple-100 text-purple-700 border-purple-200",
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-teal-700 to-teal-600">
          <div className="flex items-center gap-2 text-white">
            <Package className="w-4 h-4 opacity-80" />
            <div>
              <p className="text-xs font-bold">Ítems / Recursos</p>
              <p className="text-[10px] text-teal-200">{titulo} · {items.length} ítem{items.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-teal-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto max-h-[420px] divide-y divide-gray-100">
          {items.map((it) => (
            <div key={it.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {it.recurso && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${rc[it.recurso] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>{it.recurso}</span>}
                    <span className="font-mono text-[10px] text-gray-400">{val(it.itemCode)}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{val(it.item || it.description)}</p>
                  {it.observacion && <p className="text-[10px] text-gray-400 mt-0.5 italic">{it.observacion}</p>}
                </div>
                <div className="text-right flex-none">
                  <p className="text-sm font-black text-gray-900">{val(it.cantidad ?? it.quantity)}</p>
                  <p className="text-[10px] text-gray-400">{val(it.unidad)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-1.5">
                {it.warehouseCode  && <MiniChip l="WH"      v={it.warehouseCode} />}
                {it.costingCode    && <MiniChip l="CC"      v={it.costingCode} />}
                {it.projectCode    && <MiniChip l="PRJ"     v={it.projectCode} />}
                {it.rubro          && <MiniChip l="Rubro"   v={it.rubro} />}
                {it.paqueteTrabajo && <MiniChip l="Paquete" v={it.paqueteTrabajo} />}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL ADJUNTOS ──────────────────────────────────────────────────────────
function ModalAdjuntos({ adjuntos, titulo, onClose }) {
  const icon = (ext) => ({ pdf: "📄", xlsx: "📊", xls: "📊", png: "🖼️", jpg: "🖼️", jpeg: "🖼️" }[ext] ?? "📎");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-700">
          <div className="flex items-center gap-2 text-white">
            <Paperclip className="w-4 h-4 opacity-70" />
            <div>
              <p className="text-xs font-bold">Adjuntos</p>
              <p className="text-[10px] text-slate-400">{titulo} · {adjuntos.length} archivo{adjuntos.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto">
          {adjuntos.map((ad) => (
            <div key={ad.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 group transition-colors">
              <span className="text-2xl">{icon(ad.extension)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{ad.nombre}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge label={ad.categoria} />
                  <span className="text-[10px] text-gray-400 uppercase font-mono">.{ad.extension}</span>
                </div>
              </div>
              {ad.url && (
                <a href={ad.url} target="_blank" rel="noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700">
                  <ExternalLink className="w-3 h-3" /> Abrir
                </a>
              )}
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function MiniChip({ l, v: value }) {
  return <span className="text-[10px] text-gray-500"><span className="font-bold text-gray-400">{l}: </span>{value}</span>;
}

function ActionBtn({ icon: Icon, count, color, label, onClick }) {
  if (!count) return <span className="text-gray-300 text-[10px]">—</span>;
  const c = { teal: "bg-teal-600 hover:bg-teal-700", rose: "bg-rose-600 hover:bg-rose-700" };
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md ${c[color]} text-white text-[10px] font-bold transition-colors shadow-sm whitespace-nowrap`}>
      <Icon className="w-3 h-3" />{count} {label}
    </button>
  );
}

// ─── COLUMNAS DE ACTIVIDADES ──────────────────────────────────────────────────
const ACT_COLS = [
  { label: "#",                key: "num",          cls: "w-10  text-center" },
  { label: "Código Actividad", key: "codigo",       cls: "w-44"              },
  { label: "Sistema",          key: "sistema",      cls: "w-32"              },
  { label: "Subsistema",       key: "subsistema",   cls: "w-32"              },
  { label: "Componente",       key: "componente",   cls: "w-36"              },
  { label: "Tarea",            key: "tarea",        cls: "w-64"              },
  { label: "Tipo Trabajo",     key: "tipoTrabajo",  cls: "w-32"              },
  { label: "Rol Técnico",      key: "rolTecnico",   cls: "w-36"              },
  { label: "Duración",         key: "duracion",     cls: "w-28 text-center"  },
  { label: "Cant. Técnicos",   key: "cantTec",      cls: "w-28 text-center"  },
  { label: "Ítems",            key: "items",        cls: "w-28 text-center"  },
  { label: "Adjuntos",         key: "adjuntos",     cls: "w-28 text-center"  },
];

// ─── FILA CABECERA DEL PLAN (gris claro) ─────────────────────────────────────
function PlanHeaderRow({ plan, colCount, onItems, onAdjuntos }) {
  const equipo  = (plan.equipos  || [])[0];
  const adjPlan = plan.adjuntos  || [];
  const itPlan  = plan.items     || [];

  return (
    <tr className="border-t-[3px] border-gray-400">
      <td colSpan={colCount} className="bg-gray-100 border-b border-gray-300 px-4 py-3">
        <div className="flex items-center gap-x-5 gap-y-2 flex-wrap">

          {/* badge + código + nombre */}
          <div className="flex items-center gap-2 flex-none">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-gray-500 text-white tracking-widest uppercase">
              Plan
            </span>
            <span className="font-mono font-black text-gray-800 text-sm tracking-wide">{plan.codigoPlan}</span>
            <span className="text-gray-400">—</span>
            <span className="text-gray-700 font-semibold text-xs">{plan.nombre}</span>
          </div>

          <div className="w-px h-5 bg-gray-300 flex-none" />

          {/* campos plan */}
          <PlanField label="Tipo"        value={<Badge label={plan.tipo} />} />
          <PlanField label="Frecuencia"  value={
            plan.frecuenciaHoras
              ? <span className="font-mono font-bold text-orange-600 text-xs">{plan.frecuenciaHoras} hrs</span>
              : <Badge label={plan.frecuencia} />
          } />
          {plan.frecuenciaHoras && (
            <PlanField label="Frec. Horas" value={<span className="font-mono text-orange-600 font-bold text-xs">{plan.frecuenciaHoras} h</span>} />
          )}
          <PlanField label="Tipo Equipo"  value={<span className="text-gray-700 text-xs">{val(plan.tipoEquipo)}</span>} />
          <PlanField label="Modelo"       value={<span className="text-gray-700 text-xs">{val(plan.modeloEquipo)}</span>} />
          {equipo && (
            <PlanField label="Equipo Obj." value={<span className="text-gray-700 text-xs">{equipo.codigo} — {equipo.nombre}</span>} />
          )}
          <PlanField label="Específico" value={
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${plan.esEspecifico ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"}`}>
              {plan.esEspecifico ? "Sí" : "No"}
            </span>
          } />
          <PlanField label="Activo" value={
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${plan.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {plan.activo ? "Activo" : "Inactivo"}
            </span>
          } />
          <PlanField label="Creado" value={<span className="text-gray-600 text-xs">{fmtDate(plan.createdAt)}</span>} />

          {/* botones del plan */}
          {(itPlan.length > 0 || adjPlan.length > 0) && (
            <>
              <div className="w-px h-5 bg-gray-300 flex-none" />
              <div className="flex items-center gap-2 flex-none">
                {itPlan.length > 0 && (
                  <button onClick={() => onItems(itPlan, plan.codigoPlan)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-bold border border-teal-200 transition-colors">
                    <Package className="w-3 h-3" />{itPlan.length} ítems del plan
                  </button>
                )}
                {adjPlan.length > 0 && (
                  <button onClick={() => onAdjuntos(adjPlan, plan.codigoPlan)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200 transition-colors">
                    <Paperclip className="w-3 h-3" />{adjPlan.length} adjuntos del plan
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function PlanField({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 flex-none">
      <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider leading-none">{label}</span>
      <span className="leading-tight">{value}</span>
    </div>
  );
}

// ─── FILA DE CABECERAS DE ACTIVIDADES (por plan) ──────────────────────────────
function ActColHeaders() {
  return (
    <tr>
      {ACT_COLS.map(({ label, cls }) => (
        <td key={label}
          className={`px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-b border-gray-200 bg-gray-50 whitespace-nowrap ${cls}`}>
          {label}
        </td>
      ))}
    </tr>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function PlanMantenimientoExcelPage() {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [modalItems,    setModalItems]    = useState(null);
  const [modalAdjuntos, setModalAdjuntos] = useState(null);

  const fetchPlanes = async () => {
    setLoading(true); setError(null);
    try {
      const res = await planMantenimientoService.getPlanes();
      setPlanes(pickArray(res));
    } catch (e) {
      console.error(e);
      setError("Error al cargar los planes de mantenimiento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlanes(); }, []);

  const planesFiltrados = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return planes;
    return planes.filter((p) => {
      const blob = [
        p.codigoPlan, p.nombre, p.tipo, p.frecuencia, p.tipoEquipo, p.modeloEquipo,
        ...(p.actividades || []).flatMap(a => [a.codigoActividad, a.sistema, a.subsistema, a.componente, a.tarea, a.tipoTrabajo, a.rolTecnico]),
        ...(p.equipos || []).flatMap(eq => [eq.codigo, eq.nombre]),
      ].map(x => String(x ?? "").toLowerCase()).join(" ");
      return blob.includes(query);
    });
  }, [planes, q]);

  const totalActs = planesFiltrados.reduce((s, p) => s + (p.actividades || []).length, 0);
  const COL_COUNT = ACT_COLS.length;

  if (loading && planes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 font-medium">Cargando planes…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100" style={{ fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif" }}>

      {/* TOPBAR */}
      <div className="flex-none flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div>
          <h1 className="text-sm font-extrabold text-gray-900 tracking-tight">Planes de Mantenimiento</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">
            <span className="font-semibold text-gray-700">{planesFiltrados.length}</span> planes ·{" "}
            <span className="font-semibold text-gray-700">{totalActs}</span> actividades
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Buscar plan, actividad…"
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 w-56" />
          </div>
          <button onClick={fetchPlanes} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="flex-none mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-none" />
          <span className="flex-1">{error}</span>
          <button onClick={fetchPlanes} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Reintentar</button>
        </div>
      )}

      {/* TABLE */}
      <div className="flex-1 overflow-auto p-3">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="border-collapse text-xs" style={{ minWidth: 1200 }}>
              <tbody>
                {planesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={COL_COUNT} className="py-20 text-center text-gray-400 text-sm">
                      {q ? `Sin resultados para "${q}"` : "No hay planes de mantenimiento."}
                    </td>
                  </tr>
                ) : (
                  planesFiltrados.map((plan) => {
                    const actividades = plan.actividades || [];
                    return [
                      // 1️⃣ FILA PLAN (gris, todos sus campos)
                      <PlanHeaderRow
                        key={`plan-${plan.id}`}
                        plan={plan}
                        colCount={COL_COUNT}
                        onItems={(items, t)  => setModalItems({ items, titulo: t })}
                        onAdjuntos={(adj, t) => setModalAdjuntos({ adjuntos: adj, titulo: t })}
                      />,

                      // 2️⃣ FILA CABECERAS DE COLUMNAS (propia de este plan)
                      <ActColHeaders key={`cols-${plan.id}`} />,

                      // 3️⃣ FILAS DE ACTIVIDADES
                      ...(actividades.length === 0
                        ? [
                            <tr key={`${plan.id}-noact`}>
                              <td colSpan={COL_COUNT}
                                className="px-6 py-3 text-[11px] text-gray-400 italic border-b border-gray-100 bg-gray-50/50">
                                Sin actividades registradas
                              </td>
                            </tr>,
                          ]
                        : actividades.map((a, ai) => {
                            const isEven   = ai % 2 === 0;
                            const items    = a.items    || [];
                            const adjuntos = a.adjuntos || [];
                            return (
                              <tr key={a.id}
                                className={`${isEven ? "bg-white" : "bg-gray-50/60"} hover:bg-indigo-50/40 transition-colors border-b border-gray-100`}>

                                {/* # */}
                                <td className="px-3 py-2.5 text-center text-[10px] text-gray-400 font-mono border-r border-gray-100">
                                  {ai + 1}
                                </td>
                                {/* código actividad */}
                                <td className="px-3 py-2.5 border-r border-gray-100">
                                  <span className="font-mono text-[11px] font-bold text-indigo-600">{val(a.codigoActividad)}</span>
                                </td>
                                {/* sistema */}
                                <td className="px-3 py-2.5 text-xs text-gray-700 border-r border-gray-100 whitespace-nowrap">{val(a.sistema)}</td>
                                {/* subsistema */}
                                <td className="px-3 py-2.5 text-xs text-gray-700 border-r border-gray-100 whitespace-nowrap">{val(a.subsistema)}</td>
                                {/* componente */}
                                <td className="px-3 py-2.5 text-xs text-gray-700 border-r border-gray-100 whitespace-nowrap">{val(a.componente)}</td>
                                {/* tarea */}
                                <td className="px-3 py-2.5 border-r border-gray-100">
                                  <span className="text-xs font-semibold text-gray-900">{val(a.tarea)}</span>
                                </td>
                                {/* tipo trabajo */}
                                <td className="px-3 py-2.5 border-r border-gray-100 whitespace-nowrap">
                                  <Badge label={a.tipoTrabajo} />
                                </td>
                                {/* rol técnico */}
                                <td className="px-3 py-2.5 text-xs text-gray-600 border-r border-gray-100 whitespace-nowrap">{val(a.rolTecnico)}</td>
                                {/* duración */}
                                <td className="px-3 py-2.5 text-center border-r border-gray-100 whitespace-nowrap">
                                  <span className="font-mono font-semibold text-gray-800 text-xs">
                                    {val(a.duracionMinutos)}
                                    <span className="text-gray-400 font-normal text-[10px] ml-0.5">{val(a.unidadDuracion)}</span>
                                  </span>
                                </td>
                                {/* cant. técnicos */}
                                <td className="px-3 py-2.5 text-center text-xs text-gray-700 border-r border-gray-100">
                                  {a.cantidadTecnicos ?? "—"}
                                </td>
                                {/* ítems */}
                                <td className="px-3 py-2.5 text-center border-r border-gray-100">
                                  <ActionBtn
                                    icon={Package} count={items.length} color="teal"
                                    label={items.length === 1 ? "ítem" : "ítems"}
                                    onClick={() => setModalItems({ items, titulo: a.codigoActividad })}
                                  />
                                </td>
                                {/* adjuntos */}
                                <td className="px-3 py-2.5 text-center">
                                  <ActionBtn
                                    icon={Paperclip} count={adjuntos.length} color="rose"
                                    label="adj."
                                    onClick={() => setModalAdjuntos({ adjuntos, titulo: a.codigoActividad })}
                                  />
                                </td>
                              </tr>
                            );
                          })
                      ),

                      // 4️⃣ ESPACIADOR entre planes
                      <tr key={`gap-${plan.id}`}>
                        <td colSpan={COL_COUNT} className="py-1 bg-gray-200/60" />
                      </tr>,
                    ];
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* footer */}
          <div className="flex-none px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <span>
              <span className="font-semibold text-gray-700">{planesFiltrados.length}</span> planes ·{" "}
              <span className="font-semibold text-gray-700">{totalActs}</span> actividades
            </span>
            <span>Scroll horizontal disponible →</span>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {modalItems    && <ModalItems    {...modalItems}    onClose={() => setModalItems(null)} />}
      {modalAdjuntos && <ModalAdjuntos {...modalAdjuntos} onClose={() => setModalAdjuntos(null)} />}
    </div>
  );
}