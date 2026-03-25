import {
  X, Wrench, Package, Calendar, Clock, Hash, Layers,
  Play, Ban, CheckCircle2, AlertTriangle, Bell, CalendarClock,
  Timer, User, MapPin, Tag, Settings, ChevronRight, FileText
} from "lucide-react";

const PROG_ESTADO_CFG = {
  PENDIENTE: { badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", dot: "bg-yellow-500" },
  EJECUTADO: { badge: "bg-green-500/20 text-green-300 border-green-500/40", dot: "bg-green-500" },
  CANCELADO: { badge: "bg-red-500/20 text-red-300 border-red-500/40", dot: "bg-red-500" },
};

const URGENCIA_HEADER = {
  vencido: { bg: "from-red-900/80 to-red-800/60", icon: AlertTriangle, text: "text-red-300", pulse: true },
  critico: { bg: "from-orange-900/80 to-orange-800/60", icon: Bell, text: "text-orange-300", pulse: true },
  urgente: { bg: "from-yellow-900/60 to-yellow-800/40", icon: Clock, text: "text-yellow-300", pulse: false },
  proximo: { bg: "from-blue-900/50 to-slate-800/80", icon: CalendarClock, text: "text-blue-300", pulse: false },
  normal: { bg: "from-slate-800/80 to-slate-900/80", icon: CalendarClock, text: "text-slate-400", pulse: false },
  completado: { bg: "from-green-900/50 to-slate-800/80", icon: CheckCircle2, text: "text-green-300", pulse: false },
  sin_fecha: { bg: "from-slate-800/80 to-slate-900/80", icon: Hash, text: "text-slate-500", pulse: false },
};

export default function ModalDetalleGuia({ guia, onClose, onEjecutar, onCancelar, calcularUrgencia }) {
  if (!guia) return null;

  const urgencia = calcularUrgencia(guia);
  const headerCfg = URGENCIA_HEADER[urgencia.nivel] || URGENCIA_HEADER.sin_fecha;
  const HeaderIcon = headerCfg.icon;

  const programaciones = guia.programaciones || [];
  const pendientes = programaciones.filter((p) => p.estado === "PENDIENTE");
  const ejecutadas = programaciones.filter((p) => p.estado === "EJECUTADO");

  const safeDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-PE", {
      day: "2-digit", month: "long", year: "numeric"
    });
  };

  const safeDatetime = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-PE", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      style={{ background: "rgba(2,6,23,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900">

        {/* ── HEADER ── */}
        <div className={`bg-gradient-to-br ${headerCfg.bg} px-6 py-6 shrink-0`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 ${headerCfg.pulse ? "animate-pulse" : ""}`}>
                <HeaderIcon size={24} className={headerCfg.text} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-slate-400 text-sm font-mono">{guia.numeroAlerta || "—"}</span>
                  {guia.creticidad && (
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${guia.creticidad === "A" ? "bg-red-500/20 text-red-300 border-red-500/40" :
                      guia.creticidad === "B" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" :
                        "bg-slate-700/50 text-slate-400 border-slate-600"
                      }`}>
                      creticidad {guia.creticidad}
                    </span>
                  )}
                  {guia.tipoMantenimiento && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      {guia.tipoMantenimiento}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white leading-tight">
                  {guia.producto || guia.descripcion || "Sin descripción"}
                </h2>
                {guia.ordenVenta && (
                  <p className="text-slate-400 text-sm mt-1 font-mono">{guia.ordenVenta}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Urgencia prominente */}
          {urgencia.proxFecha && (
            <div className={`mt-4 flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3 border border-white/10 ${headerCfg.pulse ? "ring-1 ring-offset-0 ring-red-500/50" : ""}`}>
              <Timer size={18} className={headerCfg.text} />
              <div className="flex-1">
                <p className="text-slate-300 text-sm">
                  Próxima programación: <span className="font-bold text-white">{safeDate(urgencia.proxFecha)}</span>
                </p>
                {urgencia.diasRestantes !== null && (
                  <p className={`text-xs font-bold mt-0.5 ${headerCfg.text}`}>
                    {urgencia.diasRestantes < 0
                      ? `Vencida hace ${Math.abs(urgencia.diasRestantes)} día${Math.abs(urgencia.diasRestantes) !== 1 ? "s" : ""}`
                      : urgencia.diasRestantes === 0
                        ? "¡Vence HOY!"
                        : `Faltan ${urgencia.diasRestantes} día${urgencia.diasRestantes !== 1 ? "s" : ""}`}
                  </p>
                )}
              </div>
              <span className={`text-lg font-black ${headerCfg.text} tabular-nums`}>
                {urgencia.label}
              </span>
            </div>
          )}

          {/* Barra progreso */}
          {programaciones.length > 0 && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Progreso</span>
                <span className="font-bold text-white">{ejecutadas.length}/{programaciones.length} ejecutadas</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-700"
                  style={{ width: `${(ejecutadas.length / programaciones.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* INFO GENERAL */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
              <Settings size={12} /> Información General
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Número Alerta", value: guia.numeroAlerta, icon: Hash },
                { label: "Tipo Mant.", value: guia.tipoMantenimiento, icon: Wrench },
                { label: "Orden Venta", value: guia.ordenVenta, icon: FileText },
                { label: "Producto", value: guia.producto, icon: Package },
                { label: "creticidad", value: guia.creticidad, icon: AlertTriangle },
                { label: "Periodo", value: guia.periodo?.replace(/_/g, " "), icon: Calendar },
                { label: "Inicio Alerta", value: safeDate(guia.fechaInicioAlerta), icon: CalendarClock },
                { label: "Creado", value: safeDatetime(guia.createdAt), icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={12} className="text-slate-500" />
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{label}</p>
                  </div>
                  <p className="text-slate-200 font-semibold text-sm">{value || "—"}</p>
                </div>
              ))}
            </div>
          </section>

          {/* DESCRIPCIÓN */}
          {guia.descripcion && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <Tag size={12} /> Descripción
              </h3>
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 border-l-4 border-l-blue-500">
                <p className="text-slate-300 text-sm leading-relaxed">{guia.descripcion}</p>
              </div>
            </section>
          )}

          {/* EQUIPO */}
          {guia.equipo && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <Package size={12} /> Equipo
              </h3>
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
                    <Package size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{guia.equipo.nombre}</p>
                    <p className="text-xs text-slate-500 font-mono">{guia.equipo.codigo}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: "Marca", value: guia.equipo.marca },
                    { label: "Modelo", value: guia.equipo.modelo },
                    { label: "Serie", value: guia.equipo.serie },
                    { label: "Tipo", value: guia.equipo.tipoEquipo },
                    { label: "Estado", value: guia.equipo.estado },
                    { label: "Sede", value: guia.equipo.sede },
                  ].map(({ label, value }) => value ? (
                    <div key={label} className="bg-slate-900/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
                      <p className="text-slate-300 text-xs font-semibold mt-0.5">{value}</p>
                    </div>
                  ) : null)}
                </div>
              </div>
            </section>
          )}

          {/* PLAN DE MANTENIMIENTO */}
          {guia.planMantenimiento && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <Layers size={12} /> Plan de Mantenimiento
              </h3>
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Layers size={16} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{guia.planMantenimiento.nombre}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{guia.planMantenimiento.codigoPlan}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {guia.planMantenimiento.tipo && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {guia.planMantenimiento.tipo}
                    </span>
                  )}
                  {guia.planMantenimiento.frecuencia && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {guia.planMantenimiento.frecuencia}
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* PROGRAMACIONES */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
              <CalendarClock size={12} /> Programaciones ({programaciones.length})
            </h3>

            {programaciones.length === 0 ? (
              <div className="text-center py-8 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
                <CalendarClock size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin programaciones</p>
              </div>
            ) : (
              <div className="space-y-2">
                {programaciones
                  .sort((a, b) => new Date(a.fechaProgramada) - new Date(b.fechaProgramada))
                  .map((prog, idx) => {
                    const estCfg = PROG_ESTADO_CFG[prog.estado] || PROG_ESTADO_CFG.PENDIENTE;
                    const fechaProg = prog.fechaProgramada ? new Date(prog.fechaProgramada) : null;
                    const diasRestantes = fechaProg
                      ? Math.ceil((fechaProg.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;
                    const esPendiente = prog.estado === "PENDIENTE";
                    const esVencida = esPendiente && diasRestantes !== null && diasRestantes < 0;

                    return (
                      <div
                        key={prog.id}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border ${esVencida
                          ? "bg-red-950/30 border-red-500/40"
                          : esPendiente && diasRestantes !== null && diasRestantes <= 3
                            ? "bg-orange-950/20 border-orange-500/30"
                            : "bg-slate-800/60 border-slate-700/50"
                          }`}
                      >
                        <span className="text-slate-600 text-xs font-mono w-6 shrink-0">{idx + 1}</span>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${estCfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-300 text-xs font-semibold">
                            {fechaProg
                              ? fechaProg.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
                              : "Sin fecha"}
                          </p>
                          {prog.comentario && (
                            <p className="text-slate-500 text-[10px] mt-0.5 truncate">{prog.comentario}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {esPendiente && diasRestantes !== null && (
                            <span className={`text-[10px] font-bold ${diasRestantes < 0 ? "text-red-400" :
                              diasRestantes <= 3 ? "text-orange-400" :
                                diasRestantes <= 7 ? "text-yellow-400" : "text-slate-500"
                              }`}>
                              {diasRestantes < 0 ? `+${Math.abs(diasRestantes)}d` : `${diasRestantes}d`}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${estCfg.badge}`}>
                            {prog.estado}
                          </span>
                        </div>

                        {/* Acción rápida */}
                        {esPendiente && (
                          <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onEjecutar(prog.id)}
                              className="w-7 h-7 rounded-lg bg-green-600/30 hover:bg-green-600/60 text-green-400 flex items-center justify-center transition"
                              title="Ejecutar"
                            >
                              <Play size={11} />
                            </button>
                            <button
                              onClick={() => onCancelar(prog.id)}
                              className="w-7 h-7 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 flex items-center justify-center transition"
                              title="Cancelar"
                            >
                              <Ban size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        </div>

        {/* ── FOOTER ── */}
        <div className="shrink-0 border-t border-slate-700/50 px-6 py-4 flex items-center justify-between gap-4 bg-slate-900/80">
          <p className="text-xs text-slate-600 font-mono truncate">{guia.id}</p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-sm transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}