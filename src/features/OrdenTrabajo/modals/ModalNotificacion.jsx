import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Package,
  MapPinned,
  Clock3,
  UserCog,
} from "lucide-react";

import {
  crearNotificacionService,
  getNotificacionesByOT,
  abrirPdfNotificacion,
} from "../services/notificacionService";
import { uploadArchivos } from "../../adjuntos/services/adjuntosService";
import { getTrabajadores } from "../../mantenimiento/services/trabajadoresService";
import { getOrdenTrabajoById, updateOrdenTrabajoCompleta } from "../../mantenimiento/services/ordenTrabajoService";

/* =========================================================
   HELPERS GENERALES
========================================================= */

const formatearRol = (rol = "") =>
  String(rol)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

const getRegistroOTLabel = (registro) => {
  if (!registro) return "No seleccionado";

  if (registro?.equipoId) {
    return (
      registro?.numeroEquipo ||
      registro?.equipo?.codigo ||
      registro?.equipo?.nombre ||
      registro?.descripcionEquipo ||
      `Equipo ${registro.id}`
    );
  }

  if (registro?.ubicacionTecnicaId) {
    return (
      registro?.ubicacionTecnica?.codigo ||
      registro?.ubicacionTecnica?.nombre ||
      registro?.descripcionUbicacion ||
      `Ubicación técnica ${registro.id}`
    );
  }

  return `Registro ${registro.id}`;
};

const getRegistroOTSubLabel = (registro) => {
  if (!registro) return "";

  if (registro?.equipoId) {
    if (registro?.equipo?.nombre) {
      return `${registro.equipo.nombre}${
        registro.equipo.codigo ? ` • ${registro.equipo.codigo}` : ""
      }`;
    }
    return registro?.descripcionEquipo || "";
  }

  if (registro?.ubicacionTecnicaId) {
    if (registro?.ubicacionTecnica?.nombre) {
      return `${registro.ubicacionTecnica.nombre}${
        registro.ubicacionTecnica.codigo
          ? ` • ${registro.ubicacionTecnica.codigo}`
          : ""
      }`;
    }
    return registro?.descripcionUbicacion || "";
  }

  return "";
};

const getRegistroOTTipo = (registro) => {
  if (registro?.equipoId) return "EQUIPO";
  if (registro?.ubicacionTecnicaId) return "UBICACION_TECNICA";
  return "REGISTRO";
};

const getRegistroOTIcon = (registro) => {
  if (registro?.equipoId) return Package;
  if (registro?.ubicacionTecnicaId) return MapPinned;
  return Package;
};

const buildDefaultPlanItem = (actividad) => ({
  ordenTrabajoActividadId: actividad.id,
  planMantenimientoId: actividad.planMantenimientoId || null,
  estado: null,
  comentario: "",
  trabajadorId: null,
  duracionPlan: null,
  unidadDuracionPlan: "min",
  fechaInicioPlan: null,
  fechaFinPlan: null,
  observaciones: "",
});

const safeArray = (value) => (Array.isArray(value) ? value : []);

/* =========================================================
   MODAL ELEGIR REGISTRO OT
========================================================= */

function ModalElegirEquipo({
  open,
  equipos = [],
  notiByEquipoOTId,
  onSelect,
  onClose,
}) {
  if (!open) return null;

  const handleCardKeyDown = (e, item, creado) => {
    if (creado) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(item);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-slate-700 to-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Seleccionar registro para Notificación</h3>
            <p className="text-white/80 text-xs mt-0.5">
              Los registros que ya tienen notificación están bloqueados y muestran botón PDF.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg hover:bg-white/15"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {equipos.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No hay registros en la OT.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {equipos.map((eq) => {
                const label = getRegistroOTLabel(eq);
                const sub = getRegistroOTSubLabel(eq);
                const tipo = getRegistroOTTipo(eq);
                const Icon = getRegistroOTIcon(eq);

                const acts = Array.isArray(eq.actividades) ? eq.actividades.length : 0;
                const noti = notiByEquipoOTId?.get(eq.id);
                const creado = !!noti;

                return (
                  <div
                    key={eq.id}
                    role="button"
                    tabIndex={creado ? -1 : 0}
                    aria-disabled={creado}
                    onClick={() => !creado && onSelect(eq)}
                    onKeyDown={(e) => handleCardKeyDown(e, eq, creado)}
                    className={[
                      "w-full text-left p-4 rounded-xl border-2 transition-all flex items-start justify-between gap-3 select-none",
                      creado
                        ? "border-emerald-300 bg-emerald-50 opacity-90 cursor-not-allowed"
                        : "border-slate-200 hover:border-amber-400 hover:bg-amber-50 cursor-pointer",
                      !creado ? "focus:outline-none focus:ring-2 focus:ring-amber-500" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-slate-900 shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">{label}</div>

                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {tipo === "EQUIPO" ? "Equipo" : "Ubicación técnica"}
                          </span>

                          {sub ? (
                            <div className="text-xs text-slate-500 truncate">{sub}</div>
                          ) : null}
                        </div>

                        {creado ? (
                          <div className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                            <CheckCircle2 className="w-4 h-4" />
                            Notificación creada{" "}
                            <span className="text-emerald-800/70 font-semibold">
                              #{noti?.id}
                            </span>
                          </div>
                        ) : (
                          <div className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                            <AlertCircle className="w-4 h-4" />
                            Pendiente
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                        {acts} actividad(es)
                      </span>

                      {creado ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirPdfNotificacion(noti.id);
                          }}
                          className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-red-600 text-white hover:bg-red-700"
                          title="Abrir PDF"
                        >
                          <FileText className="w-4 h-4" />
                          PDF
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-slate-200 text-slate-600">
                          <Lock className="w-4 h-4" />
                          Crear
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border-2 border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL PRINCIPAL
========================================================= */

const CrearNotificacionModal = ({ isOpen, onClose, ordenTrabajoId, tipoAviso }) => {
  const esVenta = tipoAviso === "venta";
  const [ordenTrabajo, setOrdenTrabajo] = useState(null);
  const [loadingOrden, setLoadingOrden] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingTrabajadores, setLoadingTrabajadores] = useState(false);
  const [loadingNotis, setLoadingNotis] = useState(false);

  const [activeTab, setActiveTab] = useState("general");

  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [openSelectEquipo, setOpenSelectEquipo] = useState(false);

  const [notificacionesOT, setNotificacionesOT] = useState([]);

  const [form, setForm] = useState({
    fechaInicio: "",
    fechaFin: "",
    fechaUltimoMantenimientoPreventivo: "",
    horometro: "",
    numeroMisiones: "",
    numeroEquipo: "",
    descripcionMantenimiento: "",
    descripcionGeneral: "",
    observaciones: "",
    recomendaciones: "",
    estadoGeneralEquipo: "OPERATIVO",
    tecnicos: [],
    planes: [],
  });

  const [listaTrabajadores, setListaTrabajadores] = useState([]);
  const [tecnicosSeleccionados, setTecnicosSeleccionados] = useState([]);
  const [filtroRol, setFiltroRol] = useState("");
  const [busquedaNombre, setBusquedaNombre] = useState("");

  const [correctivos, setCorrectivos] = useState([]);
  const [gruposAntesDespues, setGruposAntesDespues] = useState([
    { id: 1, descripcion: "", fotosAntes: [], fotosDespues: [] },
  ]);

  const [acta, setActa] = useState(null);
  const [informe, setInforme] = useState(null);
  const [checklistAdjunto, setChecklistAdjunto] = useState(null);
  const [archivoExtra, setArchivoExtra] = useState(null);

  // Estado para venta (formulario simplificado)
  const [ventaForm, setVentaForm] = useState({
    actividadCompletada: false,
    fechaCompletado: new Date().toISOString().slice(0, 16),
    observaciones: "",
  });
  const [ventaLoading, setVentaLoading] = useState(false);

  /* =========================================================
     CARGAS
  ========================================================= */

  const cargarOrdenTrabajo = async () => {
    try {
      setLoadingOrden(true);
      const data = await getOrdenTrabajoById(ordenTrabajoId);
      setOrdenTrabajo(data);

      const registros = Array.isArray(data?.equipos) ? data.equipos : [];

      if (registros.length === 1) {
        setEquipoSeleccionado(registros[0]);
      } else {
        setEquipoSeleccionado(null);
      }
    } catch (error) {
      console.error("Error al cargar orden de trabajo:", error);
      setOrdenTrabajo(null);
      setEquipoSeleccionado(null);
    } finally {
      setLoadingOrden(false);
    }
  };

  const cargarNotificacionesOT = async () => {
    try {
      setLoadingNotis(true);
      const data = await getNotificacionesByOT(ordenTrabajoId);
      setNotificacionesOT(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al listar notificaciones OT:", error);
      setNotificacionesOT([]);
    } finally {
      setLoadingNotis(false);
    }
  };

  const cargarTrabajadores = async () => {
    try {
      setLoadingTrabajadores(true);
      const data = await getTrabajadores();
      setListaTrabajadores(Array.isArray(data) ? data : []);
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
    setGruposAntesDespues([{ id: Date.now(), descripcion: "", fotosAntes: [], fotosDespues: [] }]);
    setActa(null);
    setInforme(null);
    setChecklistAdjunto(null);
    setArchivoExtra(null);
    setActiveTab("general");
  };

  /* =========================================================
     EFFECTS
  ========================================================= */

  useEffect(() => {
    if (!isOpen || !ordenTrabajoId) return;

    (async () => {
      resetForm();
      await Promise.all([
        cargarOrdenTrabajo(),
        cargarTrabajadores(),
        cargarNotificacionesOT(),
      ]);
    })();
  }, [isOpen, ordenTrabajoId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!esVenta) setOpenSelectEquipo(true);
  }, [isOpen, esVenta]);

  /* =========================================================
     COMPUTED
  ========================================================= */

  const equiposOT = useMemo(() => {
    if (!ordenTrabajo?.equipos) return [];
    return ordenTrabajo.equipos.map((eq) => ({
      ...eq,
      actividades: Array.isArray(eq.actividades) ? eq.actividades : [],
      trabajadores: Array.isArray(eq.trabajadores) ? eq.trabajadores : [],
    }));
  }, [ordenTrabajo]);

  const notiByEquipoOTId = useMemo(() => {
    const map = new Map();
    (notificacionesOT || []).forEach((n) => {
      if (n?.ordenTrabajoEquipoId) {
        map.set(n.ordenTrabajoEquipoId, n);
      }
    });
    return map;
  }, [notificacionesOT]);

  const actividadesEquipoSeleccionado = useMemo(() => {
    if (!equipoSeleccionado) return [];
    const eq = equiposOT.find((x) => x.id === equipoSeleccionado.id);
    return Array.isArray(eq?.actividades) ? eq.actividades : [];
  }, [equipoSeleccionado, equiposOT]);

  const totalActividades = actividadesEquipoSeleccionado.length;

  const checklistCompletado = useMemo(() => {
    return form.planes.filter(
      (p) =>
        actividadesEquipoSeleccionado.some(
          (a) => a.id === p.ordenTrabajoActividadId
        ) && !!p.estado
    ).length;
  }, [form.planes, actividadesEquipoSeleccionado]);

  const labelEquipoSeleccionado = useMemo(() => {
    if (!equipoSeleccionado) return "No seleccionado";
    return getRegistroOTLabel(equipoSeleccionado);
  }, [equipoSeleccionado]);

  const subtituloEquipoSeleccionado = useMemo(() => {
    if (!equipoSeleccionado) return "";
    return getRegistroOTSubLabel(equipoSeleccionado);
  }, [equipoSeleccionado]);

  const notiActual = useMemo(() => {
    if (!equipoSeleccionado?.id) return null;
    return notiByEquipoOTId.get(equipoSeleccionado.id) || null;
  }, [equipoSeleccionado, notiByEquipoOTId]);

  // Detecta si el registro seleccionado es Ubicación Técnica (no muestra datos operativos)
  const esUbicacion = !!equipoSeleccionado?.ubicacionTecnicaId;

  const yaExisteNotiEquipo = !!notiActual;

  const progresoEquipos = useMemo(() => {
    const total = equiposOT.length;
    const hechas = notificacionesOT.length;
    return { total, hechas, faltan: Math.max(0, total - hechas) };
  }, [equiposOT.length, notificacionesOT.length]);

  /* =========================================================
     CARGA AUTOMÁTICA DE TÉCNICOS DEL REGISTRO OT
  ========================================================= */

  useEffect(() => {
    if (!equipoSeleccionado) return;

    const label = getRegistroOTLabel(equipoSeleccionado);
    const eqFull = equiposOT.find((x) => x.id === equipoSeleccionado.id);
    const trabajadoresOT = Array.isArray(eqFull?.trabajadores)
      ? eqFull.trabajadores
      : [];

    const tecnicosAuto = trabajadoresOT
      .map((tw) => {
        const w = tw?.trabajador;
        const id = tw?.trabajadorId || w?.id;
        if (!id) return null;

        const nombre =
          `${w?.nombre || ""} ${w?.apellido || ""}`.trim() || `Trabajador ${id}`;

        return {
          id,
          nombre,
          rol: formatearRol(w?.rol || ""),
          empresa: w?.empresa || "—",
          esEncargado: !!tw?.esEncargado,
        };
      })
      .filter(Boolean);

    setTecnicosSeleccionados(tecnicosAuto);

    setForm((prev) => ({
      ...prev,
      numeroEquipo: label,
      planes: [],
    }));

    setActiveTab("general");
  }, [equipoSeleccionado, equiposOT]);

  /* =========================================================
     HANDLERS BÁSICOS
  ========================================================= */

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getActividad = (actividadId) =>
    form.planes.find((p) => p.ordenTrabajoActividadId === actividadId);

  const upsertPlanActividad = (actividad, patch = {}) => {
    const existente = getActividad(actividad.id);

    if (!existente) {
      setForm((prev) => ({
        ...prev,
        planes: [
          ...prev.planes,
          {
            ...buildDefaultPlanItem(actividad),
            ...patch,
          },
        ],
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      planes: prev.planes.map((p) =>
        p.ordenTrabajoActividadId === actividad.id ? { ...p, ...patch } : p
      ),
    }));
  };

  /* =========================================================
     TÉCNICOS
  ========================================================= */

  const agregarTecnico = (trabajadorId) => {
    const trabajador = listaTrabajadores.find((t) => t.id === trabajadorId);
    if (!trabajador) return;

    if (tecnicosSeleccionados.some((t) => t.id === trabajadorId)) {
      alert("Este técnico ya fue agregado");
      return;
    }

    setTecnicosSeleccionados((prev) => [
      ...prev,
      {
        id: trabajador.id,
        nombre: `${trabajador.nombre} ${trabajador.apellido || ""}`.trim(),
        rol: formatearRol(trabajador.rol || ""),
        empresa: trabajador.empresa || "—",
        esEncargado: false,
      },
    ]);
  };

  const eliminarTecnico = (id) => {
    setTecnicosSeleccionados((prev) => prev.filter((t) => t.id !== id));

    setForm((prev) => ({
      ...prev,
      planes: prev.planes.map((p) =>
        p.trabajadorId === id ? { ...p, trabajadorId: null } : p
      ),
    }));
  };

  /* =========================================================
     CHECKLIST
  ========================================================= */

  const handleActividadEstado = (actividad, estado) => {
    const prev = getActividad(actividad.id);

    upsertPlanActividad(actividad, {
      planMantenimientoId: prev?.planMantenimientoId || actividad.planMantenimientoId || null,
      estado,
      comentario: prev?.comentario || "",
      trabajadorId: prev?.trabajadorId || null,
      duracionPlan: prev?.duracionPlan ?? null,
      unidadDuracionPlan: prev?.unidadDuracionPlan || "min",
      fechaInicioPlan: prev?.fechaInicioPlan || "",
      fechaFinPlan: prev?.fechaFinPlan || "",
      observaciones: prev?.observaciones || "",
    });
  };

  const handleActividadComentario = (actividad, comentario) => {
    upsertPlanActividad(actividad, { comentario });
  };

  const handleActividadTrabajador = (actividad, trabajadorId) => {
    upsertPlanActividad(actividad, {
      trabajadorId: trabajadorId || null,
    });
  };

  const handleActividadDuracion = (actividad, duracionPlan) => {
    upsertPlanActividad(actividad, {
      duracionPlan: duracionPlan === "" ? null : Number(duracionPlan),
    });
  };

  const handleActividadUnidad = (actividad, unidadDuracionPlan) => {
    upsertPlanActividad(actividad, {
      unidadDuracionPlan,
    });
  };

  const handleActividadFechaInicio = (actividad, fechaInicioPlan) => {
    upsertPlanActividad(actividad, {
      fechaInicioPlan,
    });
  };

  const handleActividadFechaFin = (actividad, fechaFinPlan) => {
    upsertPlanActividad(actividad, {
      fechaFinPlan,
    });
  };

  const handleActividadObservaciones = (actividad, observaciones) => {
    upsertPlanActividad(actividad, {
      observaciones,
    });
  };

  /* =========================================================
     CORRECTIVOS
  ========================================================= */

  const agregarCorrectivo = () => {
    setCorrectivos((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), fotos: [], comentario: "" },
    ]);
  };

  const eliminarCorrectivo = (id) => {
    setCorrectivos((prev) => prev.filter((c) => c.id !== id));
  };

  const actualizarComentarioCorrectivo = (id, comentario) => {
    setCorrectivos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, comentario } : c))
    );
  };

  const actualizarFotosCorrectivo = (id, files) => {
    setCorrectivos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, fotos: files } : c))
    );
  };

  /* =========================================================
     ADJUNTOS — sube archivos al servidor y devuelve URLs reales
  ========================================================= */

  const uploadAdjuntos = async () => {
    const tareas = [];

    gruposAntesDespues.forEach((g, i) => {
      const antes = Array.from(g.fotosAntes || []);
      const despues = Array.from(g.fotosDespues || []);
      if (antes.length) tareas.push({ files: antes, categoria: "ANTES", grupo: i, descripcion: g.descripcion || "" });
      if (despues.length) tareas.push({ files: despues, categoria: "DESPUES", grupo: i, descripcion: g.descripcion || "" });
    });

    correctivos.forEach((c, i) => {
      const arr = Array.from(c.fotos || []);
      if (arr.length) tareas.push({ files: arr, categoria: "CORRECTIVO", grupo: i, descripcion: c.comentario || "" });
    });

    if (acta) tareas.push({ files: [acta], categoria: "ACTA_CONFORMIDAD", grupo: 0, descripcion: "" });
    if (informe) tareas.push({ files: [informe], categoria: "INFORME", grupo: 0, descripcion: "" });
    if (checklistAdjunto) tareas.push({ files: [checklistAdjunto], categoria: "CHECKLIST", grupo: 0, descripcion: "" });
    if (archivoExtra) tareas.push({ files: [archivoExtra], categoria: "OTRO", grupo: 0, descripcion: "" });

    const lista = [];
    for (const { files, categoria, grupo, descripcion } of tareas) {
      const uploaded = await uploadArchivos(files);
      uploaded.forEach((u) =>
        lista.push({
          nombre: u.nombre,
          url: u.url,
          extension: u.tipo || u.nombre.split(".").pop(),
          categoria,
          grupo,
          descripcion,
          ordenTrabajoId: ordenTrabajo?.id || null,
          ordenTrabajoEquipoId: equipoSeleccionado?.id || null,
        })
      );
    }
    return lista;
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async () => {
    try {
      if (!equipoSeleccionado?.id) {
        alert("⚠️ Debes seleccionar un equipo o ubicación técnica");
        setOpenSelectEquipo(true);
        return;
      }

      if (yaExisteNotiEquipo) {
        alert("⚠️ Este registro ya tiene notificación. Puedes abrir su PDF.");
        return;
      }

      if (!form.fechaInicio || !form.fechaFin) {
        alert("⚠️ Fechas de inicio y fin son obligatorias");
        return;
      }

      if (new Date(form.fechaFin) < new Date(form.fechaInicio)) {
        alert("⚠️ La fecha fin no puede ser menor que la fecha inicio");
        return;
      }

      if (tecnicosSeleccionados.length === 0) {
        const confirmar = window.confirm(
          "No has seleccionado técnicos. ¿Deseas continuar?"
        );
        if (!confirmar) return;
      }

      const setIdsActs = new Set(
        actividadesEquipoSeleccionado.map((a) => a.id)
      );

      const planesFiltrados = (form.planes || []).filter((p) =>
        setIdsActs.has(p.ordenTrabajoActividadId)
      );

      const actividadesOKSinResponsable = planesFiltrados.filter(
        (p) => p.estado === "OK" && !p.trabajadorId
      );

      if (actividadesOKSinResponsable.length > 0) {
        alert("⚠️ Todas las actividades en estado OK deben tener responsable");
        return;
      }

      setLoading(true);

      const adjuntos = await uploadAdjuntos();

      const resumenCorrectivos = correctivos
        .map((c, i) => `${i + 1}. ${c.comentario}`.trim())
        .filter(Boolean)
        .join("\n");

      await crearNotificacionService({
        ...form,
        resumenCorrectivos,
        ordenTrabajoId: ordenTrabajo?.id,
        ordenTrabajoEquipoId: equipoSeleccionado.id,
        precargarPlanes: planesFiltrados.length === 0,
        planes: planesFiltrados.map((p) => ({
          ordenTrabajoActividadId: p.ordenTrabajoActividadId,
          planMantenimientoId: p.planMantenimientoId || null,
          estado: p.estado,
          comentario: p.comentario || "",
          trabajadorId: p.trabajadorId || null,
          duracionPlan: p.duracionPlan ?? null,
          unidadDuracionPlan: p.unidadDuracionPlan || "min",
          fechaInicioPlan: p.fechaInicioPlan || null,
          fechaFinPlan: p.fechaFinPlan || null,
          observaciones: p.observaciones || "",
        })),
        horometro: form.horometro ? Number(form.horometro) : null,
        numeroMisiones: form.numeroMisiones ? Number(form.numeroMisiones) : null,
        tecnicos: tecnicosSeleccionados.map((t) => t.id),
        adjuntos,
      });

      await cargarNotificacionesOT();

      alert("✅ Notificación creada. Elige el siguiente registro.");
      resetForm();
      setEquipoSeleccionado(null);
      setOpenSelectEquipo(true);
    } catch (error) {
      console.error(error);
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error.message ||
        "Error desconocido";

      alert("❌ Error al crear notificación: " + msg);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     VENTA SUBMIT
  ========================================================= */

  const handleSubmitVenta = async () => {
    if (!ventaForm.actividadCompletada) {
      alert("Debes marcar la actividad como completada");
      return;
    }
    try {
      setVentaLoading(true);
      await updateOrdenTrabajoCompleta(ordenTrabajoId, {
        estado: "CERRADO",
        fechaFinReal: ventaForm.fechaCompletado || new Date().toISOString(),
        observaciones: ventaForm.observaciones || null,
      });
      alert("✅ Actividad de venta confirmada. OT cerrada.");
      onClose();
    } catch (error) {
      console.error(error);
      alert("❌ Error al confirmar la actividad: " + (error?.response?.data?.message || error.message));
    } finally {
      setVentaLoading(false);
    }
  };

  /* =========================================================
     UI HELPERS
  ========================================================= */

  const ESTADO_CONFIG = {
    OK: {
      label: "✓ OK",
      active: "bg-emerald-500 text-white shadow-md",
      hover: "hover:border-emerald-500",
    },
    NO_OK: {
      label: "✗ NO OK",
      active: "bg-red-500 text-white shadow-md",
      hover: "hover:border-red-500",
    },
    NO_APLICA: {
      label: "— N/A",
      active: "bg-slate-500 text-white shadow-md",
      hover: "hover:border-slate-500",
    },
  };

  const estadoBadgeColor = (estado) => {
    if (estado === "OK")
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    if (estado === "NO_OK")
      return "bg-red-100 text-red-700 border-red-300";
    if (estado === "NO_APLICA")
      return "bg-slate-100 text-slate-600 border-slate-300";
    return "bg-amber-50 text-amber-600 border-amber-200";
  };

  const tipoTrabajoColor = (tipo) => {
    if (!tipo) return "bg-blue-100 text-blue-700";

    switch (tipo) {
      case "REVISION":
        return "bg-blue-100 text-blue-700";
      case "INSPECCION":
        return "bg-indigo-100 text-indigo-700";
      case "CAMBIO":
        return "bg-red-100 text-red-700";
      case "LIMPIEZA":
        return "bg-cyan-100 text-cyan-700";
      case "LUBRICACION":
        return "bg-yellow-100 text-yellow-700";
      case "AJUSTE":
        return "bg-orange-100 text-orange-700";
      case "APLICACION":
        return "bg-green-100 text-green-700";
      case "TORQUEO_REGULACION":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const countOK = form.planes.filter((p) => p.estado === "OK").length;
  const countNO_OK = form.planes.filter((p) => p.estado === "NO_OK").length;
  const countNA = form.planes.filter((p) => p.estado === "NO_APLICA").length;
  const countPending = totalActividades - countOK - countNO_OK - countNA;
  const checklistDone = countPending === 0 && totalActividades > 0;

  const tabs = [
    { id: "general", label: "General", icon: "📋" },
    {
      id: "checklist",
      label: "Checklist",
      icon: "☑️",
      badge:
        totalActividades > 0
          ? {
              text: `${checklistCompletado}/${totalActividades}`,
              done: checklistDone,
            }
          : null,
    },
    {
      id: "correctivos",
      label: "Correctivos",
      icon: "🔧",
      badge:
        correctivos.length > 0
          ? { text: correctivos.length, done: false }
          : null,
    },
    { id: "adjuntos", label: "Adjuntos", icon: "📎" },
  ];

  const trabajadoresDisponiblesFiltrados = useMemo(() => {
    return listaTrabajadores.filter((t) => {
      const rolOk = !filtroRol || t.rol === filtroRol;
      const nombreOk =
        !busquedaNombre ||
        `${t.nombre} ${t.apellido || ""}`
          .toLowerCase()
          .includes(busquedaNombre.toLowerCase());

      const noAgregado = !tecnicosSeleccionados.some((s) => s.id === t.id);

      return rolOk && nombreOk && noAgregado;
    });
  }, [listaTrabajadores, filtroRol, busquedaNombre, tecnicosSeleccionados]);

  if (!isOpen) return null;

  /* ----------------------------------------------------------------
     VENTA: UI simplificada — solo confirmar actividad
  ---------------------------------------------------------------- */
  if (esVenta && equiposOT.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-t-3xl flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🛒</span> Confirmar Actividad de Venta
              </h2>
              <p className="text-orange-100 text-sm mt-1">
                OT #{ordenTrabajo?.numeroOT || ordenTrabajoId}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Checkbox actividad */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={ventaForm.actividadCompletada}
                onChange={(e) => setVentaForm(p => ({ ...p, actividadCompletada: e.target.checked }))}
                className="mt-1 w-5 h-5 rounded border-2 border-orange-400 accent-orange-500 cursor-pointer"
              />
              <div>
                <p className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                  Actividad completada
                </p>
                <p className="text-sm text-slate-500">Marca esto para confirmar que la actividad de venta fue realizada</p>
              </div>
            </label>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fecha de cierre
              </label>
              <input
                type="datetime-local"
                value={ventaForm.fechaCompletado}
                onChange={(e) => setVentaForm(p => ({ ...p, fechaCompletado: e.target.value }))}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all"
              />
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Observaciones <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={ventaForm.observaciones}
                onChange={(e) => setVentaForm(p => ({ ...p, observaciones: e.target.value }))}
                rows={3}
                placeholder="Notas adicionales sobre la actividad de venta..."
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitVenta}
              disabled={ventaLoading || !ventaForm.actividadCompletada}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {ventaLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Confirmar y Cerrar OT
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ModalElegirEquipo
        open={openSelectEquipo}
        equipos={equiposOT}
        notiByEquipoOTId={notiByEquipoOTId}
        onClose={() => setOpenSelectEquipo(false)}
        onSelect={(eq) => {
          setEquipoSeleccionado(eq);
          setOpenSelectEquipo(false);
        }}
      />

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] lg:max-w-7xl my-8">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 p-6 rounded-t-3xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <span className="text-4xl">✅</span>
                  Cierre Técnico (Notificación por registro)
                </h2>

                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <p className="text-amber-100 text-sm">
                    OT #{ordenTrabajo?.numeroOT || ordenTrabajo?.id}
                  </p>

                  <span className="text-amber-100 text-sm">•</span>

                  <p className="text-amber-100 text-sm">
                    Progreso:{" "}
                    <span className="font-bold">
                      {progresoEquipos.hechas}/{progresoEquipos.total}
                    </span>{" "}
                    (faltan {progresoEquipos.faltan})
                  </p>

                  <span className="text-amber-100 text-sm">•</span>

                  <p className="text-amber-100 text-sm truncate">
                    Registro:{" "}
                    <span className="font-bold">{labelEquipoSeleccionado}</span>
                  </p>

                  <button
                    type="button"
                    onClick={() => setOpenSelectEquipo(true)}
                    className="ml-2 text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white hover:bg-white/30"
                    disabled={loadingOrden || loadingNotis}
                  >
                    Elegir / Cambiar
                  </button>

                  {yaExisteNotiEquipo && (
                    <button
                      type="button"
                      onClick={() => abrirPdfNotificacion(notiActual.id)}
                      className="text-xs font-bold px-3 py-1 rounded-full bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-2"
                      title="Abrir PDF del registro seleccionado"
                    >
                      <FileText className="w-4 h-4" />
                      PDF
                    </button>
                  )}
                </div>

                {subtituloEquipoSeleccionado ? (
                  <p className="text-amber-100/90 text-xs mt-2 truncate">
                    {subtituloEquipoSeleccionado}
                  </p>
                ) : null}

                {(loadingOrden || loadingNotis) && (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando OT / Notificaciones...
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-xl p-2 transition-all duration-200 hover:rotate-90"
                title="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* ALERT */}
          {yaExisteNotiEquipo && (
            <div className="px-6 pt-5">
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-800">
                      Este registro ya tiene Notificación creada.
                    </p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Está bloqueado para evitar duplicados. Puedes abrir el PDF
                      cuando lo necesites.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => abrirPdfNotificacion(notiActual.id)}
                  className="shrink-0 px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 inline-flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICACIONES CREADAS — Regenerar PDF rápido */}
          {notificacionesOT.length > 0 && (
            <div className="px-6 pt-4">
              <details open>
                <summary className="cursor-pointer text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 select-none">
                  Notificaciones creadas ({notificacionesOT.length}) — Regenerar PDF
                </summary>
                <div className="flex flex-wrap gap-2 mt-2">
                  {notificacionesOT.map((noti) => {
                    const eq = ordenTrabajo?.equipos?.find((e) => e.id === noti.ordenTrabajoEquipoId);
                    const label = eq ? getRegistroOTLabel(eq) : `Noti #${noti.id}`;
                    return (
                      <button
                        key={noti.id}
                        type="button"
                        onClick={() => abrirPdfNotificacion(noti.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold hover:bg-red-100 hover:border-red-400 transition-all"
                        title={`PDF de ${label}`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </details>
            </div>
          )}

          {/* TABS */}
          <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white mt-5">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-8 py-4 font-bold transition-all whitespace-nowrap relative
                    ${
                      activeTab === tab.id
                        ? "text-amber-600 bg-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tab.icon}</span>
                    <span>{tab.label}</span>

                    {tab.badge && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          tab.badge.done
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
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

          {/* CONTENT */}
          <div className="p-8 max-h-[70vh] overflow-y-auto">
            {/* GENERAL */}
            {activeTab === "general" && (
              <div className="space-y-6">
                {!equipoSeleccionado && (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                    <div className="text-5xl mb-3">🖥️</div>
                    <p className="text-sm text-slate-600 mb-2">
                      Primero selecciona un equipo o ubicación técnica para crear su
                      notificación.
                    </p>
                    <button
                      type="button"
                      onClick={() => setOpenSelectEquipo(true)}
                      className="px-4 py-2 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600"
                    >
                      Elegir registro
                    </button>
                  </div>
                )}

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
                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                        className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:bg-slate-100"
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
                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                        className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:bg-slate-100"
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
                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                        className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:bg-slate-100"
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
                              <p className="font-bold text-slate-800 text-sm">
                                {tecnico.nombre}
                              </p>

                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                                  {tecnico.rol || "—"}
                                </span>

                                <span className="text-xs text-slate-500">
                                  • {tecnico.empresa}
                                </span>

                                {tecnico.esEncargado && (
                                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                                    Encargado
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                            onClick={() => eliminarTecnico(tecnico.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg p-2 transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                    <p className="text-xs font-bold text-slate-700 mb-3">
                      Agregar Técnico
                    </p>

                    {loadingTrabajadores ? (
                      <div className="text-center py-6">
                        <div className="inline-block w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-600 mt-2 text-sm">
                          Cargando trabajadores...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">
                              Filtrar por Rol
                            </label>
                            <select
                              value={filtroRol}
                              disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                              onChange={(e) => setFiltroRol(e.target.value)}
                              className="w-full px-3 py-2 text-xs border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-slate-100"
                            >
                              <option value="">Todos los roles</option>
                              <option value="tecnico_electrico">
                                Técnico Eléctrico
                              </option>
                              <option value="tecnico_mecanico">
                                Técnico Mecánico
                              </option>
                              <option value="operario_de_mantenimiento">
                                Operario de Mantenimiento
                              </option>
                              <option value="supervisor">Supervisor</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">
                              Buscar por Nombre
                            </label>
                            <input
                              type="text"
                              placeholder="Escribe el nombre..."
                              value={busquedaNombre}
                              disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                              onChange={(e) => setBusquedaNombre(e.target.value)}
                              className="w-full px-3 py-2 text-xs border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-slate-100"
                            />
                          </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto border-2 border-slate-200 rounded-lg">
                          {!equipoSeleccionado ? (
                            <div className="text-center py-6 text-slate-400">
                              <p className="text-sm">
                                Selecciona un registro para agregar técnicos
                              </p>
                            </div>
                          ) : yaExisteNotiEquipo ? (
                            <div className="text-center py-6 text-slate-500">
                              <p className="text-sm font-semibold">
                                Este registro ya está cerrado.
                              </p>
                              <p className="text-xs mt-1">
                                Cambia de registro o abre el PDF.
                              </p>
                            </div>
                          ) : trabajadoresDisponiblesFiltrados.length === 0 ? (
                            <div className="text-center py-6 text-slate-400">
                              <p className="text-sm">
                                No hay trabajadores disponibles
                              </p>
                              <p className="text-xs mt-1">
                                Intenta cambiar los filtros
                              </p>
                            </div>
                          ) : (
                            trabajadoresDisponiblesFiltrados.map((trabajador) => (
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

                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                                        {formatearRol(trabajador.rol || "")}
                                      </span>

                                      <span className="text-xs text-slate-500">
                                        • {trabajador.empresa || "—"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-purple-600 opacity-0 group-hover:opacity-100 transition-all">
                                  +
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* DATOS OPERATIVOS */}
                {/* Datos Operativos — solo para Equipos, no para Ubicaciones Técnicas */}
                {!esUbicacion && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-5 border border-green-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <span className="text-xl">⚙️</span> Datos Operativos
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          Horómetro
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          name="horometro"
                          value={form.horometro}
                          onChange={handleChange}
                          disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                          className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          Número de Misiones
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          name="numeroMisiones"
                          value={form.numeroMisiones}
                          onChange={handleChange}
                          disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                          className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-slate-100"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          Código del Equipo
                        </label>
                        <input
                          type="text"
                          name="numeroEquipo"
                          value={form.numeroEquipo}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg bg-slate-100"
                          disabled
                        />
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Cargado desde el registro seleccionado
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ESTADO */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-5 border border-orange-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">🔧</span> Estado General del Registro{" "}
                    <span className="text-red-500">*</span>
                  </h3>

                  <select
                    name="estadoGeneralEquipo"
                    value={form.estadoGeneralEquipo}
                    onChange={handleChange}
                    disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-semibold disabled:bg-slate-100"
                    required
                  >
                    <option value="OPERATIVO">✅ Operativo</option>
                    <option value="INOPERATIVO">❌ Inoperativo</option>
                    <option value="OPERATIVO_CON_OBSERVACIONES">
                      ⚠️ Operativo con Observaciones
                    </option>
                  </select>
                </div>

                {/* DESCRIPCIONES */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-5 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">📝</span> Descripciones
                  </h3>

                  <div className="space-y-3">
                    {[
                      {
                        name: "descripcionGeneral",
                        label: "Descripción General",
                        placeholder: "Descripción general...",
                      },
                      {
                        name: "descripcionMantenimiento",
                        label: "Descripción del Mantenimiento",
                        placeholder: "Mantenimiento realizado...",
                      },
                      {
                        name: "observaciones",
                        label: "Observaciones",
                        placeholder: "Observaciones...",
                      },
                      {
                        name: "recomendaciones",
                        label: "Recomendaciones",
                        placeholder: "Recomendaciones...",
                      },
                    ].map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          {field.label}
                        </label>

                        <textarea
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleChange}
                          rows="2"
                          disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none transition-all disabled:bg-slate-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* FOTOS - grupos de antes/después */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-5 border border-indigo-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-xl">📸</span> Fotos del Mantenimiento
                    </h3>
                    <button
                      type="button"
                      disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                      onClick={() =>
                        setGruposAntesDespues((prev) => [
                          ...prev,
                          { id: Date.now(), descripcion: "", fotosAntes: [], fotosDespues: [] },
                        ])
                      }
                      className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      + Agregar grupo
                    </button>
                  </div>

                  <div className="space-y-4">
                    {gruposAntesDespues.map((grupo, i) => (
                      <div
                        key={grupo.id}
                        className="border border-indigo-200 rounded-xl p-4 bg-white"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-indigo-700">
                            Grupo {i + 1}
                          </span>
                          {gruposAntesDespues.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setGruposAntesDespues((prev) =>
                                  prev.filter((g) => g.id !== grupo.id)
                                )
                              }
                              className="text-xs text-red-500 hover:text-red-700 font-semibold"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>

                        <div className="mb-3">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Descripción del grupo
                          </label>
                          <input
                            type="text"
                            value={grupo.descripcion}
                            disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                            onChange={(e) =>
                              setGruposAntesDespues((prev) =>
                                prev.map((g) =>
                                  g.id === grupo.id
                                    ? { ...g, descripcion: e.target.value }
                                    : g
                                )
                              )
                            }
                            placeholder="Ej: Lubricación de motor principal..."
                            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:bg-slate-100"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { label: "Fotos Antes", field: "fotosAntes" },
                            { label: "Fotos Después", field: "fotosDespues" },
                          ].map(({ label, field }) => (
                            <div key={field}>
                              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                {label}
                              </label>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                                onChange={(e) =>
                                  setGruposAntesDespues((prev) =>
                                    prev.map((g) =>
                                      g.id === grupo.id
                                        ? { ...g, [field]: e.target.files }
                                        : g
                                    )
                                  )
                                }
                                className="w-full text-sm px-3 py-2 border-2 border-dashed border-indigo-300 rounded-lg hover:border-indigo-400 cursor-pointer bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                              />
                              {grupo[field]?.length > 0 && (
                                <p className="text-xs text-emerald-600 font-semibold mt-1.5">
                                  ✓ {grupo[field].length} archivo(s)
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CHECKLIST */}
            {activeTab === "checklist" && (
              <div className="space-y-4">
                {!equipoSeleccionado && (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                    <div className="text-5xl mb-3">🖥️</div>
                    <p className="text-sm text-slate-600 mb-1">
                      Selecciona un registro para ver su checklist
                    </p>
                    <button
                      type="button"
                      onClick={() => setOpenSelectEquipo(true)}
                      className="mt-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600"
                    >
                      Elegir registro
                    </button>
                  </div>
                )}

                {equipoSeleccionado && totalActividades > 0 && (
                  <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-slate-700">
                        Progreso del Checklist
                      </h3>

                      <span
                        className={`text-sm font-bold ${
                          checklistDone ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {checklistCompletado}/{totalActividades}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          checklistDone ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{
                          width: `${
                            totalActividades > 0
                              ? (checklistCompletado / totalActividades) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    {yaExisteNotiEquipo && (
                      <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            Este registro ya tiene notificación.
                          </p>
                          <p>
                            El checklist aquí es solo para crear. Si quieres ver lo
                            guardado, abre el PDF.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {equipoSeleccionado && actividadesEquipoSeleccionado.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                    <div className="text-5xl mb-3">☑️</div>
                    <p className="text-sm text-slate-600 mb-1">
                      Este registro no tiene actividades registradas
                    </p>
                  </div>
                )}

                {equipoSeleccionado && actividadesEquipoSeleccionado.length > 0 && (
                  <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
                    <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const Icon = getRegistroOTIcon(equipoSeleccionado);
                          return <Icon className="w-6 h-6 text-white" />;
                        })()}

                        <div>
                          <p className="font-bold text-white text-sm">
                            {labelEquipoSeleccionado}
                          </p>
                          {subtituloEquipoSeleccionado ? (
                            <p className="text-white/70 text-xs">
                              {subtituloEquipoSeleccionado}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-semibold">
                        {actividadesEquipoSeleccionado.length} actividad(es)
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 bg-white">
                      {actividadesEquipoSeleccionado.map((actividad, idx) => {
                        const registrado = getActividad(actividad.id);
                        const estadoActual = registrado?.estado;
                        const esDePlan = !!actividad.planMantenimientoActividadId;

                        return (
                          <div
                            key={actividad.id}
                            className={`p-4 transition-all ${
                              estadoActual ? "bg-white" : "bg-amber-50/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-xs font-bold text-slate-500">
                                    #{idx + 1}
                                  </span>

                                  {actividad.tipoTrabajo && (
                                    <span
                                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${tipoTrabajoColor(
                                        actividad.tipoTrabajo
                                      )}`}
                                    >
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
                                  {actividad.tarea ||
                                    actividad.descripcion ||
                                    `Actividad ${actividad.id}`}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {actividad.componente && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                      <span>⚙️</span> {actividad.componente}
                                    </p>
                                  )}

                                  {actividad.rolTecnico && (
                                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                      {formatearRol(actividad.rolTecnico)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {estadoActual && (
                                <span
                                  className={`text-xs font-bold px-3 py-1 rounded-full border ${estadoBadgeColor(
                                    estadoActual
                                  )} shrink-0`}
                                >
                                  {estadoActual === "OK"
                                    ? "✓ OK"
                                    : estadoActual === "NO_OK"
                                    ? "✗ NO OK"
                                    : "— N/A"}
                                </span>
                              )}
                            </div>

                            {/* ESTADO */}
                            <div className="flex gap-2 mb-3">
                              {Object.entries(ESTADO_CONFIG).map(
                                ([estadoKey, config]) => (
                                  <button
                                    key={estadoKey}
                                    type="button"
                                    disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                                    onClick={() =>
                                      handleActividadEstado(actividad, estadoKey)
                                    }
                                    className={`
                                      flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border-2
                                      ${
                                        estadoActual === estadoKey
                                          ? config.active
                                          : `bg-white text-slate-600 border-slate-300 ${config.hover}`
                                      }
                                      ${
                                        !equipoSeleccionado || yaExisteNotiEquipo
                                          ? "opacity-60 cursor-not-allowed"
                                          : ""
                                      }
                                    `}
                                  >
                                    {config.label}
                                  </button>
                                )
                              )}
                            </div>

                            {estadoActual && (
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {/* COLUMNA IZQUIERDA */}
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">
                                      Comentario
                                    </label>
                                    <textarea
                                      placeholder="Comentarios adicionales..."
                                      value={registrado?.comentario || ""}
                                      disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                                      onChange={(e) =>
                                        handleActividadComentario(
                                          actividad,
                                          e.target.value
                                        )
                                      }
                                      rows="2"
                                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-xs transition-all disabled:bg-slate-100"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">
                                      Responsable
                                    </label>
                                    <select
                                      value={registrado?.trabajadorId || ""}
                                      disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                                      onChange={(e) =>
                                        handleActividadTrabajador(
                                          actividad,
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-xs disabled:bg-slate-100"
                                    >
                                      <option value="">— Seleccionar técnico —</option>

                                      {tecnicosSeleccionados.map((t) => (
                                        <option key={t.id} value={t.id}>
                                          {t.nombre}
                                          {t.rol ? ` • ${t.rol}` : ""}
                                        </option>
                                      ))}
                                    </select>

                                    {estadoActual === "OK" &&
                                      !registrado?.trabajadorId && (
                                        <p className="text-xs text-red-600 font-semibold mt-1">
                                          ⚠️ Debes elegir responsable si está OK
                                        </p>
                                      )}
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">
                                      Observaciones de ejecución
                                    </label>
                                    <textarea
                                      value={registrado?.observaciones || ""}
                                      disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                                      onChange={(e) =>
                                        handleActividadObservaciones(
                                          actividad,
                                          e.target.value
                                        )
                                      }
                                      rows="2"
                                      placeholder="Observaciones de esta actividad..."
                                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-xs resize-none disabled:bg-slate-100"
                                    />
                                  </div>
                                </div>

                                {/* COLUMNA DERECHA */}
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-bold text-slate-600 mb-1">
                                        Duración real
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={
                                          registrado?.duracionPlan ?? ""
                                        }
                                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                                        onChange={(e) =>
                                          handleActividadDuracion(
                                            actividad,
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-xs disabled:bg-slate-100"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-bold text-slate-600 mb-1">
                                        Unidad
                                      </label>
                                      <select
                                        value={
                                          registrado?.unidadDuracionPlan || "min"
                                        }
                                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                                        onChange={(e) =>
                                          handleActividadUnidad(
                                            actividad,
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-xs disabled:bg-slate-100"
                                      >
                                        <option value="min">Min</option>
                                        <option value="h">Horas</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-bold text-slate-600 mb-1">
                                        Inicio real
                                      </label>
                                      <input
                                        type="datetime-local"
                                        value={registrado?.fechaInicioPlan || ""}
                                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                                        onChange={(e) =>
                                          handleActividadFechaInicio(
                                            actividad,
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-xs disabled:bg-slate-100"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-bold text-slate-600 mb-1">
                                        Fin real
                                      </label>
                                      <input
                                        type="datetime-local"
                                        value={registrado?.fechaFinPlan || ""}
                                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                                        onChange={(e) =>
                                          handleActividadFechaFin(
                                            actividad,
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-xs disabled:bg-slate-100"
                                      />
                                    </div>
                                  </div>

                                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                      <Clock3 className="w-4 h-4" />
                                      <span>
                                        Aquí puedes guardar la ejecución real de la
                                        actividad.
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                                      <UserCog className="w-4 h-4" />
                                      <span>
                                        Si la actividad está en <b>OK</b>, asigna
                                        responsable.
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CORRECTIVOS */}
            {activeTab === "correctivos" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-xl">🔧</span> Trabajos Correctivos
                  </h3>

                  <button
                    type="button"
                    disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                    onClick={agregarCorrectivo}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-bold hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-lg">+</span> Agregar Correctivo
                  </button>
                </div>

                {correctivos.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                    <div className="text-5xl mb-3">🔧</div>
                    <p className="text-sm text-slate-600 mb-1">
                      No hay correctivos registrados
                    </p>
                    <p className="text-xs text-slate-500">
                      Agrega correctivos si aplican
                    </p>
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
                          disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                          onClick={() => eliminarCorrectivo(correctivo.id)}
                          className="absolute top-3 right-3 text-red-600 hover:text-red-800 hover:bg-red-200 rounded-lg p-1.5 transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                          ✕
                        </button>

                        <h4 className="font-bold text-slate-800 mb-3 text-sm">
                          Correctivo #{index + 1}
                        </h4>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">
                              Descripción del Correctivo
                            </label>
                            <textarea
                              value={correctivo.comentario}
                              disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                              onChange={(e) =>
                                actualizarComentarioCorrectivo(
                                  correctivo.id,
                                  e.target.value
                                )
                              }
                              rows="2"
                              placeholder="Describe el trabajo correctivo realizado..."
                              className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:bg-slate-100"
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
                              disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                              onChange={(e) =>
                                actualizarFotosCorrectivo(
                                  correctivo.id,
                                  e.target.files
                                )
                              }
                              className="w-full text-sm px-3 py-2 border-2 border-dashed border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all hover:border-red-400 cursor-pointer bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                            />

                            {correctivo.fotos?.length > 0 && (
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

            {/* ADJUNTOS */}
            {activeTab === "adjuntos" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📎</span> Documentos Adjuntos
                </h3>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border-2 border-emerald-300">
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-lg">📄</span>
                    Acta de Conformidad
                  </label>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                    onChange={(e) => setActa(e.target.files[0])}
                    className="w-full text-sm px-3 py-2 border-2 border-dashed border-emerald-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-emerald-500 cursor-pointer bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />

                  {acta && (
                    <p className="text-xs text-emerald-700 font-bold mt-2 bg-emerald-200 px-3 py-1.5 rounded-lg">
                      ✓ {acta.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      label: "📄 Informe",
                      state: informe,
                      setter: setInforme,
                      accept: ".pdf,.doc,.docx",
                    },
                    {
                      label: "📄 Checklist",
                      state: checklistAdjunto,
                      setter: setChecklistAdjunto,
                      accept: ".pdf,.doc,.docx,.xlsx,.xls",
                    },
                    {
                      label: "📎 Archivo Adicional",
                      state: archivoExtra,
                      setter: setArchivoExtra,
                      accept: "*",
                    },
                  ].map(({ label, state, setter, accept }) => (
                    <div
                      key={label}
                      className="bg-white rounded-lg p-4 border-2 border-slate-200"
                    >
                      <label className="block text-sm font-bold text-slate-800 mb-2">
                        {label}
                      </label>

                      <input
                        type="file"
                        accept={accept}
                        disabled={!equipoSeleccionado || yaExisteNotiEquipo}
                        onChange={(e) => setter(e.target.files[0])}
                        className="w-full text-xs disabled:opacity-60"
                      />

                      {state && (
                        <p className="text-xs text-slate-600 mt-1.5 truncate">
                          ✓ {state.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="border-t-2 border-slate-200 p-5 bg-gradient-to-b from-slate-50 to-white rounded-b-3xl">
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-slate-600 flex items-center gap-2">
                <span className="text-red-500">*</span>
                <span>Campos obligatorios</span>
              </div>

              <div className="flex gap-3 items-center">
                {equipoSeleccionado && yaExisteNotiEquipo && (
                  <button
                    type="button"
                    onClick={() => abrirPdfNotificacion(notiActual.id)}
                    className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-all inline-flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-700 bg-white border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50 shadow-sm"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !equipoSeleccionado || yaExisteNotiEquipo}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:via-amber-700 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 inline-flex items-center gap-2"
                  title={
                    !equipoSeleccionado
                      ? "Selecciona un registro"
                      : yaExisteNotiEquipo
                      ? "Este registro ya tiene notificación"
                      : "Guardar notificación"
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "✓ Guardar Notificación"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CrearNotificacionModal;