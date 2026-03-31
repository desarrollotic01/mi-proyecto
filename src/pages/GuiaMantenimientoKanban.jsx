/**
 * GuiasMantenimientoKanban.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ Kanban BLANCO (Light UI)
 * ✅ Filtro Custom Premium (Sin <select> nativo)
 * 🚩 Consume EXCLUSIVAMENTE de avisosService.js -> obtenerAvisos() (/Avisos/)
 */

import { useCallback, useEffect, useMemo, useState } from "react";
// ✅ IMPORTACIÓN ESTRICTA DEL SERVICE
import { obtenerAvisos, actualizarEstadoAviso } from "../features/mantenimiento/services/avisoServices";
import {
  LayoutGrid, Search, RefreshCw, Filter, ChevronDown, X, Package, Wrench,
  ClipboardCheck, FileText, Ban, CheckCircle2, Wallet, ArrowLeft, ArrowRight,
  Eye, Calendar, Hash, User, MapPin, Layers,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// MAPEOS DE ESTADO (FRONTEND <-> BACKEND)
// ─────────────────────────────────────────────────────────────────────────────
const MAP_API_A_UI = {
  "CREADO": "creado",
  "TRATADO": "tratado",
  "CON_OT": "con OT",
  "FINALIZADO": "finalizado",
  "FINALIZADO_SIN_FACTURACION": "finalizado sin facturacion",
  "RECHAZADO": "rechazado"
};

const MAP_UI_A_API = {
  "creado": "CREADO",
  "tratado": "TRATADO",
  "con OT": "CON_OT",
  "finalizado": "FINALIZADO",
  "finalizado sin facturacion": "FINALIZADO_SIN_FACTURACION",
  "rechazado": "RECHAZADO"
};

const ESTADOS_GUIA = [
  "creado",
  "tratado",
  "con OT",
  "finalizado",
  "finalizado sin facturacion",
  "rechazado",
];

// Config visual por columna (Paleta Semántica Soft UI)
const ESTADOS_COLUMNA = {
  creado: { 
    label: "Creado", 
    bgHeader: "bg-[#EFF6FF]", 
    textColor: "text-[#2563EB]",
    iconBg: "bg-[#DBEAFE]",
    iconColor: "text-[#2563EB]",
    borderLeft: "border-l-4 border-l-[#2563EB]",
    border: "border-slate-100", 
    icon: FileText, 
    chip: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]"
  },
  tratado: { 
    label: "Tratado", 
    bgHeader: "bg-[#FFF7ED]", 
    textColor: "text-[#EA580C]",
    iconBg: "bg-[#FED7AA]",
    iconColor: "text-[#EA580C]",
    borderLeft: "border-l-4 border-l-[#EA580C]",
    border: "border-slate-100", 
    icon: ClipboardCheck, 
    chip: "bg-[#FFF7ED] text-[#EA580C] border-[#FDBA74]"
  },
  "con OT": { 
    label: "Con OT", 
    bgHeader: "bg-[#FAF5FF]", 
    textColor: "text-[#9333EA]",
    iconBg: "bg-[#E9D5FF]",
    iconColor: "text-[#9333EA]",
    borderLeft: "border-l-4 border-l-[#9333EA]",
    border: "border-slate-100", 
    icon: Wrench, 
    chip: "bg-[#FAF5FF] text-[#9333EA] border-[#D8B4FE]"
  },
  finalizado: { 
    label: "Finalizado", 
    bgHeader: "bg-[#F0FDF4]", 
    textColor: "text-[#16A34A]",
    iconBg: "bg-[#BBF7D0]",
    iconColor: "text-[#16A34A]",
    borderLeft: "border-l-4 border-l-[#16A34A]",
    border: "border-slate-100", 
    icon: CheckCircle2, 
    chip: "bg-[#F0FDF4] text-[#16A34A] border-[#86EFAC]"
  },
  "finalizado sin facturacion": { 
    label: "Finalizado s/ fact.", 
    bgHeader: "bg-[#F8FAFC]", 
    textColor: "text-[#475569]",
    iconBg: "bg-[#E2E8F0]",
    iconColor: "text-[#475569]",
    borderLeft: "border-l-4 border-l-[#475569]",
    border: "border-slate-100", 
    icon: Wallet, 
    chip: "bg-[#F8FAFC] text-[#475569] border-[#CBD5E1]"
  },
  rechazado: { 
    label: "Rechazado", 
    bgHeader: "bg-[#FEF2F2]", 
    textColor: "text-[#DC2626]",
    iconBg: "bg-[#FECACA]",
    iconColor: "text-[#DC2626]",
    borderLeft: "border-l-4 border-l-[#DC2626]",
    border: "border-slate-100", 
    icon: Ban, 
    chip: "bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]"
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const show = (v) => (v === null || v === undefined || v === "" ? "—" : String(v));

function fmtFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDatetime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function normalizarEstado(estadoGuia) {
  if (!estadoGuia) return "creado";
  return ESTADOS_GUIA.includes(estadoGuia) ? estadoGuia : "creado";
}

function badgecreticidad(crit) {
  if (!crit) return "bg-slate-100 text-slate-600 border-slate-200";
  if (crit === "A") return "bg-red-50 text-red-700 border-red-200";
  if (crit === "B") return "bg-yellow-50 text-yellow-800 border-yellow-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: CARD
// ─────────────────────────────────────────────────────────────────────────────
function GuiaCard({ guia, onOpen, onMoverPrev, onMoverNext }) {
  const estado = normalizarEstado(guia.estadoGuia);
  const cfg = ESTADOS_COLUMNA[estado] || ESTADOS_COLUMNA.creado;

  const canPrev = ESTADOS_GUIA.indexOf(estado) > 0;
  const canNext = ESTADOS_GUIA.indexOf(estado) < ESTADOS_GUIA.length - 1;

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition cursor-pointer group ${cfg.borderLeft}`}
      onClick={() => onOpen(guia)}
    >
      <div className="p-4 space-y-3">
        {/* Header: Icono + Estado + Contador */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 rounded-lg ${cfg.iconBg} flex items-center justify-center shrink-0`}>
              <cfg.icon size={20} className={cfg.iconColor} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-mono text-slate-400 block">
                {show(guia.numeroAlerta)}
              </span>
              <span className={`text-xs font-bold px-2 py-1 rounded-md border ${cfg.chip}`}>
                {cfg.label}
              </span>
            </div>
          </div>
          {guia.creticidad && (
            <span className={`text-xs font-black px-2 py-1 rounded-md border shrink-0 ${
              guia.creticidad === 'A' 
                ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]' 
                : 'bg-[#FFF7ED] text-[#EA580C] border-[#FDBA74]'
            }`}>
              {guia.creticidad}
            </span>
          )}
        </div>

        {/* Descripción principal */}
        <p className="font-semibold text-slate-800 text-sm leading-snug break-words">
          {guia.producto || guia.descripcion || "Sin título"}
        </p>

        {/* Equipo y Plan en grid flexible */}
        <div className="flex flex-wrap gap-2">
          {(guia.equipo || guia.equipoId) && (
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100 min-w-0">
              <Package size={12} className="text-slate-400 shrink-0" />
              <span className="text-xs text-slate-600 truncate">
                {show(guia.equipo?.nombre || guia.equipoId)}
              </span>
            </div>
          )}
          {(guia.planMantenimiento || guia.planMantenimientoId) && (
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100 min-w-0">
              <Layers size={12} className="text-slate-400 shrink-0" />
              <span className="text-xs text-slate-600 truncate">
                {show(guia.planMantenimiento?.nombre || guia.planMantenimientoId)}
              </span>
            </div>
          )}
        </div>

        {/* Fecha y OV en fila */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar size={12} />
            <span>{fmtFecha(guia.fechaInicioAlerta)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Hash size={12} />
            <span className="truncate max-w-[100px]">{show(guia.ordenVenta)}</span>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="px-4 pb-4 flex gap-2 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => canPrev && onMoverPrev(guia)}
          disabled={!canPrev}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold border border-slate-200 transition disabled:opacity-40"
        >
          <ArrowLeft size={14} /> Ant
        </button>
        <button
          onClick={() => canNext && onMoverNext(guia)}
          disabled={!canNext}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-xs font-semibold border border-[#BFDBFE] transition disabled:opacity-40"
        >
          Sig <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: MODAL DETALLE
// ─────────────────────────────────────────────────────────────────────────────
function ModalDetalle({ guia, onClose, onSetEstado }) {
  if (!guia) return null;

  const estado = normalizarEstado(guia.estadoGuia);
  const cfg = ESTADOS_COLUMNA[estado] || ESTADOS_COLUMNA.creado;
  
  // Estado local para el dropdown custom dentro del modal
  const [isOpenModalFiltro, setIsOpenModalFiltro] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden border border-slate-200 shadow-2xl bg-white">
        <div className={`relative px-6 py-5 border-b border-slate-200 bg-white ${cfg.borderLeft}`}>
          <div className={`absolute top-0 left-0 w-1 h-full ${cfg.bgHeader.replace('bg-', 'bg-')}`} />

          <div className="flex items-start justify-between gap-4 mt-1">
            <div className="min-w-0 flex-1">
              <p className="text-slate-500 text-xs font-mono truncate">
                {show(guia.numeroAlerta)} · OV {show(guia.ordenVenta)}
              </p>
              <h2 className="text-slate-900 font-black text-xl leading-tight mt-1">
                {guia.producto || guia.descripcion || "Sin título"}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.chip}`}>
                  {cfg.label}
                </span>
                {guia.creticidad && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badgecreticidad(guia.creticidad)}`}>
                    CRIT.{guia.creticidad}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition shrink-0"
              title="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <section>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Información</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { icon: Calendar, label: "Inicio alerta", value: fmtFecha(guia.fechaInicioAlerta) },
                { icon: Calendar, label: "Creado", value: fmtDatetime(guia.createdAt) },
                { icon: Calendar, label: "Actualizado", value: fmtDatetime(guia.updatedAt) },
                { icon: Hash, label: "OV", value: guia.ordenVenta },
                { icon: FileText, label: "Descripción", value: guia.descripcion },
                { icon: Layers, label: "Plan", value: guia.planMantenimiento?.nombre || guia.planMantenimientoId },
                { icon: Package, label: "Equipo", value: guia.equipo?.nombre || guia.equipoId },
                { icon: MapPin, label: "Ubicación", value: guia.ubicacionTecnica?.nombre || guia.ubicacionTecnicaId },
                { icon: User, label: "Solicitante", value: guia.solicitante?.nombre || guia.solicitanteId },
              ].map((x) => (
                <div key={x.label} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wide font-black mb-1 flex items-center gap-1">
                    <x.icon size={10} /> {x.label}
                  </p>
                  <p className="text-slate-800 text-xs font-semibold line-clamp-2">{show(x.value)}</p>
                </div>
              ))}
            </div>
          </section>

          {guia.descripcionDetallada && (
            <section className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Descripción detallada</p>
              <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{guia.descripcionDetallada}</p>
            </section>
          )}

          <section className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Adjuntos</p>
            {Array.isArray(guia.adjuntos) && guia.adjuntos.length > 0 ? (
              <div className="space-y-2">
                {guia.adjuntos.map((a, i) => (
                  <div key={a.id || i} className="flex items-center justify-between gap-3 bg-white rounded-xl p-3 border border-slate-200">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{show(a.nombre || a.filename || "Adjunto")}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{show(a.url || a.path || a.ruta || "")}</p>
                    </div>
                    {a.url ? (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye size={14} /> Ver
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">Sin adjuntos</div>
            )}
          </section>

          <section className="bg-white rounded-2xl p-4 border border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Cambiar estado</p>
            <div className="flex flex-col sm:flex-row gap-2">
              
              {/* DROPDOWN CUSTOM EN EL MODAL */}
              <div className="relative w-full sm:flex-1">
                <button
                  onClick={() => setIsOpenModalFiltro(!isOpenModalFiltro)}
                  className="
                    flex items-center justify-between w-full px-3 py-2.5 rounded-xl bg-white
                    border border-slate-300 text-slate-700 text-sm font-medium
                    hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition
                  "
                >
                  <span className="truncate flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${ESTADOS_COLUMNA[estado]?.gradient}`} />
                    {ESTADOS_COLUMNA[estado]?.label || estado}
                  </span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpenModalFiltro ? "rotate-180" : ""}`} />
                </button>

                {isOpenModalFiltro && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpenModalFiltro(false)} />
                    <div className="absolute left-0 bottom-full mb-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 z-50 py-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      {ESTADOS_GUIA.map((s) => (
                        <button
                          key={s}
                          onClick={() => { onSetEstado(s); setIsOpenModalFiltro(false); }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-3
                            ${estado === s ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-600 hover:bg-slate-50 font-medium"}
                          `}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${ESTADOS_COLUMNA[s].gradient}`} />
                          {ESTADOS_COLUMNA[s]?.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold border border-slate-200 transition"
              >
                Cerrar
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Esto actualizará el estado directamente en el backend.
            </p>
          </section>
        </div>

        <div className="shrink-0 border-t border-slate-200 px-6 py-3 flex items-center justify-between bg-white">
          <span className="text-[11px] text-slate-500 font-mono truncate">{show(guia.id)}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold border border-slate-200 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function GuiasMantenimientoKanban() {
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState("TODOS");
  const [isOpenFiltro, setIsOpenFiltro] = useState(false); // 👈 ESTADO DEL MENÚ CUSTOM

  const [guiaSeleccionada, setGuiaSeleccionada] = useState(null);

  // ✅ 1. API: ACTUALIZAR ESTADO
  const apiUpdateEstado = useCallback(async (guiaId, estadoGuiaUI) => {
    const estadoAvisoBackend = MAP_UI_A_API[estadoGuiaUI] || "CREADO";
    return actualizarEstadoAviso(guiaId, estadoAvisoBackend);
  }, []);

  // ✅ 2. API: CARGAR DESDE LA RUTA GENERAL (/Avisos)
  const cargarGuias = useCallback(async (silencioso = false) => {
    try {
      silencioso ? setRefreshing(true) : setLoading(true);
      
      let data = await obtenerAvisos();
      
      if (data && data.data && Array.isArray(data.data)) {
        data = data.data;
      }

      const guiasNormalizadas = (Array.isArray(data) ? data : []).map((a) => ({
        ...a,
        numeroAlerta: a.numeroAviso || a.numero || a.id,
        producto: a.producto || a.descripcion || "",
        descripcion: a.descripcion || a.descripcionResumida || "",
        ordenVenta: a.ordenVenta || a.ordenCliente || "",
        equipo: a.equiposRelacion?.[0]?.equipo || a.equipo || null,
        equipoId: a.equiposRelacion?.[0]?.equipoId || a.equipoId || null,
        fechaInicioAlerta: a.fechaAtencion || a.fechaSugerida || a.createdAt || null,
        estadoGuia: MAP_API_A_UI[a.estadoAviso || a.estado] || "creado",
      }));

      setGuias(guiasNormalizadas);
    } catch (e) {
      console.error("Error cargando guías (/Avisos/):", e);
      setGuias([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarGuias();
  }, [cargarGuias]);

  const guiasFiltradas = useMemo(() => {
    const txt = q.trim().toLowerCase();
    return guias.filter((g) => {
      const estado = normalizarEstado(g.estadoGuia);

      if (fEstado !== "TODOS" && estado !== fEstado) return false;
      if (!txt) return true;

      const blob = [
        g.numeroAlerta,
        g.producto,
        g.descripcion,
        g.ordenVenta,
        g.tipoMantenimiento,
        g.creticidad,
        g.periodo,
        g.estadoGuia,
        g.equipo?.nombre,
        g.equipo?.codigo,
        g.equipo?.modelo,
        g.planMantenimiento?.nombre,
        g.planMantenimiento?.codigoPlan,
      ].filter(Boolean).join(" ").toLowerCase();

      return blob.includes(txt);
    });
  }, [guias, q, fEstado]);

  const columns = useMemo(() => {
    const cols = {};
    ESTADOS_GUIA.forEach((k) => (cols[k] = { items: [] }));

    guiasFiltradas.forEach((g) => {
      const estado = normalizarEstado(g.estadoGuia);
      (cols[estado] || cols.creado).items.push(g);
    });

    Object.values(cols).forEach((c) => {
      c.items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    });

    return cols;
  }, [guiasFiltradas]);

  const stats = useMemo(() => {
    const base = { total: guias.length, creado: 0, tratado: 0, conOT: 0, finalizado: 0, finalizadoSinFact: 0, rechazado: 0 };
    guias.forEach((g) => {
      const e = normalizarEstado(g.estadoGuia);
      if (e === "creado") base.creado++;
      else if (e === "tratado") base.tratado++;
      else if (e === "con OT") base.conOT++;
      else if (e === "finalizado") base.finalizado++;
      else if (e === "finalizado sin facturacion") base.finalizadoSinFact++;
      else if (e === "rechazado") base.rechazado++;
    });
    return base;
  }, [guias]);

  const mover = useCallback(async (guia, dir) => {
    const actual = normalizarEstado(guia.estadoGuia);
    const idx = ESTADOS_GUIA.indexOf(actual);
    if (idx === -1) return;

    const nextIdx = dir === "next" ? idx + 1 : idx - 1;
    if (nextIdx < 0 || nextIdx >= ESTADOS_GUIA.length) return;

    const nuevoUI = ESTADOS_GUIA[nextIdx];

    try {
      await apiUpdateEstado(guia.id, nuevoUI);
      await cargarGuias(true);

      if (guiaSeleccionada?.id === guia.id) {
        let freshData = await obtenerAvisos();
        if (freshData && freshData.data && Array.isArray(freshData.data)) freshData = freshData.data;

        const freshAviso = (Array.isArray(freshData) ? freshData : []).find((x) => x.id === guia.id);
        if (freshAviso) {
          setGuiaSeleccionada({
            ...freshAviso,
            estadoGuia: MAP_API_A_UI[freshAviso.estadoAviso || freshAviso.estado] || "creado"
          });
        }
      }
    } catch (e) {
      console.error("Error moviendo guía:", e);
      alert(e?.message || "Error al mover la guía de estado");
    }
  }, [apiUpdateEstado, cargarGuias, guiaSeleccionada]);

  const setEstadoDesdeModal = useCallback(async (nuevoEstadoUI) => {
    if (!guiaSeleccionada) return;
    try {
      await apiUpdateEstado(guiaSeleccionada.id, nuevoEstadoUI);
      await cargarGuias(true);
      
      let freshData = await obtenerAvisos();
      if (freshData && freshData.data && Array.isArray(freshData.data)) freshData = freshData.data;

      const freshAviso = (Array.isArray(freshData) ? freshData : []).find((x) => x.id === guiaSeleccionada.id);
      if (freshAviso) {
        setGuiaSeleccionada({
          ...freshAviso,
          estadoGuia: MAP_API_A_UI[freshAviso.estadoAviso || freshAviso.estado] || "creado"
        });
      }
    } catch (e) {
      console.error(e);
      alert(e?.message || "No se pudo actualizar el estado");
    }
  }, [apiUpdateEstado, cargarGuias, guiaSeleccionada]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
            <LayoutGrid className="absolute inset-0 m-auto text-blue-600" size={22} />
          </div>
          <p className="text-slate-600 font-semibold">Cargando guías…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden" style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
              <LayoutGrid size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">Guías de Mantenimiento</h1>
              <p className="text-slate-500 text-xs mt-1">Kanban por estado (flujo tipo Aviso)</p>
            </div>
          </div>

          <button onClick={() => cargarGuias(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold border border-slate-200 transition">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { label: "Total", value: stats.total, tone: "text-slate-900" },
            { label: "Creado", value: stats.creado, tone: "text-slate-700" },
            { label: "Tratado", value: stats.tratado, tone: "text-blue-700" },
            { label: "Con OT", value: stats.conOT, tone: "text-indigo-700" },
            { label: "Finalizado", value: stats.finalizado, tone: "text-emerald-700" },
            { label: "Final. s/fact", value: stats.finalizadoSinFact, tone: "text-amber-800" },
            { label: "Rechazado", value: stats.rechazado, tone: "text-red-700" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl px-3 py-2 border border-slate-200 min-w-[92px]">
              <p className={`text-base font-black leading-none ${s.tone}`}>{s.value}</p>
              <p className="text-slate-500 text-[9px] uppercase tracking-wide mt-0.5 font-bold">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por alerta, equipo, producto, plan…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition">
                <X size={13} />
              </button>
            )}
          </div>

          {/* ✅ CUSTOM DROPDOWN FILTRO */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsOpenFiltro(!isOpenFiltro)}
              className="
                flex items-center justify-between w-48 pl-9 pr-4 py-2.5 rounded-xl bg-white
                border border-slate-300 text-slate-700 text-sm font-medium
                hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition
              "
            >
              <Filter size={14} className="absolute left-3.5 text-slate-400" />
              <span className="truncate">
                {fEstado === "TODOS" ? "Todos los estados" : ESTADOS_COLUMNA[fEstado]?.label}
              </span>
              <ChevronDown 
                size={14} 
                className={`text-slate-400 transition-transform duration-200 ${isOpenFiltro ? "rotate-180" : ""}`} 
              />
            </button>

            {isOpenFiltro && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsOpenFiltro(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => { setFEstado("TODOS"); setIsOpenFiltro(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3
                      ${fEstado === "TODOS" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-600 hover:bg-slate-50 font-medium"}
                    `}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    Todos los estados
                  </button>

                  <div className="h-px bg-slate-100 my-1 mx-4" />

                  {ESTADOS_GUIA.map((s) => {
                    const cfg = ESTADOS_COLUMNA[s];
                    return (
                      <button
                        key={s}
                        onClick={() => { setFEstado(s); setIsOpenFiltro(false); }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-3
                          ${fEstado === s ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-600 hover:bg-slate-50 font-medium"}
                        `}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${cfg.gradient}`} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <span className="shrink-0 text-slate-500 text-xs">
            <span className="text-slate-800 font-black">{guiasFiltradas.length}</span> / {guias.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-3">
        {/* GRID FLEXIBLE - Ocupa todo el ancho disponible */}
        <div className="h-full flex flex-col lg:flex-row gap-3">
          {ESTADOS_GUIA.map((estadoKey) => {
            const cfg = ESTADOS_COLUMNA[estadoKey] || ESTADOS_COLUMNA.creado;
            const Icon = cfg.icon || Eye;
            const items = columns[estadoKey]?.items || [];

            return (
              <div key={estadoKey} className={`flex-1 flex flex-col min-w-0 rounded-2xl border ${cfg.border} overflow-hidden bg-white shadow-sm min-h-0`}>
                {/* Cabecera estilo pastel pill */}
                <div className={`${cfg.bgHeader} px-3 py-3 shrink-0`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-full ${cfg.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon size={18} className={cfg.iconColor} />
                      </div>
                      <h3 className={`font-bold text-xs lg:text-sm uppercase tracking-wide ${cfg.textColor} whitespace-nowrap`}>
                        {cfg.label}
                      </h3>
                    </div>
                    <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs font-bold shadow-sm border border-slate-100 shrink-0">
                      {items.length}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 min-h-0">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                      <Package className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-xs font-bold uppercase tracking-wider">Vacío</p>
                    </div>
                  ) : (
                    items.map((g) => (
                      <GuiaCard
                        key={g.id}
                        guia={g}
                        onOpen={setGuiaSeleccionada}
                        onMoverPrev={(guia) => mover(guia, "prev")}
                        onMoverNext={(guia) => mover(guia, "next")}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {guiaSeleccionada && (
        <ModalDetalle
          guia={guiaSeleccionada}
          onClose={() => setGuiaSeleccionada(null)}
          onSetEstado={setEstadoDesdeModal}
        />
      )}
    </div>
  );
}