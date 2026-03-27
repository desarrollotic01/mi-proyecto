import {
  X, Wrench, Package, Calendar, Clock, Hash, Layers,
  Play, Ban, CheckCircle2, AlertTriangle, Bell, CalendarClock,
  Timer, User, MapPin, Tag, Settings, ChevronRight, FileText
} from "lucide-react";

// 🎨 BADGES ESTILO GHOST (Transparentes con borde de color)
const PROG_ESTADO_CFG = {
  PENDIENTE: { badge: "bg-transparent border border-amber-300 text-amber-700", dot: "bg-amber-500" },
  EJECUTADO: { badge: "bg-transparent border border-emerald-300 text-emerald-700", dot: "bg-emerald-500" },
  CANCELADO: { badge: "bg-transparent border border-rose-300 text-rose-700", dot: "bg-rose-500" },
};

// 🎨 HEADERS ESTILO PASTEL/OUTLINE
const URGENCIA_HEADER = {
  vencido: { bg: "bg-rose-50 border-b border-rose-200", icon: AlertTriangle, text: "text-rose-600", pulse: true },
  critico: { bg: "bg-orange-50 border-b border-orange-200", icon: Bell, text: "text-orange-600", pulse: true },
  urgente: { bg: "bg-amber-50 border-b border-amber-200", icon: Clock, text: "text-amber-600", pulse: false },
  proximo: { bg: "bg-blue-50 border-b border-blue-200", icon: CalendarClock, text: "text-blue-600", pulse: false },
  normal: { bg: "bg-slate-50 border-b border-slate-200", icon: CalendarClock, text: "text-slate-600", pulse: false },
  completado: { bg: "bg-emerald-50 border-b border-emerald-200", icon: CheckCircle2, text: "text-emerald-600", pulse: false },
  sin_fecha: { bg: "bg-slate-50 border-b border-slate-200", icon: Hash, text: "text-slate-500", pulse: false },
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-50">

        {/* ── HEADER CORPORATIVO PASTEL ── */}
        <div className={`${headerCfg.bg} px-6 py-6 shrink-0`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 ${headerCfg.pulse ? "animate-pulse ring-4 ring-rose-100" : ""}`}>
                <HeaderIcon size={24} className={headerCfg.text} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{guia.numeroAlerta || "—"}</span>

                  {guia.creticidad && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border bg-transparent ${guia.creticidad === "A" ? "border-rose-300 text-rose-700" :
                        guia.creticidad === "B" ? "border-amber-300 text-amber-700" :
                          "border-slate-300 text-slate-600"
                      }`}>
                      Criticidad {guia.creticidad}
                    </span>
                  )}
                  {guia.tipoMantenimiento && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-blue-300 text-blue-700 bg-transparent">
                      {guia.tipoMantenimiento}
                    </span>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                  {guia.producto || guia.descripcion || "Sin descripción"}
                </h2>
                {guia.ordenVenta && (
                  <p className="text-slate-500 text-xs mt-1 font-semibold flex items-center gap-1">
                    <FileText size={12} /> OV: {guia.ordenVenta}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Urgencia prominente (Cajita Outline) */}
          {urgencia.proxFecha && (
            <div className={`mt-4 flex items-center gap-3 bg-white rounded-xl px-4 py-3 border shadow-sm ${headerCfg.pulse ? "border-rose-300" : "border-slate-200"}`}>
              <Timer size={18} className={headerCfg.text} />
              <div className="flex-1">
                <p className="text-slate-500 text-xs md:text-sm font-medium">
                  Próxima programación: <span className="font-bold text-slate-800">{safeDate(urgencia.proxFecha)}</span>
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
              <span className={`text-sm md:text-base font-black uppercase tracking-tight ${headerCfg.text} tabular-nums`}>
                {urgencia.label}
              </span>
            </div>
          )}

          {/* Barra progreso corporativa */}
          {programaciones.length > 0 && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <span>Progreso</span>
                <span className="text-slate-700">{ejecutadas.length}/{programaciones.length} ejecutadas</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300/50">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${(ejecutadas.length / programaciones.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

          {/* INFO GENERAL (Tarjetas Blancas) */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
              <Settings size={12} /> Información General
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
              {[
                { label: "Número Alerta", value: guia.numeroAlerta, icon: Hash },
                { label: "Tipo Mant.", value: guia.tipoMantenimiento, icon: Wrench },
                { label: "Orden Venta", value: guia.ordenVenta, icon: FileText },
                { label: "Producto", value: guia.producto, icon: Package },
                { label: "Criticidad", value: guia.creticidad, icon: AlertTriangle },
                { label: "Periodo", value: guia.periodo?.replace(/_/g, " "), icon: Calendar },
                { label: "Inicio Alerta", value: safeDate(guia.fechaInicioAlerta), icon: CalendarClock },
                { label: "Creado", value: safeDatetime(guia.createdAt), icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} className="text-slate-400 shrink-0" />
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider truncate">{label}</p>
                  </div>
                  <p className="text-slate-800 font-bold text-xs truncate">{value || "—"}</p>
                </div>
              ))}
            </div>
          </section>

          {/* DESCRIPCIÓN */}
          {guia.descripcion && (
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                <Tag size={12} /> Descripción
              </h3>
              <div className="bg-white rounded-xl p-4 border border-slate-200 border-l-4 border-l-blue-500 shadow-sm">
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed italic">{guia.descripcion}</p>
              </div>
            </section>
          )}

          {/* EQUIPO */}
          {guia.equipo && (
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                <Package size={12} /> Equipo
              </h3>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <Package size={18} className="text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{guia.equipo.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{guia.equipo.codigo}</p>
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
                    <div key={label} className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
                      <p className="text-slate-700 text-xs font-bold mt-0.5 truncate">{value}</p>
                    </div>
                  ) : null)}
                </div>
              </div>
            </section>
          )}

          {/* PLAN DE MANTENIMIENTO */}
          {guia.planMantenimiento && (
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                <Layers size={12} /> Plan de Mantenimiento
              </h3>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Layers size={16} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{guia.planMantenimiento.nombre}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{guia.planMantenimiento.codigoPlan}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {guia.planMantenimiento.tipo && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-transparent border border-slate-300 text-slate-600">
                      {guia.planMantenimiento.tipo}
                    </span>
                  )}
                  {guia.planMantenimiento.frecuencia && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-transparent border border-purple-300 text-purple-700">
                      {guia.planMantenimiento.frecuencia}
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* PROGRAMACIONES */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
              <CalendarClock size={12} /> Programaciones ({programaciones.length})
            </h3>

            {programaciones.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border border-dashed border-slate-300 rounded-xl bg-white">
                <CalendarClock size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold uppercase tracking-wider">Sin programaciones</p>
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
                        className={`flex items-center gap-3 p-3 bg-white rounded-xl border shadow-sm transition-colors ${esVencida
                            ? "border-l-4 border-l-rose-500 border-rose-200"
                            : esPendiente && diasRestantes !== null && diasRestantes <= 3
                              ? "border-l-4 border-l-orange-500 border-orange-200"
                              : "border-l-4 border-l-slate-300 border-slate-200"
                          }`}
                      >
                        <span className="text-slate-400 text-xs font-mono w-6 shrink-0 text-center">{idx + 1}</span>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${estCfg.dot}`} />

                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 text-xs font-bold truncate">
                            {fechaProg
                              ? fechaProg.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
                              : "Sin fecha"}
                          </p>
                          {prog.comentario && (
                            <p className="text-slate-500 text-[10px] mt-0.5 truncate italic">{prog.comentario}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {esPendiente && diasRestantes !== null && (
                            <span className={`text-[10px] font-bold ${diasRestantes < 0 ? "text-rose-600" :
                                diasRestantes <= 3 ? "text-orange-600" :
                                  diasRestantes <= 7 ? "text-amber-600" : "text-slate-500"
                              }`}>
                              {diasRestantes < 0 ? `+${Math.abs(diasRestantes)}d` : `${diasRestantes}d`}
                            </span>
                          )}
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${estCfg.badge}`}>
                            {prog.estado}
                          </span>
                        </div>

                        {/* Acción rápida (Botones Outline) */}
                        {esPendiente && (
                          <div className="flex gap-1.5 shrink-0 border-l border-slate-100 pl-2 ml-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onEjecutar(prog.id)}
                              className="w-7 h-7 rounded border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors shadow-sm"
                              title="Ejecutar"
                            >
                              <Play size={12} />
                            </button>
                            <button
                              onClick={() => onCancelar(prog.id)}
                              className="w-7 h-7 rounded border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 flex items-center justify-center transition-colors shadow-sm"
                              title="Cancelar"
                            >
                              <Ban size={12} />
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

        {/* ── FOOTER CORPORATIVO ── */}
        <div className="shrink-0 border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-4 bg-slate-50 rounded-b-2xl">
          <p className="text-[10px] text-slate-400 font-mono truncate hidden sm:block flex-1">ID: {guia.id}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-bold text-sm transition-colors shadow-sm w-full sm:w-auto"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}