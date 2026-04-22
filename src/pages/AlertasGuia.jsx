import { useCallback, useEffect, useMemo, useState } from "react";
import {
  obtenerAvisosOrigenGuia,
  actualizarEstadoAviso,
} from "../features/mantenimiento/services/avisoServices";
import { crearOrdenTrabajo } from "../features/mantenimiento/services/ordenTrabajoService";
import { guiaMantenimientoService } from "../features/GuiaMantenimiento/services/guiaMantenimientoService";
import socket from "../services/socket";

// Modales del flujo
import ModalMantenimientoView from "../features/mantenimiento/modals/ModalMantenimientoView";
import ModalTratamiento from "../components/inputs/ModalTratamiento";
import ModalOTGrupal from "../features/OrdenTrabajo/Modalotgrupal";

import {
  RefreshCw, Search, X, Bell, Wrench, ClipboardCheck,
  Ban, CheckCircle2, Wallet, Package, Calendar,
  AlertTriangle, Zap, Clock, ChevronRight,
} from "lucide-react";

// ─── MAPAS DE ESTADO ──────────────────────────────────────────────────────────
// "facturado" no aplica para guías preventivas
const ESTADOS_AVISO = [
  "creado",
  "tratado",
  "con OT",
  "rechazado",
  "finalizado",
  "finalizado sin facturacion",
];

const ESTADO_KEY_MAP = {
  creado:                       "CREADO",
  tratado:                      "TRATADO",
  "con OT":                     "CON_OT",
  rechazado:                    "RECHAZADO",
  finalizado:                   "FINALIZADO",
  "finalizado sin facturacion": "FINALIZADO_SIN_FACTURACION",
};
const ESTADO_BACK_MAP = Object.fromEntries(
  Object.entries(ESTADO_KEY_MAP).map(([k, v]) => [v, k])
);

const ESTADOS_CFG = {
  creado:                       { label: "Creado",      gradient: "from-slate-600 to-slate-700",     chip: "bg-slate-100 text-slate-700 border-slate-200",       icon: Bell },
  tratado:                      { label: "Tratado",     gradient: "from-blue-600 to-blue-700",       chip: "bg-blue-50 text-blue-700 border-blue-200",           icon: ClipboardCheck },
  "con OT":                     { label: "Con OT",      gradient: "from-indigo-600 to-indigo-700",   chip: "bg-indigo-50 text-indigo-700 border-indigo-200",     icon: Wrench },
  rechazado:                    { label: "Rechazado",   gradient: "from-red-700 to-red-800",         chip: "bg-red-50 text-red-700 border-red-200",             icon: Ban },
  finalizado:                   { label: "Finalizado",  gradient: "from-emerald-600 to-emerald-700", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  "finalizado sin facturacion": { label: "Sin fact.",   gradient: "from-amber-600 to-amber-700",     chip: "bg-amber-50 text-amber-800 border-amber-200",       icon: Wallet },
};

const PRIORIDAD_CFG = {
  Alta:  { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500" },
  Media: { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200", dot: "bg-yellow-500" },
  Baja:  { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  dot: "bg-green-500" },
};

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "America/Lima",
  }) : "—";

const norm = (estado) => (ESTADOS_AVISO.includes(estado) ? estado : "creado");

// ─── RELOJ PERÚ ───────────────────────────────────────────────────────────────
function RelojPeru() {
  const [hora, setHora] = useState("");
  useEffect(() => {
    const tick = () => setHora(
      new Date().toLocaleString("es-PE", {
        weekday: "short", day: "2-digit", month: "short",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        timeZone: "America/Lima",
      })
    );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-mono">
      <Clock size={12} className="text-slate-400" />
      <span>{hora}</span>
      <span className="text-[10px] text-slate-400 font-bold">PE</span>
    </div>
  );
}

// ─── CARD ──────────────────────────────────────────────────────────────────────
function AvisoCard({ aviso, onClick, onCambiarEstado, onTratamiento }) {
  const estado  = norm(aviso.estadoAviso);
  const p       = PRIORIDAD_CFG[aviso.prioridad] || PRIORIDAD_CFG.Baja;
  const equipo  = aviso.equiposRelacion?.[0]?.equipo;
  const cfg     = ESTADOS_CFG[estado];

  const stopAndRun = (e, fn) => { e.stopPropagation(); fn(); };

  const renderAcciones = () => {
    if (estado === "creado") return (
      <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-100">
        <button
          onClick={(e) => stopAndRun(e, () => onTratamiento(aviso))}
          className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition"
        >
          Tratar
        </button>
        <button
          onClick={(e) => stopAndRun(e, () => onCambiarEstado(aviso, "RECHAZADO"))}
          className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold rounded-lg transition"
        >
          Rechazar
        </button>
      </div>
    );
    if (estado === "tratado") return (
      <div className="mt-2 pt-2 border-t border-slate-100">
        <button
          onClick={(e) => stopAndRun(e, () => onCambiarEstado(aviso, "CON_OT"))}
          className="w-full py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold rounded-lg transition"
        >
          Generar OT
        </button>
      </div>
    );
    if (estado === "con OT") return (
      <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-100">
        <button
          onClick={(e) => stopAndRun(e, () => onCambiarEstado(aviso, "FINALIZADO"))}
          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition"
        >
          Finalizar
        </button>
        <button
          onClick={(e) => stopAndRun(e, () => onCambiarEstado(aviso, "FINALIZADO_SIN_FACTURACION"))}
          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-bold rounded-lg transition"
        >
          Sin fact.
        </button>
      </div>
    );
    return null;
  };

  return (
    <button
      onClick={() => onClick(aviso)}
      className="w-full text-left rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 hover:border-slate-300 transition group"
    >
      <div className={`h-1.5 w-full bg-gradient-to-r ${cfg?.gradient}`} />
      <div className="p-4 space-y-3">

        {/* header */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-slate-500 truncate">{aviso.numeroAviso}</span>
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.bg} ${p.text} ${p.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
            {aviso.prioridad}
          </span>
        </div>

        {/* descripcion */}
        <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
          {aviso.descripcionResumida || aviso.descripcion || "Sin descripción"}
        </p>

        {/* equipo */}
        {equipo && (
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
            <Package size={12} className="text-slate-500 shrink-0" />
            <p className="text-xs font-semibold text-slate-800 truncate">{equipo.nombre}</p>
          </div>
        )}

        {/* período guía */}
        {aviso.guiaMantenimiento?.periodo && (
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5">
            <Clock size={10} className="text-orange-500 shrink-0" />
            <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">
              {aviso.guiaMantenimiento.periodo.replace(/_/g, " ")}
            </span>
            <span className="text-[10px] text-orange-500 ml-auto">Preventivo</span>
          </div>
        )}

        {/* fecha + OV */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-xl p-2 border border-slate-200">
            <p className="text-[9px] text-slate-500 uppercase font-black mb-0.5 flex items-center gap-1">
              <Calendar size={9} /> Fecha
            </p>
            <p className="text-[11px] font-semibold text-slate-800">{fmt(aviso.fechaAtencion)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 border border-slate-200">
            <p className="text-[9px] text-slate-500 uppercase font-black mb-0.5">OV</p>
            <p className="text-[11px] font-semibold text-slate-800 truncate">{aviso.ordenVenta || "—"}</p>
          </div>
        </div>

        {/* estado chip + abrir */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${cfg?.chip}`}>
            {cfg?.label}
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 group-hover:text-blue-600 transition">
            Ver detalle <ChevronRight size={11} />
          </span>
        </div>

        {/* acciones inline */}
        {renderAcciones()}
      </div>
    </button>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function AlertasGuiaPage() {
  // Datos
  const [avisos, setAvisos]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [q, setQ]                     = useState("");
  const [toast, setToast]             = useState(null);
  const [disparando, setDisparando]   = useState(false);
  const [lastDisparo, setLastDisparo] = useState(null);


  // Modal detalle aviso
  const [viewOpen, setViewOpen]     = useState(false);
  const [viewData, setViewData]     = useState(null);
  const [viewStep, setViewStep]     = useState(1);

  // Modal tratamiento
  const [tratamientoOpen, setTratamientoOpen]   = useState(false);
  const [avisoTratamiento, setAvisoTratamiento] = useState(null);

  // Modal OT (siempre grupal)
  const [avisoOrdenTrabajo, setAvisoOrdenTrabajo] = useState(null);
  const [modalGrupalOT, setModalGrupalOT]         = useState(false);

  // Cuando se setea avisoOrdenTrabajo, abre directo el modal grupal
  useEffect(() => {
    if (avisoOrdenTrabajo) setModalGrupalOT(true);
  }, [avisoOrdenTrabajo]);

  // ─── Cargar datos ─────────────────────────────────────────────────────────
  const cargar = useCallback(async (silencioso = false) => {
    try {
      silencioso ? setRefreshing(true) : setLoading(true);
      const data = await obtenerAvisosOrigenGuia();
      setAvisos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Socket: auto-actualiza cuando el cron crea nuevas alertas
  useEffect(() => {
    const handler = ({ count }) => {
      setToast(`🔔 ${count} nueva${count !== 1 ? "s" : ""} alerta${count !== 1 ? "s" : ""} de guía`);
      cargar(true);
      setTimeout(() => setToast(null), 5000);
    };
    socket.on("nuevas_alertas_guia", handler);
    return () => socket.off("nuevas_alertas_guia", handler);
  }, [cargar]);

  // ─── Disparo manual del cron ──────────────────────────────────────────────
  const handleDispararAlertas = useCallback(async () => {
    try {
      setDisparando(true);
      await guiaMantenimientoService.marcarVencidas();
      const result = await guiaMantenimientoService.dispararAlertas();
      const hora = new Date().toLocaleString("es-PE", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        timeZone: "America/Lima",
      });
      setLastDisparo({ hora, creados: result?.avisosCreados ?? 0 });
      await cargar(true);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Error al disparar alertas");
    } finally {
      setDisparando(false);
    }
  }, [cargar]);

  // ─── Abrir detalle de aviso ───────────────────────────────────────────────
  const handleAbrirAviso = useCallback((aviso) => {
    const estadoReal = ESTADO_KEY_MAP[aviso.estadoAviso] || aviso.estadoAviso?.toUpperCase() || "CREADO";
    setViewData({ ...aviso, _estadoReal: estadoReal });
    setViewStep(1);
    setViewOpen(true);
  }, []);

  // ─── cambiarEstado (igual que useMantenimiento) ───────────────────────────
  const cambiarEstado = useCallback(async (aviso, nuevoEstadoFront) => {
    if (nuevoEstadoFront === "CON_OT") {
      setAvisoOrdenTrabajo(aviso);
      return;
    }
    const estadoBack = ESTADO_BACK_MAP[nuevoEstadoFront];
    if (!estadoBack) return;
    await actualizarEstadoAviso(aviso.id, estadoBack);
    await cargar(true);
    setViewOpen(false);
    setViewData(null);
  }, [cargar]);

  // ─── Tratamiento ──────────────────────────────────────────────────────────
  const abrirTratamiento = useCallback((aviso) => {
    setAvisoTratamiento(aviso);
    setTratamientoOpen(true);
  }, []);

  const guardarTratamiento = useCallback(async () => {
    await cargar(true);
    setTratamientoOpen(false);
    setAvisoTratamiento(null);
    setViewOpen(false);
    setViewData(null);
  }, [cargar]);

  // ─── Orden de Trabajo ─────────────────────────────────────────────────────
  const cerrarModalOT = useCallback(() => {
    setModalGrupalOT(false);
    setAvisoOrdenTrabajo(null);
  }, []);

  const guardarOrdenTrabajo = useCallback(async (payload) => {
    await crearOrdenTrabajo(payload);
    setAvisoOrdenTrabajo(null);
    await cargar(true);
    setViewOpen(false);
    setViewData(null);
  }, [cargar]);

  const generarNumeroOT = () => `OT-${Date.now().toString().slice(-6)}`;

  // ─── Filtros y columnas ───────────────────────────────────────────────────
  const avisosFiltrados = useMemo(() => {
    const txt = q.trim().toLowerCase();
    if (!txt) return avisos;
    return avisos.filter((a) =>
      [a.numeroAviso, a.descripcion, a.descripcionResumida, a.ordenVenta, a.prioridad]
        .filter(Boolean).join(" ").toLowerCase().includes(txt)
    );
  }, [avisos, q]);

  const columns = useMemo(() => {
    const cols = {};
    ESTADOS_AVISO.forEach((k) => (cols[k] = []));
    avisosFiltrados.forEach((a) => {
      const e = norm(a.estadoAviso);
      (cols[e] || cols.creado).push(a);
    });
    return cols;
  }, [avisosFiltrados]);

  const statsChips = useMemo(() => [
    { key: "total",  label: "Total",         value: avisos.length,                                          tone: "text-slate-900" },
    { key: "nuevos", label: "Sin tratar",     value: avisos.filter(a => a.estadoAviso === "creado").length,  tone: "text-red-700" },
    { key: "alta",   label: "Alta prioridad", value: avisos.filter(a => a.prioridad === "Alta").length,      tone: "text-orange-700" },
    ...ESTADOS_AVISO.map(e => ({
      key:   `e-${e}`,
      label: ESTADOS_CFG[e]?.label || e,
      value: avisos.filter(a => norm(a.estadoAviso) === e).length,
      tone:  "text-slate-700",
    })),
  ], [avisos]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
          <p className="text-slate-600 font-semibold">Cargando alertas…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden" style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 space-y-3">

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-200">
              <Bell size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none flex items-center gap-2 flex-wrap">
                Alertas de Mantenimiento
                {avisos.filter(a => a.estadoAviso === "creado").length > 0 && (
                  <span className="text-sm font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                    {avisos.filter(a => a.estadoAviso === "creado").length} nuevas
                  </span>
                )}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">Avisos preventivos generados automáticamente desde guías</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <RelojPeru />
            <button
              onClick={handleDispararAlertas}
              disabled={disparando}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-60 text-white text-sm font-bold shadow-md shadow-orange-200 transition"
              title="Ejecuta el cron de alertas manualmente"
            >
              <Zap size={15} className={disparando ? "animate-bounce" : ""} />
              {disparando ? "Creando avisos…" : "▶ Ejecutar cron"}
            </button>
            <button
              onClick={() => cargar(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold border border-slate-200 transition"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>
        </div>

        {/* resultado último disparo */}
        {lastDisparo && (
          <div className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-xl">
            <Zap size={12} />
            <span>Último disparo: <strong>{lastDisparo.hora} PE</strong> — avisos creados: <strong>{lastDisparo.creados}</strong></span>
            <button onClick={() => setLastDisparo(null)} className="ml-auto"><X size={12} /></button>
          </div>
        )}

        {/* stats */}
        <div className="flex flex-wrap gap-2">
          {statsChips.map((s) => (
            <div key={s.key} className="bg-white rounded-xl px-3 py-2 border border-slate-200 min-w-[72px]">
              <p className={`text-base font-black leading-none ${s.tone}`}>{s.value}</p>
              <p className="text-slate-500 text-[9px] uppercase tracking-wide mt-0.5 font-bold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por N° aviso, OV, descripción…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/25 focus:border-orange-400 transition"
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* toast socket */}
      {toast && (
        <div className="shrink-0 mx-6 mt-3 flex items-center gap-3 bg-orange-500 text-white px-4 py-3 rounded-2xl shadow-lg shadow-orange-200">
          <Bell size={16} className="shrink-0 animate-bounce" />
          <span className="text-sm font-bold flex-1">{toast}</span>
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      {/* ── KANBAN ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {ESTADOS_AVISO.map((estadoKey) => {
            const cfg   = ESTADOS_CFG[estadoKey];
            const Icon  = cfg?.icon || Bell;
            const items = columns[estadoKey] || [];

            return (
              <div key={estadoKey} className="flex flex-col rounded-2xl border border-slate-200 overflow-hidden bg-white shadow">
                <div className={`bg-gradient-to-r ${cfg?.gradient} px-4 py-3.5 shrink-0`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Icon size={16} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-white text-sm leading-none truncate">{cfg?.label}</p>
                        <p className="text-white/70 text-[10px] mt-0.5">{items.length} aviso{items.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <span className="bg-white/20 text-white text-xs font-black px-2.5 py-0.5 rounded-full shrink-0">{items.length}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/50">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3">
                        <Bell size={22} className="opacity-30" />
                      </div>
                      <p className="text-xs font-semibold">Sin alertas</p>
                    </div>
                  ) : (
                    items.map((a) => (
                      <AvisoCard
                        key={a.id}
                        aviso={a}
                        onClick={handleAbrirAviso}
                        onCambiarEstado={cambiarEstado}
                        onTratamiento={abrirTratamiento}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODALES ────────────────────────────────────────────────────────── */}

      {/* Ver aviso + flujo (Tratado, Con OT, Rechazar, etc.) */}
      <ModalMantenimientoView
        isOpen={viewOpen}
        data={viewData}
        wizardStep={viewStep}
        setWizardStep={setViewStep}
        onClose={() => { setViewOpen(false); setViewData(null); }}
        cambiarEstado={cambiarEstado}
        abrirTratamiento={abrirTratamiento}
      />

      {/* Tratamiento */}
      <ModalTratamiento
        isOpen={tratamientoOpen}
        aviso={avisoTratamiento}
        onClose={() => { setTratamientoOpen(false); setAvisoTratamiento(null); }}
        onSuccess={guardarTratamiento}
        autoSelectPlanId={avisoTratamiento?.guiaMantenimiento?.planMantenimientoId}
      />

      {/* OT — siempre grupal */}
      <ModalOTGrupal
        isOpen={modalGrupalOT}
        onClose={cerrarModalOT}
        aviso={avisoOrdenTrabajo}
        onGuardar={async (payload) => {
          await guardarOrdenTrabajo(payload);
          cerrarModalOT();
        }}
        onGenerarNumeroOT={generarNumeroOT}
      />
    </div>
  );
}
