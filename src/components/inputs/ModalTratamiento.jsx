import { useEffect, useMemo, useState,useRef } from "react";
import {
  X,
  Save,
  ShoppingCart,
  CheckCircle,
  FileText,
  Package,
  Plus,
  Trash2,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  MapPinned,
  Eye,
  MessageSquare,
  AlignLeft,
  StickyNote,
} from "lucide-react";

import {
  createTratamiento,
  saveTratamientoDraft,
  getTratamientoByAviso,
} from "../../features/mantenimiento/services/tratamientoService";
import { equipoService } from "../../features/mantenimiento/services/equipoService";
import ModalSolicitudCompra from "./ModalSolicitudCompra";
import ModalSolicitudAlmacen from "./ModalSolicitudAlmacen";
import ModalConfiguracionCampos from "./ModalConfiguracionTratamiento";
import ModalMantenimientoView from "../../features/mantenimiento/modals/ModalMantenimientoView";
import { CAMPOS_AVISO } from "./camposAviso";
import { planMantenimientoService } from "../../features/PlanMantenimiento/services/planMantenimientoService";

/* ══════════════════════════════════════════════
   CONSTANTES
══════════════════════════════════════════════ */

const TIPOS_TRABAJO_CORRECTIVO = ["REPARACION", "CAMBIO"];

const TIPOS_TRABAJO_INSTALACION = [
  { value: "INSTALACION", label: "Instalación" },
  { value: "MONTAJE", label: "Montaje" },
  { value: "CONEXION", label: "Conexión" },
  { value: "CONFIGURACION", label: "Configuración" },
  { value: "PRUEBA", label: "Prueba / Commissioning" },
  { value: "PUESTA_EN_MARCHA", label: "Puesta en marcha" },
  { value: "CAMBIO", label: "Cambio" },
];

const TIPOS_TRABAJO_PREVENTIVO = [
  { value: "APLICACION", label: "Aplicación" },
  { value: "REVISION", label: "Revisión" },
  { value: "INSPECCION", label: "Inspección" },
  { value: "CAMBIO", label: "Cambio" },
  { value: "LIMPIEZA", label: "Limpieza" },
  { value: "AJUSTE", label: "Ajuste" },
  { value: "LUBRICACION", label: "Lubricación" },
  { value: "REPARACION", label: "Reparación" },
];

const ROLES_TECNICOS = [
  { value: "tecnico_electrico", label: "Técnico Eléctrico" },
  { value: "operario_de_mantenimiento", label: "Operario Mantenimiento" },
  { value: "tecnico_mecanico", label: "Técnico Mecánico" },
  { value: "supervisor", label: "Supervisor" },
];

const ACTIVIDAD_VACIA = {
  sistema: "",
  subsistema: "",
  componente: "",
  tarea: "",
  descripcion: "",
  tipo: "INTERNO",
  tipoTrabajo: "REPARACION",
  rolTecnico: "tecnico_mecanico",
  cantidadTecnicos: 1,
  duracionEstimadaValor: 0,
  unidadDuracion: "min",
  observaciones: "",
  origen: "MANUAL",
};

const TARGET_TYPES = {
  EQUIPO: "EQUIPO",
  UBICACION: "UBICACION_TECNICA",
};

const INPUT_CLASS =
  "w-full min-h-[46px] border border-slate-600 rounded-xl px-6 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";

const ensureId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const getRelUbicacionId = (rel) =>
  rel?.ubicacionId ||
  rel?.ubicacionTecnicaId ||
  rel?.ubicacion?.id ||
  rel?.ubicacionTecnica?.id ||
  null;

const getRelEquipoId = (rel) => rel?.equipoId || rel?.equipo?.id || null;

const normalizeLinea = (l = {}) => ({
  id: l.id || ensureId(),
  itemId: l.itemId || "",
  itemCode: l.itemCode || "",
  description: l.description || l.descripcion || "",
  quantity:
    Number.isFinite(Number(l.quantity ?? l.cantidad)) &&
    Number(l.quantity ?? l.cantidad) > 0
      ? Number(l.quantity ?? l.cantidad)
      : 1,
  warehouseCode: l.warehouseCode || l.whsCode || "01",
  costCenter: l.costCenter || l.costingCode || "",
  projectCode: l.projectCode || "",
  rubro: l.rubro || "",
  rubroId: l.rubroId || l.rubro?.id || null,
  paqueteTrabajoId: l.paqueteTrabajoId || null,
  rubroSapCode: l.rubroSapCode || "",
  paqueteTrabajo: l.paqueteTrabajo || "",
  observacion: l.observacion || "",
  origen: l.origen || undefined,
});

const emptySolicitudForm = () => ({
  requiredDate: "",
  lineas: [normalizeLinea()],
});

const normalizeSolicitudForm = (form) => {
  const f = form || emptySolicitudForm();
  const lineas = Array.isArray(f.lineas) ? f.lineas : [];
  return {
    ...emptySolicitudForm(),
    requiredDate: f.requiredDate ? String(f.requiredDate).slice(0, 10) : "",
    lineas: lineas.length > 0 ? lineas.map(normalizeLinea) : [normalizeLinea()],
  };
};

const createPreventivaExtra = () => ({
  idLocal: ensureId(),
  planMantenimientoActividadId: null,
  codigoActividad: null,
  sistema: "",
  subsistema: "",
  componente: "",
  tarea: "",
  descripcion: "",
  tipo: "INTERNO",
  tipoTrabajo: "REVISION",
  rolTecnico: "tecnico_mecanico",
  duracionEstimadaValor: 0,
  unidadDuracion: "min",
  cantidadTecnicos: 1,
  observaciones: "",
  origen: "MANUAL_EXTRA",
});

/* ══════════════════════════════════════════════
   GRID COLUMNS — definido una sola vez
══════════════════════════════════════════════ */
const GRID_COLS = "1fr 1fr 1fr 1.5fr 1fr 70px 1fr 0.7fr 0.7fr 0.7fr 88px 88px 40px";
const GRID_COLS_INSTALACION = "1fr 1fr 1fr 1.5fr 70px 1fr 0.7fr 0.7fr 0.7fr 88px 88px 40px";

/* ══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════ */
export default function ModalTratamiento({ isOpen, aviso, onClose, onSuccess, autoSelectPlanId }) {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlanes, setLoadingPlanes] = useState(false);

  const [showSolicitudCompra, setShowSolicitudCompra] = useState(false);
  const [showSolicitudAlmacen, setShowSolicitudAlmacen] = useState(false);
  const [showConfigCampos, setShowConfigCampos] = useState(false);
  const [showAvisoView, setShowAvisoView] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const [solicitudesCompra, setSolicitudesCompra] = useState(null);
  const [solicitudesAlmacen, setSolicitudesAlmacen] = useState(null);

  const [collapsed, setCollapsed] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [tratamientoExistente, setTratamientoExistente] = useState(null);

  const [planesPorTarget, setPlanesPorTarget] = useState({});
  const [descripcionVenta, setDescripcionVenta] = useState("");

  const [data, setData] = useState({
    actividadesManuales: {},
    planesSeleccionados: {},
    preventivoPorEquipo: {},
  });

  const [obsModal, setObsModal] = useState({
    open: false,
    mode: null,
    field: "observaciones",
    targetId: null,
    idx: null,
    value: "",
    title: "",
  });

  const esVenta = aviso?.tipoAviso === "venta";
  const esInstalacion = aviso?.tipoAviso === "instalacion";
  const esCorrectivo = !esInstalacion && aviso?.tipoMantenimiento === "Correctivo";
  const esPreventivo =
    aviso?.tipoAviso === "mantenimiento" &&
    aviso?.tipoMantenimiento === "Preventivo";

  const cantSolicitudesCompraIndividuales = Object.keys(
    solicitudesCompra?.solicitudesPorEquipo || {}
  ).length;

  const cantSolicitudesAlmacenIndividuales = Object.keys(
    solicitudesAlmacen?.solicitudesPorEquipo || {}
  ).length;

  const equiposMap = useMemo(() => {
    const map = new Map();
    for (const e of equipos || []) map.set(String(e.id), e);
    return map;
  }, [equipos]);

  const targets = useMemo(() => {
    const equiposTargets = (aviso?.equiposRelacion || []).map((rel) => {
      const id = getRelEquipoId(rel);
      const equipoFull = id ? equiposMap.get(String(id)) : null;
      const equipoInfo = equipoFull || rel?.equipo || {};
      return {
        id: String(id),
        type: TARGET_TYPES.EQUIPO,
        rel,
        raw: equipoInfo,
        nombre:
          equipoInfo?.nombre ||
          equipoInfo?.descripcion ||
          equipoInfo?.tag ||
          `Equipo ${id}`,
        tag: equipoInfo?.tag || equipoInfo?.codigo || id,
        ubicacion:
          equipoInfo?.ubicacion ||
          equipoInfo?.ubicacionTexto ||
          equipoInfo?.area ||
          "",
      };
    });

    const ubicacionesTargets = (aviso?.ubicacionesRelacion || []).map((rel) => {
      const id = getRelUbicacionId(rel);
      const ut = rel?.ubicacionTecnica || rel?.ubicacion || {};
      return {
        id: String(id),
        type: TARGET_TYPES.UBICACION,
        rel,
        raw: ut,
        nombre:
          ut?.nombre ||
          ut?.descripcion ||
          ut?.codigo ||
          `Ubicación técnica ${id}`,
        tag: ut?.codigo || id,
        ubicacion: ut?.ubicacion || ut?.area || "",
      };
    });

    return [...equiposTargets, ...ubicacionesTargets].filter((t) => !!t.id);
  }, [aviso, equiposMap]);

  const getPlanesDisponibles = (targetId) =>
    planesPorTarget[String(targetId)] || [];

  const toggleCollapse = (key) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const toMinutes = (valor, unidad) => {
    const v = Number(valor);
    if (!Number.isFinite(v) || v <= 0) return 0;
    return unidad === "h" ? Math.round(v * 60) : Math.round(v);
  };

  const durationToEditableValue = (valor) => {
    if (!Number.isFinite(Number(valor))) return 0;
    return Number(valor);
  };

  const getActividadesFromPlan = (planSel) => {
  const acts =
    planSel?.actividades ||
    planSel?.PlanMantenimientoActividades ||
    planSel?.planMantenimientoActividades ||
    planSel?.actividadesPlan ||
    [];

  return [...acts].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
};

  const getItemsFromActividad = (act) =>
    act?.items ||
    act?.PlanActividadItems ||
    act?.plan_actividad_items ||
    act?.actividadItems ||
    [];

  const getPlanRootItems = (planSel) =>
    planSel?.items || planSel?.planItems || planSel?.PlanItems || [];

  const planItemsToLineas = (planSel) => {
    const lineas = [];
    // Items a nivel raíz del plan
    for (const it of getPlanRootItems(planSel)) {
      lineas.push(normalizeLinea({
        ...it,
        origen: "PLAN",
        // Proyecto y Centro de Costo vienen del aviso, no del plan
        projectCode: it.projectCode || aviso?.ordenVenta || "",
        costCenter: it.costCenter || it.costingCode || aviso?.centroCosto || "",
      }));
    }
    // Items dentro de cada actividad del plan
    for (const act of getActividadesFromPlan(planSel)) {
      for (const it of getItemsFromActividad(act)) {
        lineas.push(normalizeLinea({
          ...it,
          description: it.description || act.tarea || "Recurso de plan",
          origen: "PLAN",
          projectCode: it.projectCode || aviso?.ordenVenta || "",
          costCenter: it.costCenter || it.costingCode || aviso?.centroCosto || "",
        }));
      }
    }
    // NO deduplicar: cada item del plan es independiente aunque tengan el mismo código.
    // El usuario los creó como items separados y deben aparecer todos.
    return lineas.filter((l) => l.itemCode || l.description);
  };

  const hydrateFromTratamiento = async (tratamiento) => {
    if (!tratamiento) return;
    setTratamientoExistente(tratamiento);
    if (tratamiento?.requerimientos?.descripcionVenta) {
      setDescripcionVenta(tratamiento.requerimientos.descripcionVenta);
    }

    // Helper para normalizar línea inyectando valores del aviso si faltan
    const normLineaConAviso = (l) => normalizeLinea({
      ...l,
      costCenter: l.costCenter || l.costingCode || aviso?.centroCosto || "",
      projectCode: l.projectCode || aviso?.ordenVenta || "",
    });

   const solicitudesCompraDb = tratamiento?.solicitudesCompra || [];
const solicitudCompraGeneralDb = solicitudesCompraDb.find((s) => s.esGeneral) || null;
const solicitudesCompraPorTargetDb = {};
for (const s of solicitudesCompraDb.filter((x) => !x.esGeneral)) {
  const key = String(s.equipo_id || s.ubicacion_tecnica_id);
  solicitudesCompraPorTargetDb[key] = normalizeSolicitudForm({
    requiredDate: s.requiredDate ? String(s.requiredDate).slice(0, 10) : "",
    lineas: (s.lineas || []).map(normLineaConAviso),
  });
}
setSolicitudesCompra({
  solicitudGeneral: normalizeSolicitudForm(
    solicitudCompraGeneralDb
      ? {
          requiredDate: solicitudCompraGeneralDb.requiredDate
            ? String(solicitudCompraGeneralDb.requiredDate).slice(0, 10)
            : "",
          lineas: (solicitudCompraGeneralDb.lineas || []).map(normLineaConAviso),
        }
      : emptySolicitudForm()
  ),
  solicitudesPorEquipo: solicitudesCompraPorTargetDb,
});
const solicitudesAlmacenDb = tratamiento?.solicitudesAlmacen || [];
const solicitudAlmacenGeneralDb = solicitudesAlmacenDb.find((s) => s.esGeneral) || null;
const solicitudesAlmacenPorTargetDb = {};
for (const s of solicitudesAlmacenDb.filter((x) => !x.esGeneral)) {
  const key = String(s.equipo_id || s.ubicacion_tecnica_id);
  solicitudesAlmacenPorTargetDb[key] = normalizeSolicitudForm({
    requiredDate: s.requiredDate ? String(s.requiredDate).slice(0, 10) : "",
    lineas: (s.lineas || []).map(normLineaConAviso),
  });
}
setSolicitudesAlmacen({
  solicitudGeneral: normalizeSolicitudForm(
    solicitudAlmacenGeneralDb
      ? {
          requiredDate: solicitudAlmacenGeneralDb.requiredDate
            ? String(solicitudAlmacenGeneralDb.requiredDate).slice(0, 10)
            : "",
          lineas: (solicitudAlmacenGeneralDb.lineas || []).map(normLineaConAviso),
        }
      : emptySolicitudForm()
  ),
  solicitudesPorEquipo: solicitudesAlmacenPorTargetDb,
});

    const planesSeleccionados = {};
    const preventivoPorEquipo = {};
    const actividadesManuales = {};

    for (const te of tratamiento?.equipos || []) {
      const targetId = String(te.equipoId || te.ubicacionTecnicaId);
      const acts = te.actividades || [];
      if (te.planMantenimientoId) {
        planesSeleccionados[targetId] = te.planMantenimientoId;
        preventivoPorEquipo[targetId] = {
          planId: te.planMantenimientoId,
          nombrePlan: te.planMantenimiento?.nombre || "",
          codigoPlan: te.planMantenimiento?.codigoPlan || "",
          actividades: acts.map((a) => ({
            idLocal: a.id || ensureId(),
            planMantenimientoActividadId:
              a.origen === "PLAN" && a.planMantenimientoActividadId
                ? String(a.planMantenimientoActividadId).trim()
                : null,
            codigoActividad: a.codigoActividad || null,
            sistema: a.sistema || "",
            subsistema: a.subsistema || "",
            componente: a.componente || "",
            tarea: a.tarea || "",
            descripcion: a.descripcion || "",
            tipo: a.tipo === "EXTERNO" ? "EXTERNO" : "INTERNO",
            tipoTrabajo: a.tipoTrabajo || "REPARACION",
            rolTecnico: a.rolTecnico || "tecnico_mecanico",
            duracionEstimadaValor: durationToEditableValue(
              a.duracionEstimadaValor ?? a.duracionEstimadaMin ?? 0
            ),
            unidadDuracion: a.unidadDuracion || "min",
            cantidadTecnicos: Number(a.cantidadTecnicos) || 1,
            observaciones: a.observaciones || "",
            origen: a.planMantenimientoActividadId ? "PLAN" : "MANUAL_EXTRA",
          })),
        };
      } else {
        actividadesManuales[targetId] = acts.map((a) => ({
          idLocal: a.id || ensureId(),
          sistema: a.sistema || "",
          subsistema: a.subsistema || "",
          componente: a.componente || "",
          tarea: a.tarea || "",
          descripcion: a.descripcion || "",
          tipo: a.tipo === "EXTERNO" ? "EXTERNO" : "INTERNO",
          tipoTrabajo: a.tipoTrabajo || "REPARACION",
          rolTecnico: a.rolTecnico || "tecnico_mecanico",
          cantidadTecnicos: Number(a.cantidadTecnicos) || 1,
          duracionEstimadaValor: durationToEditableValue(a.duracionEstimadaValor ?? 0),
          unidadDuracion: a.unidadDuracion || "min",
          observaciones: a.observaciones || "",
          origen: a.origen || "MANUAL",
        }));
      }
    }

    // For instalación, merge all per-target manual activities into a single __general__ pool
    const esInstalacionLocal = aviso?.tipoAviso === "instalacion";
    if (esInstalacionLocal) {
      const generalActs = Object.values(actividadesManuales).flat();
      setData({
        actividadesManuales: { "__general__": generalActs },
        planesSeleccionados: {},
        preventivoPorEquipo: {},
      });
    } else {
      setData({ actividadesManuales, planesSeleccionados, preventivoPorEquipo });
    }
  };

 // REEMPLAZAR el useEffect que tiene [isOpen, aviso?.id] por estos dos:

// 1. Solo corre cuando el modal se ABRE (isOpen cambia de false a true)
const prevIsOpenRef = useRef(false);
const autoSelectDoneRef = useRef(false);

useEffect(() => {
  if (!isOpen || !aviso) return;
  
  // Solo resetear si el modal estaba cerrado y acaba de abrirse
  if (!prevIsOpenRef.current) {
    setErrorMsg("");
    setSolicitudesCompra(null);
    setSolicitudesAlmacen(null);
    setCollapsed({});
    setTratamientoExistente(null);
    setPlanesPorTarget({});
    setData({ actividadesManuales: {}, planesSeleccionados: {}, preventivoPorEquipo: {} });
    setDescripcionVenta("");
  }
  
  prevIsOpenRef.current = isOpen;

  let active = true;
  const load = async () => {
    try {
      const eData = await equipoService.getEquipos();
      if (!active) return;
      setEquipos(eData || []);
    } catch {
      if (!active) return;
      setEquipos([]);
    }
  };
  load();
  return () => { active = false; };
}, [isOpen, aviso?.id]);

// Asegurarse de limpiar las refs cuando el modal se cierra
useEffect(() => {
  if (!isOpen) {
    prevIsOpenRef.current = false;
    autoSelectDoneRef.current = false;
  }
}, [isOpen]);
  useEffect(() => {
    if (!isOpen || !aviso || !targets.length) return;
    let active = true;
    const cargarPlanesPorTarget = async () => {
      setLoadingPlanes(true);
      try {
        const resultados = await Promise.all(
          targets.map(async (target) => {
            try {
              let planes = [];
              if (target.type === TARGET_TYPES.EQUIPO) {
                planes = await planMantenimientoService.getPlanesByEquipo(target.id);
              } else {
                planes = await planMantenimientoService.getPlanesByUbicacionTecnica(target.id);
              }
              return [String(target.id), Array.isArray(planes) ? planes : []];
            } catch {
              return [String(target.id), []];
            }
          })
        );
        if (!active) return;
        setPlanesPorTarget(Object.fromEntries(resultados));
      } catch {
        if (active) setPlanesPorTarget({});
      } finally {
        if (active) setLoadingPlanes(false);
      }
    };
    cargarPlanesPorTarget();
    return () => { active = false; };
  }, [isOpen, aviso?.id, targets]);

  useEffect(() => {
    const esVentaLocal = aviso?.tipoAviso === "venta";
    if (!isOpen || !aviso || (!esVentaLocal && targets.length === 0)) return;
    let active = true;
    const loadTratamiento = async () => {
      try {
        const tratamiento = await getTratamientoByAviso(aviso.id);
        if (!active) return;
        if (tratamiento?.id) await hydrateFromTratamiento(tratamiento);
        else setTratamientoExistente(null);
      } catch {
        if (!active) return;
        setTratamientoExistente(null);
      }
    };
    loadTratamiento();
    return () => { active = false; };
  }, [isOpen, aviso?.id, targets.length]);

  // Auto-seleccionar el plan de la guía para cada target cuando se carga desde AlertasGuia
  useEffect(() => {
    if (!isOpen || !autoSelectPlanId || targets.length === 0 || autoSelectDoneRef.current) return;
    autoSelectDoneRef.current = true;
    targets.forEach((target) => {
      seleccionarPlan(String(target.id), autoSelectPlanId);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoSelectPlanId, targets.length]);

  const abrirModalCampo = (targetId, idx, act, mode, field) => {
    const label = field === "descripcion" ? "Descripción" : "Observación";
    setObsModal({
      open: true,
      mode,
      field,
      targetId,
      idx,
      value: act?.[field] || "",
      title: `${label} — Actividad #${idx + 1}`,
    });
  };

  const guardarModalCampo = () => {
    if (!obsModal.open) return;
    if (obsModal.mode === "correctivo") {
      actualizarActividad(obsModal.targetId, obsModal.idx, obsModal.field, obsModal.value);
    }
    if (obsModal.mode === "preventivo") {
      updatePreventivoActividad(obsModal.targetId, obsModal.idx, obsModal.field, obsModal.value);
    }
    setObsModal({ open: false, mode: null, field: "observaciones", targetId: null, idx: null, value: "", title: "" });
  };

  const cerrarModalObservacion = () => {
    setObsModal({ open: false, mode: null, field: "observaciones", targetId: null, idx: null, value: "", title: "" });
  };

  const seleccionarPlan = async (targetId, planId) => {
    setData((prev) => ({
      ...prev,
      planesSeleccionados: { ...prev.planesSeleccionados, [targetId]: planId },
    }));

    if (!planId) {
      setSolicitudesAlmacen((prev) => {
        if (!prev) return prev;
        const base = { ...prev, solicitudesPorEquipo: { ...(prev.solicitudesPorEquipo || {}) } };
        const actual = base.solicitudesPorEquipo?.[targetId];
        if (!actual) return prev;
        return {
          ...base,
          solicitudesPorEquipo: {
            ...base.solicitudesPorEquipo,
            [targetId]: { ...actual, lineas: (actual.lineas || []).filter((l) => l.origen !== "PLAN") },
          },
        };
      });
      setData((prev) => {
        const copyPrev = { ...(prev.preventivoPorEquipo || {}) };
        delete copyPrev[targetId];
        const copySel = { ...(prev.planesSeleccionados || {}) };
        delete copySel[targetId];
        return { ...prev, planesSeleccionados: copySel, preventivoPorEquipo: copyPrev };
      });
      return;
    }

    try {
      const planSel = await planMantenimientoService.getPlanById(planId);
      const lineasAuto = planItemsToLineas(planSel);

      setSolicitudesAlmacen((prev) => {
        const base = prev || {
          solicitudGeneral: normalizeSolicitudForm(emptySolicitudForm()),
          solicitudesPorEquipo: {},
        };
        const actual = base.solicitudesPorEquipo?.[targetId] || {
          department: base.solicitudGeneral?.department || "",
          email: base.solicitudGeneral?.email || base.solicitudGeneral?.requester || "",
          requiredDate: base.solicitudGeneral?.requiredDate || new Date().toISOString().slice(0, 10),
          comments: "",
          lineas: [],
        };
        // Mantener líneas manuales, reemplazar las del plan por las nuevas
        const manuales = (actual.lineas || []).filter((l) => l.origen !== "PLAN");
        return {
          ...base,
          solicitudesPorEquipo: {
            ...(base.solicitudesPorEquipo || {}),
            [targetId]: { ...actual, lineas: [...manuales, ...lineasAuto] },
          },
        };
      });

      const actividades = getActividadesFromPlan(planSel);
      const editable = (actividades || []).map((a) => {
        const unidad = a?.unidadDuracion || "min";
        const valor = Number(a?.duracionEstimadaValor ?? 0);
        const planActividadId = a?.id ? String(a.id).trim() : null;
        return {
          idLocal: ensureId(),
          planMantenimientoActividadId: planActividadId,
          codigoActividad: a.codigoActividad || null,
          sistema: a.sistema || "",
          subsistema: a.subsistema || "",
          componente: a.componente || "",
          tarea: a.tarea || "",
          descripcion: a.descripcion || "",
          tipo: a.tipo === "EXTERNO" ? "EXTERNO" : "INTERNO",
          tipoTrabajo: a.tipoTrabajo || "REVISION",
          rolTecnico: a.rolTecnico || "tecnico_mecanico",
          duracionEstimadaValor: durationToEditableValue(valor),
          unidadDuracion: unidad,
          cantidadTecnicos: Number(a.cantidadTecnicos) || 1,
          observaciones: a.observaciones || "",
          origen: "PLAN",
        };
      });

      setData((prev) => ({
        ...prev,
        preventivoPorEquipo: {
          ...prev.preventivoPorEquipo,
          [targetId]: {
            planId,
            nombrePlan: planSel?.nombre || "",
            codigoPlan: planSel?.codigoPlan || "",
            actividades: editable,
          },
        },
      }));
    } catch (e) {
      console.error("Error cargando plan:", e);
    }
  };

  const updatePreventivoActividad = (targetId, idx, campo, valor) => {
    setData((prev) => {
      const prevEq = prev.preventivoPorEquipo?.[targetId];
      if (!prevEq) return prev;
      const acts = [...(prevEq.actividades || [])];
      const actual = acts[idx];
      if (!actual) return prev;
      const esPlan = !!actual.planMantenimientoActividadId;
      if (
        esPlan &&
        !["cantidadTecnicos", "duracionEstimadaValor", "unidadDuracion", "observaciones", "tipo"].includes(campo)
      ) {
        return prev;
      }
      acts[idx] = { ...acts[idx], [campo]: valor };
      if (campo === "cantidadTecnicos") {
        const n = Number(valor);
        acts[idx].cantidadTecnicos = Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;
      }
      if (campo === "duracionEstimadaValor") {
        const n = Number(valor);
        acts[idx].duracionEstimadaValor = Number.isFinite(n) ? n : 0;
      }
      return {
        ...prev,
        preventivoPorEquipo: { ...prev.preventivoPorEquipo, [targetId]: { ...prevEq, actividades: acts } },
      };
    });
  };

  const agregarActividad = (targetId, defaultTipoTrabajo) =>
    setData((prev) => ({
      ...prev,
      actividadesManuales: {
        ...prev.actividadesManuales,
        [targetId]: [
          ...(prev.actividadesManuales[targetId] || []),
          { ...ACTIVIDAD_VACIA, idLocal: ensureId(), ...(defaultTipoTrabajo ? { tipoTrabajo: defaultTipoTrabajo } : {}) },
        ],
      },
    }));

  const actualizarActividad = (targetId, idx, campo, valor) =>
    setData((prev) => {
      const lista = [...(prev.actividadesManuales[targetId] || [])];
      lista[idx] = { ...lista[idx], [campo]: valor };
      if (campo === "cantidadTecnicos") {
        const n = Number(valor);
        lista[idx].cantidadTecnicos = Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;
      }
      if (campo === "duracionEstimadaValor") {
        const n = Number(valor);
        lista[idx].duracionEstimadaValor = Number.isFinite(n) ? n : 0;
      }
      return { ...prev, actividadesManuales: { ...prev.actividadesManuales, [targetId]: lista } };
    });

  const eliminarActividad = (targetId, idx) =>
    setData((prev) => ({
      ...prev,
      actividadesManuales: {
        ...prev.actividadesManuales,
        [targetId]: (prev.actividadesManuales[targetId] || []).filter((_, i) => i !== idx),
      },
    }));

  const agregarActividadPreventivaManual = (targetId) => {
    setData((prev) => {
      const pack = prev.preventivoPorEquipo?.[targetId];
      if (!pack) return prev;
      return {
        ...prev,
        preventivoPorEquipo: {
          ...prev.preventivoPorEquipo,
          [targetId]: { ...pack, actividades: [...(pack.actividades || []), createPreventivaExtra()] },
        },
      };
    });
  };

  const eliminarActividadPreventiva = (targetId, idx) => {
    setData((prev) => {
      const pack = prev.preventivoPorEquipo?.[targetId];
      if (!pack) return prev;
      const act = pack.actividades?.[idx];
      if (act?.planMantenimientoActividadId) return prev;
      return {
        ...prev,
        preventivoPorEquipo: {
          ...prev.preventivoPorEquipo,
          [targetId]: { ...pack, actividades: (pack.actividades || []).filter((_, i) => i !== idx) },
        },
      };
    });
  };

  const validateBeforeSave = () => {
    if (esVenta) {
      if (!descripcionVenta.trim()) return "La descripción es obligatoria para avisos de venta.";
      return "";
    }

    if (esInstalacion) {
      const acts = data.actividadesManuales?.["__general__"] || [];
      if (acts.length === 0) return "Agrega al menos 1 actividad de instalación.";
      for (const [idx, a] of acts.entries()) {
        if (!a.tarea || !String(a.tarea).trim()) return `Actividad #${idx + 1} sin tarea.`;
        if (!a.cantidadTecnicos || Number(a.cantidadTecnicos) <= 0)
          return `Actividad #${idx + 1}: cantidad de técnicos inválida.`;
      }
      return "";
    }

    if (!targets.length) return "El aviso no tiene equipos ni ubicaciones asociadas.";

    if (esPreventivo) {
      for (const target of targets) {
        const planId = data.planesSeleccionados?.[target.id];
        if (!planId) continue; // plan selection is optional per target
        const acts = data.preventivoPorEquipo?.[target.id]?.actividades || [];
        for (const [i, a] of acts.entries()) {
          if (!a.tarea || !String(a.tarea).trim()) return `${target.nombre}: actividad #${i + 1} sin tarea.`;
          if (!a.cantidadTecnicos || Number(a.cantidadTecnicos) <= 0)
            return `${target.nombre}: actividad #${i + 1} — cantidad de técnicos inválida.`;
        }
      }
    }

    if (esCorrectivo) {
      for (const target of targets) {
        const acts = data.actividadesManuales?.[target.id] || [];
        // activities per target are optional — only validate rows that exist
        for (const [idx, a] of acts.entries()) {
          if (!a.tarea || !String(a.tarea).trim()) return `${target.nombre}: actividad #${idx + 1} sin tarea.`;
          if (a.tipoTrabajo && !TIPOS_TRABAJO_CORRECTIVO.includes(a.tipoTrabajo))
            return `${target.nombre}: tipoTrabajo inválido (solo REPARACION/CAMBIO).`;
          if (!a.cantidadTecnicos || Number(a.cantidadTecnicos) <= 0)
            return `${target.nombre}: actividad #${idx + 1} — cantidad de técnicos inválida.`;
        }
      }
    }

    return "";
  };

  const buildSolicitudForBackend = (form) => {
  const f = normalizeSolicitudForm(form);
  return {
    requiredDate: f.requiredDate || "",
    lineas: Array.isArray(f.lineas)
      ? f.lineas.map((l) => ({
          itemId: l.itemId || null,
          itemCode: l.itemCode || "",
          description: l.description || "",
          quantity: Number(l.quantity) || 1,
          warehouseCode: l.warehouseCode || "",
          costingCode: l.costCenter || l.costingCode || "",
          projectCode: l.projectCode || "",
          rubroId: l.rubroId || null,
          paqueteTrabajoId: l.paqueteTrabajoId || null,
          observacion: l.observacion || "",
        }))
      : [],
  };
};
 

  const buildSolicitudesPorEquipoForBackend = (obj = {}) => {
    const result = {};
    for (const [key, form] of Object.entries(obj || {})) result[key] = buildSolicitudForBackend(form);
    return result;
  };

  const buildPayload = () => {
    const actividadesManualesNormalizadas = {};
    for (const [targetId, acts] of Object.entries(data.actividadesManuales || {})) {
      actividadesManualesNormalizadas[targetId] = (acts || []).map((a) => {
        const unidad = a.unidadDuracion || "min";
        const valor = Number(a.duracionEstimadaValor) || 0;
        return {
          sistema: a.sistema || null,
          subsistema: a.subsistema || null,
          componente: a.componente || null,
          tarea: a.tarea || null,
          descripcion: a.descripcion || null,
          tipo: a.tipo === "EXTERNO" ? "EXTERNO" : "INTERNO",
          tipoTrabajo: targetId === "__general__" ? null : (a.tipoTrabajo || "REPARACION"),
          rolTecnico: a.tipo === "EXTERNO" ? null : (a.rolTecnico || null),
          cantidadTecnicos: Number(a.cantidadTecnicos) || 1,
          duracionEstimadaValor: valor,
          unidadDuracion: unidad,
          duracionEstimadaMin: toMinutes(valor, unidad) || null,
          observaciones: a.observaciones || null,
          origen: a.origen || "MANUAL",
        };
      });
    }
    const actividadesPlanEditadas = {};
    for (const target of targets) {
      const pack = data.preventivoPorEquipo?.[target.id];
      if (!pack?.actividades?.length) continue;
      actividadesPlanEditadas[target.id] = pack.actividades.map((a) => ({
        planMantenimientoActividadId: a.planMantenimientoActividadId || null,
        codigoActividad: a.codigoActividad || null,
        sistema: a.sistema || null,
        subsistema: a.subsistema || null,
        componente: a.componente || null,
        tarea: a.tarea || null,
        descripcion: a.descripcion || null,
        tipo: a.tipo === "EXTERNO" ? "EXTERNO" : "INTERNO",
        tipoTrabajo: a.tipoTrabajo || "REVISION",
        rolTecnico: a.tipo === "EXTERNO" ? null : (a.rolTecnico || null),
        duracionEstimadaValor: Number(a.duracionEstimadaValor) || 0,
        unidadDuracion: a.unidadDuracion || "min",
        duracionEstimadaMin: toMinutes(a.duracionEstimadaValor, a.unidadDuracion) || 0,
        cantidadTecnicos: Number(a.cantidadTecnicos) || 1,
        observaciones: a.observaciones || null,
        origen: a.origen || (a.planMantenimientoActividadId ? "PLAN" : "MANUAL_EXTRA"),
      }));
    }
    return {
      tratamiento: {
        actividadesManuales: actividadesManualesNormalizadas,
        planesSeleccionados: data.planesSeleccionados,
        actividadesPlanEditadas,
        ...(esVenta ? { descripcionVenta } : {}),
      },
      solicitudCompraGeneral: solicitudesCompra?.solicitudGeneral
        ? buildSolicitudForBackend(solicitudesCompra.solicitudGeneral)
        : null,
      solicitudesCompraPorEquipo: buildSolicitudesPorEquipoForBackend(solicitudesCompra?.solicitudesPorEquipo || {}),
      solicitudAlmacenGeneral: solicitudesAlmacen?.solicitudGeneral
        ? buildSolicitudForBackend(solicitudesAlmacen.solicitudGeneral)
        : null,
      solicitudesAlmacenPorEquipo: buildSolicitudesPorEquipoForBackend(solicitudesAlmacen?.solicitudesPorEquipo || {}),
    };
  };

  const handleGuardar = async () => {
    setErrorMsg("");
    const msg = validateBeforeSave();
    if (msg) { setErrorMsg(msg); return; }
    setLoading(true);
    try {
      const payload = buildPayload();
      if (tratamientoExistente?.id) await saveTratamientoDraft(tratamientoExistente.id, payload);
      else await createTratamiento(aviso.id, payload);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.log("BACKEND ERROR:", err?.response?.data);
      setErrorMsg(err?.response?.data?.message || err?.message || "Error guardando tratamiento.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarCambios = async () => {
    setErrorMsg("");
    const msg = validateBeforeSave();
    if (msg) { setErrorMsg(msg); return; }
    if (!tratamientoExistente?.id) {
      setErrorMsg("Todavía no existe un tratamiento creado para este aviso. Primero debes guardar el tratamiento.");
      return;
    }
    setLoading(true);
    try {
      await saveTratamientoDraft(tratamientoExistente.id, buildPayload());
      alert("✅ Cambios guardados como PENDIENTE.");
    } catch (err) {
      console.log("BACKEND ERROR:", err?.response?.data);
      setErrorMsg(err?.response?.data?.message || err?.message || "Error guardando cambios (pendiente).");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !aviso) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex justify-center items-center p-3">
        <div className="bg-white w-[98vw] max-w-[110rem] h-[96vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200">

          {/* ── Header ── */}
          <div className="px-8 py-6 border-b bg-slate-50 flex justify-between items-center shrink-0">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-slate-900 rounded-xl">
                <FileText className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Tratamiento del Aviso</h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-sm text-slate-600">Aviso #{aviso.numeroAviso}</p>
                  {aviso.tipoMantenimiento && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold border border-slate-200 bg-white text-slate-700">
                      {aviso.tipoMantenimiento}
                    </span>
                  )}
                  {tratamientoExistente?.id && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">
                      Tratamiento cargado
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setWizardStep(1); setShowAvisoView(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition"
              >
                <Eye className="w-4 h-4" />
                Ver información del aviso
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200"
              >
                <X />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8">
            {errorMsg && (
              <div className="border border-rose-200 bg-rose-50 text-rose-700 rounded-2xl p-4 text-sm font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Información del aviso */}
            <Section title="Información del Aviso">
              <Grid>
                {Object.entries(CAMPOS_AVISO).map(([key, label]) =>
                  aviso[key] ? <Info key={key} label={label} value={aviso[key]} /> : null
                )}
              </Grid>
              {aviso.descripcion && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Descripción</p>
                  <p className="text-sm text-slate-800">{aviso.descripcion}</p>
                </div>
              )}
              {targets.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Equipos Asociados</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {targets.map((t) => (
                      <div
                        key={`${t.type}-${t.id}`}
                        className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl"
                      >
                        <div className="p-2 bg-slate-900 rounded-lg shrink-0">
                          {t.type === TARGET_TYPES.EQUIPO
                            ? <Package className="w-5 h-5 text-white" />
                            : <MapPinned className="w-5 h-5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{t.nombre}</p>
                          <p className="text-xs text-slate-500 font-medium truncate">
                            {t.type === TARGET_TYPES.EQUIPO ? "Equipo" : "Ubicación técnica"} · {t.tag}
                          </p>
                          {t.ubicacion && <p className="text-xs text-slate-500">📍 {t.ubicacion}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* ── VENTA ── */}
            {esVenta && (
              <Section title="Descripción del Tratamiento">
                <p className="text-sm text-slate-600 mb-3">
                  Describe el tratamiento o actividad realizada para este aviso de venta.
                </p>
                <textarea
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none"
                  rows={5}
                  placeholder="Describe el tratamiento de venta..."
                  value={descripcionVenta}
                  onChange={(e) => setDescripcionVenta(e.target.value)}
                />
              </Section>
            )}

            {/* ── CORRECTIVO ── */}
            {!esVenta && esCorrectivo && (
              <Section title="Actividades por objetivo (Correctivo)">
                <p className="text-sm text-slate-600">
                  Crea actividades manuales por cada equipo u objetivo. Las actividades son opcionales por objetivo.
                </p>
                {targets.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    Este aviso no tiene equipos ni ubicaciones técnicas asociadas.
                  </div>
                )}
                <div className="space-y-3">
                  {targets.map((target) => {
                    const actividades = data.actividadesManuales[target.id] || [];
                    const key = `corr-${target.type}-${target.id}`;
                    const abierto = !collapsed[key];

                    return (
                      <div key={key} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                        {/* Cabecera colapsable */}
                        <button
                          type="button"
                          onClick={() => toggleCollapse(key)}
                          className="w-full flex items-center justify-between gap-4 px-4 py-4 bg-white hover:bg-slate-50 transition border-b border-slate-200"
                        >
                          <div className="min-w-0 text-left">
                            <p className="font-semibold text-slate-900 truncate">{target.nombre}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {target.type === TARGET_TYPES.EQUIPO ? "Equipo" : "Ubicación técnica"} · {target.tag}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                              {actividades.length} actividad{actividades.length !== 1 ? "es" : ""}
                            </span>
                            {abierto
                              ? <ChevronUp className="w-5 h-5 text-slate-500" />
                              : <ChevronDown className="w-5 h-5 text-slate-500" />}
                          </div>
                        </button>

                        {abierto && (
                          <div className="p-4 space-y-2">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <p className="text-xs text-slate-500">
                                Agrega y edita las actividades correctivas para este objetivo.
                              </p>
                              <button
                                type="button"
                                onClick={() => agregarActividad(target.id)}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 transition"
                              >
                                <Plus className="w-4 h-4" />
                                Agregar actividad
                              </button>
                            </div>

                            {/* ── LISTA con header o estado vacío ── */}
                            {actividades.length === 0 ? (
                              <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-500">
                                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Aún no hay actividades. Agrega una.</p>
                              </div>
                            ) : (
                              <div style={{ overflowX: "auto" }}>
                                <ActividadesCorrectivasHeader />
                                {actividades.map((act, idx) => (
                                  <ActividadCorrectivaRow
                                    key={act.idLocal || `${target.id}-${idx}`}
                                    idx={idx}
                                    act={act}
                                    onChange={(campo, valor) => actualizarActividad(target.id, idx, campo, valor)}
                                    onDelete={() => eliminarActividad(target.id, idx)}
                                    onOpenObservacion={() => abrirModalCampo(target.id, idx, act, "correctivo", "observaciones")}
                                    onOpenDescripcion={() => abrirModalCampo(target.id, idx, act, "correctivo", "descripcion")}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── INSTALACIÓN (general, no por objetivo) ── */}
            {!esVenta && esInstalacion && (() => {
              const actividadesGral = data.actividadesManuales["__general__"] || [];
              return (
                <Section title="Actividades de Instalación">
                  <p className="text-sm text-slate-600">
                    Agrega las actividades generales de instalación. Los equipos y ubicaciones del aviso son opcionales.
                  </p>

                  {/* Equipos / ubicaciones del aviso — sólo informativo */}
                  {targets.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                        Equipos / ubicaciones del aviso — opcionales
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {targets.map((t) => (
                          <span
                            key={t.id}
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-emerald-300 bg-white text-emerald-800 font-medium"
                          >
                            {t.type === TARGET_TYPES.EQUIPO
                              ? <Package className="w-3 h-3" />
                              : <MapPinned className="w-3 h-3" />}
                            {t.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Panel único de actividades generales */}
                  <div className="border border-emerald-200 rounded-xl bg-white overflow-hidden">
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs text-slate-500">
                          {actividadesGral.length} actividad{actividadesGral.length !== 1 ? "es" : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => agregarActividad("__general__")}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-700 text-white text-sm hover:bg-emerald-600 transition"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar actividad
                        </button>
                      </div>

                      {actividadesGral.length === 0 ? (
                        <div className="border border-dashed border-emerald-200 rounded-xl p-8 text-center text-slate-500">
                          <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">Aún no hay actividades. Agrega una.</p>
                        </div>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <ActividadesInstalacionHeader />
                          {actividadesGral.map((act, idx) => (
                            <ActividadInstalacionRow
                              key={act.idLocal || idx}
                              idx={idx}
                              act={act}
                              onChange={(campo, valor) => actualizarActividad("__general__", idx, campo, valor)}
                              onDelete={() => eliminarActividad("__general__", idx)}
                              onOpenObservacion={() => abrirModalCampo("__general__", idx, act, "correctivo", "observaciones")}
                              onOpenDescripcion={() => abrirModalCampo("__general__", idx, act, "correctivo", "descripcion")}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Section>
              );
            })()}

            {/* ── PREVENTIVO ── */}
            {esPreventivo && (
              <Section title="Asignación de Actividades">
                <p className="text-sm text-slate-600">
                  Selecciona un plan de mantenimiento por objetivo (opcional). Las actividades del plan solo
                  permiten editar tiempo, unidad y cantidad de técnicos. Puedes dejar objetivos sin plan si no aplica.
                </p>
                <div className="space-y-4">
                  {targets.map((target) => {
                    const planes = getPlanesDisponibles(target.id);
                    const planIdSel = data.planesSeleccionados[target.id] || "";
                    const pack = data.preventivoPorEquipo?.[target.id];
                    const actividades = pack?.actividades || [];
                    const key = `prev-${target.type}-${target.id}`;
                    const abierto = !collapsed[key];

                    const totalMin = actividades.reduce(
                      (acc, a) => acc + (toMinutes(a.duracionEstimadaValor, a.unidadDuracion) || 0),
                      0
                    );
                    const roles = [...new Set(actividades.map((a) => a.rolTecnico).filter(Boolean))];
                    const totalTecnicos = actividades.reduce((acc, a) => acc + (Number(a.cantidadTecnicos) || 0), 0);
                    const tiempoFormateado =
                      totalMin >= 60
                        ? `${Math.floor(totalMin / 60)}h ${totalMin % 60 ? `${totalMin % 60}m` : ""}`
                        : `${totalMin}m`;

                    return (
                      <div key={key} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                        {/* Cabecera con selector de plan */}
                        <div className="p-4 border-b border-slate-200 bg-white">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{target.nombre}</p>
                              <p className="text-xs text-slate-500 truncate">
                                {target.type === TARGET_TYPES.EQUIPO ? "Equipo" : "Ubicación técnica"} · {target.tag}
                              </p>
                              {target.ubicacion && (
                                <p className="text-xs text-slate-500">📍 {target.ubicacion}</p>
                              )}
                            </div>
                            {planIdSel && (
                              <div className="flex flex-wrap gap-2">
                                <SummaryCard icon={ClipboardList} label="Actividades" value={actividades.length} />
                                <SummaryCard icon={Clock} label="Tiempo total" value={tiempoFormateado} />
                                <SummaryCard
                                  icon={Layers}
                                  label="Roles"
                                  value={roles.length ? roles.map((r) => r.replace(/_/g, " ")).join(", ") : "—"}
                                />
                                <SummaryCard icon={CheckCircle} label="Técnicos" value={totalTecnicos} />
                              </div>
                            )}
                          </div>

                          <div className="mt-4">
                            <SelectField
                              label="Plan de mantenimiento *"
                              value={planIdSel}
                              onChange={(v) => seleccionarPlan(target.id, v)}
                            >
                              <option value="">Seleccionar plan...</option>
                              {planes.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                  {plan.codigoPlan} — {plan.nombre}
                                </option>
                              ))}
                            </SelectField>
                            {loadingPlanes && (
                              <p className="text-xs text-slate-500 mt-2">Cargando planes...</p>
                            )}
                            {!loadingPlanes && planes.length === 0 && (
                              <p className="text-xs text-amber-700 mt-2">
                                Este objetivo no tiene planes asociados.
                              </p>
                            )}

                            {planIdSel && (
                              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                                <div className="text-xs text-slate-500">
                                  Plan:{" "}
                                  <b className="text-slate-700">
                                    {pack?.codigoPlan || "-"} {pack?.nombrePlan || ""}
                                  </b>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => agregarActividadPreventivaManual(target.id)}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 transition"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Agregar actividad extra
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleCollapse(key)}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm text-slate-700 transition"
                                  >
                                    {abierto ? (
                                      <><ChevronUp className="w-4 h-4" /> Ocultar actividades</>
                                    ) : (
                                      <><ChevronDown className="w-4 h-4" /> Ver / Editar actividades</>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ── LISTA PREVENTIVA con header ── */}
                        {planIdSel && abierto && (
                          <div className="p-4 bg-slate-50">
                            {actividades.length === 0 ? (
                              <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-500">
                                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No se cargaron actividades del plan.</p>
                              </div>
                            ) : (
                              <div style={{ overflowX: "auto" }}>
                                <ActividadesPreventivasHeader />
                                {actividades.map((act, idx) => (
                                  <ActividadPreventivaRow
                                    key={act.idLocal || act.planMantenimientoActividadId || idx}
                                    act={act}
                                    idx={idx}
                                    onChange={(campo, valor) => updatePreventivoActividad(target.id, idx, campo, valor)}
                                    onDelete={() => eliminarActividadPreventiva(target.id, idx)}
                                    onOpenObservacion={() => abrirModalCampo(target.id, idx, act, "preventivo", "observaciones")}
                                    onOpenDescripcion={() => abrirModalCampo(target.id, idx, act, "preventivo", "descripcion")}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-8 py-6 border-t bg-white flex justify-between items-center shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
            >
              Cancelar
            </button>
            <div className="flex gap-3 flex-wrap justify-end">
              <button
                onClick={() => setShowSolicitudCompra(true)}
                className={`flex items-center gap-2 px-6 py-3 border rounded-xl transition-colors ${
                  solicitudesCompra
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {solicitudesCompra
                  ? `Requerimiento cargada ✓${cantSolicitudesCompraIndividuales > 0 ? ` (+${cantSolicitudesCompraIndividuales} objetivo${cantSolicitudesCompraIndividuales > 1 ? "s" : ""})` : ""}`
                  : "Requerimiento de Compra"}
              </button>
              <button
                onClick={() => setShowSolicitudAlmacen(true)}
                className={`flex items-center gap-2 px-6 py-3 border rounded-xl transition-colors ${
                  solicitudesAlmacen
                    ? "border-rose-300 bg-rose-50 text-rose-800"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <Package className="w-4 h-4" />
                {solicitudesAlmacen
                  ? `Requerimiento para Almacén ✓${cantSolicitudesAlmacenIndividuales > 0 ? ` (+${cantSolicitudesAlmacenIndividuales} objetivo${cantSolicitudesAlmacenIndividuales > 1 ? "s" : ""})` : ""}`
                  : "Requerimiento de Almacén"}
              </button>
              <button
                onClick={handleGuardarCambios}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={handleGuardar}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? "Guardando..." : tratamientoExistente?.id ? "Actualizar Tratamiento" : "Pasar a tratar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ModalSolicitudCompra
        isOpen={showSolicitudCompra}
        onClose={() => setShowSolicitudCompra(false)}
        onConfirm={(result) => { setSolicitudesCompra(result); setShowSolicitudCompra(false); setErrorMsg(""); }}
        targets={targets}
        equiposRelacion={aviso?.equiposRelacion || []}
        ubicacionesRelacion={aviso?.ubicacionesRelacion || []}
        equiposInfo={equipos}
        initialValue={solicitudesCompra}
        ordenVenta={aviso?.ordenVenta || ""}
        centroCosto={aviso?.centroCosto || ""}
      />
      <ModalSolicitudAlmacen
        isOpen={showSolicitudAlmacen}
        onClose={() => setShowSolicitudAlmacen(false)}
        onConfirm={(result) => { setSolicitudesAlmacen(result); setShowSolicitudAlmacen(false); setErrorMsg(""); }}
        targets={targets}
        equiposRelacion={aviso?.equiposRelacion || []}
        ubicacionesRelacion={aviso?.ubicacionesRelacion || []}
        equiposInfo={equipos}
        initialValue={solicitudesAlmacen}
        ordenVenta={aviso?.ordenVenta || ""}
        centroCosto={aviso?.centroCosto || ""}
      />
      <ModalConfiguracionCampos isOpen={showConfigCampos} onClose={() => setShowConfigCampos(false)} />
      <ModalMantenimientoView
        isOpen={showAvisoView}
        onClose={() => setShowAvisoView(false)}
        wizardStep={wizardStep}
        setWizardStep={setWizardStep}
        data={aviso}
      />
      <ModalObservacionActividad
        isOpen={obsModal.open}
        title={obsModal.title}
        field={obsModal.field}
        value={obsModal.value}
        onChange={(value) => setObsModal((prev) => ({ ...prev, value }))}
        onClose={cerrarModalObservacion}
        onSave={guardarModalCampo}
      />
    </>
  );
}

/* ══════════════════════════════════════════════
   HEADERS
══════════════════════════════════════════════ */

const HEADER_OPTIONAL_STYLE = "opacity-70 font-normal normal-case tracking-normal";

function ActividadesCorrectivasHeader() {
  return (
    <div
      className="grid items-center gap-1 mb-1 px-3 py-2 bg-slate-900 rounded-xl text-xs font-semibold text-slate-300 uppercase tracking-wide"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      <span>Sistema <span className={HEADER_OPTIONAL_STYLE}>(opc.)</span></span>
      <span>Subsistema <span className={HEADER_OPTIONAL_STYLE}>(opc.)</span></span>
      <span>Componente <span className={HEADER_OPTIONAL_STYLE}>(opc.)</span></span>
      <span>Tarea <span className="text-rose-400">*</span></span>
      <span>Tipo trabajo</span>
      <span>Tipo</span>
      <span>Rol técnico</span>
      <span>Técnicos</span>
      <span>Duración</span>
      <span>Unidad</span>
      <span>Desc.</span>
      <span>Obs.</span>
      <span />
    </div>
  );
}

function ActividadesPreventivasHeader() {
  return (
    <div
      className="grid items-center gap-1 mb-1 px-3 py-2 bg-slate-900 rounded-xl text-xs font-semibold text-slate-300 uppercase tracking-wide"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      <span>Sistema <span className={HEADER_OPTIONAL_STYLE}>(opc.)</span></span>
      <span>Subsistema <span className={HEADER_OPTIONAL_STYLE}>(opc.)</span></span>
      <span>Componente <span className={HEADER_OPTIONAL_STYLE}>(opc.)</span></span>
      <span>Tarea <span className="text-rose-400">*</span></span>
      <span>Tipo trabajo</span>
      <span>Tipo</span>
      <span>Rol técnico</span>
      <span>Técnicos</span>
      <span>Duración</span>
      <span>Unidad</span>
      <span>Desc.</span>
      <span>Obs.</span>
      <span />
    </div>
  );
}

/* ══════════════════════════════════════════════
   FILA CORRECTIVA
══════════════════════════════════════════════ */

function ActividadCorrectivaRow({ idx, act, onChange, onDelete, onOpenObservacion, onOpenDescripcion }) {
  const tieneObs  = !!String(act.observaciones || "").trim();
  const tieneDesc = !!String(act.descripcion   || "").trim();

  const inputCls =
    "w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200";

  return (
    <div
      className="grid items-center gap-1 px-3 py-2 border border-slate-100 rounded-xl mb-1 bg-white hover:bg-slate-50 transition-colors"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      <input placeholder="Sistema"    value={act.sistema    ?? ""} onChange={(e) => onChange("sistema",    e.target.value)} className={inputCls} />
      <input placeholder="Subsistema" value={act.subsistema ?? ""} onChange={(e) => onChange("subsistema", e.target.value)} className={inputCls} />
      <input placeholder="Componente" value={act.componente ?? ""} onChange={(e) => onChange("componente", e.target.value)} className={inputCls} />
      <input placeholder="Tarea"      value={act.tarea      ?? ""} onChange={(e) => onChange("tarea",      e.target.value)} className={inputCls} />

      <select value={act.tipoTrabajo ?? "REPARACION"} onChange={(e) => onChange("tipoTrabajo", e.target.value)} className={inputCls}>
        {TIPOS_TRABAJO_CORRECTIVO.map((t) => (
          <option key={t} value={t}>{t === "REPARACION" ? "Reparación" : "Cambio"}</option>
        ))}
      </select>

      <select value={act.tipo ?? "INTERNO"} onChange={(e) => onChange("tipo", e.target.value)} className={inputCls}>
        <option value="INTERNO">Interno</option>
        <option value="EXTERNO">Externo</option>
      </select>

      <select
        value={act.rolTecnico ?? "tecnico_mecanico"}
        onChange={(e) => onChange("rolTecnico", e.target.value)}
        disabled={act.tipo === "EXTERNO"}
        className={inputCls}
        style={{ opacity: act.tipo === "EXTERNO" ? 0.45 : 1, cursor: act.tipo === "EXTERNO" ? "not-allowed" : "pointer" }}
      >
        {ROLES_TECNICOS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>

      <input type="number" min={1}   value={act.cantidadTecnicos    ?? ""} onChange={(e) => onChange("cantidadTecnicos",    Number(e.target.value))} className={inputCls} />
      <input type="number" min={0}   value={act.duracionEstimadaValor ?? ""} onChange={(e) => onChange("duracionEstimadaValor", Number(e.target.value))} className={inputCls} />

      <select value={act.unidadDuracion ?? "min"} onChange={(e) => onChange("unidadDuracion", e.target.value)} className={inputCls}>
        <option value="min">Min</option>
        <option value="h">Hrs</option>
      </select>

      {/* Botón Descripción */}
      <button
        onClick={onOpenDescripcion}
        title={tieneDesc ? act.descripcion : "Sin descripción"}
        className={`w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
          tieneDesc
            ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
            : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        }`}
      >
        <AlignLeft className="w-3.5 h-3.5 shrink-0" />
        {tieneDesc ? "Ver" : "—"}
      </button>

      {/* Botón Observación */}
      <button
        onClick={onOpenObservacion}
        title={tieneObs ? act.observaciones : "Sin observación"}
        className={`w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
          tieneObs
            ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        }`}
      >
        <StickyNote className="w-3.5 h-3.5 shrink-0" />
        {tieneObs ? "Ver" : "—"}
      </button>

      <button
        onClick={onDelete}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors mx-auto"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CABECERA Y FILA INSTALACIÓN
══════════════════════════════════════════════ */

function ActividadesInstalacionHeader() {
  return (
    <div
      className="grid items-center gap-1 mb-1 px-3 py-2 bg-emerald-900 rounded-xl text-xs font-semibold text-slate-300 uppercase tracking-wide"
      style={{ gridTemplateColumns: GRID_COLS_INSTALACION }}
    >
      <span>Sistema <span className={HEADER_OPTIONAL_STYLE}>(opc.)</span></span>
      <span>Subsistema <span className={HEADER_OPTIONAL_STYLE}>(opc.)</span></span>
      <span>Componente <span className={HEADER_OPTIONAL_STYLE}>(opc.)</span></span>
      <span>Tarea <span className="text-rose-400">*</span></span>
      <span>Tipo</span>
      <span>Rol técnico</span>
      <span>Técnicos</span>
      <span>Duración</span>
      <span>Unidad</span>
      <span>Desc.</span>
      <span>Obs.</span>
      <span />
    </div>
  );
}

function ActividadInstalacionRow({ idx, act, onChange, onDelete, onOpenObservacion, onOpenDescripcion }) {
  const tieneObs  = !!String(act.observaciones || "").trim();
  const tieneDesc = !!String(act.descripcion   || "").trim();

  const inputCls =
    "w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200";

  return (
    <div
      className="grid items-center gap-1 px-3 py-2 border border-emerald-100 rounded-xl mb-1 bg-emerald-50/30 hover:bg-emerald-50 transition-colors"
      style={{ gridTemplateColumns: GRID_COLS_INSTALACION }}
    >
      <input placeholder="Sistema"    value={act.sistema    ?? ""} onChange={(e) => onChange("sistema",    e.target.value)} className={inputCls} />
      <input placeholder="Subsistema" value={act.subsistema ?? ""} onChange={(e) => onChange("subsistema", e.target.value)} className={inputCls} />
      <input placeholder="Componente" value={act.componente ?? ""} onChange={(e) => onChange("componente", e.target.value)} className={inputCls} />
      <input placeholder="Tarea *"    value={act.tarea      ?? ""} onChange={(e) => onChange("tarea",      e.target.value)} className={inputCls} />

      <select value={act.tipo ?? "INTERNO"} onChange={(e) => onChange("tipo", e.target.value)} className={inputCls}>
        <option value="INTERNO">Interno</option>
        <option value="EXTERNO">Externo</option>
      </select>

      <select
        value={act.rolTecnico ?? "tecnico_mecanico"}
        onChange={(e) => onChange("rolTecnico", e.target.value)}
        disabled={act.tipo === "EXTERNO"}
        className={inputCls}
        style={{ opacity: act.tipo === "EXTERNO" ? 0.45 : 1, cursor: act.tipo === "EXTERNO" ? "not-allowed" : "pointer" }}
      >
        {ROLES_TECNICOS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>

      <input type="number" min={1}   value={act.cantidadTecnicos    ?? ""} onChange={(e) => onChange("cantidadTecnicos",    Number(e.target.value))} className={inputCls} />
      <input type="number" min={0}   value={act.duracionEstimadaValor ?? ""} onChange={(e) => onChange("duracionEstimadaValor", Number(e.target.value))} className={inputCls} />

      <select value={act.unidadDuracion ?? "min"} onChange={(e) => onChange("unidadDuracion", e.target.value)} className={inputCls}>
        <option value="min">Min</option>
        <option value="h">Hrs</option>
      </select>

      <button
        onClick={onOpenDescripcion}
        title={tieneDesc ? act.descripcion : "Sin descripción"}
        className={`w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
          tieneDesc
            ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
            : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        }`}
      >
        <AlignLeft className="w-3.5 h-3.5 shrink-0" />
        {tieneDesc ? "Ver" : "—"}
      </button>

      <button
        onClick={onOpenObservacion}
        title={tieneObs ? act.observaciones : "Sin observación"}
        className={`w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
          tieneObs
            ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        }`}
      >
        <StickyNote className="w-3.5 h-3.5 shrink-0" />
        {tieneObs ? "Ver" : "—"}
      </button>

      <button
        onClick={onDelete}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors mx-auto"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   FILA PREVENTIVA
══════════════════════════════════════════════ */

function ActividadPreventivaRow({ act, idx, onChange, onDelete, onOpenObservacion, onOpenDescripcion }) {
  const esPlan    = !!act.planMantenimientoActividadId;
  const tieneObs  = !!String(act.observaciones || "").trim();
  const tieneDesc = !!String(act.descripcion   || "").trim();

  const puedeEditar = (campo) => {
    if (!esPlan) return true;
    return ["cantidadTecnicos", "duracionEstimadaValor", "unidadDuracion", "observaciones"].includes(campo);
  };

  const inputCls = (campo) =>
    `w-full px-2 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors ${
      puedeEditar(campo)
        ? "border-slate-200 bg-white"
        : "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
    }`;

  return (
    <div
      className={`grid items-center gap-1 px-3 py-2 border rounded-xl mb-1 transition-colors ${
        esPlan
          ? "border-slate-100 bg-white hover:bg-slate-50"
          : "border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50"
      }`}
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      <input value={act.sistema    ?? ""} disabled={!puedeEditar("sistema")}    onChange={(e) => onChange("sistema",    e.target.value)} className={inputCls("sistema")} />
      <input value={act.subsistema ?? ""} disabled={!puedeEditar("subsistema")} onChange={(e) => onChange("subsistema", e.target.value)} className={inputCls("subsistema")} />
      <input value={act.componente ?? ""} disabled={!puedeEditar("componente")} onChange={(e) => onChange("componente", e.target.value)} className={inputCls("componente")} />
      <input value={act.tarea      ?? ""} disabled={!puedeEditar("tarea")}      onChange={(e) => onChange("tarea",      e.target.value)} className={inputCls("tarea")} />

      <select value={act.tipoTrabajo ?? "REVISION"} disabled={!puedeEditar("tipoTrabajo")} onChange={(e) => onChange("tipoTrabajo", e.target.value)} className={inputCls("tipoTrabajo")}>
        {TIPOS_TRABAJO_PREVENTIVO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      <select value={act.tipo ?? "INTERNO"} onChange={(e) => onChange("tipo", e.target.value)} className={inputCls("tipo")}>
        <option value="INTERNO">Interno</option>
        <option value="EXTERNO">Externo</option>
      </select>

      <select
        value={act.rolTecnico ?? "tecnico_mecanico"}
        disabled={!puedeEditar("rolTecnico") || act.tipo === "EXTERNO"}
        onChange={(e) => onChange("rolTecnico", e.target.value)}
        className={inputCls("rolTecnico")}
        style={{ opacity: act.tipo === "EXTERNO" ? 0.45 : 1, cursor: (!puedeEditar("rolTecnico") || act.tipo === "EXTERNO") ? "not-allowed" : "pointer" }}
      >
        {ROLES_TECNICOS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>

      <input type="number" min={1} value={act.cantidadTecnicos     ?? ""} disabled={!puedeEditar("cantidadTecnicos")}     onChange={(e) => onChange("cantidadTecnicos",     Number(e.target.value))} className={inputCls("cantidadTecnicos")} />
      <input type="number" min={0} value={act.duracionEstimadaValor ?? ""} disabled={!puedeEditar("duracionEstimadaValor")} onChange={(e) => onChange("duracionEstimadaValor", Number(e.target.value))} className={inputCls("duracionEstimadaValor")} />

      <select value={act.unidadDuracion ?? "min"} disabled={!puedeEditar("unidadDuracion")} onChange={(e) => onChange("unidadDuracion", e.target.value)} className={inputCls("unidadDuracion")}>
        <option value="min">Min</option>
        <option value="h">Hrs</option>
      </select>

      {/* Botón Descripción */}
      <button
        onClick={onOpenDescripcion}
        disabled={esPlan}
        title={tieneDesc ? act.descripcion : esPlan ? "No editable en actividades de plan" : "Sin descripción"}
        className={`w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
          tieneDesc
            ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
            : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        } ${esPlan ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        <AlignLeft className="w-3.5 h-3.5 shrink-0" />
        {tieneDesc ? "Ver" : "—"}
      </button>

      {/* Botón Observación */}
      <button
        onClick={onOpenObservacion}
        title={tieneObs ? act.observaciones : "Sin observación"}
        className={`w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
          tieneObs
            ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        }`}
      >
        <StickyNote className="w-3.5 h-3.5 shrink-0" />
        {tieneObs ? "Ver" : "—"}
      </button>

      <div className="flex justify-center">
        {!esPlan ? (
          <button
            onClick={onDelete}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-8 h-8" />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MODAL OBSERVACIÓN / DESCRIPCIÓN
══════════════════════════════════════════════ */

function ModalObservacionActividad({ isOpen, title, field, value, onChange, onClose, onSave }) {
  if (!isOpen) return null;
  const esDesc = field === "descripcion";
  return (
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${esDesc ? "bg-blue-600" : "bg-slate-900"}`}>
              {esDesc
                ? <AlignLeft className="w-4 h-4 text-white" />
                : <StickyNote className="w-4 h-4 text-white" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                {esDesc ? "Descripción detallada de la actividad." : "Observaciones o notas adicionales."}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>
        <div className="p-5">
          <textarea
            rows={6}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={esDesc ? "Escribe la descripción..." : "Escribe la observación..."}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 resize-none min-h-[140px]"
          />
        </div>
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            className={`px-4 py-2 rounded-xl text-white transition ${esDesc ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-900 hover:bg-slate-800"}`}
          >
            {esDesc ? "Guardar descripción" : "Guardar observación"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════ */

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="border border-slate-200 rounded-xl bg-slate-50 px-3 py-2.5 min-w-[150px]">
      <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
        {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900 break-words">{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-lg text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-2">{children}</div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-2">
      <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
    </div>
  );
}

function BaseField({ label, children }) {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <BaseField label={label}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[46px] border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
      >
        {children}
      </select>
    </BaseField>
  );
}