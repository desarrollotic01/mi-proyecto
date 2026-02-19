import React, { useState, useEffect, useMemo } from "react";
import { crearNotificacionService } from "../services/notificacionService";
import { getTrabajadores } from "../../mantenimiento/services/trabajadoresService";
import { getOrdenTrabajoById } from "../../mantenimiento/services/ordenTrabajoService";

const CrearNotificacionModal = ({
  isOpen,
  onClose,
  ordenTrabajoId,
  // listaPlanes ya NO se usa — se extraen actividades de equipos[].actividades
}) => {


  const [ordenTrabajo, setOrdenTrabajo] = useState(null);  // ← estado interno
  const [loadingOrden, setLoadingOrden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTrabajadores, setLoadingTrabajadores] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const [form, setForm] = useState({
    fechaInicio: "",
    fechaFin: "",
    fechaUltimoMantenimientoPreventivo: "",
    horometro: "",
    numeroMisiones: "",
    numeroEquipo: "",
    codigoRepuesto: "",
    descripcionMantenimiento: "",
    descripcionGeneral: "",
    observaciones: "",
    recomendaciones: "",
    estadoGeneralEquipo: "OPERATIVO",
    tecnicos: [],
    // planes ahora usa actividadId en vez de planMantenimientoId
    planes: [],
  });

  const [listaTrabajadores, setListaTrabajadores] = useState([]);
  const [tecnicosSeleccionados, setTecnicosSeleccionados] = useState([]);
  const [filtroRol, setFiltroRol] = useState("");
  const [busquedaNombre, setBusquedaNombre] = useState("");

  const [correctivos, setCorrectivos] = useState([]);

  const [fotosAntes, setFotosAntes] = useState([]);
  const [fotosDespues, setFotosDespues] = useState([]);
  const [acta, setActa] = useState(null);
  const [informe, setInforme] = useState(null);
  const [checklistAdjunto, setChecklistAdjunto] = useState(null);
  const [archivoExtra, setArchivoExtra] = useState(null);

  // ─── Extraer actividades de equipos[].actividades ────────────────────────────
  // Estructura esperada:
  //   ordenTrabajo.equipos = [
  //     {
  //       id, numeroEquipo, descripcionEquipo,
  //       actividades: [
  //         {
  //           id, tarea, componente, tipoTrabajo,
  //           planMantenimientoId (puede ser null para correctivos)
  //         }
  //       ]
  //     }
  //   ]




  useEffect(() => {
    if (isOpen && ordenTrabajoId) {
      cargarOrdenTrabajo();
    }
  }, [isOpen, ordenTrabajoId]);

  const cargarOrdenTrabajo = async () => {
    try {
      setLoadingOrden(true);
      const data = await getOrdenTrabajoById(ordenTrabajoId);
      setOrdenTrabajo(data);
    } catch (error) {
      console.error("Error al cargar orden de trabajo:", error);
      setOrdenTrabajo(null);
    } finally {
      setLoadingOrden(false);
    }
  };


  const equiposConActividades = useMemo(() => {
    if (!ordenTrabajo?.equipos) return [];
    return ordenTrabajo.equipos
      .map((equipo) => ({
        ...equipo,
        actividades: Array.isArray(equipo.actividades) ? equipo.actividades : [],
      }))
      .filter((equipo) => equipo.actividades.length > 0);
  }, [ordenTrabajo]);

  const totalActividades = useMemo(
    () => equiposConActividades.reduce((acc, eq) => acc + eq.actividades.length, 0),
    [equiposConActividades]
  );

  const checklistCompletado = useMemo(
    () => form.planes.filter((p) => p.estado).length,
    [form.planes]
  );

  // ─── Cargar al abrir ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      cargarTrabajadores();
      resetForm();

      if (ordenTrabajo?.equipos && ordenTrabajo.equipos.length > 0) {
        const equiposNumeros = ordenTrabajo.equipos
          .map((eq) => eq.numeroEquipo || eq.descripcionEquipo)
          .filter(Boolean)
          .join(", ");
        setForm((prev) => ({ ...prev, numeroEquipo: equiposNumeros }));
      }
    }
  }, [isOpen, ordenTrabajo]);

  const cargarTrabajadores = async () => {
    try {
      setLoadingTrabajadores(true);
      const data = await getTrabajadores();
      setListaTrabajadores(data);
    } catch (error) {
      console.error("Error al cargar trabajadores:", error);
      setListaTrabajadores([]);
    } finally {
      setLoadingTrabajadores(false);
    }
  };

  const resetForm = () => {
      setForm({
      fechaInicio: "",
      fechaFin: "",
      fechaUltimoMantenimientoPreventivo: "",
      horometro: "",
      numeroMisiones: "",
      numeroEquipo: "",
      codigoRepuesto: "",
      descripcionMantenimiento: "",
      descripcionGeneral: "",
      observaciones: "",
      recomendaciones: "",
      estadoGeneralEquipo: "OPERATIVO",
      tecnicos: [],
      planes: [],
    });
    setCorrectivos([]);
    setTecnicosSeleccionados([]);
    setFiltroRol("");
    setBusquedaNombre("");
    setFotosAntes([]);
    setFotosDespues([]);
    setActa(null);
    setInforme(null);
    setChecklistAdjunto(null);
    setArchivoExtra(null);
    setActiveTab("general");
  };

  if (!isOpen) return null;


  if (loadingOrden) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-700 font-bold">Cargando orden de trabajo...</p>
      </div>
    </div>
  );
}

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ─── Técnicos ─────────────────────────────────────────────────────────────────
  const agregarTecnico = (trabajadorId) => {
    const trabajador = listaTrabajadores.find((t) => t.id === trabajadorId);
    if (!trabajador) return;
    if (tecnicosSeleccionados.some((t) => t.id === trabajadorId)) {
      alert("Este técnico ya fue agregado");
      return;
    }
    const rolFormateado = trabajador.rol
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    setTecnicosSeleccionados([
      ...tecnicosSeleccionados,
      {
        id: trabajador.id,
        nombre: `${trabajador.nombre} ${trabajador.apellido || ""}`,
        rol: rolFormateado,
        empresa: trabajador.empresa,
      },
    ]);
  };

  const eliminarTecnico = (id) => {
    setTecnicosSeleccionados(tecnicosSeleccionados.filter((t) => t.id !== id));
  };

  // ─── Checklist (actividades) ──────────────────────────────────────────────────
  // Cada entrada en form.planes:
  // { actividadId, planMantenimientoId (puede ser null), estado, comentario }
 const getActividad = (actividadId) =>
  form.planes.find((p) => p.ordenTrabajoActividadId === actividadId);



  const handleActividadEstado = (actividad, estado) => {
  const resto = form.planes.filter((p) => p.ordenTrabajoActividadId !== actividad.id);
  resto.push({
    ordenTrabajoActividadId: actividad.id,
    // si la actividad viene de un plan, guardamos su planMantenimientoActividadId
    planMantenimientoId: actividad.planMantenimientoActividadId ?? null,
    estado,
    comentario: getActividad(actividad.id)?.comentario || "",
  });
  setForm({ ...form, planes: resto });
};

  const handleActividadComentario = (actividad, comentario) => {
  const existente = getActividad(actividad.id);
  if (!existente) {
    setForm({
      ...form,
      planes: [
        ...form.planes,
        {
          ordenTrabajoActividadId: actividad.id,
          planMantenimientoId: actividad.planMantenimientoActividadId ?? null,
          estado: null,
          comentario,
        },
      ],
    });
  } else {
    setForm({
      ...form,
      planes: form.planes.map((p) =>
        p.ordenTrabajoActividadId === actividad.id ? { ...p, comentario } : p
      ),
    });
  }
};

  // ─── Correctivos ─────────────────────────────────────────────────────────────
  const agregarCorrectivo = () => {
    setCorrectivos([...correctivos, { id: Date.now(), fotos: [], comentario: "" }]);
  };
  const eliminarCorrectivo = (id) => {
    setCorrectivos(correctivos.filter((c) => c.id !== id));
  };
  const actualizarComentarioCorrectivo = (id, comentario) => {
    setCorrectivos(correctivos.map((c) => (c.id === id ? { ...c, comentario } : c)));
  };
  const actualizarFotosCorrectivo = (id, files) => {
    setCorrectivos(correctivos.map((c) => (c.id === id ? { ...c, fotos: files } : c)));
  };

  // ─── Adjuntos ─────────────────────────────────────────────────────────────────
  const convertirAdjuntos = () => {
    const lista = [];
    const mapFiles = (files, categoria) => {
      Array.from(files).forEach((file) => {
        lista.push({
          nombre: file.name,
          url: URL.createObjectURL(file),
          extension: file.name.split(".").pop(),
          categoria,
        });
      });
    };
    if (fotosAntes.length) mapFiles(fotosAntes, "ANTES");
    if (fotosDespues.length) mapFiles(fotosDespues, "DESPUES");
    correctivos.forEach((c) => {
      if (c.fotos.length) mapFiles(c.fotos, "CORRECTIVO");
    });
    if (acta)
      lista.push({ nombre: acta.name, url: URL.createObjectURL(acta), extension: acta.name.split(".").pop(), categoria: "ACTA_CONFORMIDAD" });
    if (informe)
      lista.push({ nombre: informe.name, url: URL.createObjectURL(informe), extension: informe.name.split(".").pop(), categoria: "INFORME" });
    if (checklistAdjunto)
      lista.push({ nombre: checklistAdjunto.name, url: URL.createObjectURL(checklistAdjunto), extension: checklistAdjunto.name.split(".").pop(), categoria: "CHECKLIST" });
    if (archivoExtra)
      lista.push({ nombre: archivoExtra.name, url: URL.createObjectURL(archivoExtra), extension: archivoExtra.name.split(".").pop(), categoria: "OTRO" });
    return lista;
  };

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      if (!form.fechaInicio || !form.fechaFin) {
        alert("⚠️ Las fechas de inicio y fin son obligatorias");
        return;
      }
      if (!acta) {
        alert("⚠️ El Acta de Conformidad es obligatoria");
        return;
      }
      if (tecnicosSeleccionados.length === 0) {
        const confirmar = window.confirm("No has seleccionado técnicos. ¿Deseas continuar?");
        if (!confirmar) return;
      }

      setLoading(true);

      const adjuntos = convertirAdjuntos();
      const resumenCorrectivos = correctivos
        .map((c, i) => `${i + 1}. ${c.comentario}`)
        .join("\n");

      // planes enviados al backend:
      // [{ actividadId, planMantenimientoId|null, estado, comentario }]
      await crearNotificacionService({
  ...form,
  resumenCorrectivos,
  ordenTrabajoId: ordenTrabajo.id,
  horometro: form.horometro ? Number(form.horometro) : null,
  numeroMisiones: form.numeroMisiones ? Number(form.numeroMisiones) : null,
  tecnicos: tecnicosSeleccionados.map((t) => t.id),
  adjuntos,
});

      alert("✅ Notificación creada correctamente");
      onClose();
      resetForm();
    } catch (error) {
      console.error(error);
      alert("❌ Error al crear notificación: " + (error.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers visuales ─────────────────────────────────────────────────────────
  const ESTADO_CONFIG = {
    OK:        { label: "✓ OK",   active: "bg-emerald-500 text-white shadow-md", hover: "hover:border-emerald-500" },
    NO_OK:     { label: "✗ NO OK", active: "bg-red-500 text-white shadow-md",     hover: "hover:border-red-500"     },
    NO_APLICA: { label: "— N/A",   active: "bg-slate-500 text-white shadow-md",   hover: "hover:border-slate-500"   },
  };

  const estadoBadgeColor = (estado) => {
    if (estado === "OK")        return "bg-emerald-100 text-emerald-700 border-emerald-300";
    if (estado === "NO_OK")     return "bg-red-100 text-red-700 border-red-300";
    if (estado === "NO_APLICA") return "bg-slate-100 text-slate-600 border-slate-300";
    return "bg-amber-50 text-amber-600 border-amber-200";
  };

const tipoTrabajoColor = (tipo) => {
  if (!tipo) return "bg-blue-100 text-blue-700";
  switch (tipo) {
    case "REVISION":            return "bg-blue-100 text-blue-700";
    case "INSPECCION":          return "bg-indigo-100 text-indigo-700";
    case "CAMBIO":              return "bg-red-100 text-red-700";
    case "LIMPIEZA":            return "bg-cyan-100 text-cyan-700";
    case "LUBRICACION":         return "bg-yellow-100 text-yellow-700";
    case "AJUSTE":              return "bg-orange-100 text-orange-700";
    case "APLICACION":          return "bg-green-100 text-green-700";
    case "TORQUEO_REGULACION":  return "bg-purple-100 text-purple-700";
    default:                    return "bg-slate-100 text-slate-700";
  }
};

  // Contadores para badge del tab checklist
  const countOK       = form.planes.filter((p) => p.estado === "OK").length;
  const countNO_OK    = form.planes.filter((p) => p.estado === "NO_OK").length;
  const countNA       = form.planes.filter((p) => p.estado === "NO_APLICA").length;
  const countPending  = totalActividades - countOK - countNO_OK - countNA;
  const checklistDone = countPending === 0 && totalActividades > 0;

  // ─── Tabs ─────────────────────────────────────────────────────────────────────
  const tabs = [
    { id: "general",     label: "General",    icon: "📋" },
    { id: "checklist",   label: "Checklist",  icon: "☑️",
      badge: totalActividades > 0
        ? { text: `${checklistCompletado}/${totalActividades}`, done: checklistDone }
        : null },
    { id: "correctivos", label: "Correctivos", icon: "🔧",
      badge: correctivos.length > 0 ? { text: correctivos.length, done: false } : null },
    { id: "adjuntos",    label: "Adjuntos",   icon: "📎" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] lg:max-w-7xl my-8">

        {/* ── HEADER ── */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-4xl">✅</span>
                Cierre Técnico
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-amber-100 text-sm">
                  OT #{ordenTrabajo?.numeroOT || ordenTrabajo?.id}
                </p>
                {ordenTrabajo?.equipos && ordenTrabajo.equipos.length > 0 && (
                  <p className="text-amber-100 text-sm">
                    • {ordenTrabajo.equipos.length} equipo(s)
                  </p>
                )}
                {totalActividades > 0 && (
                  <p className="text-amber-100 text-sm">
                    • {totalActividades} actividad(es)
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-xl p-2 transition-all duration-200 hover:rotate-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-8 py-4 font-bold transition-all whitespace-nowrap relative
                  ${activeTab === tab.id
                    ? "text-amber-600 bg-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`
                      text-xs font-bold px-2 py-0.5 rounded-full
                      ${tab.badge.done
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"}
                    `}>
                      {tab.badge.text}
                    </span>
                  )}
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="p-8 max-h-[70vh] overflow-y-auto">

          {/* ════ TAB: GENERAL ════ */}
          {activeTab === "general" && (
            <div className="space-y-6">

              {/* FECHAS */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">📅</span> Fechas del Mantenimiento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Inicio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="fechaInicio"
                      value={form.fechaInicio}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Fin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="fechaFin"
                      value={form.fechaFin}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Último Preventivo
                    </label>
                    <input
                      type="date"
                      name="fechaUltimoMantenimientoPreventivo"
                      value={form.fechaUltimoMantenimientoPreventivo}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* TÉCNICOS */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-5 border border-purple-200">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">👥</span> Técnicos que Ejecutaron
                </h3>

                {tecnicosSeleccionados.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-xs font-bold text-slate-600 mb-2">
                      Seleccionados ({tecnicosSeleccionados.length})
                    </p>
                    {tecnicosSeleccionados.map((tecnico) => (
                      <div
                        key={tecnico.id}
                        className="bg-white rounded-lg p-3 border-2 border-purple-300 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 rounded-full p-2">
                            <span className="text-base">👤</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{tecnico.nombre}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                                {tecnico.rol}
                              </span>
                              <span className="text-xs text-slate-500">• {tecnico.empresa}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarTecnico(tecnico.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg p-2 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                  <p className="text-xs font-bold text-slate-700 mb-3">Agregar Técnico</p>
                  {loadingTrabajadores ? (
                    <div className="text-center py-6">
                      <div className="inline-block w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-600 mt-2 text-sm">Cargando trabajadores...</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">Filtrar por Rol</label>
                          <select
                            value={filtroRol}
                            onChange={(e) => setFiltroRol(e.target.value)}
                            className="w-full px-3 py-2 text-xs border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="">Todos los roles</option>
                            <option value="tecnico_electrico">Técnico Eléctrico</option>
                            <option value="tecnico_mecanico">Técnico Mecánico</option>
                            <option value="operario_de_mantenimiento">Operario de Mantenimiento</option>
                            <option value="supervisor">Supervisor</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">Buscar por Nombre</label>
                          <input
                            type="text"
                            placeholder="Escribe el nombre..."
                            value={busquedaNombre}
                            onChange={(e) => setBusquedaNombre(e.target.value)}
                            className="w-full px-3 py-2 text-xs border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto border-2 border-slate-200 rounded-lg">
                        {(() => {
                          const filtrados = listaTrabajadores.filter((t) => {
                            const rolOk = !filtroRol || t.rol === filtroRol;
                            const nombreOk =
                              !busquedaNombre ||
                              `${t.nombre} ${t.apellido}`.toLowerCase().includes(busquedaNombre.toLowerCase());
                            const noAgregado = !tecnicosSeleccionados.some((s) => s.id === t.id);
                            return rolOk && nombreOk && noAgregado;
                          });

                          if (filtrados.length === 0) {
                            return (
                              <div className="text-center py-6 text-slate-400">
                                <p className="text-sm">No hay trabajadores disponibles</p>
                                <p className="text-xs mt-1">Intenta cambiar los filtros</p>
                              </div>
                            );
                          }

                          return filtrados.map((trabajador) => (
                            <button
                              key={trabajador.id}
                              type="button"
                              onClick={() => agregarTecnico(trabajador.id)}
                              className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-all border-b border-slate-100 last:border-b-0 flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-purple-100 group-hover:bg-purple-200 rounded-full p-2 transition-all">
                                  <span className="text-sm">👤</span>
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 text-sm">
                                    {trabajador.nombre} {trabajador.apellido}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                                      {trabajador.rol.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </span>
                                    <span className="text-xs text-slate-500">• {trabajador.empresa}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-purple-600 opacity-0 group-hover:opacity-100 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                            </button>
                          ));
                        })()}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* DATOS OPERATIVOS */}
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-5 border border-green-200">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">⚙️</span> Datos Operativos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Horómetro</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      name="horometro"
                      value={form.horometro}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Número de Misiones</label>
                    <input
                      type="number"
                      placeholder="0"
                      name="numeroMisiones"
                      value={form.numeroMisiones}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Número de Equipo</label>
                    <input
                      type="text"
                      name="numeroEquipo"
                      value={form.numeroEquipo}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      disabled
                    />
                    <p className="text-xs text-green-600 mt-1">✓ Cargado desde la orden de trabajo</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Código de Repuesto</label>
                    <input
                      type="text"
                      placeholder="Ej: REP-123"
                      name="codigoRepuesto"
                      value={form.codigoRepuesto}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* ESTADO DEL EQUIPO */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-5 border border-orange-200">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🔧</span> Estado General del Equipo{" "}
                  <span className="text-red-500">*</span>
                </h3>
                <select
                  name="estadoGeneralEquipo"
                  value={form.estadoGeneralEquipo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-semibold"
                  required
                >
                  <option value="OPERATIVO">✅ Operativo</option>
                  <option value="INOPERATIVO">❌ Inoperativo</option>
                  <option value="OPERATIVO_CON_OBSERVACIONES">⚠️ Operativo con Observaciones</option>
                </select>
              </div>

              {/* DESCRIPCIONES */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-5 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">📝</span> Descripciones
                </h3>
                <div className="space-y-3">
                  {[
                    { name: "descripcionGeneral",        label: "Descripción General",           placeholder: "Descripción general..." },
                    { name: "descripcionMantenimiento",  label: "Descripción del Mantenimiento", placeholder: "Mantenimiento realizado..." },
                    { name: "observaciones",             label: "Observaciones",                 placeholder: "Observaciones..." },
                    { name: "recomendaciones",           label: "Recomendaciones",               placeholder: "Recomendaciones..." },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">{field.label}</label>
                      <textarea
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleChange}
                        rows="2"
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* FOTOS ANTES Y DESPUÉS */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-5 border border-indigo-200">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">📸</span> Fotos del Mantenimiento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: "Fotos Antes",   state: fotosAntes,   setter: setFotosAntes },
                    { label: "Fotos Después", state: fotosDespues, setter: setFotosDespues },
                  ].map(({ label, state, setter }) => (
                    <div key={label}>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setter(e.target.files)}
                        className="w-full text-sm px-3 py-2 border-2 border-dashed border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-indigo-400 cursor-pointer bg-white"
                      />
                      {state.length > 0 && (
                        <p className="text-xs text-emerald-600 font-semibold mt-1.5">
                          ✓ {state.length} archivo(s)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ TAB: CHECKLIST ════ */}
          {activeTab === "checklist" && (
            <div className="space-y-4">

              {/* Barra de progreso */}
              {totalActividades > 0 && (
                <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-700">Progreso del Checklist</h3>
                    <span className={`text-sm font-bold ${checklistDone ? "text-emerald-600" : "text-amber-600"}`}>
                      {checklistCompletado}/{totalActividades}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${checklistDone ? "bg-emerald-500" : "bg-amber-500"}`}
                      style={{ width: `${totalActividades > 0 ? (checklistCompletado / totalActividades) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" /> OK: {countOK}
                    </span>
                    <span className="flex items-center gap-1 text-red-700 font-semibold">
                      <span className="w-2 h-2 bg-red-500 rounded-full inline-block" /> NO OK: {countNO_OK}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 font-semibold">
                      <span className="w-2 h-2 bg-slate-400 rounded-full inline-block" /> N/A: {countNA}
                    </span>
                    {countPending > 0 && (
                      <span className="flex items-center gap-1 text-amber-700 font-semibold">
                        <span className="w-2 h-2 bg-amber-400 rounded-full inline-block" /> Pendiente: {countPending}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Sin actividades */}
              {equiposConActividades.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                  <div className="text-5xl mb-3">☑️</div>
                  <p className="text-sm text-slate-600 mb-1">
                    Esta orden no tiene actividades de checklist registradas
                  </p>
                  <p className="text-xs text-slate-400">
                    Las actividades se cargan desde <code className="bg-slate-200 px-1 rounded">equipos[].actividades</code>
                  </p>
                </div>
              )}

              {/* Agrupado por equipo */}
              {equiposConActividades.map((equipo) => (
                <div
                  key={equipo.id}
                  className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm"
                >
                  {/* Cabecera del equipo */}
                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🖥️</span>
                      <div>
                        <p className="font-bold text-white text-sm">
                          {equipo.numeroEquipo || equipo.descripcionEquipo || `Equipo ${equipo.id}`}
                        </p>
                        {equipo.descripcionEquipo && equipo.numeroEquipo && (
                          <p className="text-slate-300 text-xs">{equipo.descripcionEquipo}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-semibold">
                      {equipo.actividades.length} actividad(es)
                    </span>
                  </div>

                  {/* Actividades del equipo */}
                  <div className="divide-y divide-slate-100 bg-white">
                    {equipo.actividades.map((actividad, idx) => {
                      const registrado = getActividad(actividad.id);
                      const estadoActual = registrado?.estado;
                      const esDePlan = !!actividad.planMantenimientoActividadId;


                      return (
                        <div
                          key={actividad.id}
                          className={`p-4 transition-all ${estadoActual ? "bg-white" : "bg-amber-50/40"}`}
                        >
                          {/* Fila superior: info actividad + estado badge */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                                {actividad.tipoTrabajo && (
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tipoTrabajoColor(actividad.tipoTrabajo)}`}>
                                    {actividad.tipoTrabajo}
                                  </span>
                                )}
                                {esDePlan ? (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                    Del plan
                                  </span>
                                ) : (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                    Manual
                                  </span>
                                )}
                              </div>
                              <p className="font-bold text-slate-800 text-sm leading-snug">
                                {actividad.tarea || actividad.descripcion || `Actividad ${actividad.id}`}
                              </p>
                              {actividad.componente && (
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                  <span>⚙️</span> {actividad.componente}
                                </p>
                              )}
                            </div>

                            {/* Estado badge */}
                            {estadoActual && (
                              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${estadoBadgeColor(estadoActual)} shrink-0`}>
                                {estadoActual === "OK" ? "✓ OK" : estadoActual === "NO_OK" ? "✗ NO OK" : "— N/A"}
                              </span>
                            )}
                          </div>

                          {/* Botones de estado */}
                          <div className="flex gap-2 mb-2">
                            {Object.entries(ESTADO_CONFIG).map(([estadoKey, config]) => (
                              <button
                                key={estadoKey}
                                type="button"
                                onClick={() => handleActividadEstado(actividad, estadoKey)}
                                className={`
                                  flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border-2
                                  ${estadoActual === estadoKey
                                    ? config.active
                                    : `bg-white text-slate-600 border-slate-300 ${config.hover}`}
                                `}
                              >
                                {config.label}
                              </button>
                            ))}
                          </div>

                          {/* Comentario — solo si hay estado seleccionado */}
                          {estadoActual && (
                            <textarea
                              placeholder="Comentarios adicionales (opcional)..."
                              value={registrado?.comentario || ""}
                              onChange={(e) => handleActividadComentario(actividad, e.target.value)}
                              rows="2"
                              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-xs transition-all"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ════ TAB: CORRECTIVOS ════ */}
          {activeTab === "correctivos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-xl">🔧</span> Trabajos Correctivos
                </h3>
                <button
                  type="button"
                  onClick={agregarCorrectivo}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-bold hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span className="text-lg">+</span> Agregar Correctivo
                </button>
              </div>

              {correctivos.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                  <div className="text-5xl mb-3">🔧</div>
                  <p className="text-sm text-slate-600 mb-1">No hay correctivos registrados</p>
                  <p className="text-xs text-slate-500">Haz clic en "Agregar Correctivo" para empezar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {correctivos.map((correctivo, index) => (
                    <div
                      key={correctivo.id}
                      className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 border-2 border-red-200 relative"
                    >
                      <button
                        type="button"
                        onClick={() => eliminarCorrectivo(correctivo.id)}
                        className="absolute top-3 right-3 text-red-600 hover:text-red-800 hover:bg-red-200 rounded-lg p-1.5 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <h4 className="font-bold text-slate-800 mb-3 text-sm">Correctivo #{index + 1}</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            Descripción del Correctivo
                          </label>
                          <textarea
                            value={correctivo.comentario}
                            onChange={(e) => actualizarComentarioCorrectivo(correctivo.id, e.target.value)}
                            rows="2"
                            placeholder="Describe el trabajo correctivo realizado..."
                            className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            Fotos del Correctivo
                          </label>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => actualizarFotosCorrectivo(correctivo.id, e.target.files)}
                            className="w-full text-sm px-3 py-2 border-2 border-dashed border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all hover:border-red-400 cursor-pointer bg-white"
                          />
                          {correctivo.fotos.length > 0 && (
                            <p className="text-xs text-emerald-600 font-semibold mt-1.5">
                              ✓ {correctivo.fotos.length} archivo(s)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ TAB: ADJUNTOS ════ */}
          {activeTab === "adjuntos" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-xl">📎</span> Documentos Adjuntos
              </h3>

              {/* ACTA DE CONFORMIDAD */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border-2 border-emerald-300">
                <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  Acta de Conformidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setActa(e.target.files[0])}
                  className="w-full text-sm px-3 py-2 border-2 border-dashed border-emerald-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-emerald-500 cursor-pointer bg-white"
                  required
                />
                {acta && (
                  <p className="text-xs text-emerald-700 font-bold mt-2 flex items-center gap-2 bg-emerald-200 px-3 py-1.5 rounded-lg">
                    <span>✓</span> {acta.name}
                  </p>
                )}
              </div>

              {/* OTROS DOCUMENTOS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: "📄 Informe",            state: informe,          setter: setInforme,          accept: ".pdf,.doc,.docx",          color: "blue"   },
                  { label: "📄 Checklist",           state: checklistAdjunto, setter: setChecklistAdjunto, accept: ".pdf,.doc,.docx,.xlsx,.xls", color: "purple" },
                  { label: "📎 Archivo Adicional",   state: archivoExtra,     setter: setArchivoExtra,     accept: "*",                        color: "orange" },
                ].map(({ label, state, setter, accept, color }) => (
                  <div
                    key={label}
                    className={`bg-white rounded-lg p-4 border-2 border-slate-200 hover:border-${color}-300 transition-all`}
                  >
                    <label className="block text-sm font-bold text-slate-800 mb-2">{label}</label>
                    <input
                      type="file"
                      accept={accept}
                      onChange={(e) => setter(e.target.files[0])}
                      className="w-full text-xs"
                    />
                    {state && (
                      <p className={`text-xs text-${color}-600 mt-1.5 truncate`}>✓ {state.name}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="border-t-2 border-slate-200 p-5 bg-gradient-to-b from-slate-50 to-white rounded-b-3xl">
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <span className="text-red-500">*</span>
              <span>Campos obligatorios</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-700 bg-white border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50 shadow-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:via-amber-700 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Guardar Notificación</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CrearNotificacionModal;