import {
  Clock, AlertTriangle, CheckCircle2, XCircle, Wrench,
  CalendarClock, Package, Eye, Play, Ban, Zap, Bell,
  ChevronRight, Layers, Hash, Timer
} from "lucide-react";

// ── Configuración visual por nivel de urgencia ────────────────────────────
const URGENCIA_CONFIG = {
  vencido:    { ring: "ring-2 ring-red-500",    bg: "bg-red-950/40",    bar: "bg-red-500",    text: "text-red-400",    badge: "bg-red-500/20 text-red-300 border-red-500/40",    icon: AlertTriangle,  pulse: true },
  critico:    { ring: "ring-2 ring-orange-500", bg: "bg-orange-950/30", bar: "bg-orange-500", text: "text-orange-400", badge: "bg-orange-500/20 text-orange-300 border-orange-500/40", icon: Bell, pulse: true },
  urgente:    { ring: "ring-2 ring-yellow-500", bg: "bg-yellow-950/20", bar: "bg-yellow-500", text: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", icon: Clock, pulse: false },
  proximo:    { ring: "ring-1 ring-blue-500/40", bg: "bg-slate-800/60", bar: "bg-blue-500",   text: "text-blue-400",  badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",    icon: CalendarClock, pulse: false },
  normal:     { ring: "ring-1 ring-slate-700",  bg: "bg-slate-800/60", bar: "bg-slate-500",  text: "text-slate-400", badge: "bg-slate-700/50 text-slate-300 border-slate-600",    icon: CalendarClock, pulse: false },
  completado: { ring: "ring-1 ring-green-500/40", bg: "bg-green-950/20", bar: "bg-green-500", text: "text-green-400", badge: "bg-green-500/20 text-green-300 border-green-500/40", icon: CheckCircle2, pulse: false },
  sin_fecha:  { ring: "ring-1 ring-slate-700",  bg: "bg-slate-800/60", bar: "bg-slate-600",  text: "text-slate-500", badge: "bg-slate-700/50 text-slate-400 border-slate-600",    icon: Hash, pulse: false },
};

const COL_ICONS = {
  PENDIENTE:  Clock,
  EN_PROCESO: Wrench,
  EJECUTADO:  CheckCircle2,
  CANCELADO:  XCircle,
};

function UrgenciaBadge({ urgencia }) {
  const cfg = URGENCIA_CONFIG[urgencia.nivel] || URGENCIA_CONFIG.sin_fecha;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${cfg.badge} ${cfg.pulse ? "animate-pulse" : ""}`}>
      <Icon size={11} />
      {urgencia.label}
    </span>
  );
}

function FechaCountdown({ urgencia }) {
  const cfg = URGENCIA_CONFIG[urgencia.nivel] || URGENCIA_CONFIG.sin_fecha;
  if (!urgencia.proxFecha) return null;

  const fecha = new Date(urgencia.proxFecha).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric"
  });

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${cfg.bg} border ${cfg.badge.split(" ")[2] || "border-slate-700"}`}>
      <div className="flex items-center gap-2">
        <Timer size={13} className={cfg.text} />
        <span className="text-slate-300 text-xs">{fecha}</span>
      </div>
      <UrgenciaBadge urgencia={urgencia} />
    </div>
  );
}

function GuiaCard({ guia, onVerGuia, onEjecutar, onCancelar, calcularUrgencia }) {
  const urgencia = calcularUrgencia(guia);
  const cfg = URGENCIA_CONFIG[urgencia.nivel] || URGENCIA_CONFIG.sin_fecha;
  const progPendientes = (guia.programaciones || []).filter((p) => p.estado === "PENDIENTE");
  const progEjecutadas = (guia.programaciones || []).filter((p) => p.estado === "EJECUTADO");
  const columna = resolverColumnaLocal(guia);

  return (
    <div
      className={`rounded-2xl border border-slate-700/60 overflow-hidden transition-all duration-200 cursor-pointer group hover:scale-[1.01] hover:shadow-2xl ${cfg.ring} ${cfg.bg}`}
      onClick={() => onVerGuia(guia)}
    >
      {/* Urgencia top bar */}
      <div className={`h-1 w-full ${cfg.bar}`} />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-500">{guia.numeroAlerta || "—"}</span>
              {guia.creticidad && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  guia.creticidad === "A" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                  guia.creticidad === "B" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                  "bg-slate-700/50 text-slate-400 border border-slate-600"
                }`}>
                  Crit. {guia.creticidad}
                </span>
              )}
            </div>
            <p className="font-bold text-white text-sm leading-tight line-clamp-2">
              {guia.producto || guia.descripcion || "Sin descripción"}
            </p>
          </div>
          <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 shrink-0 mt-1 transition" />
        </div>

        {/* Tipo mantenimiento */}
        <div className="flex items-center gap-2">
          <Wrench size={13} className="text-slate-500 shrink-0" />
          <span className="text-xs text-slate-400">{guia.tipoMantenimiento || "—"}</span>
          {guia.ordenVenta && (
            <>
              <span className="text-slate-700">·</span>
              <span className="text-xs font-mono text-slate-500">{guia.ordenVenta}</span>
            </>
          )}
        </div>

        {/* Equipo */}
        {guia.equipo && (
          <div className="flex items-center gap-2 bg-slate-900/40 rounded-xl px-3 py-2">
            <Package size={13} className="text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-300 truncate">{guia.equipo.nombre}</p>
              <p className="text-[10px] text-slate-500 font-mono">{guia.equipo.codigo} · {guia.equipo.modelo}</p>
            </div>
          </div>
        )}

        {/* Plan */}
        {guia.planMantenimiento && (
          <div className="flex items-center gap-2">
            <Layers size={12} className="text-slate-600 shrink-0" />
            <span className="text-[11px] text-slate-500 truncate">{guia.planMantenimiento.nombre}</span>
          </div>
        )}

        {/* Countdown fecha */}
        <FechaCountdown urgencia={urgencia} />

        {/* Progreso de programaciones */}
        {guia.programaciones?.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Programaciones</span>
              <span className="font-bold text-slate-400">{progEjecutadas.length}/{guia.programaciones.length}</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(progEjecutadas.length / guia.programaciones.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Acciones */}
      {(columna === "PENDIENTE" || columna === "EN_PROCESO") && progPendientes.length > 0 && (
        <div
          className="px-4 pb-4 flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEjecutar(progPendientes[0].id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white text-xs font-bold transition shadow-lg shadow-green-900/30"
          >
            <Play size={12} />
            Ejecutar
          </button>
          <button
            onClick={() => onCancelar(progPendientes[0].id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 text-xs font-bold transition"
          >
            <Ban size={12} />
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

function resolverColumnaLocal(guia) {
  const programaciones = guia?.programaciones || [];
  if (!programaciones.length) return "PENDIENTE";
  const estados = programaciones.map((p) => p.estado);
  if (estados.every((e) => e === "CANCELADO")) return "CANCELADO";
  if (estados.some((e) => e === "EJECUTADO") && !estados.some((e) => e === "PENDIENTE")) return "EJECUTADO";
  if (estados.some((e) => e === "EJECUTADO") && estados.some((e) => e === "PENDIENTE")) return "EN_PROCESO";
  return "PENDIENTE";
}

export default function GuiasKanban({
  columns,
  columnOrder,
  estadosConfig,
  onVerGuia,
  onEjecutar,
  onCancelar,
  calcularUrgencia,
}) {
  return (
    <div className="h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {columnOrder.map((colId) => {
        const col = columns[colId] || { items: [] };
        const cfg = estadosConfig[colId] || {};
        const Icon = COL_ICONS[colId] || Wrench;

        // Contar alertas en esta columna
        const alertCount = col.items.filter((g) => {
          const n = calcularUrgencia(g).nivel;
          return n === "vencido" || n === "critico";
        }).length;

        return (
          <div key={colId} className="flex flex-col rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden backdrop-blur-sm">
            {/* Cabecera de columna */}
            <div className={`bg-gradient-to-r ${cfg.gradient || "from-slate-600 to-slate-700"} px-4 py-4 shrink-0`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{cfg.label || colId}</p>
                    <p className="text-white/60 text-xs">{col.items.length} guía{col.items.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {alertCount > 0 && (
                    <span className="flex items-center gap-1 bg-red-500/30 text-red-200 border border-red-400/40 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                      <AlertTriangle size={10} />
                      {alertCount}
                    </span>
                  )}
                  <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {col.items.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {col.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
                    <Package size={28} className="opacity-30" />
                  </div>
                  <p className="text-sm font-semibold">Sin guías</p>
                  <p className="text-xs mt-1 opacity-70">Esta columna está vacía</p>
                </div>
              ) : (
                col.items.map((guia) => (
                  <GuiaCard
                    key={guia.id}
                    guia={guia}
                    onVerGuia={onVerGuia}
                    onEjecutar={onEjecutar}
                    onCancelar={onCancelar}
                    calcularUrgencia={calcularUrgencia}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}