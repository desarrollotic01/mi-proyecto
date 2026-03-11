import {
  X,
  FileText,
  Calendar,
  AlertCircle,
  ClipboardCheck,
  Settings,
  Zap,
  Users,
  Wrench,
  Info,
  Upload,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  MapPin,
  Package,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getTratamientoByAviso } from "../mantenimiento/services/tratamientoService";
import { getTrabajadores } from "../mantenimiento/services/trabajadoresService";
import { planMantenimientoService } from "../PlanMantenimiento/services/planMantenimientoService";
import { adjuntosService } from "../OrdenTrabajo/services/adjuntosService";

import ModalInfoAviso from "./modals/ModalInfoAviso";
import ModalDetallesEquipo from "../OrdenTrabajo/modals/ModalDetalleEquipo";

/* ─────────────────────────────────────────────
   ENUMS / HELPERS
───────────────────────────────────────────── */

const TIPOS_TRABAJO_ENUM = [
  "REVISION",
  "INSPECCION",
  "LIMPIEZA",
  "AJUSTE",
  "LUBRICACION",
  "CAMBIO",
  "APLICACION",
  "TORQUEO_REGULACION",
  "REPARACION",
];

const TIPOS_TRABAJO_CORRECTIVO = ["REPARACION", "CAMBIO"];

const toMinutes = (valor, unidad) => {
  const v = Number(valor);
  if (!Number.isFinite(v) || v <= 0) return 0;
  if (unidad === "h") return Math.round(v * 60);
  return Math.round(v);
};

const mkActOT = (base = {}, opts = {}) => {
  const unidad = base.unidadDuracion || "min";
  const durVal =
    base.duracionEstimadaValor ??
    base.duracionValor ??
    (typeof base.duracionMinutos === "number" ? base.duracionMinutos : 0);

  const durMin =
    base.duracionEstimadaMin ??
    (typeof base.duracionMinutos === "number" ? base.duracionMinutos : null) ??
    (durVal ? toMinutes(durVal, unidad) : null);

  return {
    id: base.id || crypto.randomUUID(),
    selected: opts.forceSelected ?? true,

    planMantenimientoActividadId: base.planMantenimientoActividadId || null,
    codigoActividad: base.codigoActividad || null,

    sistema: base.sistema || "",
    subsistema: base.subsistema || "",
    componente: base.componente || "",
    tarea: base.tarea || "",
    descripcion: base.descripcion || "",

    tipoTrabajo: base.tipoTrabajo || "REVISION",
    rolTecnico: base.rolTecnico || "",
    cantidadTecnicos: Number(base.cantidadTecnicos) || 1,

    duracionEstimadaValor: Number(durVal) || 0,
    unidadDuracion: unidad,
    duracionEstimadaMin: durMin ?? null,

    observaciones: base.observaciones || "",
    estado: base.estado || "PENDIENTE",
    origen: base.origen || "OT",
  };
};

const normalizeActOTForPayload = (a) => {
  const unidad = a.unidadDuracion || "min";
  const valor = Number(a.duracionEstimadaValor) || 0;
  const durMin = toMinutes(valor, unidad);

  return {
    planMantenimientoActividadId: a.planMantenimientoActividadId || null,
    codigoActividad: a.codigoActividad || null,

    sistema: a.sistema?.trim() || null,
    subsistema: a.subsistema?.trim() || null,
    componente: a.componente?.trim() || null,
    tarea: a.tarea?.trim() || null,
    descripcion: a.descripcion?.trim() || null,

    tipoTrabajo: a.tipoTrabajo || "REVISION",
    rolTecnico: a.rolTecnico || null,
    cantidadTecnicos: Number(a.cantidadTecnicos) || 1,

    duracionEstimadaValor: valor,
    unidadDuracion: unidad,
    duracionEstimadaMin: durMin || null,

    observaciones: a.observaciones?.trim() || null,
    estado: a.estado || "PENDIENTE",
    origen: a.origen || "OT",
  };
};

const getEstadoBadgeColor = (estado) => {
  const colores = {
    PENDIENTE: "bg-amber-100 text-amber-700 border-amber-300",
    EN_PROCESO: "bg-blue-100 text-blue-700 border-blue-300",
    FINALIZADO: "bg-green-100 text-green-700 border-green-300",
  };
  return colores[estado] || "bg-gray-100 text-gray-700 border-gray-300";
};

const isUbicacionTarget = (target) =>
  !!target?.ubicacionTecnicaId || target?.tipo === "UBICACION_TECNICA";

const isEquipoTarget = (target) =>
  !!target?.equipoId || !!target?.id;

const getTargetId = (target) =>
  target?.equipoId ||
  target?.ubicacionTecnicaId ||
  target?.id ||
  null;

const getTargetNombre = (target) => {
  if (!target) return "Registro";
  if (isUbicacionTarget(target)) {
    return (
      target.nombre ||
      target.ubicacionTecnicaNombre ||
      target.descripcion ||
      `Ubicación técnica ${getTargetId(target)}`
    );
  }
  return (
    target.nombre ||
    target.equipoNombre ||
    target.codigo ||
    `Equipo ${getTargetId(target)}`
  );
};

const getTargetCodigo = (target) => {
  if (!target) return "—";
  if (isUbicacionTarget(target)) {
    return (
      target.codigo ||
      target.ubicacionTecnicaCodigo ||
      String(getTargetId(target) || "—")
    );
  }
  return target.codigo || target.tag || String(getTargetId(target) || "—");
};

const getTargetTipoTexto = (target) => {
  if (!target) return "Registro";
  if (isUbicacionTarget(target)) return "Ubicación Técnica";
  return target.tipo || target.equipoTipo || "Equipo";
};

export default function ModalOTIndividual({
  isOpen,
  onClose,
  aviso,
  onGuardar,
  onGenerarNumeroOT,
  equipoActual = null,
  progresoEquipos = null,
}) {
  const [mostrarConfirmacionSalida, setMostrarConfirmacionSalida] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarInfoAviso, setMostrarInfoAviso] = useState(false);

  const [tratamientoData, setTratamientoData] = useState(null);

  const [archivosAdjuntos, setArchivosAdjuntos] = useState([]);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);

  const [trabajadores, setTrabajadores] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [cargandoTrabajadores, setCargandoTrabajadores] = useState(false);

  const [equipoDetalleModalId, setEquipoDetalleModalId] = useState(null);

  const [planesDisponibles, setPlanesDisponibles] = useState([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(false);

  const [numeroOTGenerado, setNumeroOTGenerado] = useState("");
  const [errors, setErrors] = useState({});

  const tratamientoAplicadoRef = useRef(false);

  const tipoMantenimiento = aviso?.tipoMantenimiento;
  const esPreventivo = tipoMantenimiento === "Preventivo";
  const esCorrectivo = tipoMantenimiento === "Correctivo";
  const isEditableActividades = esCorrectivo;

  const hayEquiposPendientes =
    progresoEquipos && progresoEquipos.actual < progresoEquipos.total;

  const tratamiento = tratamientoData?.tratamiento || tratamientoData || null;

  const targetEsUbicacion = isUbicacionTarget(equipoActual);
  const targetEsEquipo = !targetEsUbicacion;

  const [formData, setFormData] = useState({
    descripcionGeneral: "",
    descripcionDetallada: "",
    supervisorId: "",
    fechaProgramadaInicio: "",
    fechaProgramadaFin: "",
    observaciones: "",

    descripcionEquipo: "",
    descripcionUbicacion: "",
    prioridad: "MEDIA",

    planMantenimientoId: null,
    planMantenimiento: null,

    actividadesOT: [],

    trabajadoresAsignados: [],
    encargadoId: null,

    fechaInicioProgramada: "",
    fechaFinProgramada: "",

    adjuntosEquipo: [],
    subiendoAdjuntosEquipo: false,

    estado: "PENDIENTE",
  });

  /* ─────────────────────────────────────────────
     RESET AL CERRAR
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) {
      tratamientoAplicadoRef.current = false;
      setMostrarConfirmacion(false);
      setMostrarConfirmacionSalida(false);
      setMostrarInfoAviso(false);
      setTratamientoData(null);

      setArchivosAdjuntos([]);
      setPlanesDisponibles([]);
      setErrors({});
      setEquipoDetalleModalId(null);

      setFormData({
        descripcionGeneral: "",
        descripcionDetallada: "",
        supervisorId: "",
        fechaProgramadaInicio: "",
        fechaProgramadaFin: "",
        observaciones: "",

        descripcionEquipo: "",
        descripcionUbicacion: "",
        prioridad: "MEDIA",
        planMantenimientoId: null,
        planMantenimiento: null,
        actividadesOT: [],
        trabajadoresAsignados: [],
        encargadoId: null,
        fechaInicioProgramada: "",
        fechaFinProgramada: "",
        adjuntosEquipo: [],
        subiendoAdjuntosEquipo: false,
        estado: "PENDIENTE",
      });
    }
  }, [isOpen]);

  /* ─────────────────────────────────────────────
     CARGA TRABAJADORES / SUPERVISORES
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;

    setCargandoTrabajadores(true);
    Promise.all([
      getTrabajadores().then((data) =>
        setTrabajadores((data || []).filter((t) => t.rol !== "supervisor"))
      ),
      getTrabajadores("supervisor").then((data) => setSupervisores(data || [])),
    ])
      .catch((err) => console.error("Error cargando trabajadores:", err))
      .finally(() => setCargandoTrabajadores(false));
  }, [isOpen]);

  /* ─────────────────────────────────────────────
     AUTOGENERAR NUMERO OT + PRESET FECHAS
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen || !aviso) return;

    const numero = onGenerarNumeroOT
      ? onGenerarNumeroOT()
      : `OT-${Date.now().toString().slice(-6)}`;

    setNumeroOTGenerado(numero);

    setFormData((prev) => ({
      ...prev,
      descripcionGeneral: aviso.descripcion || "",
      fechaProgramadaInicio: aviso.fechaSugerida || "",
      fechaProgramadaFin: aviso.fechaSugeridaFin || "",
    }));
  }, [isOpen, aviso, onGenerarNumeroOT]);

  /* ─────────────────────────────────────────────
     CARGA TRATAMIENTO
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen || !aviso?.id) return;

    getTratamientoByAviso(aviso.id)
      .then((data) => setTratamientoData(data))
      .catch((err) => {
        console.error("[OTIndividual] Error cargando tratamiento:", err);
        setTratamientoData(null);
      });
  }, [isOpen, aviso?.id]);

  /* ─────────────────────────────────────────────
     CARGA PLANES SI ES EQUIPO Y PREVENTIVO
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    if (!esPreventivo) return;
    if (!equipoActual) return;
    if (targetEsUbicacion) {
      setPlanesDisponibles([]);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setCargandoPlanes(true);
      try {
        const equipoId = equipoActual?.equipoId || equipoActual?.id;
        const planes = await planMantenimientoService.getPlanesByEquipo(equipoId);
        if (cancelled) return;
        setPlanesDisponibles(Array.isArray(planes) ? planes : []);
      } catch (e) {
        console.error("[OTIndividual] Error cargando planes del equipo", e);
        if (!cancelled) setPlanesDisponibles([]);
      } finally {
        if (!cancelled) setCargandoPlanes(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, esPreventivo, equipoActual, targetEsUbicacion]);

  /* ─────────────────────────────────────────────
     APLICAR TRATAMIENTO AL TARGET ACTUAL
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    if (!tratamientoData) return;
    if (!equipoActual) return;
    if (tratamientoAplicadoRef.current) return;

    const tratEquipos = Array.isArray(tratamientoData.equipos)
      ? tratamientoData.equipos
      : [];

    if (!tratEquipos.length) return;

    const currentTargetId = getTargetId(equipoActual);

    const te = tratEquipos.find((t) => {
      if (targetEsUbicacion) {
        return (
          t.ubicacionTecnicaId === currentTargetId ||
          t.ubicacionTecnica?.id === currentTargetId
        );
      }
      return t.equipoId === currentTargetId || t.equipo?.id === currentTargetId;
    });

    tratamientoAplicadoRef.current = true;

    if (!te) return;

    const rawActs = Array.isArray(te.actividades) ? te.actividades : [];
    const actividadesOT = rawActs.map((a) =>
      mkActOT(
        {
          id: a.id,
          planMantenimientoActividadId: a.planMantenimientoActividadId,
          codigoActividad: a.codigoActividad,
          sistema: a.sistema,
          subsistema: a.subsistema,
          componente: a.componente,
          tarea: a.tarea,
          descripcion: a.descripcion,
          tipoTrabajo: a.tipoTrabajo,
          rolTecnico: a.rolTecnico,
          cantidadTecnicos: a.cantidadTecnicos,
          duracionEstimadaValor: a.duracionEstimadaValor,
          unidadDuracion: a.unidadDuracion,
          duracionEstimadaMin: a.duracionEstimadaMin,
          observaciones: a.observaciones,
          estado: "PENDIENTE",
          origen: a.origen || "TRATAMIENTO",
        },
        { forceSelected: true }
      )
    );

    setFormData((prev) => ({
      ...prev,
      planMantenimientoId: te.planMantenimientoId || null,
      planMantenimiento: te.planMantenimiento || null,
      actividadesOT,
      descripcionEquipo: targetEsEquipo
        ? te.descripcionEquipo || prev.descripcionEquipo || ""
        : prev.descripcionEquipo,
      descripcionUbicacion: targetEsUbicacion
        ? te.descripcionEquipo || prev.descripcionUbicacion || ""
        : prev.descripcionUbicacion,
    }));
  }, [isOpen, tratamientoData, equipoActual, targetEsUbicacion, targetEsEquipo]);

  /* ─────────────────────────────────────────────
     INPUT HANDLERS
  ───────────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  /* ─────────────────────────────────────────────
     PLAN (preventivo)
  ───────────────────────────────────────────── */
  const seleccionarPlan = async (planId) => {
    if (!planId) {
      setFormData((prev) => ({
        ...prev,
        planMantenimientoId: null,
        planMantenimiento: null,
        actividadesOT: [],
      }));
      return;
    }

    try {
      const planSel = await planMantenimientoService.getPlanById(planId);

      const actsRaw = planSel?.actividades || [];
      const acts = actsRaw.map((a) =>
        mkActOT(
          {
            planMantenimientoActividadId: a.id,
            codigoActividad: a.codigoActividad,
            sistema: a.sistema,
            subsistema: a.subsistema,
            componente: a.componente,
            tarea: a.tarea,
            descripcion: a.descripcion || "",
            tipoTrabajo: a.tipoTrabajo,
            rolTecnico: a.rolTecnico,
            cantidadTecnicos: a.cantidadTecnicos,
            duracionEstimadaValor: a.duracionMinutos || 0,
            unidadDuracion: a.unidadDuracion || "min",
            duracionEstimadaMin: a.duracionMinutos || null,
            observaciones: a.observaciones || "",
            estado: "PENDIENTE",
            origen: "PLAN",
          },
          { forceSelected: true }
        )
      );

      setFormData((prev) => ({
        ...prev,
        planMantenimientoId: planId,
        planMantenimiento: planSel,
        actividadesOT: acts,
      }));

      if (errors.plan) setErrors((prev) => ({ ...prev, plan: null }));
    } catch (error) {
      console.error("Error cargando detalles del plan", error);
      alert("Error cargando plan");
    }
  };

  /* ─────────────────────────────────────────────
     ACTIVIDADES OT (solo correctivo)
  ───────────────────────────────────────────── */
  const addActividadOT = () => {
    if (!isEditableActividades) return;
    setFormData((prev) => ({
      ...prev,
      actividadesOT: [
        ...(prev.actividadesOT || []),
        mkActOT(
          {
            tipoTrabajo: "REPARACION",
            unidadDuracion: "min",
            duracionEstimadaValor: 0,
            origen: "OT",
          },
          { forceSelected: true }
        ),
      ],
    }));
  };

  const updateActividadOT = (actIndex, field, value) => {
    setFormData((prev) => {
      const acts = [...(prev.actividadesOT || [])];
      acts[actIndex] = { ...acts[actIndex], [field]: value };

      if (field === "duracionEstimadaValor" || field === "unidadDuracion") {
        const unidad = acts[actIndex].unidadDuracion || "min";
        const valor = Number(acts[actIndex].duracionEstimadaValor) || 0;
        acts[actIndex].duracionEstimadaMin = toMinutes(valor, unidad) || null;
      }

      if (esCorrectivo && field === "tipoTrabajo") {
        if (!TIPOS_TRABAJO_CORRECTIVO.includes(value)) {
          acts[actIndex].tipoTrabajo = "REPARACION";
        }
      }

      return { ...prev, actividadesOT: acts };
    });
  };

  const removeActividadOT = (actIndex) => {
    if (!isEditableActividades) return;
    setFormData((prev) => ({
      ...prev,
      actividadesOT: (prev.actividadesOT || []).filter((_, i) => i !== actIndex),
    }));
  };

  /* ─────────────────────────────────────────────
     ADJUNTOS
  ───────────────────────────────────────────── */
  const handleUploadAdjuntos = async (files) => {
    try {
      if (!files || !files.length) return;
      setSubiendoArchivos(true);
      const data = await adjuntosService.uploadArchivos(files);
      setArchivosAdjuntos((prev) => [...prev, ...(data || [])]);
    } catch (err) {
      console.error("Error subiendo archivos", err);
      alert("Error subiendo archivos");
    } finally {
      setSubiendoArchivos(false);
    }
  };

  const handleUploadAdjuntosEquipo = async (files) => {
    try {
      if (!files || !files.length) return;

      setFormData((prev) => ({ ...prev, subiendoAdjuntosEquipo: true }));
      const data = await adjuntosService.uploadArchivos(files);

      setFormData((prev) => ({
        ...prev,
        adjuntosEquipo: [...(prev.adjuntosEquipo || []), ...(data || [])],
        subiendoAdjuntosEquipo: false,
      }));
    } catch (err) {
      console.error("Error subiendo adjuntos equipo", err);
      alert("Error subiendo archivos del registro");
      setFormData((prev) => ({ ...prev, subiendoAdjuntosEquipo: false }));
    }
  };

  /* ─────────────────────────────────────────────
     VALIDACIONES
  ───────────────────────────────────────────── */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.descripcionGeneral.trim())
      newErrors.descripcionGeneral = "La descripción general es requerida";
    if (!formData.supervisorId)
      newErrors.supervisorId = "El supervisor es requerido";
    if (!formData.fechaProgramadaInicio)
      newErrors.fechaProgramadaInicio = "La fecha de inicio programada es requerida";
    if (!formData.fechaProgramadaFin)
      newErrors.fechaProgramadaFin = "La fecha de fin programada es requerida";

    if (formData.fechaProgramadaInicio && formData.fechaProgramadaFin) {
      if (new Date(formData.fechaProgramadaFin) < new Date(formData.fechaProgramadaInicio))
        newErrors.fechaProgramadaFin = "La fecha de fin debe ser posterior a la de inicio";
    }

    const descripcionTarget = targetEsUbicacion
      ? formData.descripcionUbicacion
      : formData.descripcionEquipo;

    if (!descripcionTarget.trim())
      newErrors.descripcionTarget = "La descripción del trabajo es obligatoria";

    if (esPreventivo && !formData.planMantenimientoId)
      newErrors.plan = "En preventivo debe seleccionar un plan";

    if (!formData.trabajadoresAsignados || formData.trabajadoresAsignados.length === 0)
      newErrors.trabajadores = "Debe asignar al menos un trabajador";

    if (!formData.encargadoId)
      newErrors.encargado = "Debe seleccionar un encargado";

    if (!formData.fechaInicioProgramada)
      newErrors.fechaInicioProgramada = "Fecha de inicio requerida";

    if (!formData.fechaFinProgramada)
      newErrors.fechaFinProgramada = "Fecha de fin requerida";

    if (formData.fechaInicioProgramada && formData.fechaFinProgramada) {
      if (new Date(formData.fechaFinProgramada) < new Date(formData.fechaInicioProgramada))
        newErrors.fechaFinProgramada = "La fecha fin debe ser posterior a inicio";
    }

    const acts = formData.actividadesOT || [];

    if (esCorrectivo) {
      if (!acts.length) {
        newErrors.acts = "Debes agregar al menos 1 actividad";
      } else {
        const selected = acts.filter((a) => a.selected);
        if (selected.length === 0) {
          newErrors.acts = "Debes dejar al menos 1 actividad seleccionada";
        } else if (selected.some((a) => !a.tarea?.trim())) {
          newErrors.acts = "Hay actividades seleccionadas sin tarea";
        } else if (
          selected.some((a) => a.tipoTrabajo && !TIPOS_TRABAJO_CORRECTIVO.includes(a.tipoTrabajo))
        ) {
          newErrors.acts = "En correctivo solo se permite REPARACION o CAMBIO";
        }
      }
    } else {
      if (formData.planMantenimientoId && acts.length === 0)
        newErrors.acts = "El plan seleccionado no tiene actividades";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitInternal = () => {
    if (!validateForm()) return;
    setMostrarConfirmacion(true);
  };

  /* ─────────────────────────────────────────────
     CONFIRMAR Y ARMAR PAYLOAD
  ───────────────────────────────────────────── */
  const confirmarCreacion = () => {
    if (!aviso?.tratamientos || aviso.tratamientos.length === 0) {
      alert("Este aviso no tiene tratamiento.");
      return;
    }
    if (!equipoActual) {
      alert("No hay target actual.");
      return;
    }

    const tratamientoId = aviso.tratamientos[0].id;

    const targetPayload = {
      equipoId: targetEsEquipo ? getTargetId(equipoActual) : null,
      ubicacionTecnicaId: targetEsUbicacion ? getTargetId(equipoActual) : null,

      descripcionEquipo: targetEsEquipo ? formData.descripcionEquipo.trim() : null,
      descripcionUbicacion: targetEsUbicacion
        ? formData.descripcionUbicacion.trim()
        : null,

      prioridad: formData.prioridad,
      planMantenimientoId: formData.planMantenimientoId || null,

      fechaInicioProgramada: new Date(formData.fechaInicioProgramada).toISOString(),
      fechaFinProgramada: new Date(formData.fechaFinProgramada).toISOString(),

      actividades: (formData.actividadesOT || [])
        .filter((a) => (esPreventivo ? true : a.selected))
        .map(normalizeActOTForPayload),

      trabajadores: (formData.trabajadoresAsignados || []).map((id) => ({
        trabajadorId: id,
        esEncargado: id === formData.encargadoId,
      })),

      adjuntos: formData.adjuntosEquipo || [],
    };

    const payload = {
      numeroOT: numeroOTGenerado,
      descripcionGeneral: formData.descripcionGeneral.trim(),
      descripcionDetallada: formData.descripcionDetallada?.trim() || null,
      avisoId: aviso.id,
      tratamientoId,
      supervisorId: formData.supervisorId,

      fechaProgramadaInicio: new Date(formData.fechaProgramadaInicio).toISOString(),
      fechaProgramadaFin: new Date(formData.fechaProgramadaFin).toISOString(),

      observaciones: formData.observaciones || null,

      modo: "INDIVIDUAL",
      targets: [targetPayload],

      adjuntos: archivosAdjuntos || [],
    };

    onGuardar(payload);
    setMostrarConfirmacion(false);
  };

  /* ─────────────────────────────────────────────
     CERRAR
  ───────────────────────────────────────────── */
  const handleCerrar = () => {
    if (hayEquiposPendientes) setMostrarConfirmacionSalida(true);
    else onClose();
  };

  const confirmarSalida = () => {
    setMostrarConfirmacionSalida(false);
    onClose();
  };

  if (!isOpen) return null;

  const isReadOnlyActividades = esPreventivo;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col border border-slate-200">
          {/* HEADER */}
          <div className="relative bg-gradient-to-r from-violet-600 via-purple-700 to-violet-600 p-8 rounded-t-3xl overflow-hidden">
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                    <FileText className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>

                  <div>
                    <h3 className="text-3xl font-bold text-white mb-1">
                      Crear Orden de Trabajo Individual
                    </h3>

                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-bold">
                        {numeroOTGenerado}
                      </span>

                      <span className="text-violet-200">•</span>
                      <span className="text-violet-200">
                        Aviso:{" "}
                        <span className="text-white font-bold">
                          {aviso?.numeroAviso}
                        </span>
                      </span>

                      {tipoMantenimiento && (
                        <>
                          <span className="text-violet-200">•</span>
                          <span
                            className={`px-3 py-1 backdrop-blur-sm border rounded-full text-sm font-bold ${
                              esPreventivo
                                ? "bg-green-500/30 border-green-400/40 text-green-100"
                                : "bg-orange-500/30 border-orange-400/40 text-orange-100"
                            }`}
                          >
                            {tipoMantenimiento}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMostrarInfoAviso(true)}
                    className="px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl transition-all duration-200 flex items-center gap-2 text-white font-semibold border border-white/30 hover:border-white/50"
                    type="button"
                  >
                    <FileText className="w-5 h-5" />
                    Info del Aviso
                  </button>

                  <button
                    onClick={handleCerrar}
                    className="p-2.5 hover:bg-white/15 rounded-xl transition-all duration-200"
                    type="button"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {progresoEquipos && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold text-sm">
                      Registro {progresoEquipos.actual} de {progresoEquipos.total}
                    </span>
                    <span className="text-violet-200 text-xs font-semibold">
                      {Math.round(
                        (progresoEquipos.actual / progresoEquipos.total) * 100
                      )}
                      % completado
                    </span>
                  </div>

                  <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (progresoEquipos.actual / progresoEquipos.total) * 100
                        }%`,
                      }}
                    />
                  </div>

                  {equipoActual && (
                    <div className="mt-3 flex items-center gap-3 bg-white/10 rounded-lg p-3 border border-white/20">
                      {targetEsUbicacion ? (
                        <MapPin className="w-5 h-5 text-violet-200" />
                      ) : (
                        <Settings className="w-5 h-5 text-violet-200" />
                      )}
                      <div>
                        <p className="text-white font-bold text-sm">
                          {getTargetNombre(equipoActual)}
                        </p>
                        <p className="text-violet-200 text-xs">
                          {getTargetTipoTexto(equipoActual)} • {getTargetCodigo(equipoActual)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-violet-50">
            <div className="p-8 space-y-6">
              {tipoMantenimiento && (
                <div
                  className={`p-5 rounded-2xl border-l-4 ${
                    esPreventivo
                      ? "bg-green-50 border-green-500"
                      : "bg-orange-50 border-orange-500"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className={`w-6 h-6 mt-0.5 flex-shrink-0 ${
                        esPreventivo ? "text-green-600" : "text-orange-600"
                      }`}
                    />
                    <div>
                      <p
                        className={`font-bold text-lg ${
                          esPreventivo ? "text-green-900" : "text-orange-900"
                        }`}
                      >
                        Mantenimiento {tipoMantenimiento}
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          esPreventivo ? "text-green-700" : "text-orange-700"
                        }`}
                      >
                        {esPreventivo
                          ? "En preventivo puedes cambiar el plan y cargar sus actividades."
                          : "En correctivo puedes editar/agregar/eliminar actividades antes de crear la OT."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {hayEquiposPendientes && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-900 mb-1">
                        Creando OT Individual - Registro {progresoEquipos.actual} de{" "}
                        {progresoEquipos.total}
                      </p>
                      <p className="text-xs text-blue-700">
                        Complete los datos para generar la OT de este registro.
                        <span className="block mt-1 font-bold">
                          ⚠️ Luego continuarás con los{" "}
                          {progresoEquipos.total - progresoEquipos.actual} restantes.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* INFO GENERAL */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl">
                    <ClipboardCheck className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">
                    Información General
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Número de Orden de Trabajo
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                      <Zap className="w-5 h-5 text-green-600" />
                      <span className="font-bold text-green-700 text-lg">
                        {numeroOTGenerado}
                      </span>
                      <span className="ml-auto text-xs bg-green-600 text-white px-3 py-1 rounded-full font-bold">
                        Autogenerado
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Supervisor Responsable <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="supervisorId"
                      value={formData.supervisorId}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium bg-white ${
                        errors.supervisorId
                          ? "border-red-400 bg-red-50"
                          : "border-slate-300"
                      }`}
                    >
                      <option value="">Seleccione un supervisor</option>
                      {supervisores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} - {s.empresa}
                        </option>
                      ))}
                    </select>
                    {errors.supervisorId && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        {errors.supervisorId}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Descripción General del Trabajo{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="descripcionGeneral"
                      value={formData.descripcionGeneral}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe el alcance general..."
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none font-medium ${
                        errors.descripcionGeneral
                          ? "border-red-400 bg-red-50"
                          : "border-slate-300 bg-white"
                      }`}
                    />
                    {errors.descripcionGeneral && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        {errors.descripcionGeneral}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Descripción Detallada{" "}
                      <span className="text-xs text-slate-500 font-normal">(Opcional)</span>
                    </label>
                    <textarea
                      name="descripcionDetallada"
                      value={formData.descripcionDetallada}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Procedimientos, seguridad..."
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none font-medium bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* FECHAS GENERALES */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">
                    Periodo de Ejecución General
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Fecha y Hora de Inicio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="fechaProgramadaInicio"
                      value={formData.fechaProgramadaInicio}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium ${
                        errors.fechaProgramadaInicio
                          ? "border-red-400 bg-red-50"
                          : "border-slate-300 bg-white"
                      }`}
                    />
                    {errors.fechaProgramadaInicio && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        {errors.fechaProgramadaInicio}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Fecha y Hora de Fin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="fechaProgramadaFin"
                      value={formData.fechaProgramadaFin}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium ${
                        errors.fechaProgramadaFin
                          ? "border-red-400 bg-red-50"
                          : "border-slate-300 bg-white"
                      }`}
                    />
                    {errors.fechaProgramadaFin && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        {errors.fechaProgramadaFin}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* CONFIG TARGET */}
              {equipoActual && (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                        {targetEsUbicacion ? (
                          <MapPin className="w-5 h-5 text-white" />
                        ) : (
                          <Settings className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">
                          {getTargetNombre(equipoActual)}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {getTargetTipoTexto(equipoActual)} • {getTargetCodigo(equipoActual)}
                        </p>
                      </div>
                    </div>

                    {targetEsEquipo && (
                      <button
                        onClick={() => setEquipoDetalleModalId(getTargetId(equipoActual))}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md"
                        type="button"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Descripción */}
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                      <label className="block text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Descripción del Trabajo <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name={targetEsUbicacion ? "descripcionUbicacion" : "descripcionEquipo"}
                        value={targetEsUbicacion ? formData.descripcionUbicacion : formData.descripcionEquipo}
                        onChange={handleChange}
                        rows={3}
                        placeholder={`Detalla el trabajo en ${getTargetNombre(equipoActual)}...`}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium resize-none ${
                          errors.descripcionTarget
                            ? "border-red-400 bg-red-50"
                            : "border-amber-300 bg-white"
                        }`}
                      />
                      {errors.descripcionTarget && (
                        <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          {errors.descripcionTarget}
                        </p>
                      )}
                    </div>

                    {/* Prioridad */}
                    <div className="max-w-xs">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Prioridad <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="prioridad"
                        value={formData.prioridad}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                      >
                        <option value="BAJA">🟢 Baja</option>
                        <option value="MEDIA">🟡 Media</option>
                        <option value="ALTA">🟠 Alta</option>
                        <option value="CRITICA">🔴 Crítica</option>
                      </select>
                    </div>

                    {/* PLAN */}
                    {esPreventivo && (
                      <div className="border-2 rounded-xl p-4 bg-green-50 border-green-200">
                        <label className="text-sm font-bold flex items-center gap-2 text-green-900 mb-3">
                          <Wrench className="w-4 h-4" />
                          Plan de Mantenimiento <span className="text-red-500">*</span>
                        </label>

                        {targetEsUbicacion ? (
                          <>
                            {formData.planMantenimiento ? (
                              <div className="bg-white border border-green-200 rounded-xl p-4">
                                <p className="text-xs font-semibold text-green-800">
                                  Plan asociado
                                </p>
                                <p className="font-bold text-slate-900">
                                  {formData.planMantenimiento?.codigoPlan
                                    ? `${formData.planMantenimiento.codigoPlan} — `
                                    : ""}
                                  {formData.planMantenimiento?.nombre || "—"}
                                </p>
                              </div>
                            ) : (
                              <div className="bg-white border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                                Esta ubicación técnica no tiene selector de plan por equipo en este modal.
                                Si el tratamiento ya trae plan, se usará ese.
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {cargandoPlanes && planesDisponibles.length === 0 && !formData.planMantenimientoId ? (
                              <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                Cargando planes del equipo...
                              </div>
                            ) : null}

                            <select
                              className={`w-full px-4 py-2.5 border-2 rounded-lg bg-white focus:ring-4 transition-all font-medium
                                border-green-300 focus:ring-green-500/20 focus:border-green-500
                                ${errors.plan ? "border-red-400 bg-red-50" : ""}`}
                              value={formData.planMantenimientoId || ""}
                              onChange={(e) => seleccionarPlan(e.target.value)}
                            >
                              <option value="">— Seleccione un plan —</option>
                              {planesDisponibles.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {(p.codigoPlan ? `${p.codigoPlan} — ` : "") + (p.nombre || "Plan")}
                                </option>
                              ))}
                            </select>

                            {planesDisponibles.length === 0 && (
                              <p className="mt-2 text-xs text-amber-700">
                                ⚠️ Este equipo no tiene planes asociados
                              </p>
                            )}

                            {errors.plan && (
                              <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                                <AlertCircle className="w-3 h-3" /> {errors.plan}
                              </p>
                            )}
                          </>
                        )}

                        {formData.planMantenimiento && (
                          <div className="mt-3 bg-white border border-green-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-green-800">Nombre</p>
                              <p className="font-medium text-slate-900">
                                {formData.planMantenimiento.nombre || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-green-800">Código</p>
                              <p className="font-medium text-slate-900">
                                {formData.planMantenimiento.codigoPlan || "—"}
                              </p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-xs font-semibold text-green-800">Descripción</p>
                              <p className="font-medium text-slate-900">
                                {formData.planMantenimiento.descripcion || "—"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TRABAJADORES */}
                    <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-slate-900">Asignación de Personal</p>
                        {cargandoTrabajadores && (
                          <span className="text-xs text-slate-500">Cargando...</span>
                        )}
                      </div>

                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Trabajadores <span className="text-red-500">*</span>
                      </label>

                      <div
                        className={`p-3 rounded-xl border-2 bg-slate-50 ${
                          errors.trabajadores ? "border-red-400" : "border-slate-200"
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {trabajadores.map((t) => {
                            const checked = (formData.trabajadoresAsignados || []).includes(t.id);
                            return (
                              <label
                                key={t.id}
                                className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const current = new Set(formData.trabajadoresAsignados || []);
                                    if (current.has(t.id)) current.delete(t.id);
                                    else current.add(t.id);

                                    const nuevos = Array.from(current);

                                    let encargadoId = formData.encargadoId;
                                    if (encargadoId && !current.has(encargadoId)) encargadoId = null;

                                    setFormData((prev) => ({
                                      ...prev,
                                      trabajadoresAsignados: nuevos,
                                      encargadoId,
                                    }));
                                  }}
                                  className="w-4 h-4"
                                />
                                <span>
                                  {t.nombre}{" "}
                                  <span className="text-xs text-slate-400">
                                    ({t.empresa || "—"})
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {errors.trabajadores && (
                        <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          {errors.trabajadores}
                        </p>
                      )}

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Encargado <span className="text-red-500">*</span>
                        </label>

                        <select
                          value={formData.encargadoId || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, encargadoId: e.target.value }))
                          }
                          className={`w-full px-4 py-3 border-2 rounded-xl bg-white focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium ${
                            errors.encargado ? "border-red-400 bg-red-50" : "border-slate-300"
                          }`}
                        >
                          <option value="">Seleccione encargado</option>
                          {(formData.trabajadoresAsignados || []).map((id) => {
                            const t = trabajadores.find((x) => x.id === id);
                            if (!t) return null;
                            return (
                              <option key={id} value={id}>
                                {t.nombre} {t.empresa ? `- ${t.empresa}` : ""}
                              </option>
                            );
                          })}
                        </select>

                        {errors.encargado && (
                          <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3 h-3" />
                            {errors.encargado}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* FECHAS */}
                    <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                      <p className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-600" />
                        Programación del {targetEsUbicacion ? "registro" : "equipo"}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Inicio programado <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            name="fechaInicioProgramada"
                            value={formData.fechaInicioProgramada}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border-2 rounded-lg text-sm font-medium bg-white ${
                              errors.fechaInicioProgramada
                                ? "border-red-400 bg-red-50"
                                : "border-slate-200"
                            }`}
                          />
                          {errors.fechaInicioProgramada && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.fechaInicioProgramada}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Fin programado <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            name="fechaFinProgramada"
                            value={formData.fechaFinProgramada}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border-2 rounded-lg text-sm font-medium bg-white ${
                              errors.fechaFinProgramada
                                ? "border-red-400 bg-red-50"
                                : "border-slate-200"
                            }`}
                          />
                          {errors.fechaFinProgramada && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.fechaFinProgramada}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ADJUNTOS */}
                    <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                      <p className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-slate-600" />
                        Adjuntos del {targetEsUbicacion ? "registro" : "equipo"}
                      </p>

                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleUploadAdjuntosEquipo(e.target.files)}
                        className="w-full text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white file:font-bold hover:file:bg-slate-800 cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-3 hover:border-slate-400 transition-all"
                      />

                      {formData.subiendoAdjuntosEquipo && (
                        <div className="mt-3 flex items-center gap-2 text-violet-600 bg-violet-50 p-3 rounded-xl border border-violet-200">
                          <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm font-semibold">Subiendo adjuntos...</p>
                        </div>
                      )}

                      {(formData.adjuntosEquipo || []).length > 0 && (
                        <div className="mt-3 space-y-2">
                          {(formData.adjuntosEquipo || []).map((file, i) => (
                            <div
                              key={file.id || i}
                              className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-slate-700" />
                                <span className="text-sm font-semibold text-slate-800">
                                  {file.nombre || file.filename || "Archivo"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    adjuntosEquipo: (prev.adjuntosEquipo || []).filter(
                                      (_, idx) => idx !== i
                                    ),
                                  }))
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ACTIVIDADES */}
                    <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4 text-slate-600" />
                            Actividades
                            {(formData.actividadesOT || []).length > 0 && (
                              <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                {(formData.actividadesOT || []).length}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {esPreventivo ? "Preventivo · Solo lectura" : "Correctivo · Editables"}
                          </p>
                        </div>

                        {isEditableActividades && (
                          <button
                            type="button"
                            onClick={addActividadOT}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all"
                          >
                            + Agregar
                          </button>
                        )}
                      </div>

                      {errors.acts && (
                        <p className="mb-3 text-xs text-red-600 flex items-center gap-1 font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          {errors.acts}
                        </p>
                      )}

                      {(formData.actividadesOT || []).length === 0 ? (
                        <div className="text-center py-6 text-slate-400">
                          <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-xs">
                            {esPreventivo
                              ? "Selecciona un plan para cargar actividades"
                              : "No hay actividades. Agrega una."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(formData.actividadesOT || []).map((act, actIdx) => (
                            <div
                              key={act.id || actIdx}
                              className={`rounded-xl border-2 p-4 transition-all ${
                                esPreventivo
                                  ? "bg-green-50 border-green-200"
                                  : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-bold text-slate-900">
                                  Actividad #{actIdx + 1}
                                </p>

                                {isEditableActividades && (
                                  <button
                                    type="button"
                                    onClick={() => removeActividadOT(actIdx)}
                                    className="px-2 py-1 bg-red-100 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Eliminar
                                  </button>
                                )}
                              </div>

                              {esCorrectivo && (
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-3">
                                  <input
                                    type="checkbox"
                                    checked={!!act.selected}
                                    onChange={(e) =>
                                      updateActividadOT(actIdx, "selected", e.target.checked)
                                    }
                                    className="w-4 h-4"
                                  />
                                  Incluir en la OT
                                </label>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Sistema
                                  </label>
                                  <input
                                    value={act.sistema}
                                    onChange={(e) =>
                                      updateActividadOT(actIdx, "sistema", e.target.value)
                                    }
                                    disabled={isReadOnlyActividades}
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Subsistema
                                  </label>
                                  <input
                                    value={act.subsistema}
                                    onChange={(e) =>
                                      updateActividadOT(actIdx, "subsistema", e.target.value)
                                    }
                                    disabled={isReadOnlyActividades}
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Componente
                                  </label>
                                  <input
                                    value={act.componente}
                                    onChange={(e) =>
                                      updateActividadOT(actIdx, "componente", e.target.value)
                                    }
                                    disabled={isReadOnlyActividades}
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Tarea <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    value={act.tarea}
                                    onChange={(e) =>
                                      updateActividadOT(actIdx, "tarea", e.target.value)
                                    }
                                    disabled={isReadOnlyActividades}
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Descripción
                                  </label>
                                  <input
                                    value={act.descripcion}
                                    onChange={(e) =>
                                      updateActividadOT(actIdx, "descripcion", e.target.value)
                                    }
                                    disabled={isReadOnlyActividades}
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Tipo de Trabajo
                                  </label>
                                  <select
                                    value={act.tipoTrabajo}
                                    onChange={(e) =>
                                      updateActividadOT(actIdx, "tipoTrabajo", e.target.value)
                                    }
                                    disabled={isReadOnlyActividades}
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                  >
                                    {(esCorrectivo
                                      ? TIPOS_TRABAJO_CORRECTIVO
                                      : TIPOS_TRABAJO_ENUM
                                    ).map((t) => (
                                      <option key={t} value={t}>
                                        {t}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Duración
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="number"
                                      value={act.duracionEstimadaValor}
                                      onChange={(e) =>
                                        updateActividadOT(
                                          actIdx,
                                          "duracionEstimadaValor",
                                          e.target.value
                                        )
                                      }
                                      disabled={isReadOnlyActividades}
                                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                    />
                                    <select
                                      value={act.unidadDuracion}
                                      onChange={(e) =>
                                        updateActividadOT(
                                          actIdx,
                                          "unidadDuracion",
                                          e.target.value
                                        )
                                      }
                                      disabled={isReadOnlyActividades}
                                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                    >
                                      <option value="min">min</option>
                                      <option value="h">h</option>
                                    </select>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-1">
                                    Normalizado: {act.duracionEstimadaMin ?? 0} min
                                  </p>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Rol técnico
                                  </label>
                                  <input
                                    value={act.rolTecnico}
                                    onChange={(e) =>
                                      updateActividadOT(actIdx, "rolTecnico", e.target.value)
                                    }
                                    disabled={isReadOnlyActividades}
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Cantidad técnicos
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={act.cantidadTecnicos}
                                    onChange={(e) =>
                                      updateActividadOT(actIdx, "cantidadTecnicos", e.target.value)
                                    }
                                    disabled={isReadOnlyActividades}
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Observaciones
                                  </label>
                                  <input
                                    value={act.observaciones}
                                    onChange={(e) =>
                                      updateActividadOT(
                                        actIdx,
                                        "observaciones",
                                        e.target.value
                                      )
                                    }
                                    disabled={isReadOnlyActividades}
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ADJUNTOS GENERALES */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">
                    Archivos Adjuntos Generales
                  </h4>
                </div>

                <input
                  type="file"
                  multiple
                  onChange={(e) => handleUploadAdjuntos(e.target.files)}
                  className="w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-violet-600 file:to-purple-600 file:text-white file:font-bold hover:file:from-violet-700 hover:file:to-purple-700 cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-violet-400 transition-all"
                />

                {subiendoArchivos && (
                  <div className="mt-4 flex items-center gap-3 text-violet-600 bg-violet-50 p-4 rounded-xl border border-violet-200">
                    <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-semibold">Subiendo archivos...</p>
                  </div>
                )}

                {archivosAdjuntos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {archivosAdjuntos.map((file, i) => (
                      <div
                        key={file.id || i}
                        className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-xl border border-violet-200"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-violet-600" />
                          <span className="text-sm font-semibold text-slate-800">
                            {file.nombre || file.filename || "Archivo"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setArchivosAdjuntos((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* OBSERVACIONES */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Observaciones Generales
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none font-medium bg-white"
                />
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-6 border-t-2 border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-3xl">
            <button
              onClick={handleCerrar}
              className="px-6 py-3 border-2 border-slate-400 rounded-xl hover:bg-white transition-all font-bold text-slate-700 flex items-center gap-2"
              type="button"
            >
              <X className="w-5 h-5" />
              {hayEquiposPendientes ? "Cancelar Todo" : "Cancelar"}
            </button>

            <button
              onClick={handleSubmitInternal}
              className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold shadow-xl flex items-center gap-3"
              type="button"
            >
              <CheckCircle2 className="w-5 h-5" />
              {hayEquiposPendientes
                ? `Guardar y Continuar (${progresoEquipos.actual}/${progresoEquipos.total})`
                : "Crear OT Individual"}
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMACIÓN DE SALIDA */}
      {mostrarConfirmacionSalida && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-2 border-amber-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">¿Está seguro de salir?</h3>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-slate-700">
                Estás procesando <span className="font-bold text-violet-600">OTs individuales</span>.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-bold text-amber-900 mb-1">
                  ⚠️ Registros pendientes:
                </p>
                <p className="text-sm text-amber-800">
                  <span className="font-bold text-lg">
                    {progresoEquipos?.total - progresoEquipos?.actual}
                  </span>{" "}
                  de {progresoEquipos?.total} aún sin OT
                </p>
              </div>
              <p className="text-sm text-slate-600">
                Si sales ahora, tendrás que reiniciar el proceso para los registros restantes.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmacionSalida(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700"
                type="button"
              >
                Continuar
              </button>
              <button
                onClick={confirmarSalida}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-bold"
                type="button"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN CREACIÓN */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-violet-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Confirmar Creación</h3>
            </div>

            <div className="space-y-2 mb-6 text-sm text-slate-700">
              <p>
                <strong>OT:</strong> {numeroOTGenerado}
              </p>
              <p>
                <strong>Registro:</strong> {getTargetNombre(equipoActual)}
              </p>
              <p>
                <strong>Supervisor:</strong>{" "}
                {supervisores.find((s) => s.id === formData.supervisorId)?.nombre || "N/A"}
              </p>
              {hayEquiposPendientes && (
                <p className="text-amber-600 font-bold">
                  Progreso: {progresoEquipos.actual}/{progresoEquipos.total}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700"
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCreacion}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold"
                type="button"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALES AUX */}
      <ModalInfoAviso
        isOpen={mostrarInfoAviso}
        onClose={() => setMostrarInfoAviso(false)}
        aviso={aviso}
      />

      <ModalDetallesEquipo
        equipoId={equipoDetalleModalId}
        isOpen={!!equipoDetalleModalId}
        onClose={() => setEquipoDetalleModalId(null)}
      />
    </>
  );
}