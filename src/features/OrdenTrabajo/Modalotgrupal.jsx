import {
  X,
  FileText,
  Calendar,
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
import { updateSolicitudCompra,createSolicitudCompra} from "../OrdenTrabajo/services/SolicitudCompraService";

import OTRegistroCard from "./components/OTRegistroCard";
import { buildOTPayload, getRegistroId, mkActOT } from "./helpers/otHelpers";
import { validateOTForm } from "./helpers/otValidation";

import ModalSolicitudAlmacen from "../../components/inputs/ModalSolicitudAlmacen";
import { createSolicitudAlmacen,updateSolicitudAlmacen } from "./services/solicitudAlmacenService";
import {
  mapSolicitudesAlmacenToModalValue,
  buildSolicitudAlmacenUpdatePayload,
  isSolicitudVacia,
  buildSolicitudAlmacenCreatePayload
} from "./helpers/solicitudAlmacenAdapter";

import ModalSolicitudCompra from "../../components/inputs/ModalSolicitudCompra";

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

  const [equipos, setEquipos] = useState([]);
  const [planesPorEquipo, setPlanesPorEquipo] = useState({});
  const [cargandoPlanes, setCargandoPlanes] = useState(false);

  const [errors, setErrors] = useState({});

  const tratamientoAplicadoRef = useRef(false);

  const tipoMantenimiento = aviso?.tipoMantenimiento;
  const esPreventivo = tipoMantenimiento === "Preventivo";
  const esCorrectivo = tipoMantenimiento === "Correctivo";

  const tratamiento = tratamientoData?.tratamiento || tratamientoData || null;


  const [showSolicitudAlmacenModal, setShowSolicitudAlmacenModal] = useState(false);
const [guardandoSolicitudAlmacen, setGuardandoSolicitudAlmacen] = useState(false);

const [showSolicitudCompraModal, setShowSolicitudCompraModal] = useState(false);
const [guardandoSolicitudCompra, setGuardandoSolicitudCompra] = useState(false);





const getTargetMeta = (targetId) => {
  const target = equiposInfo.find((t) => String(t.id) === String(targetId));

  if (!target) {
    return {
      equipo_id: null,
      ubicacion_tecnica_id: null,
    };
  }

  return {
    equipo_id: target.tipo === "EQUIPO" ? target.id : null,
    ubicacion_tecnica_id:
      target.tipo === "UBICACION_TECNICA" ? target.id : null,
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
        rubro: l.rubro || "",
        rubroSapCode: l.rubroSapCode || "",
        paqueteTrabajo: l.paqueteTrabajo || "",
      }))
    : [],
});


  const equiposInfo = useMemo(() => {
    return (equipos || []).map((e) => ({
      id: getRegistroId(e),
      nombre: e.equipoNombre || e.ubicacionTecnicaNombre,
      codigo: e.equipoNombre || e.ubicacionTecnicaNombre,
      tag: e.equipoTipo || e.ubicacionTecnicaCodigo,
      tipo: e.equipoId ? "EQUIPO" : "UBICACION_TECNICA",
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
            rubro: l.rubro || "",
            rubroSapCode: l.rubroSapCode || "",
            paqueteTrabajo: l.paqueteTrabajo || "",
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
                rubro: l.rubro || "",
                rubroSapCode: l.rubroSapCode || "",
                paqueteTrabajo: l.paqueteTrabajo || "",
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
        rubro: l.rubro || "",
        rubroSapCode: l.rubroSapCode || "",
        paqueteTrabajo: l.paqueteTrabajo || "",
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


const validarSolicitudCompraForm = (form, label = "solicitud de compra") => {
  if (!form?.email?.trim()) {
    throw new Error(`El correo del solicitante es obligatorio en ${label}`);
  }

  if (!form?.requiredDate) {
    throw new Error(`La fecha requerida es obligatoria en ${label}`);
  }

  if (!Array.isArray(form.lineas) || form.lineas.length === 0) {
    throw new Error(`Debe existir al menos una línea en ${label}`);
  }
};

const handleGuardarSolicitudesCompraDesdeOT = async (result) => {
  try {
    setGuardandoSolicitudCompra(true);

    const tratamientoId = tratamiento?.id || tratamientoData?.id;
    if (!tratamientoId) {
      throw new Error("No se encontró el tratamiento para guardar la solicitud");
    }

    const generalExistente =
      solicitudesCompraArr.find((s) => s?.esGeneral === true) || null;

    const individualesExistentes = solicitudesCompraArr.filter(
      (s) => !s?.esGeneral
    );

    // GENERAL
    if (result?.solicitudGeneral && !isSolicitudVacia(result.solicitudGeneral)) {
      if (generalExistente) {
        await updateSolicitudCompra(
          generalExistente.id,
          buildSolicitudCompraUpdatePayload(result.solicitudGeneral)
        );
      } else {
        await createSolicitudCompra(
          buildSolicitudCompraCreatePayload(result.solicitudGeneral, {
            esGeneral: true,
            equipo_id: null,
            ubicacion_tecnica_id: null,
          })
        );
      }
    }

    // INDIVIDUALES
    const formsPorEquipo = result?.solicitudesPorEquipo || {};

    for (const [key, form] of Object.entries(formsPorEquipo)) {
      if (!form || isSolicitudVacia(form)) continue;

      const existente = individualesExistentes.find(
        (s) =>
          String(s.equipo_id || s.ubicacion_tecnica_id || "") === String(key)
      );

      if (existente) {
        await updateSolicitudCompra(
          existente.id,
          buildSolicitudCompraUpdatePayload(form)
        );
      } else {
        const meta = getTargetMeta(key);

        await createSolicitudCompra(
          buildSolicitudCompraCreatePayload(form, {
            esGeneral: false,
            equipo_id: meta.equipo_id,
            ubicacion_tecnica_id: meta.ubicacion_tecnica_id,
          })
        );
      }
    }

    const updated = await getTratamientoByAviso(aviso.id);
    setTratamientoData(updated);
    setShowSolicitudCompraModal(false);
  } catch (error) {
    console.error("Error guardando solicitudes de compra desde OT:", error);
    alert(
      error?.response?.data?.message ||
        error?.response?.data?.errors?.[0] ||
        error?.message ||
        "Error al guardar solicitudes de compra"
    );
  } finally {
    setGuardandoSolicitudCompra(false);
  }
};

const initialSolicitudesAlmacen = useMemo(() => {
  return mapSolicitudesAlmacenToModalValue(solicitudesAlmacenArr);
}, [solicitudesAlmacenArr]);

  const solicitudGeneral = useMemo(() => {
    return solicitudesCompraArr.find((s) => s?.esGeneral === true) || null;
  }, [solicitudesCompraArr]);

  const handleGuardarSolicitudesAlmacenDesdeOT = async (result) => {
  try {
    setGuardandoSolicitudAlmacen(true);

    const tratamientoId = tratamiento?.id || tratamientoData?.id;
    if (!tratamientoId) {
      throw new Error("No se encontró el tratamiento para guardar la solicitud");
    }

    const generalExistente =
      solicitudesAlmacenArr.find((s) => s?.esGeneral === true) || null;

    const individualesExistentes = solicitudesAlmacenArr.filter(
      (s) => !s?.esGeneral
    );

    // GENERAL
    if (result?.solicitudGeneral && !isSolicitudVacia(result.solicitudGeneral)) {
      if (generalExistente) {
        await updateSolicitudAlmacen(
          generalExistente.id,
          buildSolicitudAlmacenUpdatePayload(result.solicitudGeneral)
        );
      } else {
        await createSolicitudAlmacen(
          buildSolicitudAlmacenCreatePayload(result.solicitudGeneral, {
            tratamiento_id: tratamientoId,
            esGeneral: true,
            equipo_id: null,
            ubicacion_tecnica_id: null,
          })
        );
      }
    }

    // INDIVIDUALES
    const formsPorEquipo = result?.solicitudesPorEquipo || {};

    for (const [key, form] of Object.entries(formsPorEquipo)) {
      if (!form || isSolicitudVacia(form)) continue;

      const existente = individualesExistentes.find(
        (s) =>
          String(s.equipo_id || s.ubicacion_tecnica_id || "") === String(key)
      );

      if (existente) {
        await updateSolicitudAlmacen(
          existente.id,
          buildSolicitudAlmacenUpdatePayload(form)
        );
      } else {
        const meta = getTargetMeta(key);

        await createSolicitudAlmacen(
          buildSolicitudAlmacenCreatePayload(form, {
            tratamiento_id: tratamientoId,
            esGeneral: false,
            equipo_id: meta.equipo_id,
            ubicacion_tecnica_id: meta.ubicacion_tecnica_id,
          })
        );
      }
    }

    const updated = await getTratamientoByAviso(aviso.id);
    setTratamientoData(updated);
    setShowSolicitudAlmacenModal(false);
  } catch (error) {
    console.error("Error guardando solicitudes de almacén desde OT:", error);
    alert(
      error?.response?.data?.message ||
        error?.response?.data?.errors?.[0] ||
        error?.message ||
        "Error al guardar solicitudes de almacén"
    );
  } finally {
    setGuardandoSolicitudAlmacen(false);
  }
};
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
      .then((data) => setTratamientoData(data))
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
    if (!isOpen || !tratamientoData || !equipos.length || tratamientoAplicadoRef.current) {
      return;
    }

    const tratEquipos = Array.isArray(tratamientoData.equipos)
      ? tratamientoData.equipos
      : [];
    if (!tratEquipos.length) return;

    tratamientoAplicadoRef.current = true;

    setEquipos((prev) =>
      prev.map((eq) => {
        const te = tratEquipos.find((t) => {
          if (eq.equipoId) return t.equipoId === eq.equipoId || t.equipo?.id === eq.equipoId;
          if (eq.ubicacionTecnicaId)
            return (
              t.ubicacionTecnicaId === eq.ubicacionTecnicaId ||
              t.ubicacionTecnica?.id === eq.ubicacionTecnicaId
            );
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
          ubicacionTecnicaNombre:
            te.ubicacionTecnica?.nombre || eq.ubicacionTecnicaNombre,
          ubicacionTecnicaCodigo:
            te.ubicacionTecnica?.codigo || eq.ubicacionTecnicaCodigo,
          actividadesOT,
          planMantenimientoId: te.planMantenimientoId || null,
          planMantenimiento: te.planMantenimiento || null,
          descripcionEquipo: te.descripcionEquipo || eq.descripcionEquipo || "",
          descripcionUbicacion:
            te.descripcionUbicacion || eq.descripcionUbicacion || "",
        };
      })
    );
  }, [isOpen, tratamientoData, equipos.length, esCorrectivo]);

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
                const planes =
                  await planMantenimientoService.getPlanesByUbicacionTecnica(
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

      const acts = (planSel?.actividades || []).map((a) =>
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
              origen: "OT",
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


  const handleSubmitInternal = () => {
    const newErrors = validateOTForm({
      formData,
      equipos,
      esPreventivo,
      esCorrectivo,
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setMostrarConfirmacion(true);
  };

  const confirmarCreacion = () => {
    const tratamientoId = tratamientoData?.id || tratamientoData?.tratamiento?.id;

    if (!tratamientoId) {
      alert("Este aviso no tiene tratamiento cargado.");
      return;
    }

    const payload = buildOTPayload({
      numeroOT: numeroOTGenerado,
      formData,
      aviso,
      tratamientoId,
      equipos,
      archivosAdjuntos,
      esPreventivo,
    });

    onGuardar(payload);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3">
        <div className="bg-white rounded-3xl shadow-2xl w-[99vw] max-w-[145rem] h-[97vh] flex flex-col border border-slate-200 overflow-hidden">
          <div className="px-8 py-6 border-b bg-slate-900 shrink-0 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">
                Crear Orden de Trabajo Grupal
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-slate-300">
                <span className="font-semibold text-white">{numeroOTGenerado}</span>
                <span>•</span>
                <span>
                  Aviso <b className="text-white">{aviso?.numeroAviso}</b>
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

          <div className="flex-1 overflow-y-auto bg-slate-50">
            <div className="p-8 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-slate-900">
                    <ClipboardCheck className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-900">Información General</h4>
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
                    <Label>Fecha y Hora de Inicio *</Label>
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
                    <Label>Fecha y Hora de Fin *</Label>
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
                />
              ))}

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-700">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-900">Archivos Adjuntos Generales</h4>
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

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
  <div className="flex items-center justify-between mb-4">
    <h4 className="text-xl font-semibold text-slate-900">Solicitud de Compra</h4>
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

      <ModalSolicitudCompra
  isOpen={showSolicitudCompraModal}
  onClose={() => setShowSolicitudCompraModal(false)}
  onConfirm={handleGuardarSolicitudesCompraDesdeOT}
  targets={equiposInfo}
  equiposRelacion={aviso?.equiposRelacion || []}
  ubicacionesRelacion={aviso?.ubicacionesRelacion || []}
  equiposInfo={equiposInfo}
  initialValue={initialSolicitudesCompra}
/>

      <ModalSolicitudAlmacen
  isOpen={showSolicitudAlmacenModal}
  onClose={() => setShowSolicitudAlmacenModal(false)}
  onConfirm={handleGuardarSolicitudesAlmacenDesdeOT}
  targets={equiposInfo}
  equiposRelacion={aviso?.equiposRelacion || []}
  ubicacionesRelacion={aviso?.ubicacionesRelacion || []}
  equiposInfo={equiposInfo}
  initialValue={initialSolicitudesAlmacen}
/>

      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              ¿Confirmar creación?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Se creará la OT <span className="font-semibold text-slate-900">{numeroOTGenerado}</span>{" "}
              para <span className="font-semibold text-slate-900">{equipos.length}</span> registros.
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
                  confirmarCreacion();
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

function Label({ children }) {
  return <label className="block text-sm font-medium text-slate-700 mb-2">{children}</label>;
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