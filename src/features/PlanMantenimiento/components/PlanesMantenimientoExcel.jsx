import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  Pencil,
  Search,
  Wrench,
  BadgeCheck,
  Clock,
  Users,
  Layers,
  Tag,
} from "lucide-react";

/**
 * Props:
 * - planes: array de planes (como tu getAll)
 * - onVer: (plan) => void   // para abrir tu PanelPlan o modal de detalles
 * - title?: string
 */
export default function PlanesMantenimientoExcel({
  planes = [],
  onVer,
  onEditar,
  title = "Vista Detallada (Excel)",
}) {
  const [expanded, setExpanded] = useState(() => new Set()); // planId
  const [expandedActs, setExpandedActs] = useState(() => new Set()); // actividadId
  const [qLocal, setQLocal] = useState("");

  const togglePlan = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAct = (id) => {
    setExpandedActs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getTipoBadge = (tipo) => {
    const styles = {
      PREVENTIVO: "bg-blue-100 text-blue-700 border-blue-200",
      CORRECTIVO: "bg-red-100 text-red-700 border-red-200",
      MEJORA: "bg-purple-100 text-purple-700 border-purple-200",
      INSPECCION: "bg-amber-100 text-amber-700 border-amber-200",
    };
    return styles[tipo] || styles.PREVENTIVO;
  };

  const getEquiposLabel = (plan) => {
    const equipos = plan?.equipos || [];
    if (!Array.isArray(equipos) || equipos.length === 0) return "Sin asignar";
    const top = equipos
      .slice(0, 2)
      .map((e) => e?.nombre || e?.codigo)
      .filter(Boolean);
    const extra = equipos.length - top.length;
    return extra > 0 ? `${top.join(", ")} +${extra}` : top.join(", ");
  };

  const safeDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  };

  const freqLabel = (act) => {
    if (!act?.frecuencia) return "-";
    if (act.frecuencia === "POR_HORA") return act.frecuenciaHoras ? `C/${act.frecuenciaHoras}h` : "POR_HORA";
    return act.frecuencia;
  };

  const sumPlan = (plan) => {
    const acts = plan?.actividades || [];
    const totalMin = acts.reduce((acc, a) => acc + (Number(a?.duracionMinutos) || 0), 0);
    const totalTecnicos = acts.reduce((acc, a) => acc + (Number(a?.cantidadTecnicos) || 0), 0);

    const itemsCount = acts.reduce((acc, a) => acc + ((a?.items || []).length || 0), 0);
    const adjCount = acts.reduce((acc, a) => acc + ((a?.adjuntos || []).length || 0), 0);

    const roles = new Set();
    const freqs = new Set();
    const tiposTrabajo = new Set();

    acts.forEach((a) => {
      if (a?.rolTecnico) roles.add(a.rolTecnico);
      if (a?.frecuencia) freqs.add(a.frecuencia);
      if (a?.tipoTrabajo) tiposTrabajo.add(a.tipoTrabajo);
    });

    return {
      totalMin,
      totalHoras: totalMin / 60,
      totalTecnicos,
      itemsCount,
      adjCount,
      roles: Array.from(roles),
      freqs: Array.from(freqs),
      tiposTrabajo: Array.from(tiposTrabajo),
    };
  };

  const planesFiltradosLocal = useMemo(() => {
    const t = qLocal.trim().toLowerCase();
    if (!t) return planes;

    return (planes || []).filter((p) => {
      const equiposTxt = (p?.equipos || [])
        .map((e) => `${e?.codigo || ""} ${e?.nombre || ""}`.trim())
        .join(" ")
        .toLowerCase();

      const actsTxt = (p?.actividades || [])
        .map((a) =>
          [
            a?.codigoActividad,
            a?.sistema,
            a?.subsistema,
            a?.componente,
            a?.tarea,
            a?.tipoTrabajo,
            a?.rolTecnico,
            a?.frecuencia,
          ]
            .filter(Boolean)
            .join(" ")
        )
        .join(" ")
        .toLowerCase();

      const blob = [
        p?.codigoPlan,
        p?.nombre,
        p?.tipo,
        p?.tipoEquipo,
        p?.modeloEquipo,
        p?.activo ? "activo" : "inactivo",
        equiposTxt,
        actsTxt,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return blob.includes(t);
    });
  }, [planes, qLocal]);

  const stats = useMemo(() => {
    const total = planesFiltradosLocal.length;
    const activos = planesFiltradosLocal.filter((p) => p.activo).length;
    const totalActs = planesFiltradosLocal.reduce((acc, p) => acc + ((p?.actividades || []).length || 0), 0);
    const totalItems = planesFiltradosLocal.reduce(
      (acc, p) => acc + (p?.actividades || []).reduce((a2, act) => a2 + ((act?.items || []).length || 0), 0),
      0
    );
    const totalMin = planesFiltradosLocal.reduce((acc, p) => acc + sumPlan(p).totalMin, 0);

    return {
      total,
      activos,
      totalActs,
      totalItems,
      totalHoras: totalMin / 60,
    };
  }, [planesFiltradosLocal]);

  const exportCSV = () => {
    // Exporta solo nivel PLAN (resumen). Para export completo con actividades, te lo armo luego si quieres.
    const headers = [
      "codigoPlan",
      "nombre",
      "tipo",
      "activo",
      "esEspecifico",
      "tipoEquipo",
      "modeloEquipo",
      "equipos",
      "actividades",
      "duracionTotalMin",
      "duracionTotalHoras",
      "tecnicosTotal",
      "itemsTotal",
      "adjuntosTotal",
      "roles",
      "frecuencias",
      "tiposTrabajo",
      "createdAt",
      "updatedAt",
    ];

    const rows = (planesFiltradosLocal || []).map((p) => {
      const s = sumPlan(p);
      const equipos = (p?.equipos || []).map((e) => `${e?.codigo || ""} ${e?.nombre || ""}`.trim()).join(" | ");
      return [
        p?.codigoPlan ?? "",
        p?.nombre ?? "",
        p?.tipo ?? "",
        p?.activo ? "true" : "false",
        p?.esEspecifico ? "true" : "false",
        p?.tipoEquipo ?? "",
        p?.modeloEquipo ?? "",
        equipos,
        (p?.actividades || []).length || 0,
        s.totalMin,
        s.totalHoras.toFixed(2),
        s.totalTecnicos,
        s.itemsCount,
        s.adjCount,
        s.roles.join(" | "),
        s.freqs.join(" | "),
        s.tiposTrabajo.join(" | "),
        p?.createdAt ?? "",
        p?.updatedAt ?? "",
      ];
    });

    const escape = (v) => {
      const s = String(v ?? "");
      // CSV safe
      if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replaceAll('"', '""')}"`;
      return s;
    };

    const csv = [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `planes_mantenimiento_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Top bar */}
      <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow">
              <Wrench className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{title}</h2>
              <p className="text-sm text-slate-500">
                Total: <b>{stats.total}</b> | Activos: <b>{stats.activos}</b> | Actividades: <b>{stats.totalActs}</b> | Items:{" "}
                <b>{stats.totalItems}</b> | Horas planificadas: <b>{stats.totalHoras.toFixed(2)}</b>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={qLocal}
                onChange={(e) => setQLocal(e.target.value)}
                placeholder="Buscar dentro de la tabla..."
                className="w-full sm:w-[320px] pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
              />
            </div>

            <button
              onClick={exportCSV}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 hover:bg-slate-50 transition font-semibold text-slate-700"
              title="Exportar resumen a CSV"
            >
              <Download size={16} />
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Excel grid */}
      <div className="overflow-x-auto">
        <table className="min-w-[1400px] w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-100/90 backdrop-blur border-b border-slate-200">
              <th className="p-3 text-left font-semibold text-slate-700 w-[48px]"></th>

              <th className="p-3 text-left font-semibold text-slate-700">Código</th>
              <th className="p-3 text-left font-semibold text-slate-700">Nombre</th>
              <th className="p-3 text-left font-semibold text-slate-700">Tipo</th>
              <th className="p-3 text-left font-semibold text-slate-700">Equipos</th>

              <th className="p-3 text-left font-semibold text-slate-700">Estado</th>
              <th className="p-3 text-left font-semibold text-slate-700">Específico</th>

              <th className="p-3 text-right font-semibold text-slate-700">#Act</th>
              <th className="p-3 text-right font-semibold text-slate-700">#Items</th>
              <th className="p-3 text-right font-semibold text-slate-700">#Adj</th>

              <th className="p-3 text-right font-semibold text-slate-700">Duración</th>
              <th className="p-3 text-right font-semibold text-slate-700">Técnicos</th>

              <th className="p-3 text-left font-semibold text-slate-700">Frecuencias</th>
              <th className="p-3 text-left font-semibold text-slate-700">Roles</th>

              <th className="p-3 text-left font-semibold text-slate-700">Creado</th>
              <th className="p-3 text-right font-semibold text-slate-700">Acción</th>
            </tr>
          </thead>

          <tbody>
            {(planesFiltradosLocal || []).map((plan, idx) => {
              const isOpen = expanded.has(plan.id);
              const s = sumPlan(plan);

              return (
                <>
                  {/* PLAN ROW */}
                  <tr
                    key={plan.id}
                    className={[
                      "border-b border-slate-100 hover:bg-blue-50/40 transition-colors",
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/40",
                    ].join(" ")}
                  >
                    <td className="p-3">
                      <button
                        onClick={() => togglePlan(plan.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 hover:bg-white transition"
                        title={isOpen ? "Contraer" : "Expandir"}
                      >
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{plan.codigoPlan || "-"}</div>
                      <div className="text-xs text-slate-500">{plan.id}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        {plan.nombre}
                        {plan.esEspecifico && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold">
                            ESPECÍFICO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {plan.tipoEquipo || "-"} {plan.modeloEquipo ? `• ${plan.modeloEquipo}` : ""}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTipoBadge(plan.tipo)}`}>
                        {plan.tipo}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Layers size={16} className="text-slate-400" />
                        <span className="line-clamp-2">{getEquiposLabel(plan)}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      {plan.activo ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          Inactivo
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {plan.esEspecifico ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                          <BadgeCheck size={14} />
                          Sí
                        </span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </td>

                    <td className="p-3 text-right font-semibold text-slate-800">{plan.actividades?.length || 0}</td>
                    <td className="p-3 text-right font-semibold text-slate-800">{s.itemsCount}</td>
                    <td className="p-3 text-right font-semibold text-slate-800">{s.adjCount}</td>

                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2 justify-end text-slate-800 font-semibold">
                        <Clock size={16} className="text-slate-400" />
                        {s.totalMin} min
                        <span className="text-slate-500 font-medium">({s.totalHoras.toFixed(2)} h)</span>
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2 justify-end text-slate-800 font-semibold">
                        <Users size={16} className="text-slate-400" />
                        {s.totalTecnicos}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="text-slate-700 line-clamp-2">
                        {(s.freqs.length ? s.freqs : ["-"]).join(", ")}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="text-slate-700 line-clamp-2">
                        {(s.roles.length ? s.roles : ["-"]).join(", ")}
                      </div>
                    </td>

                    <td className="p-3 text-slate-600">{safeDate(plan.createdAt) || "-"}</td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onVer?.(plan)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-sm hover:shadow"
                        >
                          <Eye size={14} />
                          Ver
                        </button>
                        <button
                          onClick={() => onEditar?.(plan)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition shadow-sm hover:shadow"
                        >
                          <Pencil size={14} />
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* EXPANDED: ACTIVIDADES */}
                  {isOpen && (
                    <tr className="border-b border-slate-200 bg-white">
                      <td colSpan={16} className="p-0">
                        <div className="p-4 bg-gradient-to-r from-slate-50 to-white">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <Tag size={16} className="text-slate-400" />
                              <p className="font-semibold text-slate-800">
                                Actividades ({plan.actividades?.length || 0})
                              </p>
                            </div>
                            <p className="text-xs text-slate-500">
                              Tipos de trabajo: <b>{(s.tiposTrabajo.length ? s.tiposTrabajo : ["-"]).join(", ")}</b>
                            </p>
                          </div>

                          {/* Tabla actividades */}
                          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                            <table className="min-w-[1200px] w-full text-sm">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-200">
                                  <th className="p-3 text-left font-semibold text-slate-700 w-[44px]"></th>
                                  <th className="p-3 text-left font-semibold text-slate-700">Sistema</th>
                                  <th className="p-3 text-left font-semibold text-slate-700">Subsistema</th>
                                  <th className="p-3 text-left font-semibold text-slate-700">Componente</th>
                                  <th className="p-3 text-left font-semibold text-slate-700">Tarea</th>
                                  <th className="p-3 text-left font-semibold text-slate-700">Tipo</th>
                                  <th className="p-3 text-left font-semibold text-slate-700">Rol</th>
                                  <th className="p-3 text-right font-semibold text-slate-700">Duración</th>
                                  <th className="p-3 text-right font-semibold text-slate-700">Técnicos</th>
                                  <th className="p-3 text-right font-semibold text-slate-700">Items</th>
                                  <th className="p-3 text-right font-semibold text-slate-700">Adj</th>
                                </tr>
                              </thead>

                              <tbody>
                                {(plan.actividades || []).map((act, aIdx) => {
                                  const actOpen = expandedActs.has(act.id);
                                  const items = act?.items || [];
                                  const adj = act?.adjuntos || [];
                                  const durMin = Number(act?.duracionMinutos) || 0;

                                  return (
                                    <>
                                      <tr
                                        key={act.id}
                                        className={[
                                          "border-b border-slate-100 hover:bg-blue-50/40 transition",
                                          aIdx % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                                        ].join(" ")}
                                      >
                                        <td className="p-3">
                                          <button
                                            onClick={() => toggleAct(act.id)}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 hover:bg-white transition"
                                            title={actOpen ? "Contraer items" : "Ver items"}
                                          >
                                            {actOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                          </button>
                                        </td>

                                        <td className="p-3 text-slate-700">{act.sistema || "-"}</td>
                                        <td className="p-3 text-slate-700">{act.subsistema || "-"}</td>
                                        <td className="p-3 text-slate-700">{act.componente || "-"}</td>
                                        <td className="p-3">
                                          <div className="font-semibold text-slate-800">{act.tarea || "-"}</div>
                                        </td>
                                        <td className="p-3 text-slate-700">{act.tipoTrabajo || "-"}</td>
                                        <td className="p-3 text-slate-700">{act.rolTecnico || "-"}</td>
                                        <td className="p-3 text-right font-semibold text-slate-800">
                                          {durMin} min
                                        </td>
                                        <td className="p-3 text-right font-semibold text-slate-800">
                                          {Number(act?.cantidadTecnicos) || 0}
                                        </td>
                                        <td className="p-3 text-right font-semibold text-slate-800">
                                          {items.length}
                                        </td>
                                        <td className="p-3 text-right font-semibold text-slate-800">
                                          {adj.length}
                                        </td>
                                      </tr>

                                      {/* ITEMS */}
                                      {actOpen && (
                                        <tr className="bg-white">
                                          <td colSpan={13} className="p-3">
                                            <div className="flex items-center justify-between mb-2">
                                              <p className="text-sm font-semibold text-slate-800">
                                                Items ({items.length})
                                              </p>
                                              <p className="text-xs text-slate-500">
                                                Adjuntos: <b>{adj.length}</b>
                                              </p>
                                            </div>

                                            {items.length === 0 ? (
                                              <div className="text-sm text-slate-500 p-3 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                                                Esta actividad no tiene items.
                                              </div>
                                            ) : (
                                              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                                <table className="min-w-[900px] w-full text-sm">
                                                  <thead>
                                                    <tr className="bg-slate-100 border-b border-slate-200">
                                                      <th className="p-2.5 text-left font-semibold text-slate-700">Recurso</th>
                                                      <th className="p-2.5 text-left font-semibold text-slate-700">Item</th>
                                                      <th className="p-2.5 text-left font-semibold text-slate-700">ItemCode</th>
                                                      <th className="p-2.5 text-left font-semibold text-slate-700">Unidad</th>
                                                      <th className="p-2.5 text-right font-semibold text-slate-700">Cantidad</th>
                                                      <th className="p-2.5 text-left font-semibold text-slate-700">Obs</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {items.map((it) => (
                                                      <tr key={it.id} className="border-b border-slate-100">
                                                        <td className="p-2.5 text-slate-700">{it.recurso}</td>
                                                        <td className="p-2.5 text-slate-800 font-semibold">{it.item}</td>
                                                        <td className="p-2.5 text-slate-700">{it.itemCode}</td>
                                                        <td className="p-2.5 text-slate-700">{it.unidad}</td>
                                                        <td className="p-2.5 text-right text-slate-800 font-semibold">
                                                          {it.cantidad}
                                                        </td>
                                                        <td className="p-2.5 text-slate-600">{it.observacion || "-"}</td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      )}
                                    </>
                                  );
                                })}

                                {(plan.actividades || []).length === 0 && (
                                  <tr>
                                    <td colSpan={13} className="p-6 text-center text-slate-500">
                                      Este plan no tiene actividades.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* mini footer */}
                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                              <Clock size={14} className="text-slate-400" />
                              Duración total: <b className="text-slate-800">{s.totalMin} min</b>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                              <Users size={14} className="text-slate-400" />
                              Técnicos total: <b className="text-slate-800">{s.totalTecnicos}</b>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                              <Wrench size={14} className="text-slate-400" />
                              Frecuencias: <b className="text-slate-800">{(s.freqs.length ? s.freqs : ["-"]).join(", ")}</b>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {(planesFiltradosLocal || []).length === 0 && (
              <tr>
                <td colSpan={16} className="p-10 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-slate-100 p-4 rounded-full">
                      <Wrench className="text-slate-400" size={32} />
                    </div>
                    <p className="text-slate-700 font-semibold">No hay datos para mostrar</p>
                    <p className="text-slate-500 text-sm">Prueba limpiando la búsqueda local.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}