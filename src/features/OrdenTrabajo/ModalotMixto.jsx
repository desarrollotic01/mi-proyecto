import {
  X,
  FileText,
  Calendar,
  AlertCircle,
  ClipboardCheck,
  Settings,
  Zap,
  Users,
  ChevronRight,
  Wrench,
  Package,
  Clock,
  Eye,
  Upload,
  Trash2,
  CheckCircle2,
  Download,
  Info,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getTratamientoByAviso } from "../mantenimiento/services/tratamientoService";
import { getEquiposDisponiblesPorAviso } from "../mantenimiento/services/ordenTrabajoService";
import { getTrabajadores } from "../mantenimiento/services/trabajadoresService";
import { equipoService } from "../mantenimiento/services/equipoService";
import { planMantenimientoService } from "../PlanMantenimiento/services/planMantenimientoService";
import { adjuntosService } from "../OrdenTrabajo/services/adjuntosService";

/* =========================================================
   Helpers UI/Utils
========================================================= */
const safeText = (v) => (v ?? "").toString();
const fmtDateTime = (v) => {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return safeText(v);
    return d.toLocaleString("es-PE");
  } catch {
    return safeText(v);
  }
};

const normalizeIso = (dtLocal) => {
  // dtLocal viene de <input type="datetime-local" />
  // new Date(dtLocal) interpreta como local y produce ISO UTC: OK para backend si esperas ISO.
  if (!dtLocal) return null;
  const d = new Date(dtLocal);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `uid_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const emptyActividadManual = () => ({
  _uid: uid(),
  origen: "MANUAL", // MANUAL | TRATAMIENTO | PLAN
  componente: "",
  tarea: "",
  tipoTrabajo: "",
  duracionEstimadaMin: 0,
  estado: "PENDIENTE",
  observaciones: "",
});

/* =========================================================
   Sub-modals (inline)
========================================================= */
function ModalBase({ open, onClose, title, icon: Icon, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl border border-white/20">
              {Icon ? <Icon className="w-5 h-5 text-white" /> : null}
            </div>
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-50">{children}</div>

        {footer ? <div className="p-5 bg-white border-t border-slate-200">{footer}</div> : null}
      </div>
    </div>
  );
}

function ModalInfoAvisoInline({ open, onClose, aviso, tratamientoData, cargando }) {
  return (
    <ModalBase
      open={open}
      onClose={onClose}
      title="Información del Aviso y Tratamiento"
      icon={Info}
      footer={
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
        >
          Cerrar
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500">AVISO</p>
          <p className="text-lg font-extrabold text-slate-900 mt-1">
            {aviso?.numeroAviso || "—"}
          </p>
          <p className="text-sm text-slate-700 mt-2">
            <span className="font-semibold">Descripción:</span>{" "}
            {aviso?.descripcion || "—"}
          </p>
          <p className="text-sm text-slate-700 mt-2">
            <span className="font-semibold">Fecha sugerida:</span>{" "}
            {fmtDateTime(aviso?.fechaSugerida)}
          </p>
          <p className="text-sm text-slate-700 mt-1">
            <span className="font-semibold">Fecha sugerida fin:</span>{" "}
            {fmtDateTime(aviso?.fechaSugeridaFin)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500">TRATAMIENTO</p>
          {cargando ? (
            <div className="mt-3 flex items-center gap-2 text-slate-700">
              <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold">Cargando tratamiento...</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-700 mt-2">
                <span className="font-semibold">ID:</span> {tratamientoData?.id || "—"}
              </p>
              <p className="text-sm text-slate-700 mt-1">
                <span className="font-semibold">Tipo:</span>{" "}
                {tratamientoData?.tipo || tratamientoData?.tipoTratamiento || "—"}
              </p>

              <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-600">
                  Actividades detectadas (si aplica)
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  {Array.isArray(tratamientoData?.actividades)
                    ? tratamientoData.actividades.length
                    : Array.isArray(tratamientoData?.detalleActividades)
                      ? tratamientoData.detalleActividades.length
                      : 0}{" "}
                  actividades
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  * Si tu backend maneja actividades por equipo, este modal las mostrará cuando existan.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-4">
        <p className="text-sm font-extrabold text-slate-900">Vista rápida</p>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Prioridad aviso:</span>{" "}
            {aviso?.prioridad || "—"}
          </p>
          <p>
            <span className="font-semibold">Estado aviso:</span>{" "}
            {aviso?.estado || "—"}
          </p>
          <p>
            <span className="font-semibold">Ubicación:</span>{" "}
            {aviso?.ubicacion || aviso?.ubicacionTecnica?.nombre || "—"}
          </p>
        </div>
      </div>
    </ModalBase>
  );
}

function ModalDetalleEquipoInline({ open, onClose, equipo, cargando }) {
  return (
    <ModalBase
      open={open}
      onClose={onClose}
      title="Detalles del Equipo"
      icon={Settings}
      footer={
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
        >
          Cerrar
        </button>
      }
    >
      {cargando ? (
        <div className="flex items-center gap-2 text-slate-700">
          <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Cargando detalles...</span>
        </div>
      ) : !equipo ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-sm text-slate-700">No se encontró información del equipo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-500">NOMBRE</p>
            <p className="text-lg font-extrabold text-slate-900 mt-1">
              {equipo?.nombre || equipo?.codigo || "—"}
            </p>
            <p className="text-sm text-slate-700 mt-2">
              <span className="font-semibold">Código:</span> {equipo?.codigo || "—"}
            </p>
            <p className="text-sm text-slate-700 mt-1">
              <span className="font-semibold">Tipo:</span> {equipo?.tipo || "—"}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-500">UBICACIÓN</p>
            <p className="text-sm text-slate-700 mt-2">
              <span className="font-semibold">Área:</span>{" "}
              {equipo?.area || equipo?.ubicacion || equipo?.ubicacionTecnica?.nombre || "—"}
            </p>
            <p className="text-sm text-slate-700 mt-1">
              <span className="font-semibold">Serie:</span> {equipo?.serie || "—"}
            </p>
            <p className="text-sm text-slate-700 mt-1">
              <span className="font-semibold">Marca/Modelo:</span>{" "}
              {`${equipo?.marca || "—"} / ${equipo?.modelo || "—"}`}
            </p>
          </div>

          <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-500">DESCRIPCIÓN</p>
            <p className="text-sm text-slate-700 mt-2">
              {equipo?.descripcion || "—"}
            </p>
          </div>
        </div>
      )}
    </ModalBase>
  );
}

/* =========================================================
   Main Component
========================================================= */
export default function ModalOTMixto({
  isOpen,
  onClose,
  aviso,
  onGuardar,
  onGenerarNumeroOT,
}) {
  const [numeroOTGenerado, setNumeroOTGenerado] = useState("");
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // Info aviso/tratamiento
  const [mostrarInfoAviso, setMostrarInfoAviso] = useState(false);
  const [tratamientoData, setTratamientoData] = useState(null);
  const [cargandoTratamiento, setCargandoTratamiento] = useState(false);

  // Adjuntos generales
  const [archivosAdjuntos, setArchivosAdjuntos] = useState([]);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);

  // Trabajadores/supervisores
  const [trabajadores, setTrabajadores] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [cargandoTrabajadores, setCargandoTrabajadores] = useState(false);

  // Detalle equipo modal
  const [equipoDetalleModal, setEquipoDetalleModal] = useState(null);
  const [equipoDetalleData, setEquipoDetalleData] = useState(null);
  const [cargandoEquipoDetalle, setCargandoEquipoDetalle] = useState(false);

  // Planes
  const [planesDisponibles, setPlanesDisponibles] = useState([]);
  const [equipoPlanIndex, setEquipoPlanIndex] = useState(null);
  const [cargandoPlanes, setCargandoPlanes] = useState(false);

  // Selección equipos
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [mostrarSeleccion, setMostrarSeleccion] = useState(true);

  // Equipos ya configurados
  const [equipos, setEquipos] = useState([]);
  const [errors, setErrors] = useState({});

  // Form general
  const [formData, setFormData] = useState({
    descripcionGeneral: "",
    descripcionDetallada: "",
    supervisorId: "",
    fechaProgramadaInicio: "",
    fechaProgramadaFin: "",
    observaciones: "",
  });

  const tiposActividad = useMemo(
    () => [
      "Mantenimiento Preventivo",
      "Mantenimiento Correctivo",
      "Inspección",
      "Reparación",
      "Instalación",
      "Calibración",
      "Otro",
    ],
    []
  );

  const getEstadoBadgeColor = (estado) => {
    const colores = {
      PENDIENTE: "bg-amber-100 text-amber-700 border-amber-300",
      EN_PROCESO: "bg-blue-100 text-blue-700 border-blue-300",
      FINALIZADO: "bg-green-100 text-green-700 border-green-300",
    };
    return colores[estado] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const equiposSeleccionadosCount = useMemo(
    () => equiposDisponibles.filter((eq) => eq.seleccionado).length,
    [equiposDisponibles]
  );

  /* =========================================================
     Load data on open
  ========================================================= */

  // Generar número OT + prefills
  useEffect(() => {
    if (!isOpen || !aviso) return;

    const numeroGenerado = onGenerarNumeroOT
      ? onGenerarNumeroOT()
      : `OT-${Date.now().toString().slice(-6)}`;
    setNumeroOTGenerado(numeroGenerado);

    setFormData((prev) => ({
      ...prev,
      descripcionGeneral: aviso.descripcion || "",
      fechaProgramadaInicio: aviso.fechaSugerida || "",
      fechaProgramadaFin: aviso.fechaSugeridaFin || "",
    }));
  }, [isOpen, aviso, onGenerarNumeroOT]);

  // Cargar trabajadores y supervisores
  useEffect(() => {
    if (!isOpen) return;

    setCargandoTrabajadores(true);

    Promise.all([
      getTrabajadores().then((data) => {
        const trabajadoresNoSupervisores = (data || []).filter(
          (t) => t.rol !== "supervisor"
        );
        setTrabajadores(trabajadoresNoSupervisores);
      }),
      getTrabajadores("supervisor").then((data) => {
        setSupervisores(data || []);
      }),
    ])
      .catch((err) => {
        console.error("Error cargando trabajadores:", err);
      })
      .finally(() => {
        setCargandoTrabajadores(false);
      });
  }, [isOpen]);

  // Cargar equipos disponibles
  useEffect(() => {
    if (!isOpen || !aviso?.id) return;

    getEquiposDisponiblesPorAviso(aviso.id)
      .then((data) => {
        const equiposFormateados = (data || []).map((rel) => ({
          id: rel?.equipo?.id,
          nombre: rel?.equipo?.nombre || rel?.equipo?.codigo || "Equipo",
          tipo: rel?.equipo?.tipo || "—",
          codigo: rel?.equipo?.codigo || "—",
          seleccionado: false,
        }));
        setEquiposDisponibles(equiposFormateados);
      })
      .catch((err) => {
        console.error("Error cargando equipos disponibles", err);
      });
  }, [isOpen, aviso?.id]);

  // Cargar tratamiento en background (para poder autollenar actividades si existe)
  useEffect(() => {
    if (!isOpen || !aviso?.id) return;

    setCargandoTratamiento(true);
    setTratamientoData(null);

    getTratamientoByAviso(aviso.id)
      .then((data) => setTratamientoData(data))
      .catch((err) => {
        console.error("Error al cargar tratamiento:", err);
      })
      .finally(() => setCargandoTratamiento(false));
  }, [isOpen, aviso?.id]);

  // Reset al cerrar
  useEffect(() => {
    if (isOpen) return;
    setMostrarSeleccion(true);
    setEquipos([]);
    setEquiposDisponibles([]);
    setPlanesDisponibles([]);
    setEquipoPlanIndex(null);
    setArchivosAdjuntos([]);
    setErrors({});
    setMostrarConfirmacion(false);
    setMostrarInfoAviso(false);
    setEquipoDetalleModal(null);
    setEquipoDetalleData(null);
    setFormData({
      descripcionGeneral: "",
      descripcionDetallada: "",
      supervisorId: "",
      fechaProgramadaInicio: "",
      fechaProgramadaFin: "",
      observaciones: "",
    });
  }, [isOpen]);

  /* =========================================================
     Adjuntos
  ========================================================= */
  const handleUploadAdjuntos = async (files) => {
    try {
      if (!files || files.length === 0) return;
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

  const handleUploadAdjuntosEquipo = async (files, indexEquipo) => {
    try {
      if (!files || files.length === 0) return;
      handleEquipoChange(indexEquipo, "subiendoAdjuntos", true);
      const data = await adjuntosService.uploadArchivos(files);
      setEquipos((prev) => {
        const nuevos = [...prev];
        nuevos[indexEquipo] = {
          ...nuevos[indexEquipo],
          adjuntos: [...(nuevos[indexEquipo].adjuntos || []), ...(data || [])],
        };
        return nuevos;
      });
    } catch (err) {
      console.error("Error subiendo adjuntos equipo", err);
      alert("Error subiendo archivos del equipo");
    } finally {
      handleEquipoChange(indexEquipo, "subiendoAdjuntos", false);
    }
  };

  /* =========================================================
     Selección equipos
  ========================================================= */
  const toggleEquipoSeleccion = (equipoId) => {
    setEquiposDisponibles((prev) =>
      prev.map((eq) =>
        eq.id === equipoId ? { ...eq, seleccionado: !eq.seleccionado } : eq
      )
    );
  };

  const seleccionarTodos = () => {
    setEquiposDisponibles((prev) => prev.map((eq) => ({ ...eq, seleccionado: true })));
  };

  const deseleccionarTodos = () => {
    setEquiposDisponibles((prev) =>
      prev.map((eq) => ({ ...eq, seleccionado: false }))
    );
  };

  // Intento robusto: tomar actividades desde tratamiento si existe.
  // Soporta varios posibles shapes del backend sin romper.
  const getActividadesDesdeTratamientoParaEquipo = (equipoId) => {
    const t = tratamientoData;
    if (!t) return [];

    // Caso A: tratamientoData.actividades[] con equipoId
    if (Array.isArray(t.actividades)) {
      return t.actividades
        .filter((a) => a?.equipoId === equipoId || a?.equipo_id === equipoId)
        .map((a) => ({
          _uid: uid(),
          origen: "TRATAMIENTO",
          planMantenimientoActividadId: a?.planMantenimientoActividadId || a?.plan_mantenimiento_actividad_id || null,
          componente: a?.componente || a?.actividad?.componente || "",
          tarea: a?.tarea || a?.actividad?.tarea || a?.descripcion || "",
          tipoTrabajo: a?.tipoTrabajo || a?.tipo_trabajo || "",
          duracionEstimadaMin: a?.duracionEstimadaMin ?? a?.duracionMinutos ?? 0,
          estado: a?.estado || "PENDIENTE",
          observaciones: a?.observaciones || "",
        }));
    }

    // Caso B: tratamientoData.detalleActividades[]
    if (Array.isArray(t.detalleActividades)) {
      return t.detalleActividades
        .filter((a) => a?.equipoId === equipoId || a?.equipo_id === equipoId)
        .map((a) => ({
          _uid: uid(),
          origen: "TRATAMIENTO",
          planMantenimientoActividadId: a?.planMantenimientoActividadId || null,
          componente: a?.componente || "",
          tarea: a?.tarea || a?.descripcion || "",
          tipoTrabajo: a?.tipoTrabajo || "",
          duracionEstimadaMin: a?.duracionEstimadaMin ?? 0,
          estado: a?.estado || "PENDIENTE",
          observaciones: a?.observaciones || "",
        }));
    }

    // Caso C: tratamientoData.equipos[] cada uno con actividades
    if (Array.isArray(t.equipos)) {
      const eq = t.equipos.find(
        (x) => x?.equipoId === equipoId || x?.equipo_id === equipoId || x?.id === equipoId
      );
      const acts = eq?.actividades || eq?.detalleActividades || [];
      if (Array.isArray(acts)) {
        return acts.map((a) => ({
          _uid: uid(),
          origen: "TRATAMIENTO",
          planMantenimientoActividadId: a?.planMantenimientoActividadId || null,
          componente: a?.componente || "",
          tarea: a?.tarea || a?.descripcion || "",
          tipoTrabajo: a?.tipoTrabajo || "",
          duracionEstimadaMin: a?.duracionEstimadaMin ?? 0,
          estado: a?.estado || "PENDIENTE",
          observaciones: a?.observaciones || "",
        }));
      }
    }

    return [];
  };

  const confirmarSeleccion = () => {
    const seleccionados = equiposDisponibles.filter((eq) => eq.seleccionado);

    if (seleccionados.length === 0) {
      alert("Debe seleccionar al menos un equipo");
      return;
    }

    const equiposIniciales = seleccionados.map((eq) => {
      const actividadesTrat = getActividadesDesdeTratamientoParaEquipo(eq.id);

      return {
        equipoId: eq.id,
        equipoNombre: eq.nombre,
        equipoTipo: eq.tipo,
        descripcionEquipo: "",
        tipoActividad: "Mantenimiento Preventivo",
        prioridad: "MEDIA",
        estado: "PENDIENTE",
        fechaInicioProgramada: formData.fechaProgramadaInicio || "",
        fechaFinProgramada: formData.fechaProgramadaFin || "",
        trabajadoresAsignados: [],
        encargadoId: null,

        planMantenimientoId: null,
        planMantenimiento: null,

        // ✅ MIXTO:
        actividadesTratamiento: actividadesTrat, // desde tratamiento (si existe)
        actividadesPlan: [], // desde plan
        actividadesManual: [], // agregadas por usuario

        adjuntos: [],
        subiendoAdjuntos: false,
      };
    });

    setEquipos(equiposIniciales);
    setMostrarSeleccion(false);
  };

  const volverASeleccion = () => {
    setMostrarSeleccion(true);
    setEquipos([]);
    setErrors({});
  };

  /* =========================================================
     Planes / Detalle equipo
  ========================================================= */
  const cargarPlanesEquipo = async (equipoId, indexEquipo) => {
    try {
      setCargandoPlanes(true);
      const planes = await planMantenimientoService.getPlanesByEquipo(equipoId);
      setPlanesDisponibles(planes || []);
      setEquipoPlanIndex(indexEquipo);
    } catch (error) {
      console.error("Error cargando planes del equipo", error);
      alert("Error cargando planes del equipo");
    } finally {
      setCargandoPlanes(false);
    }
  };

  const handleVerDetallesEquipo = async (equipoId) => {
    setEquipoDetalleModal(equipoId);
    setCargandoEquipoDetalle(true);

    try {
      const list = await equipoService.getEquipos();
      const equipo = (list || []).find((e) => e.id === equipoId);
      setEquipoDetalleData(equipo || null);
    } catch (err) {
      console.error("Error cargando detalles del equipo:", err);
      setEquipoDetalleData(null);
    } finally {
      setCargandoEquipoDetalle(false);
    }
  };

  /* =========================================================
     Form handlers + validation
  ========================================================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleEquipoChange = (index, field, value) => {
    setEquipos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });

    const k = `equipo_${index}_${field}`;
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: null }));
  };

  const toggleTrabajador = (indexEquipo, trabajadorId, checked) => {
    setEquipos((prev) => {
      const next = [...prev];
      const eq = { ...next[indexEquipo] };
      const asignados = new Set(eq.trabajadoresAsignados || []);

      if (checked) asignados.add(trabajadorId);
      else {
        asignados.delete(trabajadorId);
        if (eq.encargadoId === trabajadorId) eq.encargadoId = null;
      }

      eq.trabajadoresAsignados = Array.from(asignados);
      next[indexEquipo] = eq;
      return next;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!safeText(formData.descripcionGeneral).trim()) {
      newErrors.descripcionGeneral = "La descripción general es requerida";
    }
    if (!formData.supervisorId) {
      newErrors.supervisorId = "El supervisor es requerido";
    }
    if (!formData.fechaProgramadaInicio) {
      newErrors.fechaProgramadaInicio = "La fecha de inicio programada es requerida";
    }
    if (!formData.fechaProgramadaFin) {
      newErrors.fechaProgramadaFin = "La fecha de fin programada es requerida";
    }
    if (formData.fechaProgramadaInicio && formData.fechaProgramadaFin) {
      if (new Date(formData.fechaProgramadaFin) < new Date(formData.fechaProgramadaInicio)) {
        newErrors.fechaProgramadaFin = "La fecha de fin debe ser posterior a la de inicio";
      }
    }

    equipos.forEach((equipo, index) => {
      if (!safeText(equipo.descripcionEquipo).trim()) {
        newErrors[`equipo_${index}_descripcionEquipo`] = "La descripción del trabajo es obligatoria";
      }

      if (!equipo.trabajadoresAsignados || equipo.trabajadoresAsignados.length === 0) {
        newErrors[`equipo_${index}_trabajadores`] = "Debe asignar al menos un trabajador";
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
          newErrors[`equipo_${index}_fechaFinProgramada`] = "La fecha fin debe ser posterior a inicio";
        }
      }

      if (equipo.tipoActividad === "Otro" && !safeText(equipo.tipoActividadPersonalizada).trim()) {
        newErrors[`equipo_${index}_tipoActividadPersonalizada`] = "Especifica el tipo de actividad";
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
    // ✅ Preferimos tratamientoData (porque aviso.tratamientos a veces no viene completo en front)
    const tratamientoId =
      tratamientoData?.id ||
      aviso?.tratamientos?.[0]?.id ||
      aviso?.tratamientoId ||
      null;

    if (!tratamientoId) {
      alert("Este aviso no tiene tratamiento (no se encontró tratamientoId).");
      return;
    }

    const payload = {
      numeroOT: numeroOTGenerado,
      descripcionGeneral: safeText(formData.descripcionGeneral).trim(),
      descripcionDetallada: safeText(formData.descripcionDetallada).trim() || null,
      avisoId: aviso?.id,
      tratamientoId,
      supervisorId: formData.supervisorId,

      fechaProgramadaInicio: normalizeIso(formData.fechaProgramadaInicio),
      fechaProgramadaFin: normalizeIso(formData.fechaProgramadaFin),

      observaciones: safeText(formData.observaciones).trim() || null,

      equipos: equipos.map((eq) => {
        // ✅ MIXTO: unimos actividades (tratamiento + plan + manual)
        const actsTrat = Array.isArray(eq.actividadesTratamiento) ? eq.actividadesTratamiento : [];
        const actsPlan = Array.isArray(eq.actividadesPlan) ? eq.actividadesPlan : [];
        const actsManual = Array.isArray(eq.actividadesManual) ? eq.actividadesManual : [];

        const actividades = [...actsTrat, ...actsPlan, ...actsManual].map((a) => ({
          // backend puede necesitar diferentes keys; mantenemos lo más estándar:
          planMantenimientoActividadId: a.planMantenimientoActividadId || null,
          componente: safeText(a.componente).trim() || null,
          tarea: safeText(a.tarea).trim() || null,
          tipoTrabajo: safeText(a.tipoTrabajo).trim() || null,
          duracionEstimadaMin: Number(a.duracionEstimadaMin) || 0,
          estado: a.estado || "PENDIENTE",
          observaciones: safeText(a.observaciones).trim() || null,
          origen: a.origen || "MANUAL",
        }));

        return {
          equipoId: eq.equipoId,
          descripcionEquipo: safeText(eq.descripcionEquipo).trim(),
          tipoActividad:
            eq.tipoActividad === "Otro"
              ? safeText(eq.tipoActividadPersonalizada).trim()
              : eq.tipoActividad,

          prioridad: eq.prioridad,
          planMantenimientoId: eq.planMantenimientoId || null,

          actividades,

          fechaInicioProgramada: normalizeIso(eq.fechaInicioProgramada),
          fechaFinProgramada: normalizeIso(eq.fechaFinProgramada),

          trabajadores: (eq.trabajadoresAsignados || []).map((id) => ({
            trabajadorId: id,
            esEncargado: String(id) === String(eq.encargadoId),
          })),

          adjuntos: eq.adjuntos || [],
        };
      }),

      adjuntos: archivosAdjuntos || [],
    };

    onGuardar?.(payload);
  };

  /* =========================================================
     Activities UI helpers (Mixto)
  ========================================================= */
  const addManualActividad = (indexEquipo) => {
    setEquipos((prev) => {
      const next = [...prev];
      const eq = { ...next[indexEquipo] };
      eq.actividadesManual = [...(eq.actividadesManual || []), emptyActividadManual()];
      next[indexEquipo] = eq;
      return next;
    });
  };

  const removeActividad = (indexEquipo, origen, uidToRemove) => {
    const key =
      origen === "TRATAMIENTO"
        ? "actividadesTratamiento"
        : origen === "PLAN"
          ? "actividadesPlan"
          : "actividadesManual";

    setEquipos((prev) => {
      const next = [...prev];
      const eq = { ...next[indexEquipo] };
      eq[key] = (eq[key] || []).filter((a) => a._uid !== uidToRemove);
      next[indexEquipo] = eq;
      return next;
    });
  };

  const updateActividad = (indexEquipo, origen, actUid, field, value) => {
    const key =
      origen === "TRATAMIENTO"
        ? "actividadesTratamiento"
        : origen === "PLAN"
          ? "actividadesPlan"
          : "actividadesManual";

    setEquipos((prev) => {
      const next = [...prev];
      const eq = { ...next[indexEquipo] };
      eq[key] = (eq[key] || []).map((a) =>
        a._uid === actUid ? { ...a, [field]: value } : a
      );
      next[indexEquipo] = eq;
      return next;
    });
  };

  /* =========================================================
     Render guard
  ========================================================= */
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col border border-slate-200">
          {/* HEADER */}
          <div className="relative bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 p-8 rounded-t-3xl overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%),radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.20),transparent_55%)]" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                  <Package className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">
                    Crear Orden de Trabajo Mixta
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-bold">
                        {numeroOTGenerado}
                      </span>
                      <span className="text-orange-200">•</span>
                      <span className="text-orange-200 font-medium">
                        Aviso:{" "}
                        <span className="text-white font-bold">
                          {aviso?.numeroAviso || "—"}
                        </span>
                      </span>
                    </div>
                    {!mostrarSeleccion && (
                      <span className="px-3 py-1 bg-amber-500/30 backdrop-blur-sm border border-amber-400/40 rounded-full text-amber-100 text-sm font-bold">
                        {equipos.length} equipos seleccionados
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!mostrarSeleccion && (
                  <button
                    onClick={volverASeleccion}
                    className="px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl transition-all duration-200 flex items-center gap-2 text-white font-semibold border border-white/30 hover:border-white/50"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                    Cambiar Selección
                  </button>
                )}

                <button
                  onClick={() => setMostrarInfoAviso(true)}
                  className="px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl transition-all duration-200 flex items-center gap-2 text-white font-semibold border border-white/30 hover:border-white/50"
                >
                  <FileText className="w-5 h-5" />
                  Info del Aviso
                </button>

                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-white/15 rounded-xl transition-all duration-200"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-orange-50">
            <div className="p-8 space-y-6">
              {mostrarSeleccion ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Selecciona los Equipos</h3>
                        <p className="text-orange-100">
                          Elige los equipos que deseas incluir en esta orden de trabajo
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold">{equiposSeleccionadosCount}</div>
                        <div className="text-sm text-orange-100">
                          de {equiposDisponibles.length} seleccionados
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={seleccionarTodos}
                        className="flex-1 px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all font-bold border border-white/30"
                      >
                        ✓ Seleccionar Todos
                      </button>
                      <button
                        onClick={deseleccionarTodos}
                        className="flex-1 px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all font-bold border border-white/30"
                      >
                        ✗ Deseleccionar Todos
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {equiposDisponibles.map((equipo) => (
                      <div
                        key={equipo.id}
                        onClick={() => toggleEquipoSeleccion(equipo.id)}
                        className={`relative bg-white rounded-2xl p-5 border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                          equipo.seleccionado
                            ? "border-orange-500 shadow-xl shadow-orange-500/20 bg-gradient-to-br from-orange-50 to-amber-50"
                            : "border-slate-200 hover:border-orange-300 shadow-md hover:shadow-lg"
                        }`}
                      >
                        <div className="absolute top-4 right-4">
                          <div
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                              equipo.seleccionado
                                ? "bg-orange-500 border-orange-500"
                                : "bg-white border-slate-300"
                            }`}
                          >
                            {equipo.seleccionado && (
                              <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={3} />
                            )}
                          </div>
                        </div>

                        <div className="pr-10">
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={`p-3 rounded-xl ${
                                equipo.seleccionado
                                  ? "bg-orange-500 text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <Settings className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <h4
                                className={`font-bold text-lg ${
                                  equipo.seleccionado ? "text-orange-900" : "text-slate-900"
                                }`}
                              >
                                {equipo.nombre}
                              </h4>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span
                                className={`font-semibold ${
                                  equipo.seleccionado ? "text-orange-700" : "text-slate-600"
                                }`}
                              >
                                Tipo:
                              </span>
                              <span
                                className={`${
                                  equipo.seleccionado ? "text-orange-900" : "text-slate-900"
                                }`}
                              >
                                {equipo.tipo}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span
                                className={`font-semibold ${
                                  equipo.seleccionado ? "text-orange-700" : "text-slate-600"
                                }`}
                              >
                                Código:
                              </span>
                              <span
                                className={`font-mono text-xs ${
                                  equipo.seleccionado ? "text-orange-900" : "text-slate-700"
                                }`}
                              >
                                {equipo.codigo}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center pt-4">
                    <button
                      onClick={confirmarSeleccion}
                      disabled={equiposSeleccionadosCount === 0}
                      className="px-10 py-4 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white rounded-2xl hover:from-orange-700 hover:via-amber-700 hover:to-orange-800 transition-all font-bold shadow-2xl shadow-orange-500/40 flex items-center gap-3 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                    >
                      <ChevronRight className="w-6 h-6" />
                      Continuar con {equiposSeleccionadosCount}{" "}
                      {equiposSeleccionadosCount === 1 ? "equipo" : "equipos"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* INFO GENERAL */}
                  <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
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
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium bg-white ${
                            errors.supervisorId ? "border-red-400 bg-red-50" : "border-slate-300"
                          }`}
                        >
                          <option value="">Seleccione un supervisor</option>
                          {supervisores.map((supervisor) => (
                            <option key={supervisor.id} value={supervisor.id}>
                              {supervisor.nombre} - {supervisor.empresa}
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
                          Descripción General del Trabajo <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="descripcionGeneral"
                          value={formData.descripcionGeneral}
                          onChange={handleChange}
                          rows={3}
                          placeholder="Describe el alcance general de la orden de trabajo..."
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none font-medium ${
                            errors.descripcionGeneral ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
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
                          placeholder="Procedimientos específicos, consideraciones de seguridad, recursos necesarios..."
                          className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none font-medium bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* FECHAS */}
                  <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900">Periodo de Ejecución</h4>
                      <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                        Referencial
                      </span>
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
                            errors.fechaProgramadaFin ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
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

                  {/* EQUIPOS */}
                  <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                          <Settings className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900">Configuración por Equipo</h4>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
                          {equipos.length} {equipos.length === 1 ? "equipo" : "equipos"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {equipos.map((equipo, index) => (
                        <div
                          key={equipo.equipoId || index}
                          className="relative bg-gradient-to-br from-slate-50 to-orange-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-orange-300 transition-all"
                        >
                          {/* HEADER EQUIPO */}
                          <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-600 to-amber-600 text-white rounded-xl font-bold shadow-lg">
                                {index + 1}
                              </div>
                              <div>
                                <h5 className="text-lg font-bold text-slate-900">
                                  {equipo.equipoNombre}
                                </h5>
                                <p className="text-sm text-slate-600">{equipo.equipoTipo}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleVerDetallesEquipo(equipo.equipoId)}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                              >
                                <Eye className="w-4 h-4" />
                                Ver Detalles
                              </button>
                              <span
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${getEstadoBadgeColor(
                                  equipo.estado
                                )}`}
                              >
                                {equipo.estado}
                              </span>
                            </div>
                          </div>

                          {/* Descripción trabajo */}
                          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                            <label className="block text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Descripción del Trabajo Específico{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={equipo.descripcionEquipo}
                              onChange={(e) => handleEquipoChange(index, "descripcionEquipo", e.target.value)}
                              rows={2}
                              placeholder={`Detalla el trabajo específico a realizar en ${equipo.equipoNombre}...`}
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

                          {/* Config grid */}
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Tipo de Actividad <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={equipo.tipoActividad}
                                onChange={(e) => handleEquipoChange(index, "tipoActividad", e.target.value)}
                                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                              >
                                {tiposActividad.map((tipo) => (
                                  <option key={tipo} value={tipo}>
                                    {tipo}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Prioridad <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={equipo.prioridad}
                                onChange={(e) => handleEquipoChange(index, "prioridad", e.target.value)}
                                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                              >
                                <option value="BAJA">🟢 Baja</option>
                                <option value="MEDIA">🟡 Media</option>
                                <option value="ALTA">🟠 Alta</option>
                                <option value="CRITICA">🔴 Crítica</option>
                              </select>
                            </div>

                            {equipo.tipoActividad === "Otro" && (
                              <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                  Especificar Tipo de Actividad <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={equipo.tipoActividadPersonalizada || ""}
                                  onChange={(e) =>
                                    handleEquipoChange(index, "tipoActividadPersonalizada", e.target.value)
                                  }
                                  placeholder="Describe el tipo de actividad personalizada..."
                                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium ${
                                    errors[`equipo_${index}_tipoActividadPersonalizada`]
                                      ? "border-red-400 bg-red-50"
                                      : "border-slate-300 bg-white"
                                  }`}
                                />
                                {errors[`equipo_${index}_tipoActividadPersonalizada`] && (
                                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors[`equipo_${index}_tipoActividadPersonalizada`]}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* PLAN */}
                          <div className="mt-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                <Wrench className="w-4 h-4" />
                                Plan de Mantenimiento
                              </label>
                              <button
                                onClick={() => cargarPlanesEquipo(equipo.equipoId, index)}
                                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold transition-all disabled:opacity-60"
                                disabled={cargandoPlanes && equipoPlanIndex === index}
                              >
                                {cargandoPlanes && equipoPlanIndex === index ? "Cargando..." : "Cargar Planes"}
                              </button>
                            </div>

                            {equipoPlanIndex === index && (
                              <select
                                className="w-full px-4 py-2.5 border-2 border-indigo-300 rounded-lg bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                value={equipo.planMantenimientoId || ""}
                                onChange={async (e) => {
                                  const planId = e.target.value;
                                  handleEquipoChange(index, "planMantenimientoId", planId);

                                  if (!planId) {
                                    handleEquipoChange(index, "planMantenimiento", null);
                                    handleEquipoChange(index, "actividadesPlan", []);
                                    return;
                                  }

                                  const plan = await planMantenimientoService.getPlanById(planId);
                                  handleEquipoChange(index, "planMantenimiento", plan);

                                  const acts = (plan?.actividades || []).map((a) => ({
                                    _uid: uid(),
                                    origen: "PLAN",
                                    planMantenimientoActividadId: a.id,
                                    componente: a.componente,
                                    tarea: a.tarea,
                                    tipoTrabajo: a.tipoTrabajo,
                                    duracionEstimadaMin: a.duracionMinutos,
                                    estado: "PENDIENTE",
                                    observaciones: "",
                                  }));

                                  handleEquipoChange(index, "actividadesPlan", acts);
                                }}
                              >
                                <option value="">— Trabajo manual (sin plan) —</option>
                                {planesDisponibles.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.nombre}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* Vista actividades plan */}
                            {Array.isArray(equipo.actividadesPlan) && equipo.actividadesPlan.length > 0 && (
                              <div className="mt-4 space-y-2">
                                <p className="text-xs font-bold text-indigo-900 mb-2">
                                  Actividades del Plan ({equipo.actividadesPlan.length})
                                </p>
                                {equipo.actividadesPlan.map((act) => (
                                  <div
                                    key={act._uid}
                                    className="flex items-start gap-3 bg-white rounded-lg p-3 border border-indigo-200"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="font-semibold text-sm text-slate-900">
                                        {act.componente} — {act.tarea}
                                      </p>
                                      <p className="text-xs text-slate-600 mt-1">
                                        {act.tipoTrabajo} • {act.duracionEstimadaMin} min
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => removeActividad(index, "PLAN", act._uid)}
                                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700"
                                      title="Quitar actividad del plan (solo en front)"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* ACTIVIDADES TRATAMIENTO + MANUAL (MIXTO) */}
                          <div className="mt-4 bg-white border-2 border-slate-200 rounded-xl p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-extrabold text-slate-900">
                                  Actividades (Mixto)
                                </p>
                                <p className="text-xs text-slate-600">
                                  Incluye actividades del tratamiento (si existen) + manuales que agregues aquí.
                                </p>
                              </div>
                              <button
                                onClick={() => addManualActividad(index)}
                                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center gap-2"
                              >
                                <PlusIcon />
                                Agregar Manual
                              </button>
                            </div>

                            {/* Tratamiento */}
                            {Array.isArray(equipo.actividadesTratamiento) &&
                              equipo.actividadesTratamiento.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs font-bold text-orange-700 mb-2">
                                    Desde Tratamiento ({equipo.actividadesTratamiento.length})
                                  </p>
                                  <div className="space-y-2">
                                    {equipo.actividadesTratamiento.map((act) => (
                                      <ActividadRow
                                        key={act._uid}
                                        act={act}
                                        color="orange"
                                        onChange={(field, val) =>
                                          updateActividad(index, "TRATAMIENTO", act._uid, field, val)
                                        }
                                        onRemove={() => removeActividad(index, "TRATAMIENTO", act._uid)}
                                        removable
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Manual */}
                            {Array.isArray(equipo.actividadesManual) && equipo.actividadesManual.length > 0 && (
                              <div className="mt-4">
                                <p className="text-xs font-bold text-slate-700 mb-2">
                                  Manuales ({equipo.actividadesManual.length})
                                </p>
                                <div className="space-y-2">
                                  {equipo.actividadesManual.map((act) => (
                                    <ActividadRow
                                      key={act._uid}
                                      act={act}
                                      color="slate"
                                      onChange={(field, val) =>
                                        updateActividad(index, "MANUAL", act._uid, field, val)
                                      }
                                      onRemove={() => removeActividad(index, "MANUAL", act._uid)}
                                      removable
                                      editableFull
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {(!equipo.actividadesTratamiento?.length && !equipo.actividadesManual?.length) && (
                              <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700">
                                No hay actividades del tratamiento para este equipo (o tu backend no las envía por equipo).
                                Puedes agregar manualmente con “Agregar Manual”.
                              </div>
                            )}
                          </div>

                          {/* Trabajadores */}
                          <div className="mt-4 bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                            <label className="block text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Trabajadores Asignados <span className="text-red-500">*</span>
                            </label>

                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-lg border border-purple-200">
                              {trabajadores.map((trab) => {
                                const seleccionado = (equipo.trabajadoresAsignados || []).includes(trab.id);
                                return (
                                  <label
                                    key={trab.id}
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                                      seleccionado
                                        ? "bg-purple-100 border-2 border-purple-300"
                                        : "bg-slate-50 border-2 border-transparent hover:bg-purple-50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={seleccionado}
                                      onChange={(e) => toggleTrabajador(index, trab.id, e.target.checked)}
                                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-sm font-medium text-slate-800">{trab.nombre}</span>
                                  </label>
                                );
                              })}
                            </div>

                            {errors[`equipo_${index}_trabajadores`] && (
                              <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                {errors[`equipo_${index}_trabajadores`]}
                              </p>
                            )}

                            {(equipo.trabajadoresAsignados || []).length > 0 && (
                              <div className="mt-4">
                                <label className="block text-sm font-semibold text-purple-900 mb-2">
                                  Encargado del Equipo <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={equipo.encargadoId || ""}
                                  onChange={(e) => handleEquipoChange(index, "encargadoId", e.target.value)}
                                  className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg bg-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                >
                                  <option value="">Seleccione un encargado</option>
                                  {trabajadores
                                    .filter((t) => (equipo.trabajadoresAsignados || []).includes(t.id))
                                    .map((t) => (
                                      <option key={t.id} value={t.id}>
                                        {t.nombre}
                                      </option>
                                    ))}
                                </select>
                                {errors[`equipo_${index}_encargado`] && (
                                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors[`equipo_${index}_encargado`]}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Fechas específicas */}
                          <div className="mt-4 bg-sky-50 border-2 border-sky-200 rounded-xl p-4">
                            <h6 className="text-sm font-bold text-sky-900 mb-3 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Programación Específica
                            </h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">
                                  Fecha/Hora Inicio <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="datetime-local"
                                  value={equipo.fechaInicioProgramada}
                                  onChange={(e) =>
                                    handleEquipoChange(index, "fechaInicioProgramada", e.target.value)
                                  }
                                  className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-medium ${
                                    errors[`equipo_${index}_fechaInicioProgramada`]
                                      ? "border-red-400 bg-red-50"
                                      : "border-sky-300 bg-white"
                                  }`}
                                />
                                {errors[`equipo_${index}_fechaInicioProgramada`] && (
                                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors[`equipo_${index}_fechaInicioProgramada`]}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">
                                  Fecha/Hora Fin <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="datetime-local"
                                  value={equipo.fechaFinProgramada}
                                  onChange={(e) =>
                                    handleEquipoChange(index, "fechaFinProgramada", e.target.value)
                                  }
                                  className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-medium ${
                                    errors[`equipo_${index}_fechaFinProgramada`]
                                      ? "border-red-400 bg-red-50"
                                      : "border-sky-300 bg-white"
                                  }`}
                                />
                                {errors[`equipo_${index}_fechaFinProgramada`] && (
                                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors[`equipo_${index}_fechaFinProgramada`]}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Adjuntos equipo */}
                          <div className="mt-4 bg-white border-2 border-slate-200 rounded-xl p-4">
                            <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              Archivos Adjuntos del Equipo
                            </label>

                            <input
                              type="file"
                              multiple
                              onChange={(e) => handleUploadAdjuntosEquipo(e.target.files, index)}
                              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-600 file:text-white file:font-semibold hover:file:bg-orange-700 cursor-pointer"
                            />

                            {equipo.subiendoAdjuntos && (
                              <div className="mt-3 flex items-center gap-2 text-orange-600">
                                <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-medium">Subiendo archivos...</p>
                              </div>
                            )}

                            {Array.isArray(equipo.adjuntos) && equipo.adjuntos.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {equipo.adjuntos.map((file, i) => (
                                  <div
                                    key={`${file.id || file.nombre || "file"}_${i}`}
                                    className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200"
                                  >
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-orange-600" />
                                      <span className="text-sm font-medium text-slate-800">
                                        {file.nombre || file.filename || "Archivo"}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {file?.url && (
                                        <a
                                          href={file.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                                          title="Abrir"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </a>
                                      )}
                                      {file?.url && (
                                        <a
                                          href={file.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                                          title="Descargar"
                                        >
                                          <Download className="w-4 h-4" />
                                        </a>
                                      )}

                                      <button
                                        onClick={() => {
                                          setEquipos((prev) => {
                                            const next = [...prev];
                                            const eq = { ...next[index] };
                                            eq.adjuntos = (eq.adjuntos || []).filter((_, idx) => idx !== i);
                                            next[index] = eq;
                                            return next;
                                          });
                                        }}
                                        className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Quitar"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ADJUNTOS GENERALES */}
                  <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900">Archivos Adjuntos Generales</h4>
                      <span className="text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                        (Opcional)
                      </span>
                    </div>

                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleUploadAdjuntos(e.target.files)}
                      className="w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-orange-600 file:to-amber-600 file:text-white file:font-bold hover:file:from-orange-700 hover:file:to-amber-700 cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-orange-400 transition-all"
                    />

                    {subiendoArchivos && (
                      <div className="mt-4 flex items-center gap-3 text-orange-600 bg-orange-50 p-4 rounded-xl border border-orange-200">
                        <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-semibold">Subiendo archivos...</p>
                      </div>
                    )}

                    {archivosAdjuntos.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-semibold text-slate-700 mb-2">
                          Archivos adjuntos ({archivosAdjuntos.length})
                        </p>
                        {archivosAdjuntos.map((file, i) => (
                          <div
                            key={`${file.id || file.nombre || "file"}_${i}`}
                            className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-600 rounded-lg">
                                <FileText className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-semibold text-slate-800">
                                {file.nombre || file.filename || "Archivo"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {file?.url && (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 rounded-lg hover:bg-white/60 text-slate-700"
                                  title="Descargar"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                onClick={() => setArchivosAdjuntos((prev) => prev.filter((_, idx) => idx !== i))}
                                className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Quitar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* OBSERVACIONES */}
                  <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      Observaciones Generales
                    </label>
                    <textarea
                      name="observaciones"
                      value={formData.observaciones}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Notas adicionales, consideraciones especiales, información relevante..."
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none font-medium bg-white"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-6 border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-orange-50 flex items-center justify-between rounded-b-3xl">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-slate-400 rounded-xl hover:bg-white hover:border-slate-500 transition-all font-bold text-slate-700 flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>

            {!mostrarSeleccion && (
              <button
                onClick={handleSubmitInternal}
                className="px-8 py-3 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:via-amber-700 hover:to-orange-800 transition-all font-bold shadow-xl shadow-orange-500/40 flex items-center gap-3 transform hover:scale-[1.02] active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                Crear OT Mixta
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{equipos.length} equipos</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL INFO AVISO */}
      <ModalInfoAvisoInline
        open={mostrarInfoAviso}
        onClose={() => setMostrarInfoAviso(false)}
        aviso={aviso}
        tratamientoData={tratamientoData}
        cargando={cargandoTratamiento}
      />

      {/* MODAL DETALLE EQUIPO */}
      <ModalDetalleEquipoInline
        open={!!equipoDetalleModal}
        onClose={() => {
          setEquipoDetalleModal(null);
          setEquipoDetalleData(null);
        }}
        equipo={equipoDetalleData}
        cargando={cargandoEquipoDetalle}
      />

      {/* CONFIRMACIÓN */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Confirmar Creación</h3>
            </div>

            <div className="space-y-2 mb-6 text-sm text-slate-700">
              <p>
                <strong>OT:</strong> {numeroOTGenerado}
              </p>
              <p>
                <strong>Equipos:</strong> {equipos.length} equipos incluidos
              </p>
              <p>
                <strong>Supervisor:</strong>{" "}
                {supervisores.find((s) => String(s.id) === String(formData.supervisorId))?.nombre || "N/A"}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Se enviarán actividades (TRATAMIENTO + PLAN + MANUAL) en un solo arreglo por equipo.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmarCreacion();
                  setMostrarConfirmacion(false);
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold shadow-lg shadow-green-500/30"
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
   UI Components for Activities
========================================================= */
function PlusIcon() {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-white/10 border border-white/15">
      <span className="text-white font-black leading-none">+</span>
    </span>
  );
}

function ActividadRow({ act, color = "slate", onChange, onRemove, removable, editableFull }) {
  const badge =
    color === "orange"
      ? "bg-orange-100 text-orange-700 border-orange-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  const inputBase =
    "w-full px-3 py-2 border-2 rounded-lg focus:ring-4 transition-all text-sm font-medium bg-white";
  const ring =
    color === "orange"
      ? "focus:ring-orange-500/20 focus:border-orange-500"
      : "focus:ring-slate-500/20 focus:border-slate-500";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-[11px] font-extrabold border rounded-lg ${badge}`}>
            {act.origen}
          </span>
          <span className="text-xs text-slate-500">
            {act.duracionEstimadaMin ? `${act.duracionEstimadaMin} min` : ""}
          </span>
        </div>

        {removable && (
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700"
            title="Quitar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Componente</label>
          <input
            value={act.componente || ""}
            onChange={(e) => onChange("componente", e.target.value)}
            disabled={!editableFull && act.origen !== "MANUAL"}
            className={`${inputBase} ${ring} ${
              !editableFull && act.origen !== "MANUAL" ? "opacity-70 bg-slate-50" : ""
            }`}
            placeholder="Componente"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Tarea</label>
          <input
            value={act.tarea || ""}
            onChange={(e) => onChange("tarea", e.target.value)}
            disabled={!editableFull && act.origen !== "MANUAL"}
            className={`${inputBase} ${ring} ${
              !editableFull && act.origen !== "MANUAL" ? "opacity-70 bg-slate-50" : ""
            }`}
            placeholder="Tarea / descripción"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Tipo trabajo</label>
          <input
            value={act.tipoTrabajo || ""}
            onChange={(e) => onChange("tipoTrabajo", e.target.value)}
            disabled={!editableFull && act.origen !== "MANUAL"}
            className={`${inputBase} ${ring} ${
              !editableFull && act.origen !== "MANUAL" ? "opacity-70 bg-slate-50" : ""
            }`}
            placeholder="Tipo trabajo"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Duración (min)</label>
            <input
              type="number"
              min={0}
              value={act.duracionEstimadaMin ?? 0}
              onChange={(e) => onChange("duracionEstimadaMin", e.target.value)}
              disabled={!editableFull && act.origen !== "MANUAL"}
              className={`${inputBase} ${ring} ${
                !editableFull && act.origen !== "MANUAL" ? "opacity-70 bg-slate-50" : ""
              }`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Estado</label>
            <select
              value={act.estado || "PENDIENTE"}
              onChange={(e) => onChange("estado", e.target.value)}
              className={`${inputBase} ${ring}`}
            >
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN_PROCESO">EN_PROCESO</option>
              <option value="FINALIZADO">FINALIZADO</option>
            </select>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Observaciones</label>
          <input
            value={act.observaciones || ""}
            onChange={(e) => onChange("observaciones", e.target.value)}
            className={`${inputBase} ${ring}`}
            placeholder="Observaciones"
          />
        </div>
      </div>
    </div>
  );
}