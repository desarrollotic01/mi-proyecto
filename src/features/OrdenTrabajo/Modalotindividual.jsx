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
  ShoppingCart,
  Warehouse,
  Edit,
} from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";

import { getTratamientoByAviso } from "../mantenimiento/services/tratamientoService";
import { getTrabajadores } from "../mantenimiento/services/trabajadoresService";
import { planMantenimientoService } from "../PlanMantenimiento/services/planMantenimientoService";
import { adjuntosService } from "../OrdenTrabajo/services/adjuntosService";

import ModalInfoAviso from "./modals/ModalInfoAviso";
import ModalDetallesEquipo from "../OrdenTrabajo/modals/ModalDetalleEquipo";
import ModalSolicitudCompra from "../../components/inputs/ModalSolicitudCompra";
import ModalSolicitudAlmacen from "../../components/inputs/ModalSolicitudAlmacen";

import OTActividadPreventivaItem, {
  OTActividadesPreventivasHeader,
} from "./components/OTActividadPreventivaItem";
import OTActividadCorrectivaItem, {
  OTActividadesCorrectivasHeader,
} from "./components/OTActividadCorrectivaItem";

/* ─────────────────────────────────────────────
   ENUMS / HELPERS
───────────────────────────────────────────── */

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
    tipo: base.tipo === "EXTERNO" ? "EXTERNO" : "INTERNO",
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
    tipo: a.tipo === "EXTERNO" ? "EXTERNO" : "INTERNO",
    rolTecnico: a.tipo === "EXTERNO" ? null : (a.rolTecnico || null),
    cantidadTecnicos: Number(a.cantidadTecnicos) || 1,
    duracionEstimadaValor: valor,
    unidadDuracion: unidad,
    duracionEstimadaMin: durMin || null,
    observaciones: a.observaciones?.trim() || null,
    estado: a.estado || "PENDIENTE",
    origen: a.origen || "OT",
  };
};

const isUbicacionTarget = (target) =>
  !!target?.ubicacionTecnicaId || target?.tipo === "UBICACION_TECNICA";

const getTargetId = (target) =>
  target?.equipoId || target?.ubicacionTecnicaId || target?.id || null;

const getTargetKey = (target) => {
  if (!target) return null;
  if (target?.equipoId) return `E:${String(target.equipoId)}`;
  if (target?.ubicacionTecnicaId) return `U:${String(target.ubicacionTecnicaId)}`;
  return null;
};

const getTargetNombre = (target) => {
  if (!target) return "Registro";
  if (isUbicacionTarget(target))
    return target.nombre || target.ubicacionTecnicaNombre || `Ubicación ${getTargetId(target)}`;
  return target.nombre || target.equipoNombre || target.codigo || `Equipo ${getTargetId(target)}`;
};

const getTargetCodigo = (target) => {
  if (!target) return "—";
  if (isUbicacionTarget(target))
    return target.codigo || target.ubicacionTecnicaCodigo || String(getTargetId(target) || "—");
  return target.codigo || target.tag || String(getTargetId(target) || "—");
};

const getTargetTipoTexto = (target) => {
  if (!target) return "Registro";
  if (isUbicacionTarget(target)) return "Ubicación Técnica";
  return target.tipo || target.equipoTipo || "Equipo";
};

/* ─────────────────────────────────────────────
   HELPERS SOLICITUDES
───────────────────────────────────────────── */

const normalizarSolicitudDesdeDB = (s) => {
  if (!s) return null;
  return {
    requiredDate: s.requiredDate ? String(s.requiredDate).slice(0, 10) : "",
    lineas: (s.lineas || []).map((l) => ({
      id: l.id || crypto.randomUUID(),
      itemId: l.itemId || "",
      itemCode: l.itemCode || "",
      description: l.description || "",
      quantity: Number(l.quantity) || 1,
      warehouseCode: l.warehouseCode || "",
      costCenter: l.costingCode || l.costCenter || "",
      projectCode: l.projectCode || "",
      rubroId: l.rubroId || null,
      paqueteTrabajoId: l.paqueteTrabajoId || null,
    })),
  };
};

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */

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
  const [modalTexto, setModalTexto] = useState(null);

  // Solicitudes
  const [showSolicitudCompraModal, setShowSolicitudCompraModal] = useState(false);
  const [showSolicitudAlmacenModal, setShowSolicitudAlmacenModal] = useState(false);
  const [solicitudesCompra, setSolicitudesCompra] = useState(null);
  const [solicitudesAlmacen, setSolicitudesAlmacen] = useState(null);

  // Strategy para solicitud general
  const [strategyCompra, setStrategyCompra] = useState("NINGUNA"); // "ASIGNAR" | "NINGUNA"
  const [strategyAlmacen, setStrategyAlmacen] = useState("NINGUNA");

  const tratamientoAplicadoRef = useRef(false);

  const tipoMantenimiento = aviso?.tipoMantenimiento;
  const esPreventivo = tipoMantenimiento === "Preventivo";
  const esCorrectivo = tipoMantenimiento === "Correctivo";

  const hayEquiposPendientes =
    progresoEquipos && progresoEquipos.actual < progresoEquipos.total;

  const targetEsUbicacion = isUbicacionTarget(equipoActual);
  const targetEsEquipo = !targetEsUbicacion;
  const targetKey = getTargetKey(equipoActual);

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

  /* ─── Solicitudes del tratamiento ── */
  const solicitudesCompraDB = useMemo(() => {
    const arr = tratamientoData?.solicitudesCompra || [];
    return Array.isArray(arr) ? arr : [];
  }, [tratamientoData]);

  const solicitudesAlmacenDB = useMemo(() => {
    const arr = tratamientoData?.solicitudesAlmacen || [];
    return Array.isArray(arr) ? arr : [];
  }, [tratamientoData]);

  // Solicitud general del tratamiento (si existe)
 // Solicitud general de compra — solo si NO tiene OT asignada aún
const solicitudCompraGeneralDB = useMemo(
  () => solicitudesCompraDB.find((s) => s.esGeneral && !s.ordenTrabajoId) || null,
  [solicitudesCompraDB]
);

const solicitudAlmacenGeneralDB = useMemo(
  () => solicitudesAlmacenDB.find((s) => s.esGeneral && !s.ordenTrabajoId) || null,
  [solicitudesAlmacenDB]
);

  // Solicitud por equipo/ubicación de este target
  const solicitudCompraPorTarget = useMemo(() => {
    const id = String(getTargetId(equipoActual) || "");
    return solicitudesCompraDB.find(
      (s) => !s.esGeneral && (String(s.equipo_id) === id || String(s.ubicacion_tecnica_id) === id)
    ) || null;
  }, [solicitudesCompraDB, equipoActual]);

  const solicitudAlmacenPorTarget = useMemo(() => {
    const id = String(getTargetId(equipoActual) || "");
    return solicitudesAlmacenDB.find(
      (s) => !s.esGeneral && (String(s.equipo_id) === id || String(s.ubicacion_tecnica_id) === id)
    ) || null;
  }, [solicitudesAlmacenDB, equipoActual]);

  // Valor inicial para los modales de solicitud
  const initialValueCompra = useMemo(() => {
    const porEquipo = {};
    if (solicitudCompraPorTarget && targetKey) {
      porEquipo[targetKey] = normalizarSolicitudDesdeDB(solicitudCompraPorTarget);
    }
    return {
      solicitudGeneral: normalizarSolicitudDesdeDB(solicitudCompraGeneralDB),
      solicitudesPorEquipo: porEquipo,
    };
  }, [solicitudCompraGeneralDB, solicitudCompraPorTarget, targetKey]);

  const initialValueAlmacen = useMemo(() => {
    const porEquipo = {};
    if (solicitudAlmacenPorTarget && targetKey) {
      porEquipo[targetKey] = normalizarSolicitudDesdeDB(solicitudAlmacenPorTarget);
    }
    return {
      solicitudGeneral: normalizarSolicitudDesdeDB(solicitudAlmacenGeneralDB),
      solicitudesPorEquipo: porEquipo,
    };
  }, [solicitudAlmacenGeneralDB, solicitudAlmacenPorTarget, targetKey]);

  // Targets para los modales de solicitud (solo este equipo)
const targetsParaModal = useMemo(() => {
  if (!equipoActual || !targetKey) return [];
  return [{
    id: targetKey,  // ← "E:uuid" o "U:uuid" en vez de uuid plano
    type: isUbicacionTarget(equipoActual) ? "UBICACION_TECNICA" : "EQUIPO",
    nombre: getTargetNombre(equipoActual),
    tag: getTargetCodigo(equipoActual),
    equipoId: targetEsEquipo ? getTargetId(equipoActual) : null,
    ubicacionTecnicaId: targetEsUbicacion ? getTargetId(equipoActual) : null,
  }];
}, [equipoActual, targetKey, targetEsEquipo, targetEsUbicacion]);
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
      setModalTexto(null);
      setSolicitudesCompra(null);
      setSolicitudesAlmacen(null);
      setStrategyCompra("NINGUNA");
      setStrategyAlmacen("NINGUNA");
      setFormData({
        descripcionGeneral: "", descripcionDetallada: "", supervisorId: "",
        fechaProgramadaInicio: "", fechaProgramadaFin: "", observaciones: "",
        descripcionEquipo: "", descripcionUbicacion: "", prioridad: "MEDIA",
        planMantenimientoId: null, planMantenimiento: null, actividadesOT: [],
        trabajadoresAsignados: [], encargadoId: null, fechaInicioProgramada: "",
        fechaFinProgramada: "", adjuntosEquipo: [], subiendoAdjuntosEquipo: false,
        estado: "PENDIENTE",
      });
    }
  }, [isOpen]);

  /* ─── Trabajadores / supervisores ── */
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

  /* ─── Número OT + fechas preset ── */
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

  /* ─── Tratamiento ── */
  useEffect(() => {
    if (!isOpen || !aviso?.id) return;
    getTratamientoByAviso(aviso.id)
      .then((data) => setTratamientoData(data))
      .catch((err) => {
        console.error("[OTIndividual] Error cargando tratamiento:", err);
        setTratamientoData(null);
      });
  }, [isOpen, aviso?.id]);

  /* ─── Planes (preventivo, equipo) ── */
  useEffect(() => {
    if (!isOpen || !esPreventivo || !equipoActual || targetEsUbicacion) {
      setPlanesDisponibles([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setCargandoPlanes(true);
      try {
        const equipoId = equipoActual?.equipoId || equipoActual?.id;
        const planes = await planMantenimientoService.getPlanesByEquipo(equipoId);
        if (!cancelled) setPlanesDisponibles(Array.isArray(planes) ? planes : []);
      } catch (e) {
        if (!cancelled) setPlanesDisponibles([]);
      } finally {
        if (!cancelled) setCargandoPlanes(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [isOpen, esPreventivo, equipoActual, targetEsUbicacion]);

  /* ─── Aplicar tratamiento ── */
  useEffect(() => {
    if (!isOpen || !tratamientoData || !equipoActual || tratamientoAplicadoRef.current) return;
    const tratEquipos = Array.isArray(tratamientoData.equipos) ? tratamientoData.equipos : [];
    if (!tratEquipos.length) return;
    const currentTargetId = getTargetId(equipoActual);
    const te = tratEquipos.find((t) =>
      targetEsUbicacion
        ? t.ubicacionTecnicaId === currentTargetId || t.ubicacionTecnica?.id === currentTargetId
        : t.equipoId === currentTargetId || t.equipo?.id === currentTargetId
    );
    tratamientoAplicadoRef.current = true;
    if (!te) return;

    const actividadesOT = (te.actividades || []).map((a) =>
      mkActOT({
        id: a.id, planMantenimientoActividadId: a.planMantenimientoActividadId,
        codigoActividad: a.codigoActividad, sistema: a.sistema, subsistema: a.subsistema,
        componente: a.componente, tarea: a.tarea, descripcion: a.descripcion,
        tipoTrabajo: a.tipoTrabajo, rolTecnico: a.rolTecnico, cantidadTecnicos: a.cantidadTecnicos,
        duracionEstimadaValor: a.duracionEstimadaValor, unidadDuracion: a.unidadDuracion,
        duracionEstimadaMin: a.duracionEstimadaMin, observaciones: a.observaciones,
        estado: "PENDIENTE", origen: a.origen || "TRATAMIENTO",
      }, { forceSelected: true })
    );

    setFormData((prev) => ({
      ...prev,
      planMantenimientoId: te.planMantenimientoId || null,
      planMantenimiento: te.planMantenimiento || null,
      actividadesOT,
      descripcionEquipo: targetEsEquipo ? te.descripcionEquipo || prev.descripcionEquipo || "" : prev.descripcionEquipo,
      descripcionUbicacion: targetEsUbicacion ? te.descripcionEquipo || prev.descripcionUbicacion || "" : prev.descripcionUbicacion,
    }));
  }, [isOpen, tratamientoData, equipoActual, targetEsUbicacion, targetEsEquipo]);

  /* ─── Inicializar solicitudes desde DB ── */
  useEffect(() => {
    if (!tratamientoData) return;
    setSolicitudesCompra(initialValueCompra);
    setSolicitudesAlmacen(initialValueAlmacen);
  }, [tratamientoData, initialValueCompra, initialValueAlmacen]);

  /* ─────────────────────────────────────────────
     HANDLERS
  ───────────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const seleccionarPlan = async (planId) => {
    if (!planId) {
      setFormData((prev) => ({ ...prev, planMantenimientoId: null, planMantenimiento: null, actividadesOT: [] }));
      return;
    }
    try {
      const planSel = await planMantenimientoService.getPlanById(planId);
      const acts = (planSel?.actividades || []).map((a) =>
        mkActOT({
          planMantenimientoActividadId: a.id, codigoActividad: a.codigoActividad,
          sistema: a.sistema, subsistema: a.subsistema, componente: a.componente,
          tarea: a.tarea, descripcion: a.descripcion || "", tipoTrabajo: a.tipoTrabajo,
          rolTecnico: a.rolTecnico, cantidadTecnicos: a.cantidadTecnicos,
          duracionEstimadaValor: a.duracionMinutos || 0, unidadDuracion: a.unidadDuracion || "min",
          duracionEstimadaMin: a.duracionMinutos || null, observaciones: a.observaciones || "",
          estado: "PENDIENTE", origen: "PLAN",
        }, { forceSelected: true })
      );
      setFormData((prev) => ({ ...prev, planMantenimientoId: planId, planMantenimiento: planSel, actividadesOT: acts }));
      if (errors.plan) setErrors((prev) => ({ ...prev, plan: null }));
    } catch (error) {
      console.error("Error cargando plan", error);
    }
  };

  const addActividadOT = () => {
    setFormData((prev) => ({
      ...prev,
      actividadesOT: [
        ...(prev.actividadesOT || []),
        mkActOT({ tipoTrabajo: esCorrectivo ? "REPARACION" : "REVISION", unidadDuracion: "min", duracionEstimadaValor: 0, origen: "MANUAL" }, { forceSelected: true }),
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
      if (field === "cantidadTecnicos") acts[actIndex].cantidadTecnicos = Math.max(1, Number(value) || 1);
      return { ...prev, actividadesOT: acts };
    });
  };

  const removeActividadOT = (actIndex) => {
    setFormData((prev) => ({
      ...prev,
      actividadesOT: (prev.actividadesOT || []).filter((_, i) => i !== actIndex),
    }));
  };

  const handleUploadAdjuntos = async (files) => {
    if (!files?.length) return;
    try {
      setSubiendoArchivos(true);
      const data = await adjuntosService.uploadArchivos(files);
      setArchivosAdjuntos((prev) => [...prev, ...(data || [])]);
    } catch (err) {
      console.error("Error subiendo archivos", err);
    } finally {
      setSubiendoArchivos(false);
    }
  };

  const handleUploadAdjuntosEquipo = async (files) => {
    if (!files?.length) return;
    try {
      setFormData((prev) => ({ ...prev, subiendoAdjuntosEquipo: true }));
      const data = await adjuntosService.uploadArchivos(files);
      setFormData((prev) => ({
        ...prev,
        adjuntosEquipo: [...(prev.adjuntosEquipo || []), ...(data || [])],
        subiendoAdjuntosEquipo: false,
      }));
    } catch (err) {
      console.error("Error subiendo adjuntos equipo", err);
      setFormData((prev) => ({ ...prev, subiendoAdjuntosEquipo: false }));
    }
  };

  /* ─────────────────────────────────────────────
     VALIDACIONES
  ───────────────────────────────────────────── */
  const validateForm = () => {
    const newErrors = {};
    if (!formData.descripcionGeneral.trim()) newErrors.descripcionGeneral = "La descripción general es requerida";
    if (!formData.supervisorId) newErrors.supervisorId = "El supervisor es requerido";
    if (!formData.fechaProgramadaInicio) newErrors.fechaProgramadaInicio = "La fecha de inicio es requerida";
    if (!formData.fechaProgramadaFin) newErrors.fechaProgramadaFin = "La fecha de fin es requerida";
    if (formData.fechaProgramadaInicio && formData.fechaProgramadaFin) {
      if (new Date(formData.fechaProgramadaFin) < new Date(formData.fechaProgramadaInicio))
        newErrors.fechaProgramadaFin = "La fecha de fin debe ser posterior";
    }
    const desc = targetEsUbicacion ? formData.descripcionUbicacion : formData.descripcionEquipo;
    if (!desc.trim()) newErrors.descripcionTarget = "La descripción del trabajo es obligatoria";
    if (esPreventivo && !formData.planMantenimientoId) newErrors.plan = "Debe seleccionar un plan";
    const acts = formData.actividadesOT || [];
    const todasExternas = acts.length > 0 && acts.every((a) => a.tipo === "EXTERNO");
    if (!todasExternas) {
      if (!formData.trabajadoresAsignados?.length) newErrors.trabajadores = "Debe asignar al menos un trabajador";
      if (!formData.encargadoId) newErrors.encargado = "Debe seleccionar un encargado";
    }
    if (!formData.fechaInicioProgramada) newErrors.fechaInicioProgramada = "Fecha de inicio requerida";
    if (!formData.fechaFinProgramada) newErrors.fechaFinProgramada = "Fecha de fin requerida";

    if (esCorrectivo) {
      if (!acts.length) newErrors.acts = "Debes agregar al menos 1 actividad";
      else if (acts.some((a) => !a.tarea?.trim())) newErrors.acts = "Hay actividades sin tarea";
      else if (acts.some((a) => a.tipoTrabajo && !TIPOS_TRABAJO_CORRECTIVO.includes(a.tipoTrabajo)))
        newErrors.acts = "En correctivo solo se permite REPARACION o CAMBIO";
    } else {
      if (formData.planMantenimientoId && !acts.length) newErrors.acts = "El plan no tiene actividades";
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
    if (!equipoActual) return;

    const tratamientoId =
      aviso?.tratamientos?.[0]?.id ||
      tratamientoData?.id ||
      tratamientoData?.tratamiento?.id ||
      null;

    const targetPayload = {
      equipoId: targetEsEquipo ? getTargetId(equipoActual) : null,
      ubicacionTecnicaId: targetEsUbicacion ? getTargetId(equipoActual) : null,
      descripcionEquipo: targetEsEquipo ? formData.descripcionEquipo.trim() : null,
      descripcionUbicacion: targetEsUbicacion ? formData.descripcionUbicacion.trim() : null,
      prioridad: formData.prioridad,
      planMantenimientoId: formData.planMantenimientoId || null,
      fechaInicioProgramada: new Date(formData.fechaInicioProgramada).toISOString(),
      fechaFinProgramada: new Date(formData.fechaFinProgramada).toISOString(),
      actividades: (formData.actividadesOT || [])
        .filter((a) => esPreventivo ? true : a.selected)
        .map(normalizeActOTForPayload),
      trabajadores: (formData.trabajadoresAsignados || []).map((id) => ({
        trabajadorId: id,
        esEncargado: id === formData.encargadoId,
      })),
      adjuntos: formData.adjuntosEquipo || [],
    };

    // Construir solicitudesCompra para el payload
    const buildSolicitudesPayload = (solicitudes, strategy) => {
      if (!solicitudes) return null;
      const porEquipo = {};
      if (targetKey && solicitudes.solicitudesPorEquipo?.[targetKey]) {
        const s = solicitudes.solicitudesPorEquipo[targetKey];
        porEquipo[targetKey] = {
          ...s,
          equipo_id: targetEsEquipo ? getTargetId(equipoActual) : null,
          ubicacion_tecnica_id: targetEsUbicacion ? getTargetId(equipoActual) : null,
        };
      }
      return {
        general: strategy === "ASIGNAR" ? (solicitudes.solicitudGeneral || null) : null,
        porEquipo,
      };
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
      equipos: [targetPayload],
      adjuntos: archivosAdjuntos || [],

      // Solicitudes
      solicitudesCompra: buildSolicitudesPayload(solicitudesCompra, strategyCompra),
      solicitudesAlmacen: buildSolicitudesPayload(solicitudesAlmacen, strategyAlmacen),

      // Strategy para la general
      solicitudGeneralStrategy: {
        compra: {
          tipo: strategyCompra,
          targetKey: strategyCompra === "ASIGNAR" ? targetKey : null,
        },
        almacen: {
          tipo: strategyAlmacen,
          targetKey: strategyAlmacen === "ASIGNAR" ? targetKey : null,
        },
      },
    };

    onGuardar(payload);
    setMostrarConfirmacion(false);
  };

  const handleCerrar = () => {
    if (hayEquiposPendientes) setMostrarConfirmacionSalida(true);
    else onClose();
  };

  if (!isOpen) return null;

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-3">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[97vh] flex flex-col border border-slate-200">

          {/* HEADER */}
          <div className="relative bg-gradient-to-r from-violet-600 via-purple-700 to-violet-600 p-6 rounded-t-3xl shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                  <FileText className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Crear Orden de Trabajo Individual
                  </h3>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="px-3 py-1 bg-white/20 border border-white/30 rounded-lg text-white font-bold text-sm">
                      {numeroOTGenerado}
                    </span>
                    <span className="text-violet-200 text-sm">
                      Aviso: <span className="text-white font-bold">{aviso?.numeroAviso}</span>
                    </span>
                    {tipoMantenimiento && (
                      <span className={`px-3 py-1 backdrop-blur-sm border rounded-full text-xs font-bold ${
                        esPreventivo
                          ? "bg-green-500/30 border-green-400/40 text-green-100"
                          : "bg-orange-500/30 border-orange-400/40 text-orange-100"
                      }`}>
                        {tipoMantenimiento}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMostrarInfoAviso(true)}
                  className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl transition flex items-center gap-2 text-white font-medium border border-white/30 text-sm"
                  type="button"
                >
                  <FileText className="w-4 h-4" />
                  Info del Aviso
                </button>
                <button onClick={handleCerrar} className="p-2.5 hover:bg-white/15 rounded-xl transition" type="button">
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Progreso */}
            {progresoEquipos && (
              <div className="mt-4 bg-white/10 rounded-xl p-3 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold text-sm">
                    Registro {progresoEquipos.actual} de {progresoEquipos.total}
                  </span>
                  <span className="text-violet-200 text-xs">
                    {Math.round((progresoEquipos.actual / progresoEquipos.total) * 100)}% completado
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(progresoEquipos.actual / progresoEquipos.total) * 100}%` }}
                  />
                </div>
                {equipoActual && (
                  <div className="mt-2 flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 border border-white/20">
                    {isUbicacionTarget(equipoActual)
                      ? <MapPin className="w-4 h-4 text-violet-200" />
                      : <Settings className="w-4 h-4 text-violet-200" />}
                    <p className="text-white font-bold text-sm">{getTargetNombre(equipoActual)}</p>
                    <span className="text-violet-200 text-xs">• {getTargetCodigo(equipoActual)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BODY — dos columnas */}
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <div className="p-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* ══════════════════════════════
                    COLUMNA IZQUIERDA
                ══════════════════════════════ */}
                <div className="space-y-5">

                  {/* Info general */}
                  <Card title="Información General" icon={<ClipboardCheck className="w-4 h-4 text-white" />} iconBg="bg-violet-500">
                    <div className="space-y-4">
                      {/* Número OT */}
                      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border-2 border-green-200 rounded-xl">
                        <Zap className="w-4 h-4 text-green-600" />
                        <span className="font-bold text-green-700">{numeroOTGenerado}</span>
                        <span className="ml-auto text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">Autogenerado</span>
                      </div>

                      {/* Supervisor */}
                      <FormField label="Supervisor *" error={errors.supervisorId}>
                        <select
                          name="supervisorId"
                          value={formData.supervisorId}
                          onChange={handleChange}
                          className={inputCls(errors.supervisorId)}
                        >
                          <option value="">Seleccione un supervisor</option>
                          {supervisores.map((s) => (
                            <option key={s.id} value={s.id}>{s.nombre} - {s.empresa}</option>
                          ))}
                        </select>
                      </FormField>

                      {/* Descripción general */}
                      <FormField label="Descripción General *" error={errors.descripcionGeneral}>
                        <textarea
                          name="descripcionGeneral"
                          value={formData.descripcionGeneral}
                          onChange={handleChange}
                          rows={3}
                          placeholder="Describe el alcance general..."
                          className={textareaCls(errors.descripcionGeneral)}
                        />
                      </FormField>

                      {/* Descripción detallada */}
                      <FormField label="Descripción Detallada">
                        <textarea
                          name="descripcionDetallada"
                          value={formData.descripcionDetallada}
                          onChange={handleChange}
                          rows={2}
                          className={textareaCls()}
                        />
                      </FormField>

                      {/* Fechas generales */}
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="Inicio *" error={errors.fechaProgramadaInicio}>
                          <input type="datetime-local" name="fechaProgramadaInicio"
                            value={formData.fechaProgramadaInicio} onChange={handleChange}
                            className={inputCls(errors.fechaProgramadaInicio)} />
                        </FormField>
                        <FormField label="Fin *" error={errors.fechaProgramadaFin}>
                          <input type="datetime-local" name="fechaProgramadaFin"
                            value={formData.fechaProgramadaFin} onChange={handleChange}
                            className={inputCls(errors.fechaProgramadaFin)} />
                        </FormField>
                      </div>

                      {/* Observaciones */}
                      <FormField label="Observaciones">
                        <textarea name="observaciones" value={formData.observaciones}
                          onChange={handleChange} rows={2} className={textareaCls()} />
                      </FormField>
                    </div>
                  </Card>

                  {/* Solicitudes */}
                  <Card title="Solicitudes" icon={<ShoppingCart className="w-4 h-4 text-white" />} iconBg="bg-amber-500">
                    <div className="space-y-4">

                      {/* COMPRA */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-green-50 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-slate-800">Solicitud de Compra</span>
                            {solicitudCompraPorTarget && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                {solicitudCompraPorTarget.lineas?.length || 0} ítems
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowSolicitudCompraModal(true)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Editar
                          </button>
                        </div>

                        {/* Strategy general compra */}
                        {solicitudCompraGeneralDB && (
                          <div className="px-4 py-3 bg-amber-50 border-b border-slate-200">
                            <p className="text-xs font-semibold text-amber-800 mb-2">
                              Solicitud general del tratamiento — ¿asignar a esta OT?
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setStrategyCompra("ASIGNAR")}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                                  strategyCompra === "ASIGNAR"
                                    ? "bg-green-600 border-green-600 text-white"
                                    : "bg-white border-slate-300 text-slate-600 hover:border-green-400"
                                }`}
                              >
                                ✓ Asignar a esta OT
                              </button>
                              <button
                                type="button"
                                onClick={() => setStrategyCompra("NINGUNA")}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                                  strategyCompra === "NINGUNA"
                                    ? "bg-slate-700 border-slate-700 text-white"
                                    : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                                }`}
                              >
                                — No asignar
                              </button>
                            </div>
                          </div>
                        )}

                        {!solicitudCompraPorTarget && !solicitudCompraGeneralDB && (
                          <div className="px-4 py-3 text-xs text-slate-400 text-center">
                            Sin solicitudes de compra en el tratamiento
                          </div>
                        )}
                      </div>

                      {/* ALMACÉN */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <Warehouse className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-semibold text-slate-800">Solicitud de Almacén</span>
                            {solicitudAlmacenPorTarget && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                {solicitudAlmacenPorTarget.lineas?.length || 0} ítems
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowSolicitudAlmacenModal(true)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Editar
                          </button>
                        </div>

                        {/* Strategy general almacén */}
                        {solicitudAlmacenGeneralDB && (
                          <div className="px-4 py-3 bg-amber-50 border-b border-slate-200">
                            <p className="text-xs font-semibold text-amber-800 mb-2">
                              Solicitud general del tratamiento — ¿asignar a esta OT?
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setStrategyAlmacen("ASIGNAR")}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                                  strategyAlmacen === "ASIGNAR"
                                    ? "bg-red-600 border-red-600 text-white"
                                    : "bg-white border-slate-300 text-slate-600 hover:border-red-400"
                                }`}
                              >
                                ✓ Asignar a esta OT
                              </button>
                              <button
                                type="button"
                                onClick={() => setStrategyAlmacen("NINGUNA")}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                                  strategyAlmacen === "NINGUNA"
                                    ? "bg-slate-700 border-slate-700 text-white"
                                    : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                                }`}
                              >
                                — No asignar
                              </button>
                            </div>
                          </div>
                        )}

                        {!solicitudAlmacenPorTarget && !solicitudAlmacenGeneralDB && (
                          <div className="px-4 py-3 text-xs text-slate-400 text-center">
                            Sin solicitudes de almacén en el tratamiento
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Adjuntos generales */}
                  <Card title="Adjuntos Generales" icon={<Upload className="w-4 h-4 text-white" />} iconBg="bg-slate-600">
                    <input
                      type="file" multiple
                      onChange={(e) => handleUploadAdjuntos(e.target.files)}
                      className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white file:font-medium hover:file:bg-slate-800 cursor-pointer border border-dashed border-slate-300 rounded-xl p-3"
                    />
                    {subiendoArchivos && (
                      <div className="mt-3 flex items-center gap-2 text-violet-600 bg-violet-50 p-3 rounded-xl border border-violet-200">
                        <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-medium">Subiendo...</p>
                      </div>
                    )}
                    {archivosAdjuntos.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {archivosAdjuntos.map((file, i) => (
                          <div key={file.id || i} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-sm text-slate-700 truncate">{file.nombre || "Archivo"}</span>
                            </div>
                            <button type="button" onClick={() => setArchivosAdjuntos((p) => p.filter((_, idx) => idx !== i))}
                              className="ml-2 text-slate-400 hover:text-red-600 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                {/* ══════════════════════════════
                    COLUMNA DERECHA
                ══════════════════════════════ */}
                <div className="space-y-5">

                  {/* Config del target */}
                  {equipoActual && (
                    <Card
                      title={getTargetNombre(equipoActual)}
                      subtitle={`${getTargetTipoTexto(equipoActual)} · ${getTargetCodigo(equipoActual)}`}
                      icon={
                        isUbicacionTarget(equipoActual)
                          ? <MapPin className="w-4 h-4 text-white" />
                          : <Settings className="w-4 h-4 text-white" />
                      }
                      iconBg="bg-indigo-500"
                      action={
                        targetEsEquipo && (
                          <button
                            onClick={() => setEquipoDetalleModalId(getTargetId(equipoActual))}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                            type="button"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver detalles
                          </button>
                        )
                      }
                    >
                      <div className="space-y-4">
                        {/* Descripción trabajo */}
                        <FormField
                          label={`Descripción del trabajo en ${getTargetNombre(equipoActual)} *`}
                          error={errors.descripcionTarget}
                        >
                          <textarea
                            name={targetEsUbicacion ? "descripcionUbicacion" : "descripcionEquipo"}
                            value={targetEsUbicacion ? formData.descripcionUbicacion : formData.descripcionEquipo}
                            onChange={handleChange}
                            rows={3}
                            placeholder={`Detalla el trabajo...`}
                            className={textareaCls(errors.descripcionTarget)}
                          />
                        </FormField>

                        {/* Prioridad */}
                        <FormField label="Prioridad">
                          <select name="prioridad" value={formData.prioridad} onChange={handleChange} className={inputCls()}>
                            <option value="BAJA">🟢 Baja</option>
                            <option value="MEDIA">🟡 Media</option>
                            <option value="ALTA">🟠 Alta</option>
                            <option value="CRITICA">🔴 Crítica</option>
                          </select>
                        </FormField>

                        {/* Plan preventivo */}
                        {esPreventivo && (
                          <FormField label="Plan de mantenimiento *" error={errors.plan}>
                            {targetEsUbicacion ? (
                              formData.planMantenimiento ? (
                                <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm font-medium text-green-800">
                                  {formData.planMantenimiento.codigoPlan} — {formData.planMantenimiento.nombre}
                                </div>
                              ) : (
                                <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                                  El plan se carga desde el tratamiento para ubicaciones técnicas.
                                </div>
                              )
                            ) : (
                              <>
                                {cargandoPlanes && (
                                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                                    <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                    Cargando planes...
                                  </div>
                                )}
                                <select
                                  value={formData.planMantenimientoId || ""}
                                  onChange={(e) => seleccionarPlan(e.target.value)}
                                  className={inputCls(errors.plan)}
                                >
                                  <option value="">— Seleccione un plan —</option>
                                  {planesDisponibles.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {(p.codigoPlan ? `${p.codigoPlan} — ` : "") + (p.nombre || "Plan")}
                                    </option>
                                  ))}
                                </select>
                                {planesDisponibles.length === 0 && !cargandoPlanes && (
                                  <p className="mt-1 text-xs text-amber-600">⚠️ Sin planes asociados</p>
                                )}
                              </>
                            )}
                          </FormField>
                        )}

                        {/* Fechas del target */}
                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="Inicio programado *" error={errors.fechaInicioProgramada}>
                            <input type="datetime-local" name="fechaInicioProgramada"
                              value={formData.fechaInicioProgramada} onChange={handleChange}
                              className={inputCls(errors.fechaInicioProgramada)} />
                          </FormField>
                          <FormField label="Fin programado *" error={errors.fechaFinProgramada}>
                            <input type="datetime-local" name="fechaFinProgramada"
                              value={formData.fechaFinProgramada} onChange={handleChange}
                              className={inputCls(errors.fechaFinProgramada)} />
                          </FormField>
                        </div>

                        {/* Trabajadores */}
                        <FormField
                          label={`Trabajadores${
                            (formData.actividadesOT || []).length > 0 &&
                            (formData.actividadesOT || []).every((a) => a.tipo === "EXTERNO")
                              ? " (opcional — actividades externas)"
                              : " *"
                          }`}
                          error={errors.trabajadores}
                        >
                          <div className={`rounded-xl border-2 p-3 bg-slate-50 ${errors.trabajadores ? "border-red-400" : "border-slate-200"}`}>
                            {cargandoTrabajadores ? (
                              <p className="text-xs text-slate-400 text-center py-2">Cargando...</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {trabajadores.map((t) => {
                                  const checked = (formData.trabajadoresAsignados || []).includes(t.id);
                                  return (
                                    <label key={t.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-1.5 rounded-lg hover:bg-white transition">
                                      <input type="checkbox" checked={checked}
                                        onChange={() => {
                                          const current = new Set(formData.trabajadoresAsignados || []);
                                          if (current.has(t.id)) current.delete(t.id);
                                          else current.add(t.id);
                                          const nuevos = Array.from(current);
                                          let encargadoId = formData.encargadoId;
                                          if (encargadoId && !current.has(encargadoId)) encargadoId = null;
                                          setFormData((prev) => ({ ...prev, trabajadoresAsignados: nuevos, encargadoId }));
                                        }}
                                        className="w-4 h-4 rounded accent-slate-800"
                                      />
                                      <span className="truncate">{t.nombre} <span className="text-xs text-slate-400">({t.empresa || "—"})</span></span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </FormField>

                        {/* Encargado */}
                        <FormField
                          label={`Encargado${
                            (formData.actividadesOT || []).length > 0 &&
                            (formData.actividadesOT || []).every((a) => a.tipo === "EXTERNO")
                              ? " (opcional — actividades externas)"
                              : " *"
                          }`}
                          error={errors.encargado}
                        >
                          <select
                            value={formData.encargadoId || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, encargadoId: e.target.value }))}
                            className={inputCls(errors.encargado)}
                          >
                            <option value="">Seleccione encargado</option>
                            {(formData.trabajadoresAsignados || []).map((id) => {
                              const t = trabajadores.find((x) => x.id === id);
                              if (!t) return null;
                              return <option key={id} value={id}>{t.nombre}{t.empresa ? ` - ${t.empresa}` : ""}</option>;
                            })}
                          </select>
                        </FormField>

                        {/* Adjuntos del target */}
                        <FormField label="Adjuntos del equipo/ubicación">
                          <input type="file" multiple onChange={(e) => handleUploadAdjuntosEquipo(e.target.files)}
                            className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer border border-dashed border-slate-300 rounded-xl p-2.5" />
                          {formData.subiendoAdjuntosEquipo && (
                            <div className="mt-2 flex items-center gap-2 text-violet-600 text-xs bg-violet-50 p-2 rounded-lg">
                              <div className="w-3 h-3 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                              Subiendo...
                            </div>
                          )}
                          {(formData.adjuntosEquipo || []).length > 0 && (
                            <div className="mt-2 space-y-1">
                              {(formData.adjuntosEquipo || []).map((file, i) => (
                                <div key={file.id || i} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-xs text-slate-700 truncate">{file.nombre || "Archivo"}</span>
                                  </div>
                                  <button type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, adjuntosEquipo: (prev.adjuntosEquipo || []).filter((_, idx) => idx !== i) }))}
                                    className="ml-2 text-slate-400 hover:text-red-600 transition">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </FormField>
                      </div>
                    </Card>
                  )}
                </div>
              </div>

              {/* ACTIVIDADES — full width */}
              <div className="mt-6">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 bg-slate-900">
                    <div className="flex items-center gap-3">
                      <ClipboardCheck className="w-5 h-5 text-white" />
                      <div>
                        <p className="font-semibold text-white">Actividades</p>
                        <p className="text-xs text-slate-400">
                          {esPreventivo ? "Preventivo · Todas las columnas editables" : "Correctivo · Editables"}
                          {(formData.actividadesOT || []).length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-white/20 text-white rounded-full">
                              {(formData.actividadesOT || []).length}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addActividadOT}
                      className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 transition"
                    >
                      + Agregar
                    </button>
                  </div>

                  {errors.acts && (
                    <div className="mx-4 mt-3 text-xs text-red-600 flex items-center gap-1 font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.acts}
                    </div>
                  )}

                  {(formData.actividadesOT || []).length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">
                        {esPreventivo ? "Selecciona un plan para cargar actividades" : "No hay actividades. Agrega una."}
                      </p>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      {esPreventivo
                        ? <OTActividadesPreventivasHeader />
                        : <OTActividadesCorrectivasHeader />
                      }
                      {(formData.actividadesOT || []).map((act, actIdx) =>
                        esPreventivo ? (
                          <OTActividadPreventivaItem
                            key={act.id || actIdx}
                            act={act}
                            index={actIdx}
                            onChange={(field, value) => updateActividadOT(actIdx, field, value)}
                            onDelete={() => removeActividadOT(actIdx)}
                            onOpenObservacion={() => setModalTexto({ actIndex: actIdx, campo: "observaciones", titulo: "Observación" })}
                            onOpenDescripcion={() => setModalTexto({ actIndex: actIdx, campo: "descripcion", titulo: "Descripción" })}
                          />
                        ) : (
                          <OTActividadCorrectivaItem
                            key={act.id || actIdx}
                            act={act}
                            index={actIdx}
                            onChange={(field, value) => updateActividadOT(actIdx, field, value)}
                            onDelete={() => removeActividadOT(actIdx)}
                            onOpenObservacion={() => setModalTexto({ actIndex: actIdx, campo: "observaciones", titulo: "Observación" })}
                            onOpenDescripcion={() => setModalTexto({ actIndex: actIdx, campo: "descripcion", titulo: "Descripción" })}
                          />
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t bg-white flex items-center justify-between shrink-0 rounded-b-3xl">
            <button onClick={handleCerrar}
              className="px-6 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition font-bold text-slate-700 flex items-center gap-2"
              type="button">
              <X className="w-5 h-5" />
              {hayEquiposPendientes ? "Cancelar Todo" : "Cancelar"}
            </button>
            <button onClick={handleSubmitInternal}
              className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"
              type="button">
              <CheckCircle2 className="w-5 h-5" />
              {hayEquiposPendientes
                ? `Guardar y Continuar (${progresoEquipos.actual}/${progresoEquipos.total})`
                : "Crear OT Individual"}
            </button>
          </div>
        </div>
      </div>

      {/* MODALES SECUNDARIOS */}
      <ModalInfoAviso isOpen={mostrarInfoAviso} onClose={() => setMostrarInfoAviso(false)} aviso={aviso} />
      <ModalDetallesEquipo equipoId={equipoDetalleModalId} isOpen={!!equipoDetalleModalId} onClose={() => setEquipoDetalleModalId(null)} />

     <ModalSolicitudCompra
  isOpen={showSolicitudCompraModal}
  onClose={() => setShowSolicitudCompraModal(false)}
  onConfirm={(result) => {
    // Normalizar la estructura que devuelve el modal
    setSolicitudesCompra({
      solicitudGeneral: result.general || result.solicitudGeneral || null,
      solicitudesPorEquipo: result.porEquipo || result.solicitudesPorEquipo || {},
    });
    setShowSolicitudCompraModal(false);
  }}
  targets={targetsParaModal}
  initialValue={solicitudesCompra || initialValueCompra}
/>

<ModalSolicitudAlmacen
  isOpen={showSolicitudAlmacenModal}
  onClose={() => setShowSolicitudAlmacenModal(false)}
  onConfirm={(result) => {
    setSolicitudesAlmacen({
      solicitudGeneral: result.solicitudGeneral || result.general || null,
      solicitudesPorEquipo: result.solicitudesPorEquipo || result.porEquipo || {},
    });
    setShowSolicitudAlmacenModal(false);
  }}
  targets={targetsParaModal}
  initialValue={solicitudesAlmacen || initialValueAlmacen}
/>
      {/* Modal texto actividad */}
      {modalTexto && (
        <ModalTextoActividad
          titulo={modalTexto.titulo}
          valor={formData.actividadesOT?.[modalTexto.actIndex]?.[modalTexto.campo] || ""}
          onClose={() => setModalTexto(null)}
          onGuardar={(nuevoValor) => {
            updateActividadOT(modalTexto.actIndex, modalTexto.campo, nuevoValor);
            setModalTexto(null);
          }}
        />
      )}

      {/* Confirmación salida */}
      {mostrarConfirmacionSalida && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-2 border-amber-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">¿Está seguro de salir?</h3>
            </div>
            <p className="text-slate-700 mb-2">
              Quedan <span className="font-bold text-amber-600">{progresoEquipos?.total - progresoEquipos?.actual}</span> registros sin OT.
            </p>
            <p className="text-sm text-slate-500 mb-6">Si sale ahora tendrá que reiniciar el proceso.</p>
            <div className="flex gap-3">
              <button onClick={() => setMostrarConfirmacionSalida(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-bold text-slate-700" type="button">
                Continuar
              </button>
              <button onClick={() => { setMostrarConfirmacionSalida(false); onClose(); }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold" type="button">
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación creación */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-violet-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Confirmar Creación</h3>
            </div>
            <div className="space-y-2 mb-6 text-sm text-slate-700">
              <p><strong>OT:</strong> {numeroOTGenerado}</p>
              <p><strong>Registro:</strong> {getTargetNombre(equipoActual)}</p>
              <p><strong>Supervisor:</strong> {supervisores.find((s) => s.id === formData.supervisorId)?.nombre || "N/A"}</p>
              <p><strong>Actividades:</strong> {formData.actividadesOT?.length || 0}</p>
              {solicitudCompraGeneralDB && (
                <p><strong>Solicitud compra general:</strong> {strategyCompra === "ASIGNAR" ? "✓ Asignada a esta OT" : "— No asignada"}</p>
              )}
              {solicitudAlmacenGeneralDB && (
                <p><strong>Solicitud almacén general:</strong> {strategyAlmacen === "ASIGNAR" ? "✓ Asignada a esta OT" : "— No asignada"}</p>
              )}
              {hayEquiposPendientes && (
                <p className="text-amber-600 font-bold">Progreso: {progresoEquipos.actual}/{progresoEquipos.total}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-bold text-slate-700" type="button">
                Cancelar
              </button>
              <button onClick={confirmarCreacion}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 font-bold" type="button">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Subcomponentes ─────────────────────────────────────────────────────── */

function ModalTextoActividad({ titulo, valor, onClose, onGuardar }) {
  const [texto, setTexto] = useState(valor);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-base font-semibold text-slate-900">{titulo}</h3>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="px-6 py-5">
          <textarea rows={6} value={texto} onChange={(e) => setTexto(e.target.value)}
            placeholder={`Ingrese ${titulo.toLowerCase()}...`}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-slate-200"
            autoFocus />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 transition">Cancelar</button>
          <button type="button" onClick={() => onGuardar(texto)} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, subtitle, icon, iconBg = "bg-slate-700", action, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 ${iconBg} rounded-lg`}>{icon}</div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

function inputCls(hasError) {
  return `w-full px-3 py-2.5 border rounded-xl bg-white text-sm text-slate-800 ${
    hasError ? "border-red-400 bg-red-50" : "border-slate-300"
  } focus:outline-none focus:ring-2 focus:ring-slate-200`;
}

function textareaCls(hasError) {
  return `w-full px-3 py-2.5 border rounded-xl bg-white text-sm text-slate-800 resize-none ${
    hasError ? "border-red-400 bg-red-50" : "border-slate-300"
  } focus:outline-none focus:ring-2 focus:ring-slate-200`;
}