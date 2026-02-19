import { useEffect, useState } from "react";
import { X, Plus, Trash2, Save, Wrench, Calendar, Clock, Users, ChevronDown, ChevronUp, Upload, FileText, Sparkles } from "lucide-react";
import { planMantenimientoService } from "../services/planMantenimientoService";
import { equipoService } from "../../mantenimiento/services/equipoService";

export default function ModalCrearPlan({ onClose, onCreated, equipoPreseleccionado }) {
  const [equipos, setEquipos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [actividadesExpandidas, setActividadesExpandidas] = useState({});

  const [form, setForm] = useState({
    familiaId: equipoPreseleccionado?.familia?.id || "",
    tipoEquipo: equipoPreseleccionado?.tipoEquipo || "",
    modeloEquipo: equipoPreseleccionado?.modelo || "",
    equipoId: equipoPreseleccionado?.id || "",
    nombre: equipoPreseleccionado 
      ? `Plan de Mantenimiento - ${equipoPreseleccionado.nombre || equipoPreseleccionado.codigo}` 
      : "",
    tipo: "PREVENTIVO",
  });

  const [actividades, setActividades] = useState([]);

  useEffect(() => {
    const loadEquipos = async () => {
      const data = await equipoService.getEquipos();

      const normalizados = data.map((e) => ({
        ...e,
        familiaId: e.familia?.id || null,
        familiaNombre: e.familia?.nombre || "",
        tipoEquipo: e.tipoEquipo || "",
        modelo: e.modelo || "",
      }));

      setEquipos(normalizados);
    };

    loadEquipos();
  }, []);

  const agregarActividad = () => {
    const nuevaActividad = {
      sistema: "",
      subsistema: "",
      componente: "",
      tarea: "",
      tipoTrabajo: "REVISION",
      rolTecnico: "tecnico_mecanico",
      frecuencia: "MENSUAL",
      frecuenciaHoras: null,
      duracionMinutos: 30,
      unidadDuracion: "min",
      cantidadTecnicos: 1,
      items: [],
      adjuntos: [],
    };
    setActividades([...actividades, nuevaActividad]);
    setActividadesExpandidas({ ...actividadesExpandidas, [actividades.length]: true });
  };

  const eliminarActividad = (index) => {
    setActividades(actividades.filter((_, i) => i !== index));
    const nuevasExpandidas = { ...actividadesExpandidas };
    delete nuevasExpandidas[index];
    setActividadesExpandidas(nuevasExpandidas);
  };

  const toggleActividad = (index) => {
    setActividadesExpandidas({
      ...actividadesExpandidas,
      [index]: !actividadesExpandidas[index],
    });
  };

  const handleActividadChange = (index, field, value) => {
    const copia = [...actividades];
    copia[index][field] = value;
    setActividades(copia);
  };

  const limpiarVacios = (obj) => {
    const limpio = {};

    Object.entries(obj).forEach(([key, value]) => {
      limpio[key] = value === "" ? null : value;
    });

    return limpio;
  };

  const guardarPlan = async () => {
    if (!form.nombre?.trim()) {
      alert("El nombre del plan es obligatorio");
      return;
    }

    if (!form.familiaId && !form.tipoEquipo && !form.modeloEquipo && !form.equipoId) {
      alert("Debe especificar al menos Familia, Tipo, Modelo o Equipo");
      return;
    }

    setGuardando(true);

    try {
      const payload = limpiarVacios(form);

      await planMantenimientoService.createPlan({
        ...payload,
        actividades,
      });

      onCreated();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message || "Error al guardar el plan");
    } finally {
      setGuardando(false);
    }
  };

  // Filtros independientes
  const familias = [
    ...new Map(
      equipos
        .filter((e) => e.familiaId)
        .map((e) => [
          e.familiaId,
          { id: e.familiaId, nombre: e.familiaNombre },
        ])
    ).values(),
  ];

  const tipos = [
    ...new Set(
      equipos
        .filter((e) => !form.familiaId || e.familiaId === form.familiaId)
        .map((e) => e.tipoEquipo)
        .filter(Boolean)
    ),
  ];

  const modelos = [
    ...new Set(
      equipos
        .filter((e) => {
          if (form.familiaId && e.familiaId !== form.familiaId) return false;
          if (form.tipoEquipo && e.tipoEquipo !== form.tipoEquipo) return false;
          return true;
        })
        .map((e) => e.modelo)
        .filter(Boolean)
    ),
  ];

  const equiposFiltrados = equipos.filter((e) => {
    if (form.familiaId && e.familiaId !== form.familiaId) return false;
    if (form.tipoEquipo && e.tipoEquipo !== form.tipoEquipo) return false;
    if (form.modeloEquipo && e.modelo !== form.modeloEquipo) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-7xl max-h-[96vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col animate-slideUp">
        {/* HEADER */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-xl p-3 rounded-2xl shadow-lg">
                <Wrench size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1 flex items-center gap-2">
                  Crear Plan de Mantenimiento
                  <Sparkles size={24} className="text-yellow-300" />
                </h2>
                <p className="text-blue-100 text-sm">
                  {equipoPreseleccionado 
                    ? `📌 Para equipo: ${equipoPreseleccionado.codigo} - ${equipoPreseleccionado.nombre || 'Sin nombre'}`
                    : 'Define las actividades y características del plan de forma detallada'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50">
          {/* DATOS DEL PLAN */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-800">Información del Plan</h3>
            </div>

            {equipoPreseleccionado && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Wrench className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-800">Plan vinculado a equipo específico</p>
                    <p className="text-xs text-green-600 mt-1">
                      Los campos de familia, tipo y modelo están pre-configurados según el equipo seleccionado
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* FAMILIA */}
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Familia
                </label>
                <select
                  value={form.familiaId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      familiaId: e.target.value,
                    })
                  }
                  disabled={!!equipoPreseleccionado}
                  className={`w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3.5 rounded-xl outline-none transition-all duration-200 ${
                    equipoPreseleccionado ? 'bg-slate-100 cursor-not-allowed' : 'bg-white hover:border-slate-400'
                  }`}
                >
                  <option value="">Todas las familias</option>
                  {familias.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* TIPO */}
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Tipo de Equipo
                </label>
                <select
                  value={form.tipoEquipo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tipoEquipo: e.target.value,
                      modeloEquipo: "",
                      equipoId: "",
                    })
                  }
                  disabled={!!equipoPreseleccionado}
                  className={`w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3.5 rounded-xl outline-none transition-all duration-200 ${
                    equipoPreseleccionado ? 'bg-slate-100 cursor-not-allowed' : 'bg-white hover:border-slate-400'
                  }`}
                >
                  <option value="">Todos los tipos</option>
                  {tipos.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* MODELO */}
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Modelo
                </label>
                <select
                  value={form.modeloEquipo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      modeloEquipo: e.target.value,
                      equipoId: "",
                    })
                  }
                  disabled={!!equipoPreseleccionado}
                  className={`w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3.5 rounded-xl outline-none transition-all duration-200 ${
                    equipoPreseleccionado ? 'bg-slate-100 cursor-not-allowed' : 'bg-white hover:border-slate-400'
                  }`}
                >
                  <option value="">Todos los modelos</option>
                  {modelos.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* EQUIPO ESPECÍFICO */}
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Equipo específico
                </label>
                <select
                  value={form.equipoId}
                  onChange={(e) => setForm({ ...form, equipoId: e.target.value })}
                  disabled={!!equipoPreseleccionado}
                  className={`w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3.5 rounded-xl outline-none transition-all duration-200 ${
                    equipoPreseleccionado ? 'bg-green-100 cursor-not-allowed font-semibold text-green-800' : 'bg-white hover:border-slate-400'
                  }`}
                >
                  <option value="">Todos los equipos</option>
                  {equiposFiltrados.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.codigo} - {eq.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* NOMBRE */}
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Nombre del Plan <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Ej: Mantenimiento Mensual Equipos"
                  className="w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3.5 rounded-xl outline-none transition-all duration-200 hover:border-slate-400"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>

              {/* TIPO DE PLAN */}
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Tipo de Plan
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3.5 rounded-xl outline-none transition-all duration-200 bg-white hover:border-slate-400"
                >
                  <option>PREVENTIVO</option>
                  <option>CORRECTIVO</option>
                  <option>MEJORA</option>
                  <option>INSPECCION</option>
                </select>
              </div>
            </div>
          </div>

          {/* ACTIVIDADES */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-green-600 to-emerald-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  Actividades del Plan
                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
                    {actividades.length}
                  </span>
                </h3>
              </div>
              <button
                onClick={agregarActividad}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 font-bold hover:scale-105"
              >
                <Plus size={20} strokeWidth={2.5} />
                Agregar Actividad
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
              {actividades.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-dashed border-slate-300">
                  <div className="bg-gradient-to-br from-slate-200 to-slate-300 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Plus className="text-slate-500" size={36} strokeWidth={2.5} />
                  </div>
                  <p className="text-slate-700 font-bold text-lg">Sin actividades</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Agrega actividades para completar este plan de mantenimiento
                  </p>
                </div>
              ) : (
                actividades.map((act, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                  >
                    {/* HEADER DE ACTIVIDAD */}
                    <div
                      className="flex items-center gap-3 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors duration-200"
                      onClick={() => toggleActividad(index)}
                    >
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                          Actividad {index + 1}
                        </span>
                        <h4 className="font-bold text-slate-800 text-lg">
                          {act.tarea || "Nueva actividad"}
                        </h4>
                        {act.sistema && (
                          <p className="text-sm text-slate-600 mt-1">
                            📍 {act.sistema}
                            {act.subsistema && ` → ${act.subsistema}`}
                            {act.componente && ` → ${act.componente}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarActividad(index);
                          }}
                          className="bg-red-100 hover:bg-red-200 text-red-600 p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
                        >
                          <Trash2 size={18} strokeWidth={2.5} />
                        </button>
                        {actividadesExpandidas[index] ? (
                          <ChevronUp className="text-slate-400" size={24} />
                        ) : (
                          <ChevronDown className="text-slate-400" size={24} />
                        )}
                      </div>
                    </div>

                    {/* CONTENIDO EXPANDIBLE */}
                    {actividadesExpandidas[index] && (
                      <div className="p-6 space-y-6 animate-slideDown">
                        {/* INFORMACIÓN BÁSICA */}
                        <div>
                          <h5 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                            Información Básica
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* SISTEMA */}
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">
                                Sistema <span className="text-red-500">*</span>
                              </label>
                              <input
                                placeholder="Ej: Sistema Eléctrico"
                                value={act.sistema}
                                onChange={(e) => handleActividadChange(index, "sistema", e.target.value)}
                                className="w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3 rounded-xl text-sm outline-none transition-all duration-200"
                              />
                            </div>

                            {/* SUBSISTEMA */}
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">
                                Subsistema
                              </label>
                              <input
                                placeholder="Ej: Tablero de Control"
                                value={act.subsistema}
                                onChange={(e) => handleActividadChange(index, "subsistema", e.target.value)}
                                className="w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3 rounded-xl text-sm outline-none transition-all duration-200"
                              />
                            </div>

                            {/* COMPONENTE */}
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">
                                Componente
                              </label>
                              <input
                                placeholder="Ej: Motor principal"
                                value={act.componente}
                                onChange={(e) => handleActividadChange(index, "componente", e.target.value)}
                                className="w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3 rounded-xl text-sm outline-none transition-all duration-200"
                              />
                            </div>

                            {/* TAREA */}
                            <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-slate-600 mb-2">
                                Tarea <span className="text-red-500">*</span>
                              </label>
                              <input
                                placeholder="Ej: Revisar rodamientos"
                                value={act.tarea}
                                onChange={(e) => handleActividadChange(index, "tarea", e.target.value)}
                                className="w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3 rounded-xl text-sm outline-none transition-all duration-200"
                              />
                            </div>

                            {/* TIPO DE TRABAJO */}
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">
                                Tipo de Trabajo
                              </label>
                              <select
                                value={act.tipoTrabajo}
                                onChange={(e) => handleActividadChange(index, "tipoTrabajo", e.target.value)}
                                className="w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3 rounded-xl text-sm outline-none transition-all duration-200 bg-white"
                              >
                                <option value="TORQUEO_REGULACION">Torqueo/Regulación</option>
                                <option value="APLICACION">Aplicación</option>
                                <option value="REVISION">Revisión</option>
                                <option value="INSPECCION">Inspección</option>
                                <option value="CAMBIO">Cambio</option>
                                <option value="LIMPIEZA">Limpieza</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* PROGRAMACIÓN */}
                        <div>
                          <h5 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
                            Programación y Recursos
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* FRECUENCIA */}
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                                <Calendar size={14} />
                                Frecuencia
                              </label>
                              <select
                                value={act.frecuencia}
                                onChange={(e) => handleActividadChange(index, "frecuencia", e.target.value)}
                                className="w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3 rounded-xl text-sm outline-none transition-all duration-200 bg-white"
                              >
                                <option value="POR_HORA">Por Hora</option>
                                <option value="DIARIA">Diaria</option>
                                <option value="SEMANAL">Semanal</option>
                                <option value="QUINCENAL">Quincenal</option>
                                <option value="MENSUAL">Mensual</option>
                                <option value="TRIMESTRAL">Trimestral</option>
                                <option value="SEMESTRAL">Semestral</option>
                                <option value="ANUAL">Anual</option>
                                <option value="BIENAL">Bienal</option>
                                <option value="QUINQUENAL">Quinquenal</option>
                              </select>
                            </div>

                            {/* FRECUENCIA HORAS */}
                            {act.frecuencia === "POR_HORA" && (
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">
                                  Cada cuántas horas <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={act.frecuenciaHoras || ""}
                                  onChange={(e) => handleActividadChange(index, "frecuenciaHoras", Number(e.target.value))}
                                  className="w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3 rounded-xl text-sm outline-none transition-all duration-200"
                                />
                              </div>
                            )}

                            {/* DURACIÓN */}
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                                <Clock size={14} />
                                Duración
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={act.duracionMinutos}
                                  onChange={(e) => handleActividadChange(index, "duracionMinutos", Number(e.target.value))}
                                  className="flex-1 border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3 rounded-xl text-sm outline-none transition-all duration-200"
                                  min="1"
                                />
                                <select
                                  value={act.unidadDuracion}
                                  onChange={(e) => handleActividadChange(index, "unidadDuracion", e.target.value)}
                                  className="border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3 rounded-xl text-sm outline-none transition-all duration-200 bg-white"
                                >
                                  <option value="min">min</option>
                                  <option value="h">h</option>
                                </select>
                              </div>
                            </div>

                            {/* ROL TÉCNICO */}
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">
                                Rol requerido <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={act.rolTecnico}
                                onChange={(e) => handleActividadChange(index, "rolTecnico", e.target.value)}
                                className="w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3 rounded-xl text-sm outline-none transition-all duration-200 bg-white"
                              >
                                <option value="tecnico_mecanico">Técnico Mecánico</option>
                                <option value="tecnico_electrico">Técnico Eléctrico</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="externo">Externo</option>
                              </select>
                            </div>

                            {/* TÉCNICOS */}
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                                <Users size={14} />
                                Cantidad Técnicos
                              </label>
                              <input
                                type="number"
                                value={act.cantidadTecnicos}
                                onChange={(e) => handleActividadChange(index, "cantidadTecnicos", Number(e.target.value))}
                                className="w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-3 rounded-xl text-sm outline-none transition-all duration-200"
                                min="1"
                              />
                            </div>
                          </div>
                        </div>

                        {/* RECURSOS (ITEMS) */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                              <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                              Recursos
                              {act.items.length > 0 && (
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-bold">
                                  {act.items.length}
                                </span>
                              )}
                            </h5>
                            <button
                              onClick={() =>
                                handleActividadChange(index, "items", [
                                  ...act.items,
                                  {
                                    recurso: "MATERIAL",
                                    itemCode: "",
                                    item: "",
                                    unidad: "",
                                    cantidad: 1,
                                    observacion: "",
                                  },
                                ])
                              }
                              className="flex items-center gap-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                            >
                              <Plus size={16} strokeWidth={2.5} />
                              Agregar Item
                            </button>
                          </div>

                          {act.items.length > 0 && (
                            <div className="space-y-3">
                              {act.items.map((item, itemIndex) => (
                                <div
                                  key={itemIndex}
                                  className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 relative hover:border-indigo-300 transition-all duration-200"
                                >
                                  <button
                                    onClick={() => {
                                      const nuevos = [...act.items];
                                      nuevos.splice(itemIndex, 1);
                                      handleActividadChange(index, "items", nuevos);
                                    }}
                                    className="absolute top-3 right-3 text-red-600 hover:text-red-800 bg-white rounded-lg p-1.5 hover:bg-red-50 transition-colors duration-200"
                                  >
                                    <Trash2 size={16} />
                                  </button>

                                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pr-10">
                                    {/* CÓDIGO */}
                                    <div>
                                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                                        Código <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        value={item.itemCode}
                                        onChange={(e) => {
                                          const nuevos = [...act.items];
                                          nuevos[itemIndex].itemCode = e.target.value;
                                          handleActividadChange(index, "items", nuevos);
                                        }}
                                        placeholder="Ej: MAT-001"
                                        className="w-full border-2 border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl p-2 text-sm outline-none transition-all duration-200"
                                      />
                                    </div>

                                    {/* ITEM */}
                                    <div className="md:col-span-2">
                                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                                        Item <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        value={item.item}
                                        onChange={(e) => {
                                          const nuevos = [...act.items];
                                          nuevos[itemIndex].item = e.target.value;
                                          handleActividadChange(index, "items", nuevos);
                                        }}
                                        placeholder="Ej: Grasa industrial"
                                        className="w-full border-2 border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl p-2 text-sm outline-none transition-all duration-200"
                                      />
                                    </div>

                                    {/* TIPO DE RECURSO */}
                                    <div>
                                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                                        Tipo
                                      </label>
                                      <select
                                        value={item.recurso}
                                        onChange={(e) => {
                                          const nuevos = [...act.items];
                                          nuevos[itemIndex].recurso = e.target.value;
                                          handleActividadChange(index, "items", nuevos);
                                        }}
                                        className="w-full border-2 border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl p-2 text-sm outline-none transition-all duration-200 bg-white"
                                      >
                                        <option value="MATERIAL">📦 Material</option>
                                        <option value="MANO_OBRA">👷 Mano de Obra</option>
                                        <option value="SERVICIO">🧾 Servicio</option>
                                      </select>
                                    </div>

                                    {/* UNIDAD */}
                                    <div>
                                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                                        Unidad <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        value={item.unidad}
                                        onChange={(e) => {
                                          const nuevos = [...act.items];
                                          nuevos[itemIndex].unidad = e.target.value;
                                          handleActividadChange(index, "items", nuevos);
                                        }}
                                        placeholder="kg, hr, unid"
                                        className="w-full border-2 border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl p-2 text-sm outline-none transition-all duration-200"
                                      />
                                    </div>

                                    {/* CANTIDAD */}
                                    <div>
                                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                                        Cantidad <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={item.cantidad}
                                        onChange={(e) => {
                                          const nuevos = [...act.items];
                                          nuevos[itemIndex].cantidad = Number(e.target.value);
                                          handleActividadChange(index, "items", nuevos);
                                        }}
                                        className="w-full border-2 border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl p-2 text-sm outline-none transition-all duration-200"
                                      />
                                    </div>

                                    {/* OBSERVACIÓN */}
                                    <div className="md:col-span-6">
                                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                                        Observación
                                      </label>
                                      <input
                                        value={item.observacion || ""}
                                        onChange={(e) => {
                                          const nuevos = [...act.items];
                                          nuevos[itemIndex].observacion = e.target.value;
                                          handleActividadChange(index, "items", nuevos);
                                        }}
                                        placeholder="Opcional"
                                        className="w-full border-2 border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl p-2 text-sm outline-none transition-all duration-200"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* ADJUNTOS */}
                        <div>
                          <h5 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                            Archivos Adjuntos
                            {act.adjuntos.length > 0 && (
                              <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">
                                {act.adjuntos.length}
                              </span>
                            )}
                          </h5>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105">
                              <Upload size={18} strokeWidth={2.5} />
                              Subir Archivos
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={async (e) => {
                                  const formData = new FormData();
                                  Array.from(e.target.files).forEach((f) => formData.append("files", f));

                                  const res = await fetch("/api/adjuntos/upload", {
                                    method: "POST",
                                    body: formData,
                                  });

                                  const archivos = await res.json();
                                  handleActividadChange(index, "adjuntos", [...act.adjuntos, ...archivos]);
                                }}
                              />
                            </label>
                          </div>

                          {act.adjuntos.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {act.adjuntos.map((a, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm"
                                >
                                  <FileText size={16} className="text-amber-600" />
                                  <span className="text-amber-800 font-medium flex-1 truncate">
                                    {a.nombre}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-gradient-to-t from-slate-100 via-slate-50 to-transparent p-6 border-t-2 border-slate-200">
          <div className="flex gap-4 justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3.5 rounded-xl font-bold text-slate-700 bg-white border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow"
            >
              Cancelar
            </button>
            <button
              onClick={guardarPlan}
              disabled={guardando}
              className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 disabled:from-slate-400 disabled:to-slate-500 text-white px-10 py-3.5 rounded-xl font-bold flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all duration-200 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
            >
              {guardando ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={22} strokeWidth={2.5} />
                  Guardar Plan
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 2000px;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}