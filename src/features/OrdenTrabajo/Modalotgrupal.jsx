import {
  X,
  FileText,
  Edit,
  AlertCircle,
  ClipboardCheck,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { getEquiposDisponiblesPorAviso } from "../mantenimiento/services/ordenTrabajoService";
import { getTrabajadores } from "../mantenimiento/services/trabajadoresService";
import { planMantenimientoService } from "../PlanMantenimiento/services/planMantenimientoService";
import { adjuntosService } from "../OrdenTrabajo/services/adjuntosService";
import ModalInfoAviso from "../OrdenTrabajo/modals/ModalInfoAviso";
import ModalDetallesEquipo from "../OrdenTrabajo/modals/ModalDetalleEquipo";
import { getTratamientoByAviso } from "../mantenimiento/services/tratamientoService";
import {
  updateSolicitudCompra,
  createSolicitudCompra,
} from "../OrdenTrabajo/services/SolicitudCompraService";

import OTRegistroCard from "./components/OTRegistroCard";
import { getRegistroId, mkActOT } from "./helpers/otHelpers";
import { validateOTForm } from "./helpers/otValidation";

import ModalSolicitudAlmacen from "../../components/inputs/ModalSolicitudAlmacen";
import {
  createSolicitudAlmacen,
  updateSolicitudAlmacen,
} from "./services/solicitudAlmacenService";
import {
  mapSolicitudesAlmacenToModalValue,
  buildSolicitudAlmacenUpdatePayload,
  isSolicitudVacia,
  buildSolicitudAlmacenCreatePayload,
} from "./helpers/solicitudAlmacenAdapter";

import ModalSolicitudCompra from "../../components/inputs/ModalSolicitudCompra";

/* =========================================================
   HELPERS
========================================================= */

function toDatetimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function mapOrdenTrabajoToModalData(ot) {
  return {
    id: ot?.id || null,
    numeroOT: ot?.numeroOT || "",
    descripcionGeneral: ot?.descripcionGeneral || "",
    descripcionDetallada: ot?.descripcionDetallada || "",
    supervisorId: ot?.supervisorId || "",
    fechaProgramadaInicio: ot?.fechaProgramadaInicio
      ? toDatetimeLocal(ot.fechaProgramadaInicio)
      : "",
    fechaProgramadaFin: ot?.fechaProgramadaFin
      ? toDatetimeLocal(ot.fechaProgramadaFin)
      : "",
    fechaInicioReal: ot?.fechaInicioReal ? toDatetimeLocal(ot.fechaInicioReal) : "",
    fechaFinReal: ot?.fechaFinReal ? toDatetimeLocal(ot.fechaFinReal) : "",
    fechaCierre: ot?.fechaCierre ? toDatetimeLocal(ot.fechaCierre) : "",
    observaciones: ot?.observaciones || "",
    tipoMantenimiento: ot?.tipoMantenimiento || "",
    estado: ot?.estado || "CREADO",
    avisoId: ot?.avisoId || null,
    tratamientoId: ot?.tratamientoId || null,
    archivosAdjuntos: Array.isArray(ot?.adjuntos) ? ot.adjuntos : [],
    equipos: Array.isArray(ot?.equipos)
      ? ot.equipos.map((eq) => {
          const encargado = Array.isArray(eq?.trabajadores)
            ? eq.trabajadores.find((t) => t?.esEncargado)
            : null;
          return {
            id: eq?.id || null,
            equipoId: eq?.equipoId || null,
            ubicacionTecnicaId: eq?.ubicacionTecnicaId || null,
            equipoNombre: eq?.equipo?.nombre || eq?.equipo?.codigo || "",
            equipoTipo:
              eq?.equipo?.tipoEquipo ||
              eq?.equipo?.tipo ||
              eq?.equipo?.tipoEquipoPropiedad ||
              "",
            ubicacionTecnicaNombre: eq?.ubicacionTecnica?.nombre || "",
            ubicacionTecnicaCodigo: eq?.ubicacionTecnica?.codigo || "",
            descripcionEquipo: eq?.descripcionEquipo || "",
            descripcionUbicacion: eq?.descripcionUbicacion || "",
            prioridad: eq?.prioridad || "MEDIA",
            estado: eq?.estadoEquipo || "PENDIENTE",
            fechaInicioProgramada: eq?.fechaInicioProgramada
              ? toDatetimeLocal(eq.fechaInicioProgramada)
              : "",
            fechaFinProgramada: eq?.fechaFinProgramada
              ? toDatetimeLocal(eq.fechaFinProgramada)
              : "",
            fechaInicioReal: eq?.fechaInicioReal
              ? toDatetimeLocal(eq.fechaInicioReal)
              : "",
            fechaFinReal: eq?.fechaFinReal ? toDatetimeLocal(eq.fechaFinReal) : "",
            observacionesEquipo: eq?.observacionesEquipo || "",
            observaciones: eq?.observaciones || "",
            trabajadoresAsignados: Array.isArray(eq?.trabajadores)
              ? eq.trabajadores.map((t) => t?.trabajadorId).filter(Boolean)
              : [],
            trabajadoresData: Array.isArray(eq?.trabajadores)
              ? eq.trabajadores.map((t) => ({
                  id: t?.id || null,
                  trabajadorId: t?.trabajadorId || null,
                  esEncargado: !!t?.esEncargado,
                }))
              : [],
            encargadoId: encargado?.trabajadorId || null,
            planMantenimientoId: eq?.planMantenimientoId || null,
            planMantenimiento: eq?.planMantenimiento || null,
            actividadesOT: Array.isArray(eq?.actividades)
              ? eq.actividades.map((a) => ({
                  id: a?.id || null,
                  planMantenimientoActividadId:
                    a?.planMantenimientoActividadId || null,
                  codigoActividad: a?.codigoActividad || "",
                  sistema: a?.sistema || "",
                  subsistema: a?.subsistema || "",
                  componente: a?.componente || "",
                  tarea: a?.tarea || "",
                  descripcion: a?.descripcion || "",
                  tipoTrabajo: a?.tipoTrabajo || "",
                  rolTecnico: a?.rolTecnico || "",
                  cantidadTecnicos: a?.cantidadTecnicos || 1,
                  duracionEstimadaValor: a?.duracionEstimadaValor || "",
                  unidadDuracion: a?.unidadDuracion || "min",
                  duracionEstimadaMin: a?.duracionEstimadaMin || null,
                  duracionRealValor: a?.duracionRealValor || "",
                  unidadDuracionReal: a?.unidadDuracionReal || "min",
                  duracionRealMin: a?.duracionRealMin || null,
                  estado: a?.estado || "PENDIENTE",
                  origen: a?.origen || "PLAN",
                  tratamientoEquipoActividadId:
                    a?.tratamientoEquipoActividadId || null,
                  observaciones: a?.observaciones || "",
                  selected: true,
                }))
              : [],
            adjuntos: Array.isArray(eq?.adjuntos) ? eq.adjuntos : [],
            subiendoAdjuntos: false,
          };
        })
      : [],
  };
}

function buildOTPayload({
  numeroOT,
  formData,
  aviso,
  tratamientoId,
  equipos,
  archivosAdjuntos,
  esPreventivo,
  mode = "create",
  initialData = null,
}) {
  return {
    numeroOT,
    tipoMantenimiento:
      aviso?.tipoMantenimiento || initialData?.tipoMantenimiento || "Preventivo",
    descripcionGeneral: formData.descripcionGeneral || "",
    estado: initialData?.estado || "CREADO",
    supervisorId: formData.supervisorId || null,
    fechaProgramadaInicio: formData.fechaProgramadaInicio || null,
    fechaProgramadaFin: formData.fechaProgramadaFin || null,
    fechaInicioReal: initialData?.fechaInicioReal || null,
    fechaFinReal: initialData?.fechaFinReal || null,
    fechaCierre: initialData?.fechaCierre || null,
    observaciones: formData.observaciones || null,
    avisoId: aviso?.id || initialData?.avisoId || null,
    tratamientoId: tratamientoId || null,
    adjuntos: (archivosAdjuntos || []).map((a) => ({
      ...(mode === "edit" && a.id ? { id: a.id } : {}),
      nombre: a.nombre || "",
      url: a.url || "",
      extension: a.extension || null,
      categoria: a.categoria || "OTRO",
      mostrarEnPortal: a.mostrarEnPortal ?? false,
      tituloPortal: a.tituloPortal || null,
      descripcionPortal: a.descripcionPortal || null,
      ordenPortal: a.ordenPortal ?? 0,
    })),
    equipos: (equipos || []).map((eq) => {
      const trabajadores = (eq.trabajadoresAsignados || []).map((trabajadorId) => {
        const existente = Array.isArray(eq.trabajadoresData)
          ? eq.trabajadoresData.find(
              (t) => String(t.trabajadorId) === String(trabajadorId)
            )
          : null;
        return {
          ...(mode === "edit" && existente?.id ? { id: existente.id } : {}),
          trabajadorId,
          esEncargado: String(eq.encargadoId) === String(trabajadorId),
        };
      });
      return {
        ...(mode === "edit" && eq.id ? { id: eq.id } : {}),
        equipoId: eq.equipoId || null,
        ubicacionTecnicaId: eq.ubicacionTecnicaId || null,
        descripcionEquipo: eq.descripcionEquipo || null,
        planMantenimientoId: eq.planMantenimientoId || null,
        prioridad: eq.prioridad || "MEDIA",
        fechaInicioProgramada: eq.fechaInicioProgramada || null,
        fechaFinProgramada: eq.fechaFinProgramada || null,
        fechaInicioReal: eq.fechaInicioReal || null,
        fechaFinReal: eq.fechaFinReal || null,
        observacionesEquipo: eq.observacionesEquipo || null,
        estadoEquipo: eq.estado || "PENDIENTE",
        observaciones: eq.observaciones || null,
        trabajadores,
        actividades: (eq.actividadesOT || []).map((act) => ({
          ...(mode === "edit" && act.id ? { id: act.id } : {}),
          planMantenimientoActividadId: act.planMantenimientoActividadId || null,
          sistema: act.sistema || null,
          subsistema: act.subsistema || null,
          componente: act.componente || null,
          tarea: act.tarea || "",
          descripcion: act.descripcion || null,
          tipoTrabajo: act.tipoTrabajo || null,
          tipo: act.tipo === "EXTERNO" ? "EXTERNO" : "INTERNO",
          rolTecnico: act.tipo === "EXTERNO" ? null : (act.rolTecnico || null),
          cantidadTecnicos: act.cantidadTecnicos ?? 1,
          duracionEstimadaValor:
            act.duracionEstimadaValor === "" ? null : act.duracionEstimadaValor,
          unidadDuracion: act.unidadDuracion || "min",
          duracionEstimadaMin: act.duracionEstimadaMin ?? null,
          duracionRealValor:
            act.duracionRealValor === "" ? null : act.duracionRealValor,
          unidadDuracionReal: act.unidadDuracionReal || "min",
          duracionRealMin: act.duracionRealMin ?? null,
          estado: act.estado || "PENDIENTE",
          origen:
            act.origen && ["PLAN", "MANUAL", "TRATAMIENTO"].includes(act.origen)
              ? act.origen
              : esPreventivo
              ? "PLAN"
              : "MANUAL",
          tratamientoEquipoActividadId: act.tratamientoEquipoActividadId || null,
          observaciones: act.observaciones || null,
        })),
        adjuntos: (eq.adjuntos || []).map((adj) => ({
          ...(mode === "edit" && adj.id ? { id: adj.id } : {}),
          nombre: adj.nombre || "",
          url: adj.url || "",
          extension: adj.extension || null,
          categoria: adj.categoria || "OTRO",
          mostrarEnPortal: adj.mostrarEnPortal ?? false,
          tituloPortal: adj.tituloPortal || null,
          descripcionPortal: adj.descripcionPortal || null,
          ordenPortal: adj.ordenPortal ?? 0,
        })),
      };
    }),
  };
}

/* =========================================================
   HELPER: mapea array de solicitudes compra al formato del modal
   (extraído fuera del componente para evitar stale closures)
========================================================= */
function buildInitialSolicitudesCompra(solicitudesCompraArr) {
  const arr = Array.isArray(solicitudesCompraArr) ? solicitudesCompraArr : [];
  const mapLinea = (l) => ({
    id: l.id,
    itemId: l.itemId || "",
    itemCode: l.itemCode || "",
    description: l.description || "",
    quantity: Number(l.quantity) || 1,
    warehouseCode: l.warehouseCode || "",
    costCenter: l.costingCode || "",
    projectCode: l.projectCode || "",
    rubroId: l.rubroId || null,
    paqueteTrabajoId: l.paqueteTrabajoId || null,
  });
  const general = arr.find((s) => s?.esGeneral === true) || null;
  const individuales = arr.filter((s) => !s?.esGeneral);
  const solicitudesPorEquipo = {};
  for (const sol of individuales) {
    const key = String(sol.equipo_id || sol.ubicacion_tecnica_id || "");
    if (!key) continue;
    solicitudesPorEquipo[key] = {
      department: sol.department || "",
      email: sol.requester || sol.email || "",
      requiredDate: sol.requiredDate ? String(sol.requiredDate).slice(0, 10) : "",
      comments: sol.comments || "",
      lineas: Array.isArray(sol.lineas) ? sol.lineas.map(mapLinea) : [],
    };
  }
  return {
    solicitudGeneral: general
      ? {
          department: general.department || "",
          email: general.requester || general.email || "",
          requiredDate: general.requiredDate ? String(general.requiredDate).slice(0, 10) : "",
          comments: general.comments || "",
          lineas: Array.isArray(general.lineas) ? general.lineas.map(mapLinea) : [],
        }
      : null,
    solicitudesPorEquipo,
  };
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function ModalOTGrupal({
  isOpen,
  onClose,
  aviso,
  onGuardar,
  onGenerarNumeroOT,
  mode = "create",
  initialData = null,
}) {
  const [numeroOTGenerado, setNumeroOTGenerado] = useState("");
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarInfoAviso, setMostrarInfoAviso] = useState(false);

  const [archivosAdjuntos, setArchivosAdjuntos] = useState([]);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);

  const [supervisores, setSupervisores] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargandoTrabajadores, setCargandoTrabajadores] = useState(false);

  const [equipoDetalleModal, setEquipoDetalleModal] = useState(null);
  const [tratamientoData, setTratamientoData] = useState(null);

  const [equipos, setEquipos] = useState([]);
  const [planesPorEquipo, setPlanesPorEquipo] = useState({});
  const [cargandoPlanes, setCargandoPlanes] = useState(false);

  const [errors, setErrors] = useState({});

  // ── Modal de texto (observación / descripción) ──
  const [modalTexto, setModalTexto] = useState(null);

  const tratamientoAplicadoRef = useRef(false);

  const tipoMantenimiento =
    aviso?.tipoMantenimiento ||
    initialData?.tipoMantenimiento ||
    initialData?.aviso?.tipoMantenimiento;

  const esPreventivo = tipoMantenimiento === "Preventivo";
  const esCorrectivo = tipoMantenimiento === "Correctivo";
  const esVenta = (aviso?.tipoAviso || initialData?.aviso?.tipoAviso) === "venta";
  const esInstalacion = (aviso?.tipoAviso || initialData?.aviso?.tipoAviso) === "instalacion";

  const tratamiento = tratamientoData?.tratamiento || tratamientoData || null;

  const [equiposAvisoDisplay, setEquiposAvisoDisplay] = useState([]);

  const [showSolicitudAlmacenModal, setShowSolicitudAlmacenModal] = useState(false);
  const [guardandoSolicitudAlmacen, setGuardandoSolicitudAlmacen] = useState(false);

  const [showSolicitudCompraModal, setShowSolicitudCompraModal] = useState(false);
  const [guardandoSolicitudCompra, setGuardandoSolicitudCompra] = useState(false);

  const [solicitudesCompraOT, setSolicitudesCompraOT] = useState(null);
const [solicitudesAlmacenOT, setSolicitudesAlmacenOT] = useState(null);

  const [formData, setFormData] = useState({
    descripcionGeneral: "",
    descripcionDetallada: "",
    supervisorId: "",
    encargadoId: "",
    fechaProgramadaInicio: "",
    fechaProgramadaFin: "",
    observaciones: "",
  });

  const equiposInfo = useMemo(() => {
    return (equipos || []).map((e) => ({
      id: String(getRegistroId(e)),
      nombre:
        e.equipoNombre ||
        e.ubicacionTecnicaNombre ||
        e.equipo?.nombre ||
        e.ubicacionTecnica?.nombre,
      codigo:
        e.equipoNombre ||
        e.ubicacionTecnicaNombre ||
        e.equipo?.codigo ||
        e.ubicacionTecnica?.codigo,
      tag: e.equipoTipo || e.ubicacionTecnicaCodigo,
      tipo: e.equipoId ? "EQUIPO" : "UBICACION_TECNICA",
    }));
  }, [equipos]);

  const getTargetMeta = (targetId) => {
    const target = equiposInfo.find((t) => String(t.id) === String(targetId));
    if (!target) return { equipo_id: null, ubicacion_tecnica_id: null };
    return {
      equipo_id: target.tipo === "EQUIPO" ? target.id : null,
      ubicacion_tecnica_id: target.tipo === "UBICACION_TECNICA" ? target.id : null,
    };
  };

  const buildSolicitudCompraCreatePayload = (form, extra = {}) => ({
    tratamiento_id: tratamiento?.id || tratamientoData?.id || null,
    equipo_id: extra.equipo_id ?? null,
    ubicacion_tecnica_id: extra.ubicacion_tecnica_id ?? null,
    esGeneral: !!extra.esGeneral,
    department: form.department || "",
    requester: form.email?.trim() || "",
    requiredDate: form.requiredDate || "",
    comments: form.comments || "",
    lineas: Array.isArray(form.lineas)
      ? form.lineas.map((l) => ({
          itemId: l.itemId || null,
          itemCode: l.itemCode || "",
          description: l.description || "",
          quantity: Number(l.quantity) || 1,
          warehouseCode: l.warehouseCode || "",
          costingCode: l.costCenter || "",
          projectCode: l.projectCode || "",
          rubroId: l.rubroId || null,
          paqueteTrabajoId: l.paqueteTrabajoId || null,
        }))
      : [],
  });

  const solicitudesCompraArr = useMemo(() => {
    const arr =
      tratamientoData?.solicitudesCompra ||
      tratamiento?.solicitudesCompra ||
      tratamientoData?.tratamiento?.solicitudesCompra ||
      [];
    return Array.isArray(arr) ? arr : [];
  }, [tratamientoData, tratamiento]);

  const initialSolicitudesCompra = useMemo(() => {
    const general = solicitudesCompraArr.find((s) => s?.esGeneral === true) || null;
    const individuales = solicitudesCompraArr.filter((s) => !s?.esGeneral);
    const solicitudesPorEquipo = {};
    for (const sol of individuales) {
      const key = String(sol.equipo_id || sol.ubicacion_tecnica_id || "");
      if (!key) continue;
      solicitudesPorEquipo[key] = {
        department: sol.department || "",
        email: sol.requester || sol.email || "",
        requiredDate: sol.requiredDate ? String(sol.requiredDate).slice(0, 10) : "",
        comments: sol.comments || "",
        lineas: Array.isArray(sol.lineas)
          ? sol.lineas.map((l) => ({
              id: l.id,
              itemId: l.itemId || "",
              itemCode: l.itemCode || "",
              description: l.description || "",
              quantity: Number(l.quantity) || 1,
              warehouseCode: l.warehouseCode || "",
              costCenter: l.costingCode || "",
              projectCode: l.projectCode || "",
              rubroId: l.rubroId || null,
              paqueteTrabajoId: l.paqueteTrabajoId || null,
            }))
          : [],
      };
    }
    return {
      solicitudGeneral: general
        ? {
            department: general.department || "",
            email: general.requester || general.email || "",
            requiredDate: general.requiredDate
              ? String(general.requiredDate).slice(0, 10)
              : "",
            comments: general.comments || "",
            lineas: Array.isArray(general.lineas)
              ? general.lineas.map((l) => ({
                  id: l.id,
                  itemId: l.itemId || "",
                  itemCode: l.itemCode || "",
                  description: l.description || "",
                  quantity: Number(l.quantity) || 1,
                  warehouseCode: l.warehouseCode || "",
                  costCenter: l.costingCode || "",
                  projectCode: l.projectCode || "",
                  rubroId: l.rubroId || null,
                  paqueteTrabajoId: l.paqueteTrabajoId || null,
                }))
              : [],
          }
        : null,
      solicitudesPorEquipo,
    };
  }, [solicitudesCompraArr]);

  const buildSolicitudCompraUpdatePayload = (form) => ({
    department: form.department || "",
    requester: form.email?.trim() || "",
    requiredDate: form.requiredDate || "",
    comments: form.comments || "",
    lineas: Array.isArray(form.lineas)
      ? form.lineas.map((l) => ({
          itemId: l.itemId || null,
          itemCode: l.itemCode || "",
          description: l.description || "",
          quantity: Number(l.quantity) || 1,
          warehouseCode: l.warehouseCode || "",
          costingCode: l.costCenter || "",
          projectCode: l.projectCode || "",
          rubroId: l.rubroId || null,
          paqueteTrabajoId: l.paqueteTrabajoId || null,
        }))
      : [],
  });

  const solicitudesAlmacenArr = useMemo(() => {
    const arr =
      tratamientoData?.solicitudesAlmacen ||
      tratamiento?.solicitudesAlmacen ||
      tratamientoData?.tratamiento?.solicitudesAlmacen ||
      [];
    return Array.isArray(arr) ? arr : [];
  }, [tratamientoData, tratamiento]);

  const initialSolicitudesAlmacen = useMemo(() => {
    return mapSolicitudesAlmacenToModalValue(solicitudesAlmacenArr);
  }, [solicitudesAlmacenArr]);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) {
      tratamientoAplicadoRef.current = false;
      setEquipos([]);
      setEquiposAvisoDisplay([]);
      setPlanesPorEquipo({});
      setTratamientoData(null);
      setArchivosAdjuntos([]);
      setErrors({});
      setModalTexto(null);
      setFormData({
        descripcionGeneral: "",
        descripcionDetallada: "",
        supervisorId: "",
        encargadoId: "",
        fechaProgramadaInicio: "",
        fechaProgramadaFin: "",
        observaciones: "",
      });
      setNumeroOTGenerado("");
    }
  }, [isOpen]);

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

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && initialData) {
      const mapped = mapOrdenTrabajoToModalData(initialData);
      setNumeroOTGenerado(mapped.numeroOT || "");
      setArchivosAdjuntos(mapped.archivosAdjuntos || []);
      setEquipos(mapped.equipos || []);
      setFormData({
        descripcionGeneral: mapped.descripcionGeneral || "",
        descripcionDetallada: mapped.descripcionDetallada || "",
        supervisorId: mapped.supervisorId || "",
        fechaProgramadaInicio: mapped.fechaProgramadaInicio || "",
        fechaProgramadaFin: mapped.fechaProgramadaFin || "",
        observaciones: mapped.observaciones || "",
      });
      return;
    }
    if (mode === "create" && aviso) {
      const numero = onGenerarNumeroOT
        ? onGenerarNumeroOT()
        : `OT-${Date.now().toString().slice(-6)}`;
      setNumeroOTGenerado(numero);
      setFormData({
        descripcionGeneral: aviso.descripcion || "",
        descripcionDetallada: "",
        supervisorId: "",
        encargadoId: "",
        fechaProgramadaInicio: aviso.fechaSugerida || "",
        fechaProgramadaFin: aviso.fechaSugeridaFin || "",
        observaciones: "",
      });
    }
  }, [isOpen, aviso, onGenerarNumeroOT, mode, initialData]);

  useEffect(() => {
    if (!isOpen || !aviso?.id) return;
    getTratamientoByAviso(aviso.id)
      .then((data) => {
        setTratamientoData(data);
        // Para venta: pre-llenar descripcionGeneral desde descripcionVenta del tratamiento
        const descripcionVenta =
          data?.requerimientos?.descripcionVenta ||
          data?.tratamiento?.requerimientos?.descripcionVenta;
        if (aviso?.tipoAviso === "venta" && descripcionVenta) {
          setFormData((prev) => ({
            ...prev,
            descripcionGeneral: descripcionVenta,
          }));
        }
        // Calculamos directo desde `data` para evitar stale closures con los useMemo
        const compraArr =
          data?.solicitudesCompra ||
          data?.tratamiento?.solicitudesCompra ||
          [];
        const almacenArr =
          data?.solicitudesAlmacen ||
          data?.tratamiento?.solicitudesAlmacen ||
          [];
        setSolicitudesCompraOT(buildInitialSolicitudesCompra(compraArr));
        setSolicitudesAlmacenOT(mapSolicitudesAlmacenToModalValue(almacenArr));
      })
      .catch((err) => {
        console.error("[OTGrupal] Error cargando tratamiento:", err);
        setTratamientoData(null);
      });
  }, [isOpen, aviso?.id]);

  useEffect(() => {
    if (!isOpen || !esInstalacion || !tratamientoData || mode !== "create") return;
    if (tratamientoAplicadoRef.current) return;
    tratamientoAplicadoRef.current = true;

    // Cargar equipos y ubicaciones del aviso para mostrarlos como referencia
    if (aviso?.id) {
      getEquiposDisponiblesPorAviso(aviso.id)
        .then((resp) => {
          const equiposList = (resp || []).map((rel) => ({
            nombre: rel.equipo.nombre || rel.equipo.codigo,
            tipo: "EQUIPO",
          }));
          const ubicacionesList = (aviso?.ubicacionesRelacion || []).map((rel) => {
            const ut = rel.ubicacionTecnica || rel.ubicacion || {};
            return { nombre: ut.nombre || ut.codigo || ut.descripcion, tipo: "UBICACION" };
          });
          setEquiposAvisoDisplay([...equiposList, ...ubicacionesList]);
        })
        .catch(() => {
          const ubicacionesList = (aviso?.ubicacionesRelacion || []).map((rel) => {
            const ut = rel.ubicacionTecnica || rel.ubicacion || {};
            return { nombre: ut.nombre || ut.codigo || ut.descripcion, tipo: "UBICACION" };
          });
          setEquiposAvisoDisplay(ubicacionesList);
        });
    }

    const teGeneral = (tratamientoData.equipos || []).find(
      (te) => !te.equipoId && !te.ubicacionTecnicaId
    );
    const actividadesOT = (teGeneral?.actividades || []).map((a) =>
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
        { forceSelected: true, esCorrectivo }
      )
    );

    setEquipos([
      {
        id: null,
        equipoId: null,
        ubicacionTecnicaId: null,
        equipoNombre: "Instalación",
        equipoTipo: "Instalación",
        ubicacionTecnicaNombre: "",
        ubicacionTecnicaCodigo: "",
        descripcionEquipo: "",
        descripcionUbicacion: "",
        prioridad: "MEDIA",
        estado: "PENDIENTE",
        fechaInicioProgramada: "",
        fechaFinProgramada: "",
        fechaInicioReal: "",
        fechaFinReal: "",
        observacionesEquipo: "",
        observaciones: "",
        trabajadoresAsignados: [],
        trabajadoresData: [],
        encargadoId: null,
        planMantenimientoId: null,
        planMantenimiento: null,
        actividadesOT,
        adjuntos: [],
        subiendoAdjuntos: false,
      },
    ]);
  }, [isOpen, esInstalacion, tratamientoData, mode, esCorrectivo]);

  useEffect(() => {
    if (!isOpen || !aviso?.id || mode !== "create") return;
    if (esInstalacion) return; // instalación uses a single general block, not per-equipo
    const cargarRegistros = async () => {
      try {
        const equiposResp = await getEquiposDisponiblesPorAviso(aviso.id).catch(() => []);
        const equiposIniciales = (equiposResp || []).map((rel) => ({
          id: null,
          equipoId: rel.equipo.id,
          ubicacionTecnicaId: null,
          equipoNombre: rel.equipo.nombre || rel.equipo.codigo,
          equipoTipo:
            rel.equipo.tipoEquipo || rel.equipo.tipo || rel.equipo.tipoEquipoPropiedad || "—",
          ubicacionTecnicaNombre: "",
          ubicacionTecnicaCodigo: "",
          descripcionEquipo: "",
          descripcionUbicacion: "",
          prioridad: "MEDIA",
          estado: "PENDIENTE",
          fechaInicioProgramada: "",
          fechaFinProgramada: "",
          fechaInicioReal: "",
          fechaFinReal: "",
          observacionesEquipo: "",
          observaciones: "",
          trabajadoresAsignados: [],
          trabajadoresData: [],
          encargadoId: null,
          planMantenimientoId: null,
          planMantenimiento: null,
          actividadesOT: [],
          adjuntos: [],
          subiendoAdjuntos: false,
        }));

        const ubicacionesIniciales = (aviso?.ubicacionesRelacion || []).map((rel) => {
          const ut = rel.ubicacionTecnica || rel.ubicacion || {};
          const ubicacionId = rel.ubicacionTecnicaId || rel.ubicacionId || ut.id;
          return {
            id: null,
            equipoId: null,
            ubicacionTecnicaId: ubicacionId,
            equipoNombre: "",
            equipoTipo: "",
            ubicacionTecnicaNombre:
              ut.nombre || ut.descripcion || `Ubicación técnica ${ubicacionId}`,
            ubicacionTecnicaCodigo: ut.codigo || String(ubicacionId),
            descripcionEquipo: "",
            descripcionUbicacion: "",
            prioridad: "MEDIA",
            estado: "PENDIENTE",
            fechaInicioProgramada: "",
            fechaFinProgramada: "",
            fechaInicioReal: "",
            fechaFinReal: "",
            observacionesEquipo: "",
            observaciones: "",
            trabajadoresAsignados: [],
            trabajadoresData: [],
            encargadoId: null,
            planMantenimientoId: null,
            planMantenimiento: null,
            actividadesOT: [],
            adjuntos: [],
            subiendoAdjuntos: false,
          };
        });

        setEquipos([...equiposIniciales, ...ubicacionesIniciales]);
      } catch (err) {
        console.error("Error cargando registros disponibles", err);
        setEquipos([]);
      }
    };
    cargarRegistros();
  }, [isOpen, aviso?.id, aviso?.ubicacionesRelacion, mode]);

  useEffect(() => {
    if (
      !isOpen ||
      mode !== "create" ||
      !tratamientoData ||
      !equipos.length ||
      esInstalacion ||
      tratamientoAplicadoRef.current
    ) return;

    const tratEquipos = Array.isArray(tratamientoData.equipos)
      ? tratamientoData.equipos
      : [];
    if (!tratEquipos.length) return;

    tratamientoAplicadoRef.current = true;

    setEquipos((prev) =>
      prev.map((eq) => {
        const te = tratEquipos.find((t) => {
          if (eq.equipoId) return t.equipoId === eq.equipoId || t.equipo?.id === eq.equipoId;
          if (eq.ubicacionTecnicaId) {
            return (
              t.ubicacionTecnicaId === eq.ubicacionTecnicaId ||
              t.ubicacionTecnica?.id === eq.ubicacionTecnicaId
            );
          }
          return false;
        });
        if (!te) return eq;

        const actividadesOT = (te.actividades || []).map((a) =>
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
            { forceSelected: true, esCorrectivo }
          )
        );

        return {
          ...eq,
          equipoId: te.equipoId || eq.equipoId || null,
          ubicacionTecnicaId: te.ubicacionTecnicaId || eq.ubicacionTecnicaId || null,
          equipoNombre: te.equipo?.nombre || te.equipo?.codigo || eq.equipoNombre,
          equipoTipo: te.equipo?.tipoEquipo || te.equipo?.tipo || eq.equipoTipo,
          ubicacionTecnicaNombre: te.ubicacionTecnica?.nombre || eq.ubicacionTecnicaNombre,
          ubicacionTecnicaCodigo: te.ubicacionTecnica?.codigo || eq.ubicacionTecnicaCodigo,
          actividadesOT,
          planMantenimientoId: te.planMantenimientoId || null,
          planMantenimiento: te.planMantenimiento || null,
          descripcionEquipo: te.descripcionEquipo || eq.descripcionEquipo || "",
          descripcionUbicacion: te.descripcionUbicacion || eq.descripcionUbicacion || "",
        };
      })
    );
  }, [isOpen, mode, tratamientoData, equipos.length, esCorrectivo]);

  useEffect(() => {
    if (!isOpen || !esPreventivo || !equipos.length) return;
    let cancelled = false;
    const run = async () => {
      setCargandoPlanes(true);
      try {
        const entries = await Promise.all(
          equipos.map(async (eq) => {
            const key = getRegistroId(eq);
            try {
              if (eq.equipoId) {
                const planes = await planMantenimientoService.getPlanesByEquipo(eq.equipoId);
                return [key, Array.isArray(planes) ? planes : []];
              }
              if (eq.ubicacionTecnicaId) {
                const planes = await planMantenimientoService.getPlanesByUbicacionTecnica(
                  eq.ubicacionTecnicaId
                );
                return [key, Array.isArray(planes) ? planes : []];
              }
              return [key, []];
            } catch (e) {
              console.error("[OTGrupal] Error cargando planes", key, e);
              return [key, []];
            }
          })
        );
        if (cancelled) return;
        const map = {};
        for (const [id, planes] of entries) map[id] = planes;
        setPlanesPorEquipo(map);
      } finally {
        if (!cancelled) setCargandoPlanes(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [isOpen, esPreventivo, equipos]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const seleccionarPlan = async (equipoIndex, planId) => {
    if (!planId) {
      handleEquipoChange(equipoIndex, "planMantenimientoId", null);
      handleEquipoChange(equipoIndex, "planMantenimiento", null);
      handleEquipoChange(equipoIndex, "actividadesOT", []);
      return;
    }
    try {
      const planSel = await planMantenimientoService.getPlanById(planId);
      const acts = (planSel?.actividades || []).map((a) =>
        mkActOT(
          {
            id: a.id,
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
            duracionEstimadaValor:
              a.duracionEstimadaValor ??
              (a.unidadDuracion === "h"
                ? Number(a.duracionMinutos || 0) / 60
                : Number(a.duracionMinutos || 0)),
            unidadDuracion: a.unidadDuracion || "min",
            duracionEstimadaMin: a.duracionMinutos || a.duracionEstimadaMin || null,
            observaciones: a.observaciones || "",
            estado: "PENDIENTE",
            origen: "PLAN",
          },
          { forceSelected: true, esCorrectivo }
        )
      );
      setEquipos((prev) => {
        const updated = [...prev];
        updated[equipoIndex] = {
          ...updated[equipoIndex],
          planMantenimientoId: planId,
          planMantenimiento: planSel,
          actividadesOT: acts,
        };
        return updated;
      });
    } catch (error) {
      console.error("Error cargando detalles del plan", error);
      alert("Error cargando plan");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleEquipoChange = (index, field, value) => {
    setEquipos((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateActividadOT = (eqIndex, actIndex, field, value) => {
    setEquipos((prev) => {
      const updated = [...prev];
      const acts = [...(updated[eqIndex].actividadesOT || [])];
      acts[actIndex] = { ...acts[actIndex], [field]: value };

      if (field === "duracionEstimadaValor" || field === "unidadDuracion") {
        const unidad = acts[actIndex].unidadDuracion || "min";
        const valor = Number(acts[actIndex].duracionEstimadaValor) || 0;
        acts[actIndex].duracionEstimadaMin =
          unidad === "h" ? Math.round(valor * 60) : Math.round(valor);
      }

      if (field === "cantidadTecnicos") {
        acts[actIndex].cantidadTecnicos = Math.max(1, Number(value) || 1);
      }

      updated[eqIndex] = { ...updated[eqIndex], actividadesOT: acts };
      return updated;
    });
  };

  const addActividadOT = (eqIndex) => {
    if (!esCorrectivo) return;
    setEquipos((prev) => {
      const updated = [...prev];
      updated[eqIndex] = {
        ...updated[eqIndex],
        actividadesOT: [
          ...(updated[eqIndex].actividadesOT || []),
          mkActOT(
            {
              tipoTrabajo: "REPARACION",
              unidadDuracion: "min",
              duracionEstimadaValor: 0,
              rolTecnico: "tecnico_mecanico",
              cantidadTecnicos: 1,
              origen: "MANUAL",
            },
            { forceSelected: true, esCorrectivo: true }
          ),
        ],
      };
      return updated;
    });
  };

  const removeActividadOT = (eqIndex, actIndex) => {
    if (!esCorrectivo) return;
    setEquipos((prev) => {
      const updated = [...prev];
      updated[eqIndex] = {
        ...updated[eqIndex],
        actividadesOT: (updated[eqIndex].actividadesOT || []).filter(
          (_, i) => i !== actIndex
        ),
      };
      return updated;
    });
  };

  const handleUploadAdjuntos = async (files) => {
    try {
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

  const handleUploadAdjuntosEquipo = async (equipoIndex, files) => {
    try {
      setEquipos((prev) => {
        const updated = [...prev];
        updated[equipoIndex] = { ...updated[equipoIndex], subiendoAdjuntos: true };
        return updated;
      });
      const data = await adjuntosService.uploadArchivos(files);
      setEquipos((prev) => {
        const updated = [...prev];
        updated[equipoIndex] = {
          ...updated[equipoIndex],
          adjuntos: [...(updated[equipoIndex].adjuntos || []), ...(data || [])],
          subiendoAdjuntos: false,
        };
        return updated;
      });
    } catch (err) {
      console.error("Error subiendo adjuntos equipo", err);
      setEquipos((prev) => {
        const updated = [...prev];
        updated[equipoIndex] = { ...updated[equipoIndex], subiendoAdjuntos: false };
        return updated;
      });
    }
  };

 const handleGuardarSolicitudesCompraDesdeOT = (result) => {
  setSolicitudesCompraOT(result);
  setShowSolicitudCompraModal(false);
};

  const handleGuardarSolicitudesAlmacenDesdeOT = (result) => {
  setSolicitudesAlmacenOT(result);
  setShowSolicitudAlmacenModal(false);
};



  const handleSubmitInternal = () => {
    const newErrors = validateOTForm({ formData, equipos, esPreventivo, esCorrectivo, esVenta, esInstalacion });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setMostrarConfirmacion(true);
  };

const confirmarGuardado = () => {
  const tratamientoId =
    initialData?.tratamientoId ||
    tratamientoData?.id ||
    tratamientoData?.tratamiento?.id || null;

  if (!tratamientoId && mode === "create") {
    alert("Este aviso no tiene tratamiento cargado.");
    return;
  }

  const otPayload = buildOTPayload({
    numeroOT: numeroOTGenerado,
    formData, aviso, tratamientoId,
    equipos, archivosAdjuntos,
    esPreventivo, mode, initialData,
  });

  onGuardar({
    ...otPayload,
    tipoAviso: aviso?.tipoAviso || null,
    ...(esVenta && formData.encargadoId ? { encargadoId: formData.encargadoId } : {}),
    modo: "GRUPAL",
    solicitudesCompra: solicitudesCompraOT
      ? {
          general: solicitudesCompraOT.solicitudGeneral || null,
          porEquipo: solicitudesCompraOT.solicitudesPorEquipo || {},
        }
      : null,
    solicitudesAlmacen: solicitudesAlmacenOT
      ? {
          general: solicitudesAlmacenOT.solicitudGeneral || null,
          porEquipo: solicitudesAlmacenOT.solicitudesPorEquipo || {},
        }
      : null,
  });
};
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-3">
        <div className="bg-white rounded-3xl shadow-2xl w-[99vw] max-w-[145rem] h-[97vh] flex flex-col border border-slate-200 overflow-hidden">

          {/* ── Header ── */}
          <div className="px-8 py-6 border-b bg-slate-900 shrink-0 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {mode === "edit"
                  ? "Editar Orden de Trabajo Grupal"
                  : "Crear Orden de Trabajo Grupal"}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-slate-300">
                <span className="font-semibold text-white">{numeroOTGenerado}</span>
                <span>•</span>
                <span>
                  Aviso <b className="text-white">{aviso?.numeroAviso || aviso?.id}</b>
                </span>
                {tipoMantenimiento && (
                  <>
                    <span>•</span>
                    <span className="px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800 text-slate-100 font-medium">
                      {tipoMantenimiento}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>{equipos.length} registros</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setMostrarInfoAviso(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl transition border border-white/10 text-white font-medium flex items-center gap-2"
                type="button"
              >
                <FileText className="w-4 h-4" />
                Info del Aviso
              </button>
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-white/10 rounded-xl transition"
                type="button"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <div className="p-8 space-y-6">

              {/* Información general */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-slate-900">
                    <ClipboardCheck className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-900">
                    Información General
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <Label>Supervisor Responsable *</Label>
                    <select
                      name="supervisorId"
                      value={formData.supervisorId}
                      onChange={handleChange}
                      className={inputClass(errors.supervisorId)}
                    >
                      <option value="">Seleccione un supervisor</option>
                      {supervisores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} - {s.empresa}
                        </option>
                      ))}
                    </select>
                    <FieldError message={errors.supervisorId} />
                  </div>

                  {!esVenta && (
                    <div className="md:col-span-2">
                      <Label>Descripción General del Trabajo *</Label>
                      <textarea
                        name="descripcionGeneral"
                        value={formData.descripcionGeneral}
                        onChange={handleChange}
                        rows={3}
                        className={textareaClass(errors.descripcionGeneral)}
                      />
                      <FieldError message={errors.descripcionGeneral} />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <Label>Descripción Detallada</Label>
                    <textarea
                      name="descripcionDetallada"
                      value={formData.descripcionDetallada}
                      onChange={handleChange}
                      rows={3}
                      className={textareaClass()}
                    />
                  </div>

                  <div>
                    <Label>Fecha y Hora de Inicio Total*</Label>
                    <input
                      type="datetime-local"
                      name="fechaProgramadaInicio"
                      value={formData.fechaProgramadaInicio}
                      onChange={handleChange}
                      className={inputClass(errors.fechaProgramadaInicio)}
                    />
                    <FieldError message={errors.fechaProgramadaInicio} />
                  </div>

                  <div>
                    <Label>Fecha y Hora de Fin Total*</Label>
                    <input
                      type="datetime-local"
                      name="fechaProgramadaFin"
                      value={formData.fechaProgramadaFin}
                      onChange={handleChange}
                      className={inputClass(errors.fechaProgramadaFin)}
                    />
                    <FieldError message={errors.fechaProgramadaFin} />
                  </div>
                </div>
              </div>

              {/* Cuadro de venta — debajo de Información General */}
              {esVenta && (
                <div className="bg-orange-50 rounded-2xl p-6 shadow-sm border border-orange-200">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-orange-500">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-slate-900">
                      Tratamiento de Venta
                    </h4>
                  </div>

                  <div className="space-y-4">
                    {/* Descripción editable */}
                    <div>
                      <Label>Descripción del tratamiento *</Label>
                      <textarea
                        name="descripcionGeneral"
                        value={formData.descripcionGeneral}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Descripción del tratamiento de venta..."
                        className={textareaClass(errors.descripcionGeneral)}
                      />
                      <FieldError message={errors.descripcionGeneral} />
                    </div>

                    {/* Encargado */}
                    <div>
                      <Label>Encargado *</Label>
                      <select
                        name="encargadoId"
                        value={formData.encargadoId}
                        onChange={handleChange}
                        className={inputClass(errors.encargadoId)}
                      >
                        <option value="">Seleccione un encargado</option>
                        {trabajadores.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre} - {t.cargo || t.rol || "Técnico"}
                          </option>
                        ))}
                      </select>
                      <FieldError message={errors.encargadoId} />
                    </div>
                  </div>
                </div>
              )}

              {/* Registros (equipos / ubicaciones) */}
              {equipos.map((registro, index) => (
                <OTRegistroCard
                  key={`${getRegistroId(registro)}-${index}`}
                  registro={registro}
                  index={index}
                  planes={planesPorEquipo[getRegistroId(registro)] || []}
                  cargandoPlanes={cargandoPlanes}
                  trabajadores={trabajadores}
                  errors={errors}
                  esPreventivo={esPreventivo}
                  esCorrectivo={esCorrectivo}
                  equiposReferencia={esInstalacion ? equiposAvisoDisplay : []}
                  onOpenDetalleEquipo={setEquipoDetalleModal}
                  onRegistroChange={(field, value) =>
                    handleEquipoChange(index, field, value)
                  }
                  onSeleccionarPlan={(planId) => seleccionarPlan(index, planId)}
                  onUploadAdjuntos={(files) => handleUploadAdjuntosEquipo(index, files)}
                  onRemoveAdjunto={(adjIdx) =>
                    setEquipos((prev) => {
                      const updated = [...prev];
                      updated[index] = {
                        ...updated[index],
                        adjuntos: (updated[index].adjuntos || []).filter(
                          (_, i) => i !== adjIdx
                        ),
                      };
                      return updated;
                    })
                  }
                  onAddActividad={() => addActividadOT(index)}
                  onActividadChange={(actIdx, field, value) =>
                    updateActividadOT(index, actIdx, field, value)
                  }
                  onRemoveActividad={(actIdx) => removeActividadOT(index, actIdx)}
                  onOpenObservacion={(actIdx) =>
                    setModalTexto({
                      eqIndex: index,
                      actIndex: actIdx,
                      campo: "observaciones",
                      titulo: "Observación",
                    })
                  }
                  onOpenDescripcion={(actIdx) =>
                    setModalTexto({
                      eqIndex: index,
                      actIndex: actIdx,
                      campo: "descripcion",
                      titulo: "Descripción",
                    })
                  }
                />
              ))}

              {/* Adjuntos generales */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-700">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-900">
                    Archivos Adjuntos Generales
                  </h4>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleUploadAdjuntos(e.target.files)}
                  className="w-full text-sm file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white file:font-medium hover:file:bg-slate-800 cursor-pointer border border-dashed border-slate-300 rounded-xl p-4"
                />
                {subiendoArchivos && (
                  <div className="mt-4 flex items-center gap-3 text-blue-600 bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium">Subiendo archivos...</p>
                  </div>
                )}
              </div>

              {/* Solicitud de compra */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold text-slate-900">
                    Solicitud de Compra
                  </h4>
                  <button
                    onClick={() => setShowSolicitudCompraModal(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium flex items-center gap-2"
                    type="button"
                    disabled={guardandoSolicitudCompra}
                  >
                    <Edit className="w-4 h-4" />
                    {guardandoSolicitudCompra ? "Guardando..." : "Editar solicitud de compra"}
                  </button>
                </div>
              </div>

              {/* Solicitud de almacén */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold text-slate-900">
                    Solicitud de Almacén
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowSolicitudAlmacenModal(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium flex items-center gap-2"
                    disabled={guardandoSolicitudAlmacen}
                  >
                    <Edit className="w-4 h-4" />
                    {guardandoSolicitudAlmacen ? "Guardando..." : "Editar solicitud de almacén"}
                  </button>
                </div>
              </div>

              {/* Observaciones generales */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <Label>Observaciones Generales</Label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  rows={3}
                  className={textareaClass()}
                />
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-8 py-5 border-t bg-white flex items-center justify-between shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition text-slate-700 font-medium flex items-center gap-2"
              type="button"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
            <button
              onClick={handleSubmitInternal}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium shadow-sm hover:bg-slate-800 transition flex items-center gap-3"
              type="button"
            >
              <CheckCircle2 className="w-5 h-5" />
              {mode === "edit" ? "Guardar cambios" : "Crear Orden de Trabajo"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modales secundarios ── */}
      <ModalInfoAviso
        isOpen={mostrarInfoAviso}
        onClose={() => setMostrarInfoAviso(false)}
        aviso={aviso}
      />

      <ModalDetallesEquipo
        equipoId={equipoDetalleModal}
        isOpen={!!equipoDetalleModal}
        onClose={() => setEquipoDetalleModal(null)}
      />

      <ModalSolicitudCompra
        isOpen={showSolicitudCompraModal}
        onClose={() => setShowSolicitudCompraModal(false)}
        onConfirm={handleGuardarSolicitudesCompraDesdeOT}
        targets={equiposInfo}
        equiposRelacion={aviso?.equiposRelacion || []}
        ubicacionesRelacion={aviso?.ubicacionesRelacion || []}
        equiposInfo={equiposInfo}
        initialValue={solicitudesCompraOT || initialSolicitudesCompra}
      />

      <ModalSolicitudAlmacen
        isOpen={showSolicitudAlmacenModal}
        onClose={() => setShowSolicitudAlmacenModal(false)}
        onConfirm={handleGuardarSolicitudesAlmacenDesdeOT}
        targets={equiposInfo}
        equiposRelacion={aviso?.equiposRelacion || []}
        ubicacionesRelacion={aviso?.ubicacionesRelacion || []}
        equiposInfo={equiposInfo}
        initialValue={solicitudesAlmacenOT || initialSolicitudesAlmacen}
        mostrarDestinatario={true}  
      />

      {/* Modal de texto (observación / descripción de actividad) */}
      {modalTexto && (
        <ModalTextoActividad
          titulo={modalTexto.titulo}
          valor={
            equipos[modalTexto.eqIndex]?.actividadesOT?.[modalTexto.actIndex]?.[
              modalTexto.campo
            ] || ""
          }
          onClose={() => setModalTexto(null)}
          onGuardar={(nuevoValor) => {
            updateActividadOT(
              modalTexto.eqIndex,
              modalTexto.actIndex,
              modalTexto.campo,
              nuevoValor
            );
            setModalTexto(null);
          }}
        />
      )}

      {/* Confirmación de guardado */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {mode === "edit" ? "¿Confirmar cambios?" : "¿Confirmar creación?"}
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              {mode === "edit" ? (
                <>
                  Se actualizará la OT{" "}
                  <span className="font-semibold text-slate-900">{numeroOTGenerado}</span>{" "}
                  para{" "}
                  <span className="font-semibold text-slate-900">{equipos.length}</span>{" "}
                  registros.
                </>
              ) : (
                <>
                  Se creará la OT{" "}
                  <span className="font-semibold text-slate-900">{numeroOTGenerado}</span>{" "}
                  para{" "}
                  <span className="font-semibold text-slate-900">{equipos.length}</span>{" "}
                  registros.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-medium hover:bg-slate-50 transition"
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmarGuardado();
                  setMostrarConfirmacion(false);
                }}
                className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition"
                type="button"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   SUBCOMPONENTES LOCALES
========================================================= */

function ModalTextoActividad({ titulo, valor, onClose, onGuardar }) {
  const [texto, setTexto] = useState(valor);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">{titulo}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5">
          <textarea
            rows={6}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Ingrese ${titulo.toLowerCase()}...`}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-slate-200"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onGuardar(texto)}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {children}
    </label>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
      <AlertCircle className="w-4 h-4" /> {message}
    </p>
  );
}

function inputClass(hasError) {
  return `w-full px-4 py-2.5 border rounded-xl bg-white text-sm text-slate-800 ${
    hasError ? "border-red-400 bg-red-50" : "border-slate-300"
  } focus:outline-none focus:ring-2 focus:ring-slate-200`;
}

function textareaClass(hasError) {
  return `w-full px-4 py-3 border rounded-xl bg-white text-sm text-slate-800 resize-none ${
    hasError ? "border-red-400 bg-red-50" : "border-slate-300"
  } focus:outline-none focus:ring-2 focus:ring-slate-200`;
}