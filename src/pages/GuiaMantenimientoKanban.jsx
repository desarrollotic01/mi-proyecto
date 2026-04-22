/**
 * GuiasMantenimientoKanban.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ Kanban BLANCO (Light UI) para Guías de Mantenimiento por estadoGuia
 * Estados (según tu modelo):
 *  - "creado" | "tratado" | "con OT" | "rechazado" | "finalizado" | "finalizado sin facturacion"
 *
 * 📍 Coloca en:  src/pages/GuiasMantenimientoKanban.jsx
 * ✅ Solo importa: guiaMantenimientoService y lucide-react
 *
 * ⚠️ IMPORTANTE:
 * Este archivo asume que tu service tiene alguno de estos métodos:
 *  - guiaMantenimientoService.updateEstadoGuia(guiaId, estadoGuia)
 *  - guiaMantenimientoService.updateGuia(guiaId, { estadoGuia })
 *  - guiaMantenimientoService.patchGuia(guiaId, { estadoGuia })
 * Si no existe, te va a salir el alert "No existe método..."
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { guiaMantenimientoService } from "../features/GuiaMantenimiento/services/guiaMantenimientoService";
import GanttGuias from "../features/GuiaMantenimiento/Components/GanttGuias";
import {
  LayoutGrid,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  X,
  Package,
  Wrench,
  ClipboardCheck,
  FileText,
  Ban,
  CheckCircle2,
  Wallet,
  ArrowLeft,
  ArrowRight,
  Eye,
  Calendar,
  Hash,
  User,
  MapPin,
  Layers,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// ESTADOS (según tu ENUM)
// ─────────────────────────────────────────────────────────────────────────────
const ESTADOS_GUIA = [
  "creado",
  "tratado",
  "con OT",
  "finalizado",
  "finalizado sin facturacion",
  "rechazado",
];

// Config visual por columna (light)
const ESTADOS_COLUMNA = {
  creado: {
    label: "Creado",
    gradient: "from-slate-600 to-slate-700",
    border: "border-slate-200",
    icon: FileText,
    chip: "bg-slate-100 text-slate-700 border-slate-200",
  },
  tratado: {
    label: "Tratado",
    gradient: "from-blue-600 to-blue-700",
    border: "border-slate-200",
    icon: ClipboardCheck,
    chip: "bg-blue-50 text-blue-700 border-blue-200",
  },
  "con OT": {
    label: "Con OT",
    gradient: "from-indigo-600 to-indigo-700",
    border: "border-slate-200",
    icon: Wrench,
    chip: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  finalizado: {
    label: "Finalizado",
    gradient: "from-emerald-600 to-emerald-700",
    border: "border-slate-200",
    icon: CheckCircle2,
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  "finalizado sin facturacion": {
    label: "Finalizado s/ fact.",
    gradient: "from-amber-600 to-amber-700",
    border: "border-slate-200",
    icon: Wallet,
    chip: "bg-amber-50 text-amber-800 border-amber-200",
  },
  rechazado: {
    label: "Rechazado",
    gradient: "from-red-700 to-red-800",
    border: "border-slate-200",
    icon: Ban,
    chip: "bg-red-50 text-red-700 border-red-200",
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
  return isNaN(d)
    ? "—"
    : d.toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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
      className="
        rounded-2xl border border-slate-200 bg-white overflow-hidden
        hover:shadow-lg hover:shadow-slate-200/60 transition cursor-pointer group
      "
      onClick={() => onOpen(guia)}
    >
      {/* top color bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${cfg.gradient}`} />

      <div className="p-4 space-y-3">
        {/* meta row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-slate-500 truncate">
            {show(guia.numeroAlerta)}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {guia.creticidad && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badgecreticidad(guia.creticidad)}`}>
                CRIT.{guia.creticidad}
              </span>
            )}

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.chip}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* title */}
        <p className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
          {guia.producto || guia.descripcion || "Sin título"}
        </p>

        {/* equipo */}
        {(guia.equipo || guia.equipoId) && (
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
            <Package size={12} className="text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{show(guia.equipo?.nombre || guia.equipoId)}</p>
              {guia.equipo && (
                <p className="text-[10px] font-mono text-slate-500 truncate">
                  {show(guia.equipo.codigo)} · {show(guia.equipo.modelo)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* plan */}
        {(guia.planMantenimiento || guia.planMantenimientoId) && (
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
            <Layers size={12} className="text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {show(guia.planMantenimiento?.nombre || guia.planMantenimientoId)}
              </p>
              {guia.planMantenimiento?.codigoPlan && (
                <p className="text-[10px] font-mono text-slate-500 truncate">{show(guia.planMantenimiento.codigoPlan)}</p>
              )}
            </div>
          </div>
        )}

        {/* fechas + OV */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
            <p className="text-[9px] text-slate-500 uppercase tracking-wide font-black mb-1 flex items-center gap-1">
              <Calendar size={10} /> Inicio alerta
            </p>
            <p className="text-xs text-slate-800 font-semibold">{fmtFecha(guia.fechaInicioAlerta)}</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
            <p className="text-[9px] text-slate-500 uppercase tracking-wide font-black mb-1 flex items-center gap-1">
              <Hash size={10} /> OV
            </p>
            <p className="text-xs text-slate-800 font-semibold truncate">{show(guia.ordenVenta)}</p>
          </div>
        </div>
      </div>

      {/* actions (hover) */}
      <div className="px-4 pb-4 flex gap-2 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => canPrev && onMoverPrev(guia)}
          disabled={!canPrev}
          className="
            flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
            bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold
            border border-slate-200 transition disabled:opacity-40 disabled:hover:bg-slate-100
          "
          title="Mover a estado anterior"
        >
          <ArrowLeft size={12} />
          Anterior
        </button>

        <button
          onClick={() => canNext && onMoverNext(guia)}
          disabled={!canNext}
          className="
            flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
            bg-blue-600/10 hover:bg-blue-600/15 text-blue-700 text-xs font-bold
            border border-blue-200 transition disabled:opacity-40 disabled:hover:bg-blue-600/10
          "
          title="Mover a siguiente estado"
        >
          Siguiente
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: MODAL DETALLE (light)
// ─────────────────────────────────────────────────────────────────────────────
function ModalDetalle({ guia, onClose, onSetEstado }) {
  if (!guia) return null;

  const estado = normalizarEstado(guia.estadoGuia);
  const cfg = ESTADOS_COLUMNA[estado] || ESTADOS_COLUMNA.creado;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-white">
        {/* header */}
        <div className="relative px-6 py-5 border-b border-slate-200 bg-white">
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cfg.gradient}`} />

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

                {guia.periodo && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {String(guia.periodo).replace(/_/g, " ")}
                  </span>
                )}

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

        {/* body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* info grid */}
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

          {/* desc det */}
          {guia.descripcionDetallada && (
            <section className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Descripción detallada</p>
              <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{guia.descripcionDetallada}</p>
            </section>
          )}

          {/* adjuntos */}
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
                        <Eye size={14} />
                        Ver
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

          {/* cambiar estado */}
          <section className="bg-white rounded-2xl p-4 border border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Cambiar estado</p>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={estado}
                onChange={(e) => onSetEstado(e.target.value)}
                className="
                  w-full sm:flex-1 px-3 py-2.5 rounded-xl bg-white
                  border border-slate-300 text-slate-800 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30
                "
              >
                {ESTADOS_GUIA.map((s) => (
                  <option key={s} value={s}>
                    {ESTADOS_COLUMNA[s]?.label || s}
                  </option>
                ))}
              </select>

              <button
                onClick={onClose}
                className="
                  px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200
                  text-slate-700 text-sm font-bold border border-slate-200 transition
                "
              >
                Cerrar
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Esto replica el flujo tipo Aviso: solo cambiamos <span className="font-mono">estadoGuia</span>.
            </p>
          </section>
        </div>

        {/* footer */}
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
  const [viewMode, setViewMode] = useState("gantt"); // "kanban" | "gantt"

  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState("TODOS");

  const [guiaSeleccionada, setGuiaSeleccionada] = useState(null);

  // ✅ adapta aquí si tu service tiene otro método
  const apiUpdateEstado = useCallback(async (guiaId, estadoGuia) => {
    if (guiaMantenimientoService.updateEstadoGuia) {
      return guiaMantenimientoService.updateEstadoGuia(guiaId, estadoGuia);
    }
    if (guiaMantenimientoService.updateGuia) {
      return guiaMantenimientoService.updateGuia(guiaId, { estadoGuia });
    }
    if (guiaMantenimientoService.patchGuia) {
      return guiaMantenimientoService.patchGuia(guiaId, { estadoGuia });
    }
    throw new Error("No existe método en guiaMantenimientoService para actualizar estadoGuia");
  }, []);

  const cargarGuias = useCallback(async (silencioso = false) => {
    try {
      silencioso ? setRefreshing(true) : setLoading(true);
      const data = await guiaMantenimientoService.getGuias();
      setGuias(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error cargando guías:", e);
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
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

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

    // orden: más nuevo primero
    Object.values(cols).forEach((c) => {
      c.items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    });

    return cols;
  }, [guiasFiltradas]);

  const stats = useMemo(() => {
    const base = {
      total: guias.length,
      creado: 0,
      tratado: 0,
      conOT: 0,
      finalizado: 0,
      finalizadoSinFact: 0,
      rechazado: 0,
    };

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

  const mover = useCallback(
    async (guia, dir) => {
      const actual = normalizarEstado(guia.estadoGuia);
      const idx = ESTADOS_GUIA.indexOf(actual);
      if (idx === -1) return;

      const nextIdx = dir === "next" ? idx + 1 : idx - 1;
      if (nextIdx < 0 || nextIdx >= ESTADOS_GUIA.length) return;

      const nuevo = ESTADOS_GUIA[nextIdx];

      try {
        await apiUpdateEstado(guia.id, nuevo);
        await cargarGuias(true);

        // refrescar modal si corresponde
        if (guiaSeleccionada?.id === guia.id) {
          const fresh = (await guiaMantenimientoService.getGuias()).find((x) => x.id === guia.id);
          if (fresh) setGuiaSeleccionada(fresh);
        }
      } catch (e) {
        console.error("Error moviendo guía:", e);
        alert(e?.message || "Error al mover la guía de estado");
      }
    },
    [apiUpdateEstado, cargarGuias, guiaSeleccionada]
  );

  const setEstadoDesdeModal = useCallback(
    async (nuevoEstado) => {
      if (!guiaSeleccionada) return;
      try {
        await apiUpdateEstado(guiaSeleccionada.id, nuevoEstado);
        await cargarGuias(true);
        const fresh = (await guiaMantenimientoService.getGuias()).find((x) => x.id === guiaSeleccionada.id);
        if (fresh) setGuiaSeleccionada(fresh);
      } catch (e) {
        console.error(e);
        alert(e?.message || "No se pudo actualizar el estado");
      }
    },
    [apiUpdateEstado, cargarGuias, guiaSeleccionada]
  );

  // loading screen (light)
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
      {/* HEADER */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 space-y-4">
        {/* row 1 */}
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

          <div className="flex items-center gap-2">
            {/* Toggle Kanban / Gantt */}
            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
              {[["kanban", "⊞ Kanban"], ["gantt", "📊 Gantt"]].map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === mode
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => cargarGuias(true)}
              className="
                flex items-center gap-2 px-4 py-2 rounded-xl
                bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold
                border border-slate-200 transition
              "
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>
        </div>

        {/* stats */}
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

        {/* search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por alerta, equipo, producto, plan…"
              className="
                w-full pl-9 pr-9 py-2.5 rounded-xl bg-white
                border border-slate-300 text-slate-800 placeholder-slate-400 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition
              "
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={fEstado}
              onChange={(e) => setFEstado(e.target.value)}
              className="
                pl-8 pr-8 py-2.5 rounded-xl bg-white
                border border-slate-300 text-slate-700 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500/25 appearance-none cursor-pointer
              "
            >
              <option value="TODOS">Todos los estados</option>
              {ESTADOS_GUIA.map((s) => (
                <option key={s} value={s}>
                  {ESTADOS_COLUMNA[s]?.label || s}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <span className="shrink-0 text-slate-500 text-xs">
            <span className="text-slate-800 font-black">{guiasFiltradas.length}</span> / {guias.length}
          </span>
        </div>
      </div>

      {/* GANTT VIEW */}
      {viewMode === "gantt" && (
        <div className="flex-1 overflow-auto p-4">
          <GanttGuias guias={guiasFiltradas} />
        </div>
      )}

      {/* KANBAN */}
      {viewMode === "kanban" && <div className="flex-1 overflow-hidden p-4">
        <div className="h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {ESTADOS_GUIA.map((estadoKey) => {
            const cfg = ESTADOS_COLUMNA[estadoKey] || ESTADOS_COLUMNA.creado;
            const Icon = cfg.icon || Eye;
            const items = columns[estadoKey]?.items || [];

            return (
              <div key={estadoKey} className={`flex flex-col rounded-2xl border ${cfg.border} overflow-hidden bg-white shadow`}>
                {/* column header */}
                <div className={`bg-gradient-to-r ${cfg.gradient} px-4 py-3.5 shrink-0`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Icon size={16} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-white text-sm leading-none truncate">{cfg.label}</p>
                        <p className="text-white/70 text-[10px] mt-0.5">
                          {items.length} guía{items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <span className="bg-white/20 text-white text-xs font-black px-2.5 py-0.5 rounded-full shrink-0">
                      {items.length}
                    </span>
                  </div>
                </div>

                {/* cards list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3">
                        <Package size={24} className="opacity-40" />
                      </div>
                      <p className="text-xs font-semibold">Sin guías</p>
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
      </div>}

      {/* MODAL */}
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