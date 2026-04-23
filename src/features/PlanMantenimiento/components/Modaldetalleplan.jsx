import { useState, useMemo } from "react";
import {
  X,
  Wrench,
  BadgeCheck,
  Clock,
  Users,
  Layers,
  Tag,
  ChevronDown,
  ChevronRight,
  Calendar,
  Package,
  Paperclip,
  Activity,
  Shield,
  Settings,
  Hash,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  Zap,
} from "lucide-react";

const TIPO_STYLES = {
  PREVENTIVO: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    accent: "from-blue-500 to-blue-600",
    light: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  CORRECTIVO: {
    badge: "bg-red-100 text-red-700 border-red-200",
    accent: "from-red-500 to-red-600",
    light: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  MEJORA: {
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    accent: "from-purple-500 to-purple-600",
    light: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  INSPECCION: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    accent: "from-amber-500 to-amber-600",
    light: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
};

function StatCard({ icon: Icon, label, value, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  };
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-4 ${colors[color]}`}>
      <div className="shrink-0">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs mt-1 opacity-70 font-medium">{label}</p>
      </div>
    </div>
  );
}

function Chip({ label, className = "" }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${className}`}>
      {label}
    </span>
  );
}

export default function ModalDetallePlan({ plan, onClose }) {
  const [expandedActs, setExpandedActs] = useState(new Set());

  if (!plan) return null;

  const tipo = plan.tipo || "PREVENTIVO";
  const style = TIPO_STYLES[tipo] || TIPO_STYLES.PREVENTIVO;

  const toggleAct = (id) => {
    setExpandedActs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const actividades = plan.actividades || [];
  const equipos = plan.equipos || [];

  const summary = useMemo(() => {
    const totalMin = actividades.reduce((a, act) => a + (Number(act?.duracionMinutos) || 0), 0);
    const totalTecnicos = actividades.reduce((a, act) => a + (Number(act?.cantidadTecnicos) || 0), 0);
    const totalItems = actividades.reduce((a, act) => a + (act?.items?.length || 0), 0);
    const totalAdj = actividades.reduce((a, act) => a + (act?.adjuntos?.length || 0), 0);
    const roles = [...new Set(actividades.map((a) => a?.rolTecnico).filter(Boolean))];
    const freqs = [...new Set(actividades.map((a) => a?.frecuencia).filter(Boolean))];
    const tipos = [...new Set(actividades.map((a) => a?.tipoTrabajo).filter(Boolean))];
    return { totalMin, totalHoras: totalMin / 60, totalTecnicos, totalItems, totalAdj, roles, freqs, tipos };
  }, [actividades]);

  const safeDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d) ? "—" : d.toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      style={{ background: "rgba(15,23,42,0.7)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
      >
        {/* ── HEADER ── */}
        <div className={`bg-gradient-to-r ${style.accent} p-6 sm:p-8 text-white shrink-0`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur rounded-2xl p-3 shrink-0">
                <Wrench size={28} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-white/70 text-sm font-mono">{plan.codigoPlan || "—"}</span>
                  {plan.esEspecifico && (
                    <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <BadgeCheck size={12} /> ESPECÍFICO
                    </span>
                  )}
                  <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {tipo}
                  </span>
                  {plan.activo ? (
                    <span className="bg-green-400/30 text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12} /> ACTIVO
                    </span>
                  ) : (
                    <span className="bg-red-400/30 text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <XCircle size={12} /> INACTIVO
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold leading-tight">{plan.nombre || "Sin nombre"}</h2>
                {(plan.tipoEquipo || plan.modeloEquipo) && (
                  <p className="text-white/70 text-sm mt-1">
                    {plan.tipoEquipo} {plan.modeloEquipo ? `• ${plan.modeloEquipo}` : ""}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 bg-white/20 hover:bg-white/30 transition rounded-xl p-2.5"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          {/* STATS ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Actividades", value: actividades.length, icon: Activity },
              { label: "Equipos", value: equipos.length, icon: Layers },
              { label: "Horas planif.", value: summary.totalHoras.toFixed(1) + "h", icon: Clock },
              { label: "Items", value: summary.totalItems, icon: Package },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/15 backdrop-blur rounded-2xl p-3 flex items-center gap-3">
                <Icon size={18} className="text-white/80 shrink-0" />
                <div>
                  <p className="text-xl font-bold leading-none">{value}</p>
                  <p className="text-white/70 text-xs mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-8">

          {/* INFO GENERAL */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Settings size={14} /> Información General
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { label: "Código Plan", value: plan.codigoPlan },
                { label: "Tipo", value: plan.tipo },
                { label: "Tipo Equipo", value: plan.tipoEquipo },
                { label: "Modelo Equipo", value: plan.modeloEquipo },
                { label: "Estado", value: plan.activo ? "Activo" : "Inactivo" },
                { label: "Específico", value: plan.esEspecifico ? "Sí" : "No" },
                { label: "Creado", value: safeDate(plan.createdAt) },
                { label: "Actualizado", value: safeDate(plan.updatedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-slate-800 font-semibold text-sm">{value || "—"}</p>
                </div>
              ))}
            </div>
          </section>

          {/* RESUMEN TÉCNICO */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <BarChart3 size={14} /> Resumen Técnico
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard icon={Clock} label="Duración total" value={`${summary.totalMin} min`} color="blue" />
              <StatCard icon={Zap} label="Horas totales" value={`${summary.totalHoras.toFixed(2)}h`} color="purple" />
              <StatCard icon={Users} label="Técnicos total" value={summary.totalTecnicos} color="green" />
              <StatCard icon={Package} label="Items" value={summary.totalItems} color="amber" />
              <StatCard icon={Paperclip} label="Adjuntos" value={summary.totalAdj} color="slate" />
            </div>

            {/* Tags */}
            {(summary.roles.length > 0 || summary.freqs.length > 0 || summary.tipos.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-3">
                {summary.roles.map((r) => (
                  <Chip key={r} label={`👤 ${r}`} className="bg-blue-50 text-blue-700 border-blue-200" />
                ))}
                {summary.freqs.map((f) => (
                  <Chip key={f} label={`🔁 ${f}`} className="bg-purple-50 text-purple-700 border-purple-200" />
                ))}
                {summary.tipos.map((t) => (
                  <Chip key={t} label={`🔧 ${t}`} className="bg-amber-50 text-amber-700 border-amber-200" />
                ))}
              </div>
            )}
          </section>

          {/* EQUIPOS */}
          {equipos.length > 0 && (
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Layers size={14} /> Equipos Asignados ({equipos.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {equipos.map((eq) => (
                  <div
                    key={eq.id || eq.codigo}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3"
                  >
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 shrink-0">
                      <Settings size={18} className="text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{eq.nombre || "—"}</p>
                      <p className="text-xs text-slate-500 font-mono">{eq.codigo || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ACTIVIDADES */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Activity size={14} /> Actividades ({actividades.length})
            </h3>

            {actividades.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                <AlertCircle size={32} />
                <p className="font-semibold">Sin actividades registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actividades.map((act, idx) => {
                  const isOpen = expandedActs.has(act.id);
                  const items = act?.items || [];
                  const adj = act?.adjuntos || [];

                  return (
                    <div
                      key={act.id || idx}
                      className="border border-slate-200 rounded-2xl overflow-hidden"
                    >
                      {/* Actividad header */}
                      <button
                        onClick={() => toggleAct(act.id)}
                        className="w-full flex items-center gap-4 p-4 sm:p-5 bg-white hover:bg-slate-50 transition text-left"
                      >
                        <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>

                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <p className="font-bold text-slate-800 truncate">{act.tarea || "—"}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {[act.sistema, act.subsistema, act.componente].filter(Boolean).join(" › ")}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center sm:justify-end">
                            {act.tipoTrabajo && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                                {act.tipoTrabajo}
                              </span>
                            )}
                            {act.frecuencia && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                {act.frecuencia}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 hidden sm:flex items-center gap-4 text-sm text-slate-600 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock size={14} className="text-slate-400" />
                            {Number(act?.duracionMinutos) || 0} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} className="text-slate-400" />
                            {Number(act?.cantidadTecnicos) || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package size={14} className="text-slate-400" />
                            {items.length}
                          </span>
                          {adj.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip size={14} className="text-slate-400" />
                              {adj.length}
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Actividad expanded */}
                      {isOpen && (
                        <div className="border-t border-slate-100 bg-slate-50 p-4 sm:p-5 space-y-5">
                          {/* Detalle actividad */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: "Sistema", value: act.sistema },
                              { label: "Subsistema", value: act.subsistema },
                              { label: "Componente", value: act.componente },
                              { label: "Tipo Trabajo", value: act.tipoTrabajo },
                              { label: "Tipo", value: act.tipo || "INTERNO" },
                              { label: "Rol Técnico", value: act.tipo === "EXTERNO" ? "— (Externo)" : act.rolTecnico },
                              { label: "Frecuencia", value: act.frecuencia },
                              { label: "Duración (min)", value: act.duracionMinutos },
                              { label: "Técnicos", value: act.cantidadTecnicos },
                            ].map(({ label, value }) => (
                              <div key={label} className="bg-white rounded-xl p-3 border border-slate-200">
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                                <p className="text-slate-800 font-semibold text-sm">{value ?? "—"}</p>
                              </div>
                            ))}
                          </div>

                          {/* Items */}
                          {items.length > 0 && (
                            <div>
                              <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Package size={15} className="text-slate-400" />
                                Items ({items.length})
                              </p>
                              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                <table className="min-w-[700px] w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Recurso</th>
                                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</th>
                                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Código</th>
                                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Unidad</th>
                                      <th className="p-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Cant.</th>
                                      <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Obs.</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.map((it, iIdx) => (
                                      <tr key={it.id || iIdx} className="border-b border-slate-50 hover:bg-blue-50/30 transition">
                                        <td className="p-3 text-slate-600">{it.recurso || "—"}</td>
                                        <td className="p-3 font-semibold text-slate-800">{it.item || "—"}</td>
                                        <td className="p-3 font-mono text-xs text-slate-600">{it.itemCode || "—"}</td>
                                        <td className="p-3 text-slate-600">{it.unidad || "—"}</td>
                                        <td className="p-3 text-right font-bold text-slate-800">{it.cantidad ?? "—"}</td>
                                        <td className="p-3 text-slate-500 text-xs">{it.observacion || "—"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Adjuntos */}
                          {adj.length > 0 && (
                            <div>
                              <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Paperclip size={15} className="text-slate-400" />
                                Adjuntos ({adj.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {adj.map((a, aIdx) => (
                                  <a
                                    key={a.id || aIdx}
                                    href={a.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                                  >
                                    <Paperclip size={12} />
                                    {a.nombre || a.url || `Adjunto ${aIdx + 1}`}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
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
        <div className="shrink-0 border-t border-slate-100 px-6 sm:px-8 py-4 flex items-center justify-between gap-4 bg-white">
          <p className="text-xs text-slate-400">
            ID: <span className="font-mono">{plan.id || "—"}</span>
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}