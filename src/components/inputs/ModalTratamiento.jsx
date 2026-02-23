import { useEffect, useState } from "react";
import {
  X, Save, ShoppingCart, Settings, CheckCircle, Briefcase,
  Wrench, FileText, Package, Plus, Trash2, ClipboardList,
  ChevronDown, ChevronUp, Clock, Layers, Tag, Cpu
} from "lucide-react";

import { createTratamiento } from "../../features/mantenimiento/services/tratamientoService";
import { getTrabajadores } from "../../features/mantenimiento/services/trabajadoresService";
import { equipoService } from "../../features/mantenimiento/services/equipoService";
import ModalSolicitudCompra from "./ModalSolicitudCompra";
import ModalConfiguracionCampos from "./ModalConfiguracionTratamiento";
import { CAMPOS_AVISO } from "./camposAviso";

/* ══════════════════════════════════════════════
   CONSTANTES
══════════════════════════════════════════════ */

const TIPOS_TRABAJO = [
  "TORQUEO_REGULACION", "APLICACION", "REVISION", "INSPECCION",
  "CAMBIO", "LIMPIEZA", "AJUSTE", "LUBRICACION",
];

const ACTIVIDAD_VACIA = {
  sistema: "", subsistema: "", componente: "", tarea: "",
  tipoTrabajo: "REVISION", duracionEstimadaMin: 0, observaciones: "",
};

const COLOR_TIPO = {
  TORQUEO_REGULACION: "bg-orange-100 text-orange-700 border-orange-200",
  APLICACION:         "bg-blue-100 text-blue-700 border-blue-200",
  REVISION:           "bg-purple-100 text-purple-700 border-purple-200",
  INSPECCION:         "bg-cyan-100 text-cyan-700 border-cyan-200",
  CAMBIO:             "bg-red-100 text-red-700 border-red-200",
  LIMPIEZA:           "bg-green-100 text-green-700 border-green-200",
  AJUSTE:             "bg-yellow-100 text-yellow-700 border-yellow-200",
  LUBRICACION:        "bg-indigo-100 text-indigo-700 border-indigo-200",
};

/* ══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════ */

export default function ModalTratamiento({ isOpen, aviso, onClose, onSuccess }) {
  const [trabajadores, setTrabajadores]         = useState([]);
  const [equipos, setEquipos]                   = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [showSolicitud, setShowSolicitud]       = useState(false);
  const [showConfigCampos, setShowConfigCampos] = useState(false);
  const [solicitudes, setSolicitudes]           = useState(null);
  const [collapsed, setCollapsed]               = useState({});

  const [data, setData] = useState({
    contratista: "",
    requerimientos: [
      { rol: "tecnico_electrico",         label: "Técnico Eléctrico",     cantidad: 0, personas: [], search: "", icon: Wrench,    color: "blue"   },
      { rol: "operario_de_mantenimiento", label: "Operario Mantenimiento", cantidad: 0, personas: [], search: "", icon: Settings,  color: "green"  },
      { rol: "tecnico_mecanico",          label: "Técnico Mecánico",      cantidad: 0, personas: [], search: "", icon: Briefcase, color: "purple" },
    ],
    actividadesManuales: {},
    planesSeleccionados: {},
  });

  /* ── Carga inicial ── */
  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      getTrabajadores({ activo: true }),
      equipoService.getEquipos(),
    ]).then(([tData, eData]) => {
      setTrabajadores(tData);
      setEquipos(eData);
    });
  }, [isOpen]);

  /* ── Helpers ── */
  const getEquipoInfo   = (id) => equipos.find(e => e.id === id) || { nombre: id, tag: id };
  const getEquipoFull   = (id) => equipos.find(e => e.id === id);
  const toggleCollapse  = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  /* ── Requerimientos ── */
  const updateReq = (i, changes) => {
    const reqs = [...data.requerimientos];
    reqs[i] = { ...reqs[i], ...changes };
    if (changes.cantidad !== undefined) reqs[i].personas = reqs[i].personas.slice(0, changes.cantidad);
    setData({ ...data, requerimientos: reqs });
  };

  const togglePersona = (i, persona) => {
    const r = data.requerimientos[i];
    const exists = r.personas.some(p => p.id === persona.id);
    if (!exists && r.personas.length >= r.cantidad) return;
    updateReq(i, {
      personas: exists ? r.personas.filter(p => p.id !== persona.id) : [...r.personas, persona],
    });
  };

  /* ── Actividades manuales (Correctivo) ── */
  const agregarActividad = (equipoId) =>
    setData(prev => ({
      ...prev,
      actividadesManuales: {
        ...prev.actividadesManuales,
        [equipoId]: [...(prev.actividadesManuales[equipoId] || []), { ...ACTIVIDAD_VACIA }],
      },
    }));

  const actualizarActividad = (equipoId, idx, campo, valor) =>
    setData(prev => {
      const lista = [...(prev.actividadesManuales[equipoId] || [])];
      lista[idx] = { ...lista[idx], [campo]: valor };
      return { ...prev, actividadesManuales: { ...prev.actividadesManuales, [equipoId]: lista } };
    });

  const eliminarActividad = (equipoId, idx) =>
    setData(prev => ({
      ...prev,
      actividadesManuales: {
        ...prev.actividadesManuales,
        [equipoId]: (prev.actividadesManuales[equipoId] || []).filter((_, i) => i !== idx),
      },
    }));

  /* ── Planes preventivos ── */
  const seleccionarPlan = (equipoId, planId) =>
    setData(prev => ({
      ...prev,
      planesSeleccionados: { ...prev.planesSeleccionados, [equipoId]: planId },
    }));

  /* ── Guardar ── */
  const handleGuardar = async () => {
    setLoading(true);
    try {
      await createTratamiento(aviso.id, {
        tratamiento: {
          contratista: data.contratista,
          requerimientos: data.requerimientos
            .filter(r => r.cantidad > 0)
            .map(r => ({ rol: r.rol, label: r.label, cantidad: r.cantidad, personas: r.personas.map(p => p.id) })),
          actividadesManuales: data.actividadesManuales,
          planesSeleccionados: data.planesSeleccionados,
        },
        solicitudGeneral:     solicitudes?.solicitudGeneral || null,
        solicitudesPorEquipo: solicitudes?.solicitudesPorEquipo || {},
      });
      onSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  /* ── Flags ── */
  const esCorrectivo = aviso?.tipoMantenimiento === "Correctivo";
  const esPreventivo = aviso?.tipoAviso === "mantenimiento" && aviso?.tipoMantenimiento === "Preventivo";
  const tieneEquipos = (aviso?.equiposRelacion?.length || 0) > 0;
  const cantSolicitudesIndividuales = Object.keys(solicitudes?.solicitudesPorEquipo || {}).length;

  if (!isOpen || !aviso) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-center items-center p-4">
        <div className="bg-white w-full max-w-7xl h-[94vh] rounded-3xl shadow-2xl flex flex-col">

          {/* ── HEADER ── */}
          <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center shrink-0">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-indigo-600 rounded-xl">
                <FileText className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Tratamiento del Aviso</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm text-gray-600">Aviso #{aviso.numeroAviso}</p>
                  {aviso.tipoMantenimiento && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      esCorrectivo ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {aviso.tipoMantenimiento}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X />
            </button>
          </div>

          {/* ── BODY ── */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">

            {/* INFORMACIÓN DEL AVISO */}
            <Section title="🧾 Información del Aviso">
              <Grid>
                {Object.entries(CAMPOS_AVISO).map(([key, label]) =>
                  aviso[key] && <Info key={key} label={label} value={aviso[key]} />
                )}
              </Grid>
              {aviso.descripcion && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Descripción</p>
                  <p className="text-sm text-gray-800">{aviso.descripcion}</p>
                </div>
              )}
              {tieneEquipos && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Equipos Asociados</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {aviso.equiposRelacion.map(e => {
                      const info = getEquipoInfo(e.equipoId);
                      return (
                        <div key={e.id} className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl">
                          <div className="p-2 bg-indigo-600 rounded-lg shrink-0"><Package className="w-5 h-5 text-white" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{info.nombre || info.tag || 'Sin nombre'}</p>
                            {info.tag && info.nombre && <p className="text-xs text-indigo-600 font-medium">TAG: {info.tag}</p>}
                            {info.ubicacion && <p className="text-xs text-gray-500">📍 {info.ubicacion}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Section>

            {/* CONTRATISTA */}
            <Section title="👷 Contratista">
              <input
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Nombre del contratista"
                value={data.contratista}
                onChange={e => setData({ ...data, contratista: e.target.value })}
              />
            </Section>

            {/* REQUERIMIENTOS */}
            <Section title="👥 Requerimientos de Personal">
              {data.requerimientos.map((r, i) => {
                const lista = trabajadores.filter(t =>
                  t.rol === r.rol && t.nombre.toLowerCase().includes(r.search.toLowerCase())
                );
                const Icon = r.icon;
                return (
                  <div key={r.rol} className="border rounded-xl p-5 bg-slate-50 mb-4 last:mb-0">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex gap-2 items-center">
                        <Icon className="w-5 h-5 text-gray-600" />
                        <strong className="text-gray-800">{r.label}</strong>
                        {r.cantidad > 0 && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            {r.personas.length}/{r.cantidad} asignados
                          </span>
                        )}
                      </div>
                      <input
                        type="number" min="0"
                        value={r.cantidad}
                        onChange={e => updateReq(i, { cantidad: +e.target.value })}
                        className="w-20 border rounded-lg px-3 py-2 text-center font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                    {r.cantidad > 0 && (
                      <>
                        <input
                          className="w-full mb-3 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          placeholder="Buscar trabajador..."
                          value={r.search}
                          onChange={e => updateReq(i, { search: e.target.value })}
                        />
                        <div className="flex flex-wrap gap-2">
                          {lista.length === 0 && (
                            <p className="text-sm text-gray-400 py-1">Sin resultados para "{r.search}"</p>
                          )}
                          {lista.map(t => {
                            const selected = r.personas.some(p => p.id === t.id);
                            const lleno    = !selected && r.personas.length >= r.cantidad;
                            return (
                              <button
                                key={t.id}
                                onClick={() => togglePersona(i, t)}
                                disabled={lleno}
                                className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                                  selected ? "bg-indigo-100 border-indigo-400 text-indigo-800 font-medium"
                                  : lleno   ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                  : "bg-white hover:bg-slate-50"
                                }`}
                              >
                                {selected && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                                {t.nombre}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </Section>

            {/* ══ CORRECTIVO ══ */}
            {esCorrectivo && tieneEquipos && (
              <Section title="🔧 Actividades por Equipo">
                {aviso.equiposRelacion.map(e => {
                  const info        = getEquipoInfo(e.equipoId);
                  const actividades = data.actividadesManuales[e.equipoId] || [];
                  const key         = `corr-${e.equipoId}`;
                  const abierto     = !collapsed[key];
                  return (
                    <div key={e.equipoId} className="border rounded-xl bg-slate-50 mb-4 last:mb-0 overflow-hidden">
                      <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleCollapse(key)}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-500 rounded-lg shrink-0"><Package className="w-4 h-4 text-white" /></div>
                          <div>
                            <p className="font-semibold text-gray-800">{info.nombre || info.tag || 'Sin nombre'}</p>
                            {info.tag && info.nombre && <p className="text-xs text-orange-600">TAG: {info.tag}</p>}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actividades.length > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"}`}>
                            {actividades.length} actividad{actividades.length !== 1 ? "es" : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={ev => { ev.stopPropagation(); agregarActividad(e.equipoId); if (!abierto) toggleCollapse(key); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors">
                            <Plus className="w-4 h-4" /> Agregar
                          </button>
                          {abierto ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>
                      </div>
                      {abierto && (
                        <div className="p-4 pt-0 space-y-3">
                          {actividades.length === 0 && (
                            <div className="flex flex-col items-center py-6 text-gray-400">
                              <ClipboardList className="w-8 h-8 mb-2 opacity-40" />
                              <p className="text-sm">Sin actividades. Presioná "+ Agregar".</p>
                            </div>
                          )}
                          {actividades.map((act, idx) => (
                            <div key={idx} className="border rounded-xl p-4 bg-white shadow-sm">
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <InputField placeholder="Sistema"    value={act.sistema}    onChange={v => actualizarActividad(e.equipoId, idx, "sistema", v)} />
                                <InputField placeholder="Subsistema" value={act.subsistema} onChange={v => actualizarActividad(e.equipoId, idx, "subsistema", v)} />
                                <InputField placeholder="Componente" value={act.componente} onChange={v => actualizarActividad(e.equipoId, idx, "componente", v)} />
                                <InputField placeholder="Tarea *"    value={act.tarea}      onChange={v => actualizarActividad(e.equipoId, idx, "tarea", v)} />
                              </div>
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <select className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                                  value={act.tipoTrabajo} onChange={ev => actualizarActividad(e.equipoId, idx, "tipoTrabajo", ev.target.value)}>
                                  {TIPOS_TRABAJO.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                                </select>
                                <InputField type="number" placeholder="Duración (min)" value={act.duracionEstimadaMin} onChange={v => actualizarActividad(e.equipoId, idx, "duracionEstimadaMin", +v)} />
                              </div>
                              <div className="flex gap-2">
                                <InputField placeholder="Observaciones (opcional)" value={act.observaciones} onChange={v => actualizarActividad(e.equipoId, idx, "observaciones", v)} className="flex-1" />
                                <button onClick={() => eliminarActividad(e.equipoId, idx)}
                                  className="px-3 py-2 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors shrink-0">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </Section>
            )}

            {/* ══ PREVENTIVO — Selección de plan + actividades ══ */}
            {esPreventivo && tieneEquipos && (
              <Section title="🧩 Plan de mantenimiento por equipo">
                {aviso.equiposRelacion.map(rel => {
                  const info        = getEquipoInfo(rel.equipoId);
                  const equipoFull  = getEquipoFull(rel.equipoId);
                  const planes      = equipoFull?.planesMantenimiento || [];
                  const planIdSel   = data.planesSeleccionados[rel.equipoId] || "";
                  const planSel     = planes.find(p => p.id === planIdSel);
                  const actividades = planSel?.actividades || [];
                  const key         = `prev-${rel.equipoId}`;
                  const abierto     = !collapsed[key];

                  // Estadísticas del plan
                  const totalMin = actividades.reduce((acc, a) => acc + (a.duracionMinutos || 0), 0);
                  const sistemas = [...new Set(actividades.map(a => a.sistema).filter(Boolean))];

                  return (
                    <div key={rel.equipoId} className="border rounded-xl bg-slate-50 mb-4 last:mb-0 overflow-hidden">

                      {/* ── Cabecera equipo ── */}
                      <div className="p-4 border-b bg-white">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-emerald-600 rounded-lg shrink-0">
                            <Package className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{info.nombre || info.tag || "Sin nombre"}</p>
                            {info.tag && info.nombre && <p className="text-xs text-emerald-600">TAG: {info.tag}</p>}
                            {info.ubicacion && <p className="text-xs text-gray-400">📍 {info.ubicacion}</p>}
                          </div>
                        </div>

                        {/* Selector de plan */}
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">
                            Plan de mantenimiento *
                          </label>
                          <select
                            value={planIdSel}
                            onChange={e => seleccionarPlan(rel.equipoId, e.target.value)}
                            className={`w-full border rounded-xl px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors ${
                              planIdSel ? "border-emerald-300 text-gray-800" : "border-gray-200 text-gray-400"
                            }`}
                          >
                            <option value="">Seleccionar plan...</option>
                            {planes.map(plan => (
                              <option key={plan.id} value={plan.id}>
                                {plan.codigoPlan} — {plan.nombre}
                              </option>
                            ))}
                          </select>
                          {planes.length === 0 && (
                            <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                              ⚠️ Este equipo no tiene planes asociados
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ── Detalles del plan seleccionado ── */}
                      {planSel && (
                        <>
                          {/* Resumen del plan */}
                          <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                {/* Nombre plan */}
                                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                                  <ClipboardList className="w-4 h-4" />
                                  {planSel.nombre}
                                </span>
                                {planSel.codigoPlan && (
                                  <span className="text-xs bg-white border border-emerald-300 text-emerald-700 px-2 py-0.5 rounded-full font-mono">
                                    {planSel.codigoPlan}
                                  </span>
                                )}
                                {planSel.frecuencia && (
                                  <span className="text-xs bg-white border border-emerald-300 text-emerald-700 px-2 py-0.5 rounded-full">
                                    🔄 {planSel.frecuencia}
                                  </span>
                                )}
                              </div>

                              {/* Stats */}
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-xs text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-full">
                                  <ClipboardList className="w-3.5 h-3.5" />
                                  <span>{actividades.length} actividad{actividades.length !== 1 ? "es" : ""}</span>
                                </div>
                                {totalMin > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-full">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{totalMin >= 60 ? `${Math.floor(totalMin/60)}h ${totalMin%60 > 0 ? `${totalMin%60}m` : ""}` : `${totalMin}m`}</span>
                                  </div>
                                )}
                                {sistemas.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-full">
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>{sistemas.length} sistema{sistemas.length !== 1 ? "s" : ""}</span>
                                  </div>
                                )}
                                {/* Botón colapsar/expandir */}
                                <button
                                  onClick={() => toggleCollapse(key)}
                                  className="flex items-center gap-1 text-xs text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-full hover:bg-emerald-50 transition-colors"
                                >
                                  {abierto ? <><ChevronUp className="w-3.5 h-3.5" /> Ocultar</> : <><ChevronDown className="w-3.5 h-3.5" /> Ver actividades</>}
                                </button>
                              </div>
                            </div>

                            {/* Descripción del plan */}
                            {planSel.descripcion && (
                              <p className="text-xs text-emerald-700 mt-2 opacity-80">{planSel.descripcion}</p>
                            )}
                          </div>

                          {/* ── Lista de actividades ── */}
                          {abierto && (
                            <div className="p-4">
                              {actividades.length === 0 ? (
                                <div className="flex flex-col items-center py-8 text-gray-400">
                                  <ClipboardList className="w-8 h-8 mb-2 opacity-40" />
                                  <p className="text-sm">Este plan no tiene actividades registradas.</p>
                                </div>
                              ) : (
                                <>
                                  {/* Agrupadas por sistema */}
                                  {sistemas.length > 0
                                    ? sistemas.map(sistema => {
                                        const actsDelSistema = actividades.filter(a => a.sistema === sistema);
                                        return (
                                          <div key={sistema} className="mb-4 last:mb-0">
                                            {/* Header sistema */}
                                            <div className="flex items-center gap-2 mb-2">
                                              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold">
                                                <Cpu className="w-3.5 h-3.5" />
                                                {sistema}
                                              </div>
                                              <div className="flex-1 h-px bg-emerald-200" />
                                              <span className="text-xs text-gray-400">{actsDelSistema.length} tarea{actsDelSistema.length !== 1 ? "s" : ""}</span>
                                            </div>

                                            {/* Actividades del sistema */}
                                            <div className="space-y-2 pl-2">
                                              {actsDelSistema.map((act, idx) => (
                                                <ActividadCard key={act.id || idx} act={act} />
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })
                                    : (
                                      <div className="space-y-2">
                                        {actividades.map((act, idx) => (
                                          <ActividadCard key={act.id || idx} act={act} />
                                        ))}
                                      </div>
                                    )
                                  }
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* Sin plan seleccionado → placeholder */}
                      {!planSel && planes.length > 0 && (
                        <div className="flex flex-col items-center py-8 text-gray-400">
                          <ClipboardList className="w-8 h-8 mb-2 opacity-30" />
                          <p className="text-sm">Seleccioná un plan para ver sus actividades.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Section>
            )}

          </div>

          {/* ── FOOTER ── */}
          <div className="p-6 border-t bg-gray-50 flex justify-between items-center shrink-0">
            <button onClick={onClose} className="px-6 py-3 border rounded-xl hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSolicitud(true)}
                className={`flex items-center gap-2 px-6 py-3 border rounded-xl transition-colors ${
                  solicitudes
                    ? "border-green-400 bg-green-50 text-green-700"
                    : "hover:bg-gray-100"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {solicitudes
                  ? `Solicitud cargada ✓${cantSolicitudesIndividuales > 0 ? ` (+${cantSolicitudesIndividuales} equipo${cantSolicitudesIndividuales > 1 ? "s" : ""})` : ""}`
                  : "Solicitud de Compra"
                }
              </button>
              <button
                onClick={handleGuardar}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? "Guardando..." : "Guardar Tratamiento"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ModalSolicitudCompra
        isOpen={showSolicitud}
        onClose={() => setShowSolicitud(false)}
        onConfirm={result => { setSolicitudes(result); setShowSolicitud(false); }}
        equiposRelacion={aviso?.equiposRelacion || []}
        equiposInfo={equipos}
      />

      <ModalConfiguracionCampos
        isOpen={showConfigCampos}
        onClose={() => setShowConfigCampos(false)}
      />
    </>
  );
}

/* ══════════════════════════════════════════════
   CARD DE ACTIVIDAD DEL PLAN
══════════════════════════════════════════════ */

function ActividadCard({ act }) {
  return (
    <div className="flex items-start gap-3 p-3.5 bg-white border border-gray-200 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all">
      {/* Indicador lateral */}
      <div className="w-1 self-stretch bg-emerald-400 rounded-full shrink-0" />

      <div className="flex-1 min-w-0">
        {/* Tarea principal */}
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <p className="font-semibold text-sm text-gray-900">{act.tarea}</p>
          {act.tipoTrabajo && (
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${COLOR_TIPO[act.tipoTrabajo] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {act.tipoTrabajo.replace(/_/g, " ")}
            </span>
          )}
        </div>

        {/* Ruta: sistema › subsistema › componente */}
        {(act.subsistema || act.componente) && (
          <p className="text-xs text-gray-500 mb-2">
            {[act.sistema, act.subsistema, act.componente].filter(Boolean).join(" › ")}
          </p>
        )}

        {/* Metadatos */}
        <div className="flex items-center gap-3 flex-wrap">
          {act.duracionMinutos > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {act.duracionMinutos} min
            </span>
          )}
          {act.subsistema && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Layers className="w-3 h-3" />
              {act.subsistema}
            </span>
          )}
          {act.componente && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Tag className="w-3 h-3" />
              {act.componente}
            </span>
          )}
        </div>

        {/* Observaciones */}
        {act.observaciones && (
          <p className="mt-1.5 text-xs text-gray-400 italic border-t border-gray-100 pt-1.5">
            {act.observaciones}
          </p>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════ */

function Section({ title, children }) {
  return (
    <div className="bg-white border rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-lg">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Info({ label, value }) {
  return (
    <div className="bg-slate-50 border rounded-xl p-3">
      <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function InputField({ placeholder, value, onChange, type = "text", className = "" }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full ${className}`}
    />
  );
}