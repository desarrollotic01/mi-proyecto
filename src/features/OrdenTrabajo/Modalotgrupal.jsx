import {
  X,
  FileText,
  Calendar,
  Edit,
  AlertCircle,
  ClipboardCheck,
  Settings,
  Zap,
  Users,
  Wrench,
  Eye,
  Upload,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";

import { getEquiposDisponiblesPorAviso } from "../mantenimiento/services/ordenTrabajoService";
import { getTrabajadores } from "../mantenimiento/services/trabajadoresService";
import { planMantenimientoService } from "../PlanMantenimiento/services/planMantenimientoService";
import { adjuntosService } from "../OrdenTrabajo/services/adjuntosService";
import ModalInfoAviso from "../OrdenTrabajo/modals/ModalInfoAviso";
import ModalDetallesEquipo from "../OrdenTrabajo/modals/ModalDetalleEquipo";
import { getTratamientoByAviso } from "../mantenimiento/services/tratamientoService";
import { updateSolicitudCompra } from "../OrdenTrabajo/services/SolicitudCompraService";
import ModalEditarSolicitudCompra from "../OrdenTrabajo/modals/ModalEditarSolicitudCompra";

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

const ROLES_TECNICOS = [
  { value: "tecnico_electrico", label: "Técnico Eléctrico" },
  { value: "operario_de_mantenimiento", label: "Operario de Mantenimiento" },
  { value: "tecnico_mecanico", label: "Técnico Mecánico" },
  { value: "supervisor", label: "Supervisor" },
];

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

    tipoTrabajo: base.tipoTrabajo || (opts.esCorrectivo ? "REPARACION" : "REVISION"),

    rolTecnico: ROLES_TECNICOS.some((r) => r.value === base.rolTecnico)
      ? base.rolTecnico
      : "tecnico_mecanico",

    cantidadTecnicos:
      Number(base.cantidadTecnicos) > 0 ? Number(base.cantidadTecnicos) : 1,

    duracionEstimadaValor: Number(durVal) || 0,
    unidadDuracion: unidad,
    duracionEstimadaMin: durMin ?? null,

    observaciones: base.observaciones || "",
    estado: base.estado || "PENDIENTE",
    origen: base.origen || "TRATAMIENTO",
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
    rolTecnico: ROLES_TECNICOS.some((r) => r.value === a.rolTecnico)
      ? a.rolTecnico
      : "tecnico_mecanico",
    cantidadTecnicos:
      Number(a.cantidadTecnicos) > 0 ? Number(a.cantidadTecnicos) : 1,

    duracionEstimadaValor: valor,
    unidadDuracion: unidad,
    duracionEstimadaMin: durMin || null,

    observaciones: a.observaciones?.trim() || null,
    estado: a.estado || "PENDIENTE",
    origen: a.origen || "TRATAMIENTO",
  };
};

const getRegistroId = (r) => r.equipoId || r.ubicacionTecnicaId || null;
const esEquipoRegistro = (r) => !!r.equipoId;
const esUbicacionRegistro = (r) => !!r.ubicacionTecnicaId;

const getRegistroNombre = (r) => {
  if (r.equipoId) return r.equipoNombre || `Equipo ${r.equipoId}`;
  return r.ubicacionTecnicaNombre || `Ubicación técnica ${r.ubicacionTecnicaId}`;
};

const getRegistroSubtitulo = (r) => {
  if (r.equipoId) return r.equipoTipo || "Equipo";
  return r.ubicacionTecnicaCodigo || "Ubicación técnica";
};

const getRegistroLabel = (r) => {
  if (r.equipoId) return "Equipo";
  return "Ubicación técnica";
};

const getRolLabel = (value) =>
  ROLES_TECNICOS.find((r) => r.value === value)?.label || value || "—";

/* ───────────────────────────────────────────── */

export default function ModalOTGrupal({
  isOpen,
  onClose,
  aviso,
  onGuardar,
  onGenerarNumeroOT,
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
  const [modalEditarSolicitud, setModalEditarSolicitud] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  const [equipos, setEquipos] = useState([]);
  const [planesPorEquipo, setPlanesPorEquipo] = useState({});
  const [cargandoPlanes, setCargandoPlanes] = useState(false);

  const [errors, setErrors] = useState({});

  const tratamientoAplicadoRef = useRef(false);

  const tipoMantenimiento = aviso?.tipoMantenimiento;
  const esPreventivo = tipoMantenimiento === "Preventivo";
  const esCorrectivo = tipoMantenimiento === "Correctivo";
  const isEditableActividades = esCorrectivo;

  const tratamiento = tratamientoData?.tratamiento || tratamientoData || null;

  const equiposInfo = useMemo(() => {
    return (equipos || []).map((e) => ({
      id: getRegistroId(e),
      nombre: getRegistroNombre(e),
      codigo: getRegistroNombre(e),
      tag: getRegistroSubtitulo(e),
      tipo: esEquipoRegistro(e) ? "EQUIPO" : "UBICACION_TECNICA",
    }));
  }, [equipos]);

  const solicitudesCompraArr = useMemo(() => {
    const arr =
      tratamientoData?.solicitudesCompra ||
      tratamiento?.solicitudesCompra ||
      tratamientoData?.tratamiento?.solicitudesCompra ||
      [];
    return Array.isArray(arr) ? arr : [];
  }, [tratamientoData, tratamiento]);

  const solicitudGeneral = useMemo(() => {
    return solicitudesCompraArr.find((s) => s?.esGeneral === true) || null;
  }, [solicitudesCompraArr]);

  const solicitudesPorEquipo = useMemo(() => {
    const map = {};
    for (const s of solicitudesCompraArr) {
      if (!s || s.esGeneral) continue;
      const key = String(s.equipo_id || s.ubicacion_tecnica_id || "SIN_TARGET");
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [solicitudesCompraArr]);

  const [formData, setFormData] = useState({
    descripcionGeneral: "",
    descripcionDetallada: "",
    supervisorId: "",
    fechaProgramadaInicio: "",
    fechaProgramadaFin: "",
    observaciones: "",
  });

  useEffect(() => {
    if (!isOpen) {
      tratamientoAplicadoRef.current = false;
      setEquipos([]);
      setPlanesPorEquipo({});
      setTratamientoData(null);
      setArchivosAdjuntos([]);
      setErrors({});
      setModalEditarSolicitud(false);
      setSolicitudSeleccionada(null);
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

  useEffect(() => {
    if (!isOpen || !aviso?.id) return;

    getTratamientoByAviso(aviso.id)
      .then((data) => {
        setTratamientoData(data);
      })
      .catch((err) => {
        console.error("[OTGrupal] Error cargando tratamiento:", err);
        setTratamientoData(null);
      });
  }, [isOpen, aviso?.id]);

  useEffect(() => {
    if (!isOpen || !aviso?.id) return;

    const cargarRegistros = async () => {
      try {
        const equiposResp = await getEquiposDisponiblesPorAviso(aviso.id).catch(() => []);

        const equiposIniciales = (equiposResp || []).map((rel) => ({
          equipoId: rel.equipo.id,
          ubicacionTecnicaId: null,

          equipoNombre: rel.equipo.nombre || rel.equipo.codigo,
          equipoTipo:
            rel.equipo.tipoEquipo ||
            rel.equipo.tipo ||
            rel.equipo.tipoEquipoPropiedad ||
            "—",

          ubicacionTecnicaNombre: "",
          ubicacionTecnicaCodigo: "",

          descripcionEquipo: "",
          descripcionUbicacion: "",
          prioridad: "MEDIA",
          estado: "PENDIENTE",

          fechaInicioProgramada: "",
          fechaFinProgramada: "",

          trabajadoresAsignados: [],
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

            trabajadoresAsignados: [],
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
  }, [isOpen, aviso?.id, aviso?.ubicacionesRelacion]);

  useEffect(() => {
    if (!isOpen) return;
    if (!tratamientoData) return;
    if (!equipos.length) return;
    if (tratamientoAplicadoRef.current) return;

    const tratEquipos = Array.isArray(tratamientoData.equipos) ? tratamientoData.equipos : [];
    if (!tratEquipos.length) return;

    tratamientoAplicadoRef.current = true;

    setEquipos((prev) =>
      prev.map((eq) => {
        const te = tratEquipos.find((t) => {
          if (eq.equipoId) {
            return t.equipoId === eq.equipoId || t.equipo?.id === eq.equipoId;
          }

          if (eq.ubicacionTecnicaId) {
            return (
              t.ubicacionTecnicaId === eq.ubicacionTecnicaId ||
              t.ubicacionTecnica?.id === eq.ubicacionTecnicaId
            );
          }

          return false;
        });

        if (!te) return eq;

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
            { forceSelected: true, esCorrectivo }
          )
        );

        const planMantenimientoId = te.planMantenimientoId || null;
        const planMantenimiento = te.planMantenimiento || null;

        return {
          ...eq,
          equipoId: te.equipoId || eq.equipoId || null,
          ubicacionTecnicaId: te.ubicacionTecnicaId || eq.ubicacionTecnicaId || null,

          equipoNombre: te.equipo?.nombre || te.equipo?.codigo || eq.equipoNombre,
          equipoTipo: te.equipo?.tipoEquipo || te.equipo?.tipo || eq.equipoTipo,

          ubicacionTecnicaNombre:
            te.ubicacionTecnica?.nombre || eq.ubicacionTecnicaNombre,
          ubicacionTecnicaCodigo:
            te.ubicacionTecnica?.codigo || eq.ubicacionTecnicaCodigo,

          actividadesOT,
          planMantenimientoId,
          planMantenimiento,

          descripcionEquipo: te.descripcionEquipo || eq.descripcionEquipo || "",
          descripcionUbicacion: te.descripcionEquipo || eq.descripcionUbicacion || "",
        };
      })
    );
  }, [isOpen, tratamientoData, equipos.length, esCorrectivo]);

  useEffect(() => {
    if (!isOpen) return;
    if (!esPreventivo) return;
    if (!equipos.length) return;

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
                const planes = await planMantenimientoService.getPlanesByEquipo(
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

    return () => {
      cancelled = true;
    };
  }, [isOpen, esPreventivo, equipos.length]);

  const seleccionarPlan = async (equipoIndex, planId) => {
    if (!planId) {
      handleEquipoChange(equipoIndex, "planMantenimientoId", null);
      handleEquipoChange(equipoIndex, "planMantenimiento", null);
      handleEquipoChange(equipoIndex, "actividadesOT", []);
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

  const addActividadOT = (eqIndex) => {
    if (!isEditableActividades) return;

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
              origen: "OT",
            },
            { forceSelected: true, esCorrectivo: true }
          ),
        ],
      };
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
        acts[actIndex].duracionEstimadaMin = toMinutes(valor, unidad) || null;
      }

      if (field === "cantidadTecnicos") {
        acts[actIndex].cantidadTecnicos = Math.max(1, Number(value) || 1);
      }

      if (field === "rolTecnico") {
        acts[actIndex].rolTecnico = ROLES_TECNICOS.some((r) => r.value === value)
          ? value
          : "tecnico_mecanico";
      }

      if (esCorrectivo && field === "tipoTrabajo") {
        if (!TIPOS_TRABAJO_CORRECTIVO.includes(value)) {
          acts[actIndex].tipoTrabajo = "REPARACION";
        }
      }

      updated[eqIndex] = { ...updated[eqIndex], actividadesOT: acts };
      return updated;
    });
  };

  const removeActividadOT = (eqIndex, actIndex) => {
    if (!isEditableActividades) return;

    setEquipos((prev) => {
      const updated = [...prev];
      updated[eqIndex] = {
        ...updated[eqIndex],
        actividadesOT: (updated[eqIndex].actividadesOT || []).filter((_, i) => i !== actIndex),
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
        const eq = updated[equipoIndex];
        updated[equipoIndex] = {
          ...eq,
          adjuntos: [...(eq.adjuntos || []), ...(data || [])],
          subiendoAdjuntos: false,
        };
        return updated;
      });
    } catch (err) {
      console.error("Error subiendo adjuntos equipo", err);
      alert("Error subiendo archivos del registro");
      setEquipos((prev) => {
        const updated = [...prev];
        updated[equipoIndex] = { ...updated[equipoIndex], subiendoAdjuntos: false };
        return updated;
      });
    }
  };

  const handleGuardarSolicitud = async (id, data) => {
    try {
      await updateSolicitudCompra(id, data);
      const updated = await getTratamientoByAviso(aviso.id);
      setTratamientoData(updated);
    } catch (error) {
      console.error("Error actualizando solicitud:", error);
      alert("Error al actualizar la solicitud");
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
    if (errors[`equipo_${index}_${field}`]) {
      setErrors((prev) => ({ ...prev, [`equipo_${index}_${field}`]: null }));
    }
  };

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
      if (new Date(formData.fechaProgramadaFin) < new Date(formData.fechaProgramadaInicio)) {
        newErrors.fechaProgramadaFin = "La fecha de fin debe ser posterior a la de inicio";
      }
    }

    equipos.forEach((equipo, index) => {
      const descripcionTrabajo = equipo.equipoId
        ? equipo.descripcionEquipo
        : equipo.descripcionUbicacion;

      if (!descripcionTrabajo?.trim()) {
        newErrors[`equipo_${index}_descripcionEquipo`] =
          "La descripción del trabajo es obligatoria";
      }

      if (esPreventivo && !equipo.planMantenimientoId) {
        newErrors[`equipo_${index}_plan`] = "En preventivo debe seleccionar un plan";
      }

      if (!equipo.trabajadoresAsignados || equipo.trabajadoresAsignados.length === 0) {
        newErrors[`equipo_${index}_trabajadores`] =
          "Debe asignar al menos un trabajador";
      }

      if (!equipo.encargadoId) {
        newErrors[`equipo_${index}_encargado`] = "Debe seleccionar un encargado";
      }

      if (!equipo.fechaInicioProgramada) {
        newErrors[`equipo_${index}_fechaInicioProgramada`] = "Fecha de inicio requerida";
      }

      if (!equipo.fechaFinProgramada) {
        newErrors[`equipo_${index}_fechaFinProgramada`] = "Fecha de fin requerida";
      }

      if (equipo.fechaInicioProgramada && equipo.fechaFinProgramada) {
        if (new Date(equipo.fechaFinProgramada) < new Date(equipo.fechaInicioProgramada)) {
          newErrors[`equipo_${index}_fechaFinProgramada`] =
            "La fecha fin debe ser posterior a inicio";
        }
      }

      const acts = equipo.actividadesOT || [];

      if (esCorrectivo) {
        if (!acts.length) {
          newErrors[`equipo_${index}_acts`] = "Debes agregar al menos 1 actividad";
        } else {
          const selected = acts.filter((a) => a.selected);

          if (selected.length === 0) {
            newErrors[`equipo_${index}_acts`] =
              "Debes dejar al menos 1 actividad seleccionada";
          } else if (selected.some((a) => !a.tarea?.trim())) {
            newErrors[`equipo_${index}_acts`] =
              "Hay actividades seleccionadas sin tarea";
          } else if (
            selected.some(
              (a) => a.tipoTrabajo && !TIPOS_TRABAJO_CORRECTIVO.includes(a.tipoTrabajo)
            )
          ) {
            newErrors[`equipo_${index}_acts`] =
              "En correctivo solo se permite REPARACION o CAMBIO";
          } else if (
            selected.some((a) => !ROLES_TECNICOS.some((r) => r.value === a.rolTecnico))
          ) {
            newErrors[`equipo_${index}_acts`] =
              "Hay actividades con rol técnico inválido";
          } else if (selected.some((a) => Number(a.cantidadTecnicos) <= 0)) {
            newErrors[`equipo_${index}_acts`] =
              "Hay actividades con cantidad de técnicos inválida";
          }
        }
      } else {
        if (equipo.planMantenimientoId && acts.length === 0) {
          newErrors[`equipo_${index}_acts`] = "El plan seleccionado no tiene actividades";
        }

        if (acts.some((a) => !ROLES_TECNICOS.some((r) => r.value === a.rolTecnico))) {
          newErrors[`equipo_${index}_acts`] =
            "Hay actividades con rol técnico inválido";
        }

        if (acts.some((a) => Number(a.cantidadTecnicos) <= 0)) {
          newErrors[`equipo_${index}_acts`] =
            "Hay actividades con cantidad de técnicos inválida";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitInternal = () => {
    if (!validateForm()) return;
    setMostrarConfirmacion(true);
  };

  const confirmarCreacion = () => {
    if (!aviso?.tratamientos || aviso.tratamientos.length === 0) {
      alert("Este aviso no tiene tratamiento.");
      return;
    }

    const tratamientoId = aviso.tratamientos[0].id;

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
      modo: "GRUPAL",

      targets: equipos.map((eq) => ({
        equipoId: eq.equipoId || null,
        ubicacionTecnicaId: eq.ubicacionTecnicaId || null,

        descripcionEquipo: eq.equipoId ? eq.descripcionEquipo.trim() : null,
        descripcionUbicacion: eq.ubicacionTecnicaId
          ? eq.descripcionUbicacion?.trim() || null
          : null,

        prioridad: eq.prioridad,
        planMantenimientoId: eq.planMantenimientoId || null,

        fechaInicioProgramada: new Date(eq.fechaInicioProgramada).toISOString(),
        fechaFinProgramada: new Date(eq.fechaFinProgramada).toISOString(),

        actividades: (eq.actividadesOT || [])
          .filter((a) => (esPreventivo ? true : a.selected))
          .map(normalizeActOTForPayload),

        trabajadores: (eq.trabajadoresAsignados || []).map((id) => ({
          trabajadorId: id,
          esEncargado: id === eq.encargadoId,
        })),

        adjuntos: eq.adjuntos || [],
        observacionesEquipo: eq.observacionesEquipo || null,
      })),

      adjuntos: archivosAdjuntos || [],
    };

    onGuardar(payload);
  };

  const getEstadoBadgeColor = (estado) => {
    const colores = {
      PENDIENTE: "bg-amber-100 text-amber-700 border-amber-300",
      EN_PROCESO: "bg-blue-100 text-blue-700 border-blue-300",
      FINALIZADO: "bg-green-100 text-green-700 border-green-300",
    };
    return colores[estado] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-10">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col border border-slate-200">
          <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 p-9 rounded-t-3xl overflow-hidden">
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="p-9 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                  <Users className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>

                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">
                    Crear Orden de Trabajo Grupal
                  </h3>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-bold">
                        {numeroOTGenerado}
                      </span>

                      <span className="text-blue-200">•</span>

                      <span className="text-blue-200 font-medium">
                        Aviso:{" "}
                        <span className="text-white font-bold">{aviso?.numeroAviso}</span>
                      </span>

                      {tipoMantenimiento && (
                        <>
                          <span className="text-blue-200">•</span>
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

                    <span className="px-3 py-1 bg-cyan-500/30 backdrop-blur-sm border border-cyan-400/40 rounded-full text-cyan-100 text-sm font-bold">
                      {equipos.length} registros
                    </span>
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
                  onClick={onClose}
                  className="p-2.5 hover:bg-white/15 rounded-xl transition-all duration-200"
                  type="button"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="p-8 space-y-6">
              {tipoMantenimiento && (
                <div
                  className={`p-5 rounded-2xl border-l-4 ${
                    esPreventivo ? "bg-green-50 border-green-500" : "bg-orange-50 border-orange-500"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className={`w-6 h-6 mt-0.5 flex-shrink-0 ${
                        esPreventivo ? "text-green-600" : "text-orange-600"
                      }`}
                    />
                    <div>
                      <p className={`font-bold text-lg ${esPreventivo ? "text-green-900" : "text-orange-900"}`}>
                        Mantenimiento {tipoMantenimiento}
                      </p>
                      <p className={`text-sm mt-1 ${esPreventivo ? "text-green-700" : "text-orange-700"}`}>
                        {esPreventivo
                          ? "En preventivo puedes cambiar el plan tanto para equipo como ubicación técnica."
                          : "En correctivo puedes editar/agregar/eliminar actividades para equipo o ubicación técnica."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <ClipboardCheck className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Información General</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Número de Orden de Trabajo
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                      <Zap className="w-5 h-5 text-green-600" />
                      <span className="font-bold text-green-700 text-lg">{numeroOTGenerado}</span>
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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium bg-white ${
                        errors.supervisorId ? "border-red-400 bg-red-50" : "border-slate-300"
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
                        <AlertCircle className="w-4 h-4" /> {errors.supervisorId}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Descripción General del Trabajo <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="descripcionGeneral"
                      value={formData.descripcionGeneral}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe el alcance general..."
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-medium ${
                        errors.descripcionGeneral ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                      }`}
                    />
                    {errors.descripcionGeneral && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4" /> {errors.descripcionGeneral}
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
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-medium bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Periodo de Ejecución General</h4>
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
                        errors.fechaProgramadaInicio ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                      }`}
                    />
                    {errors.fechaProgramadaInicio && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4" /> {errors.fechaProgramadaInicio}
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
                        errors.fechaProgramadaFin ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                      }`}
                    />
                    {errors.fechaProgramadaFin && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4" /> {errors.fechaProgramadaFin}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">
                    Equipos / Ubicaciones Técnicas
                  </h4>
                </div>

                <div className="space-y-4">
                  {equipos.map((equipo, index) => {
                    const planes = planesPorEquipo[getRegistroId(equipo)] || [];
                    const isReadOnlyActividades = false;

                    return (
                      <div
                        key={`${getRegistroId(equipo)}-${index}`}
                        className="relative bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg">
                              {index + 1}
                            </div>
                            <div>
                              <h5 className="text-lg font-bold text-slate-900">
                                {getRegistroNombre(equipo)}
                              </h5>
                              <p className="text-sm text-slate-600 flex items-center gap-2">
                                {esEquipoRegistro(equipo) ? (
                                  <Package className="w-4 h-4" />
                                ) : (
                                  <MapPin className="w-4 h-4" />
                                )}
                                {getRegistroLabel(equipo)} · {getRegistroSubtitulo(equipo)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {esEquipoRegistro(equipo) && (
                              <button
                                onClick={() => setEquipoDetalleModal(equipo.equipoId)}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md"
                                type="button"
                              >
                                <Eye className="w-4 h-4" />
                                Ver Detalles
                              </button>
                            )}

                            <span
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${getEstadoBadgeColor(
                                equipo.estado
                              )}`}
                            >
                              {equipo.estado}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                            <label className="block text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Descripción del Trabajo <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={esEquipoRegistro(equipo) ? equipo.descripcionEquipo : equipo.descripcionUbicacion}
                              onChange={(e) =>
                                handleEquipoChange(
                                  index,
                                  esEquipoRegistro(equipo) ? "descripcionEquipo" : "descripcionUbicacion",
                                  e.target.value
                                )
                              }
                              rows={2}
                              placeholder={`Detalla el trabajo en ${getRegistroNombre(equipo)}...`}
                              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium resize-none ${
                                errors[`equipo_${index}_descripcionEquipo`]
                                  ? "border-red-400 bg-red-50"
                                  : "border-amber-300 bg-white"
                              }`}
                            />
                            {errors[`equipo_${index}_descripcionEquipo`] && (
                              <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                {errors[`equipo_${index}_descripcionEquipo`]}
                              </p>
                            )}
                          </div>

                          <div className="max-w-xs">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Prioridad <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={equipo.prioridad}
                              onChange={(e) => handleEquipoChange(index, "prioridad", e.target.value)}
                              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            >
                              <option value="BAJA">🟢 Baja</option>
                              <option value="MEDIA">🟡 Media</option>
                              <option value="ALTA">🟠 Alta</option>
                              <option value="CRITICA">🔴 Crítica</option>
                            </select>
                          </div>

                          {esPreventivo && (
                            <div className="border-2 rounded-xl p-4 bg-green-50 border-green-200">
                              <label className="text-sm font-bold flex items-center gap-2 text-green-900 mb-3">
                                <Wrench className="w-4 h-4" />
                                Plan de Mantenimiento <span className="text-red-500">*</span>
                              </label>

                              {cargandoPlanes && planes.length === 0 && !equipo.planMantenimientoId ? (
                                <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
                                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                  Cargando planes...
                                </div>
                              ) : null}

                              <select
                                className={`w-full px-4 py-2.5 border-2 rounded-lg bg-white focus:ring-4 transition-all font-medium
                                  border-green-300 focus:ring-green-500/20 focus:border-green-500
                                  ${errors[`equipo_${index}_plan`] ? "border-red-400 bg-red-50" : ""}`}
                                value={equipo.planMantenimientoId || ""}
                                onChange={(e) => seleccionarPlan(index, e.target.value)}
                              >
                                <option value="">— Seleccione un plan —</option>
                                {planes.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {(p.codigoPlan ? `${p.codigoPlan} — ` : "") + (p.nombre || "Plan")}
                                  </option>
                                ))}
                              </select>

                              {planes.length === 0 && (
                                <p className="mt-2 text-xs text-amber-700">
                                  ⚠️ Este registro no tiene planes asociados
                                </p>
                              )}

                              {errors[`equipo_${index}_plan`] && (
                                <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                                  <AlertCircle className="w-3 h-3" /> {errors[`equipo_${index}_plan`]}
                                </p>
                              )}

                              {equipo.planMantenimiento && (
                                <div className="mt-3 bg-white border border-green-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-xs font-semibold text-green-800">Nombre</p>
                                    <p className="font-medium text-slate-900">
                                      {equipo.planMantenimiento.nombre || "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-green-800">Código</p>
                                    <p className="font-medium text-slate-900">
                                      {equipo.planMantenimiento.codigoPlan || "—"}
                                    </p>
                                  </div>
                                  <div className="md:col-span-2">
                                    <p className="text-xs font-semibold text-green-800">Descripción</p>
                                    <p className="font-medium text-slate-900">
                                      {equipo.planMantenimiento.descripcion || "—"}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

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
                                errors[`equipo_${index}_trabajadores`] ? "border-red-400" : "border-slate-200"
                              }`}
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {trabajadores.map((t) => {
                                  const checked = (equipo.trabajadoresAsignados || []).includes(t.id);
                                  return (
                                    <label
                                      key={t.id}
                                      className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                          const current = new Set(equipo.trabajadoresAsignados || []);
                                          if (current.has(t.id)) current.delete(t.id);
                                          else current.add(t.id);

                                          const nuevos = Array.from(current);

                                          let encargadoId = equipo.encargadoId;
                                          if (encargadoId && !current.has(encargadoId)) encargadoId = null;

                                          handleEquipoChange(index, "trabajadoresAsignados", nuevos);
                                          handleEquipoChange(index, "encargadoId", encargadoId);
                                        }}
                                        className="w-4 h-4"
                                      />
                                      <span>
                                        {t.nombre}{" "}
                                        <span className="text-xs text-slate-400">({t.empresa || "—"})</span>
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            {errors[`equipo_${index}_trabajadores`] && (
                              <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                {errors[`equipo_${index}_trabajadores`]}
                              </p>
                            )}

                            <div className="mt-4">
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Encargado <span className="text-red-500">*</span>
                              </label>

                              <select
                                value={equipo.encargadoId || ""}
                                onChange={(e) => handleEquipoChange(index, "encargadoId", e.target.value)}
                                className={`w-full px-4 py-3 border-2 rounded-xl bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${
                                  errors[`equipo_${index}_encargado`] ? "border-red-400 bg-red-50" : "border-slate-300"
                                }`}
                              >
                                <option value="">Seleccione encargado</option>

                                {(equipo.trabajadoresAsignados || []).map((id) => {
                                  const t = trabajadores.find((x) => x.id === id);
                                  if (!t) return null;
                                  return (
                                    <option key={id} value={id}>
                                      {t.nombre} {t.empresa ? `- ${t.empresa}` : ""}
                                    </option>
                                  );
                                })}
                              </select>

                              {errors[`equipo_${index}_encargado`] && (
                                <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                                  <AlertCircle className="w-3 h-3" />
                                  {errors[`equipo_${index}_encargado`]}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                            <p className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-600" />
                              Programación por {esEquipoRegistro(equipo) ? "equipo" : "ubicación técnica"}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                  Inicio programado <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="datetime-local"
                                  value={equipo.fechaInicioProgramada}
                                  onChange={(e) =>
                                    handleEquipoChange(index, "fechaInicioProgramada", e.target.value)
                                  }
                                  className={`w-full px-3 py-2 border-2 rounded-lg text-sm font-medium bg-white ${
                                    errors[`equipo_${index}_fechaInicioProgramada`]
                                      ? "border-red-400 bg-red-50"
                                      : "border-slate-200"
                                  }`}
                                />
                                {errors[`equipo_${index}_fechaInicioProgramada`] && (
                                  <p className="mt-1 text-xs text-red-600">
                                    {errors[`equipo_${index}_fechaInicioProgramada`]}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                  Fin programado <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="datetime-local"
                                  value={equipo.fechaFinProgramada}
                                  onChange={(e) =>
                                    handleEquipoChange(index, "fechaFinProgramada", e.target.value)
                                  }
                                  className={`w-full px-3 py-2 border-2 rounded-lg text-sm font-medium bg-white ${
                                    errors[`equipo_${index}_fechaFinProgramada`]
                                      ? "border-red-400 bg-red-50"
                                      : "border-slate-200"
                                  }`}
                                />
                                {errors[`equipo_${index}_fechaFinProgramada`] && (
                                  <p className="mt-1 text-xs text-red-600">
                                    {errors[`equipo_${index}_fechaFinProgramada`]}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                            <p className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <Upload className="w-4 h-4 text-slate-600" />
                              Adjuntos del {esEquipoRegistro(equipo) ? "equipo" : "registro"}
                            </p>

                            <input
                              type="file"
                              multiple
                              onChange={(e) => handleUploadAdjuntosEquipo(index, e.target.files)}
                              className="w-full text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white file:font-bold hover:file:bg-slate-800 cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-3 hover:border-slate-400 transition-all"
                            />

                            {equipo.subiendoAdjuntos && (
                              <div className="mt-3 flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-xl border border-blue-200">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm font-semibold">Subiendo adjuntos...</p>
                              </div>
                            )}

                            {(equipo.adjuntos || []).length > 0 && (
                              <div className="mt-3 space-y-2">
                                {(equipo.adjuntos || []).map((file, i) => (
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
                                        setEquipos((prev) => {
                                          const updated = [...prev];
                                          const eq = updated[index];
                                          updated[index] = {
                                            ...eq,
                                            adjuntos: (eq.adjuntos || []).filter((_, idx) => idx !== i),
                                          };
                                          return updated;
                                        })
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

                          <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                  <ClipboardCheck className="w-4 h-4 text-slate-600" />
                                  Actividades
                                  {(equipo.actividadesOT || []).length > 0 && (
                                    <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                      {(equipo.actividadesOT || []).length}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {esPreventivo
                                    ? "Preventivo · Puedes cambiar el plan y ajustar duración, rol y técnicos"
                                    : "Correctivo · Editables"}
                                </p>
                              </div>

                              {isEditableActividades && (
                                <button
                                  type="button"
                                  onClick={() => addActividadOT(index)}
                                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all"
                                >
                                  + Agregar
                                </button>
                              )}
                            </div>

                            {errors[`equipo_${index}_acts`] && (
                              <p className="mb-3 text-xs text-red-600 flex items-center gap-1 font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                {errors[`equipo_${index}_acts`]}
                              </p>
                            )}

                            {(equipo.actividadesOT || []).length === 0 ? (
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
                                {(equipo.actividadesOT || []).map((act, actIdx) => (
                                  <div
                                    key={act.id || actIdx}
                                    className={`rounded-xl border-2 p-4 transition-all ${
                                      esPreventivo
                                        ? "bg-green-50 border-green-200"
                                        : "bg-slate-50 border-slate-200"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div>
                                        <p className="text-sm font-bold text-slate-900">
                                          Actividad #{actIdx + 1}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-1">
                                          Rol: {getRolLabel(act.rolTecnico)} · {act.cantidadTecnicos} técnico
                                          {Number(act.cantidadTecnicos) !== 1 ? "s" : ""}
                                        </p>
                                      </div>

                                      {isEditableActividades && (
                                        <button
                                          type="button"
                                          onClick={() => removeActividadOT(index, actIdx)}
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
                                            updateActividadOT(index, actIdx, "selected", e.target.checked)
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
                                          onChange={(e) => updateActividadOT(index, actIdx, "sistema", e.target.value)}
                                          disabled={false}
                                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                          Subsistema
                                        </label>
                                        <input
                                          value={act.subsistema}
                                          onChange={(e) => updateActividadOT(index, actIdx, "subsistema", e.target.value)}
                                          disabled={false}
                                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                          Componente
                                        </label>
                                        <input
                                          value={act.componente}
                                          onChange={(e) => updateActividadOT(index, actIdx, "componente", e.target.value)}
                                          disabled={false}
                                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                          Tarea <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          value={act.tarea}
                                          onChange={(e) => updateActividadOT(index, actIdx, "tarea", e.target.value)}
                                          disabled={false}
                                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white"
                                        />
                                      </div>

                                      <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                          Descripción
                                        </label>
                                        <input
                                          value={act.descripcion}
                                          onChange={(e) => updateActividadOT(index, actIdx, "descripcion", e.target.value)}
                                          disabled={false}
                                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                          Tipo de Trabajo
                                        </label>
                                        <select
                                          value={act.tipoTrabajo}
                                          onChange={(e) =>
                                            updateActividadOT(index, actIdx, "tipoTrabajo", e.target.value)
                                          }
                                          disabled={esPreventivo ? false : false}
                                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white"
                                        >
                                          {(esCorrectivo ? TIPOS_TRABAJO_CORRECTIVO : TIPOS_TRABAJO_ENUM).map((t) => (
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
                                              updateActividadOT(index, actIdx, "duracionEstimadaValor", e.target.value)
                                            }
                                            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white"
                                          />
                                          <select
                                            value={act.unidadDuracion}
                                            onChange={(e) =>
                                              updateActividadOT(index, actIdx, "unidadDuracion", e.target.value)
                                            }
                                            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white"
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
                                        <select
                                          value={act.rolTecnico || "tecnico_mecanico"}
                                          onChange={(e) =>
                                            updateActividadOT(index, actIdx, "rolTecnico", e.target.value)
                                          }
                                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white"
                                        >
                                          {ROLES_TECNICOS.map((rol) => (
                                            <option key={rol.value} value={rol.value}>
                                              {rol.label}
                                            </option>
                                          ))}
                                        </select>
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
                                            updateActividadOT(index, actIdx, "cantidadTecnicos", e.target.value)
                                          }
                                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white"
                                        />
                                      </div>

                                      <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                          Observaciones
                                        </label>
                                        <input
                                          value={act.observaciones}
                                          onChange={(e) =>
                                            updateActividadOT(index, actIdx, "observaciones", e.target.value)
                                          }
                                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium bg-white"
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
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Archivos Adjuntos Generales</h4>
                </div>

                <input
                  type="file"
                  multiple
                  onChange={(e) => handleUploadAdjuntos(e.target.files)}
                  className="w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-blue-600 file:to-cyan-600 file:text-white file:font-bold hover:file:from-blue-700 hover:file:to-cyan-700 cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-blue-400 transition-all"
                />

                {subiendoArchivos && (
                  <div className="mt-4 flex items-center gap-3 text-blue-600 bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-semibold">Subiendo archivos...</p>
                  </div>
                )}

                {archivosAdjuntos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {archivosAdjuntos.map((file, i) => (
                      <div
                        key={file.id || i}
                        className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-slate-800">
                            {file.nombre || file.filename || "Archivo"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setArchivosAdjuntos((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(solicitudGeneral || Object.keys(solicitudesPorEquipo).length > 0) && (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-slate-900">Solicitud de Compra</h4>
                    {solicitudGeneral && (
                      <button
                        onClick={() => {
                          setSolicitudSeleccionada(solicitudGeneral);
                          setModalEditarSolicitud(true);
                        }}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold flex items-center gap-2"
                        type="button"
                      >
                        <Edit className="w-4 h-4" />
                        Editar General
                      </button>
                    )}
                  </div>

                  {solicitudGeneral && (
                    <div className="border border-amber-200 rounded-xl p-4 bg-amber-50 mb-4">
                      <p className="text-sm font-bold text-amber-900 mb-2">General</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-amber-700 font-semibold">Departamento</p>
                          <p className="font-medium text-slate-900">{solicitudGeneral.department || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-amber-700 font-semibold">Fecha requerida</p>
                          <p className="font-medium text-slate-900">{solicitudGeneral.requiredDate || "—"}</p>
                        </div>
                      </div>

                      {(solicitudGeneral.lineas || []).length > 0 && (
                        <div className="mt-3 space-y-2">
                          {(solicitudGeneral.lineas || []).map((l, i) => (
                            <div
                              key={l.id || i}
                              className="flex items-center justify-between bg-white p-3 rounded-xl border border-amber-200"
                            >
                              <span className="text-sm font-medium text-slate-800">
                                {(l.itemCode ? `${l.itemCode} — ` : "") + (l.description || l.item || "Ítem")}
                              </span>
                              <span className="text-xs font-bold text-amber-700">
                                Cant: {l.quantity ?? l.cantidad ?? 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {Object.keys(solicitudesPorEquipo).length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-slate-900">Por registro</p>

                      {Object.entries(solicitudesPorEquipo).map(([equipoId, sols]) => {
                        const equipo = equipos.find(
                          (e) => String(getRegistroId(e)) === String(equipoId)
                        );

                        return (
                          <div key={equipoId} className="border border-slate-200 rounded-xl p-4 bg-white">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-bold text-slate-900 text-sm">
                                {equipo ? getRegistroNombre(equipo) : `Registro ${equipoId}`}
                              </p>
                              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                                {sols.length} solicitud{sols.length !== 1 ? "es" : ""}
                              </span>
                            </div>

                            <div className="space-y-3">
                              {sols.map((sol) => (
                                <div key={sol.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-slate-700">
                                      {sol.department || "—"} · {sol.requiredDate || "—"}
                                    </p>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSolicitudSeleccionada(sol);
                                        setModalEditarSolicitud(true);
                                      }}
                                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                    >
                                      <Edit className="w-3 h-3" />
                                      Editar
                                    </button>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-600">
                                      {sol.estado || "—"}
                                    </span>
                                  </div>

                                  {(sol.lineas || []).length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      {(sol.lineas || []).map((l, i) => (
                                        <div
                                          key={l.id || i}
                                          className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200"
                                        >
                                          <span className="text-sm font-medium text-slate-800">
                                            {(l.itemCode ? `${l.itemCode} — ` : "") + (l.description || l.item || "Ítem")}
                                          </span>
                                          <span className="text-xs font-bold text-amber-700">
                                            Cant: {l.quantity ?? l.cantidad ?? 0}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Observaciones Generales
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-medium bg-white"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t-2 border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-3xl">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-slate-400 rounded-xl hover:bg-white transition-all font-bold text-slate-700 flex items-center gap-2"
              type="button"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>

            <button
              onClick={handleSubmitInternal}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold shadow-xl flex items-center gap-3"
              type="button"
            >
              <CheckCircle2 className="w-5 h-5" />
              Crear Orden de Trabajo
            </button>
          </div>
        </div>
      </div>

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

      <ModalEditarSolicitudCompra
        isOpen={modalEditarSolicitud}
        onClose={() => {
          setModalEditarSolicitud(false);
          setSolicitudSeleccionada(null);
        }}
        solicitudes={solicitudesCompraArr}
        equiposInfo={equiposInfo}
        defaultSolicitudId={solicitudSeleccionada?.id || solicitudGeneral?.id}
        onSave={async (id, payload) => {
          await handleGuardarSolicitud(id, payload);
          setModalEditarSolicitud(false);
          setSolicitudSeleccionada(null);
        }}
      />

      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">¿Confirmar creación?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Se creará la OT <span className="font-bold text-slate-900">{numeroOTGenerado}</span>{" "}
              para <span className="font-bold text-slate-900">{equipos.length}</span> registro
              {equipos.length !== 1 ? "s" : ""}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl font-bold hover:bg-slate-50 transition-all"
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmarCreacion();
                  setMostrarConfirmacion(false);
                }}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all"
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