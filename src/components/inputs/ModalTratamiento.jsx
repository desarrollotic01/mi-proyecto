import { useEffect, useState } from "react";
import {
  X,
  Save,
  ShoppingCart,
  CheckCircle,
  Briefcase,
  Wrench,
  FileText,
  Package,
  Plus,
  Trash2,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Tag,
} from "lucide-react";

import {
  createTratamiento,
  saveTratamientoDraft,
} from "../../features/mantenimiento/services/tratamientoService";
import { equipoService } from "../../features/mantenimiento/services/equipoService";
import ModalSolicitudCompra from "./ModalSolicitudCompra";
import ModalConfiguracionCampos from "./ModalConfiguracionTratamiento";
import { CAMPOS_AVISO } from "./camposAviso";
import { planMantenimientoService } from "../../features/PlanMantenimiento/services/planMantenimientoService";

/* ══════════════════════════════════════════════
   CONSTANTES / TEMPLATES
══════════════════════════════════════════════ */

// ✅ Correctivo: solo REPARACION o CAMBIO
const TIPOS_TRABAJO_CORRECTIVO = ["REPARACION", "CAMBIO"];

// ✅ Roles técnicos (igual a tu ENUM backend)
const ROLES_TECNICOS = [
  { value: "tecnico_electrico", label: "Técnico Eléctrico" },
  { value: "operario_de_mantenimiento", label: "Operario Mantenimiento" },
  { value: "tecnico_mecanico", label: "Técnico Mecánico" },
  { value: "supervisor", label: "Supervisor" },
];

// ✅ Actividad manual (Correctivo) — incluye rol + cantidad
const ACTIVIDAD_VACIA = {
  sistema: "",
  subsistema: "",
  componente: "",
  tarea: "",
  descripcion: "",
  tipoTrabajo: "REPARACION",
  rolTecnico: "tecnico_mecanico",
  cantidadTecnicos: 1,
  duracionEstimadaValor: 0,
  unidadDuracion: "min", // "min" | "h"
  observaciones: "",
};

export default function ModalTratamiento({ isOpen, aviso, onClose, onSuccess }) {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showSolicitud, setShowSolicitud] = useState(false);
  const [showConfigCampos, setShowConfigCampos] = useState(false);

  // ✅ valor que se manda al backend (solicitudGeneral + solicitudesPorEquipo)
  const [solicitudes, setSolicitudes] = useState(null);

  const [collapsed, setCollapsed] = useState({});
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ data alineada a tu backend
  const [data, setData] = useState({
    actividadesManuales: {}, // { [equipoId]: ActividadManual[] }
    planesSeleccionados: {}, // { [equipoId]: planId }
    // ✅ preventivo editable por equipo
    preventivoPorEquipo: {}, // { [equipoId]: { planId, nombrePlan, codigoPlan, actividades: [] } }
  });

  /* ─────────────────────────────
     Flags
  ───────────────────────────── */
  const esCorrectivo = aviso?.tipoMantenimiento === "Correctivo";
  const esPreventivo =
    aviso?.tipoAviso === "mantenimiento" &&
    aviso?.tipoMantenimiento === "Preventivo";

  const tieneEquipos = (aviso?.equiposRelacion?.length || 0) > 0;
  const tieneUbicaciones = (aviso?.ubicacionesRelacion?.length || 0) > 0;

  const cantSolicitudesIndividuales = Object.keys(
    solicitudes?.solicitudesPorEquipo || {}
  ).length;

  /* ─────────────────────────────
     Carga inicial + RESET (bug de estados pegados)
  ───────────────────────────── */
  useEffect(() => {
    if (!isOpen || !aviso) return;

    setErrorMsg("");

    // ✅ limpiar estado cuando abres otro aviso
    setSolicitudes(null);
    setCollapsed({});
    setData({
      actividadesManuales: {},
      planesSeleccionados: {},
      preventivoPorEquipo: {},
    });

    equipoService
      .getEquipos()
      .then((eData) => {
        setEquipos(eData || []);
      })
      .catch(() => {
        setEquipos([]);
      });
  }, [isOpen, aviso?.id]);

  /* ─────────────────────────────
     Helpers
  ───────────────────────────── */
  const getEquipoInfo = (id) =>
    equipos.find((e) => e.id === id) || { nombre: id, tag: id };

  const getEquipoFull = (id) => equipos.find((e) => e.id === id);

  const getUbicacionInfo = (id) => {
    return { nombre: `Ubicación técnica`, tag: id };
  };

  const toggleCollapse = (key) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const toMinutes = (valor, unidad) => {
    const v = Number(valor);
    if (!Number.isFinite(v) || v <= 0) return 0;
    if (unidad === "h") return Math.round(v * 60);
    return Math.round(v);
  };

  const minutesToEditableValue = (min, unidad) => {
    if (!Number.isFinite(Number(min))) return 0;
    return unidad === "h" ? Number(min) / 60 : Number(min);
  };

  /* ─────────────────────────────
     AUTO-CARGA: PlanActividadItem -> lineas solicitud
  ───────────────────────────── */
  const getActividadesFromPlan = (planSel) => {
    return (
      planSel?.actividades ||
      planSel?.PlanMantenimientoActividades ||
      planSel?.planMantenimientoActividades ||
      planSel?.actividadesPlan ||
      []
    );
  };

  const getItemsFromActividad = (act) => {
    return (
      act?.items ||
      act?.PlanActividadItems ||
      act?.plan_actividad_items ||
      act?.actividadItems ||
      []
    );
  };

  const planItemsToLineas = (planSel) => {
    const lineas = [];
    const actividades = getActividadesFromPlan(planSel);

    for (const act of actividades) {
      const items = getItemsFromActividad(act);

      for (const it of items) {
        lineas.push({
          id: crypto.randomUUID(),
          itemCode: it.itemCode || "",
          description: it.item || act.tarea || "Recurso de plan",
          quantity: Number(it.cantidad) || 1,
          warehouseCode: "01",
          costCenter: "",
          projectCode: "",
          rubro: it.recurso || "",
          paqueteTrabajo: "",
          origen: "PLAN", // ✅ CLAVE PARA BORRAR/REEMPLAZAR
        });
      }
    }

    // dedupe (sumar cantidades)
    const keyOf = (l) =>
      `${(l.itemCode || "").trim()}__${(l.description || "").trim()}__${(
        l.rubro || ""
      ).trim()}__${(l.paqueteTrabajo || "").trim()}__${l.origen || ""}`;

    const map = new Map();
    for (const l of lineas) {
      const k = keyOf(l);
      if (!map.has(k)) map.set(k, { ...l });
      else map.get(k).quantity += Number(l.quantity) || 0;
    }

    return Array.from(map.values()).filter((l) => l.itemCode || l.description);
  };

  /* ─────────────────────────────
     PREVENTIVO: seleccionar plan (FIX items pegados)
     - REEMPLAZA items PLAN previos por equipo
     - mantiene lineas manuales
  ───────────────────────────── */
  const seleccionarPlan = async (equipoId, planId) => {
    setData((prev) => ({
      ...prev,
      planesSeleccionados: { ...prev.planesSeleccionados, [equipoId]: planId },
    }));

    // ✅ si quitan el plan: borrar items origen PLAN y limpiar actividades cargadas
    if (!planId) {
      setSolicitudes((prev) => {
        if (!prev) return prev;
        const base = {
          ...prev,
          solicitudesPorEquipo: { ...(prev.solicitudesPorEquipo || {}) },
        };
        const actual = base.solicitudesPorEquipo?.[equipoId];
        if (!actual) return prev;

        return {
          ...base,
          solicitudesPorEquipo: {
            ...base.solicitudesPorEquipo,
            [equipoId]: {
              ...actual,
              lineas: (actual.lineas || []).filter((l) => l.origen !== "PLAN"),
            },
          },
        };
      });

      setData((prev) => {
        const copy = { ...(prev.preventivoPorEquipo || {}) };
        delete copy[equipoId];
        return { ...prev, preventivoPorEquipo: copy };
      });

      return;
    }

    try {
      const planSel = await planMantenimientoService.getPlanById(planId);

      // 1) ✅ auto-carga items: reemplazar PLAN anterior
      const lineasAuto = planItemsToLineas(planSel);

      setSolicitudes((prev) => {
        const base = prev || { solicitudGeneral: null, solicitudesPorEquipo: {} };

        const actual = base.solicitudesPorEquipo?.[equipoId] || {
          department: base.solicitudGeneral?.department || "",
          email: base.solicitudGeneral?.email || "",
          requiredDate:
            base.solicitudGeneral?.requiredDate ||
            new Date().toISOString().slice(0, 10),
          comments: "",
          lineas: [],
        };

        const manuales = (actual.lineas || []).filter((l) => l.origen !== "PLAN");

        // dedupe global
        const keyOf = (l) =>
          `${(l.itemCode || "").trim()}__${(l.description || "").trim()}__${(
            l.rubro || ""
          ).trim()}__${(l.paqueteTrabajo || "").trim()}__${l.origen || ""}`;

        const map = new Map();
        for (const l of [...manuales, ...lineasAuto]) {
          const k = keyOf(l);
          if (!map.has(k)) map.set(k, { ...l });
          else map.get(k).quantity += Number(l.quantity) || 0;
        }

        return {
          ...base,
          solicitudesPorEquipo: {
            ...(base.solicitudesPorEquipo || {}),
            [equipoId]: {
              ...actual,
              lineas: Array.from(map.values()),
            },
          },
        };
      });

      // 2) actividades editables por equipo (desde plan)
      const actividades = getActividadesFromPlan(planSel);

      const editable = (actividades || []).map((a) => {
        const unidad = a.unidadDuracion || "min";
        const min = Number(a.duracionMinutos) || 0;

        return {
          planMantenimientoActividadId: a.id,
          codigoActividad: a.codigoActividad || null,

          sistema: a.sistema || "",
          subsistema: a.subsistema || "",
          componente: a.componente || "",
          tarea: a.tarea || "",
          tipoTrabajo: a.tipoTrabajo || "",
          rolTecnico: a.rolTecnico || null,

          duracionEstimadaValor: minutesToEditableValue(min, unidad),
          unidadDuracion: unidad,
          cantidadTecnicos: Number(a.cantidadTecnicos) || 1,

          observaciones: "",
        };
      });

      setData((prev) => ({
        ...prev,
        preventivoPorEquipo: {
          ...prev.preventivoPorEquipo,
          [equipoId]: {
            planId,
            nombrePlan: planSel?.nombre || "",
            codigoPlan: planSel?.codigoPlan || "",
            actividades: editable,
          },
        },
      }));
    } catch (e) {
      console.error("Error cargando plan para autocarga:", e);
    }
  };

  const updatePreventivoActividad = (equipoId, idx, campo, valor) => {
    setData((prev) => {
      const prevEq = prev.preventivoPorEquipo?.[equipoId];
      if (!prevEq) return prev;

      const acts = [...(prevEq.actividades || [])];
      acts[idx] = { ...acts[idx], [campo]: valor };

      if (campo === "cantidadTecnicos") {
        const n = Number(valor);
        acts[idx].cantidadTecnicos = Number.isFinite(n)
          ? Math.max(1, Math.floor(n))
          : 1;
      }
      if (campo === "duracionEstimadaValor") {
        const n = Number(valor);
        acts[idx].duracionEstimadaValor = Number.isFinite(n) ? n : 0;
      }

      return {
        ...prev,
        preventivoPorEquipo: {
          ...prev.preventivoPorEquipo,
          [equipoId]: { ...prevEq, actividades: acts },
        },
      };
    });
  };

  /* ─────────────────────────────
     Correctivo: actividades manuales
  ───────────────────────────── */
  const agregarActividad = (equipoId) =>
    setData((prev) => ({
      ...prev,
      actividadesManuales: {
        ...prev.actividadesManuales,
        [equipoId]: [
          ...(prev.actividadesManuales[equipoId] || []),
          { ...ACTIVIDAD_VACIA },
        ],
      },
    }));

  const actualizarActividad = (equipoId, idx, campo, valor) =>
    setData((prev) => {
      const lista = [...(prev.actividadesManuales[equipoId] || [])];
      lista[idx] = { ...lista[idx], [campo]: valor };

      if (campo === "cantidadTecnicos") {
        const n = Number(valor);
        lista[idx].cantidadTecnicos = Number.isFinite(n)
          ? Math.max(1, Math.floor(n))
          : 1;
      }
      if (campo === "duracionEstimadaValor") {
        const n = Number(valor);
        lista[idx].duracionEstimadaValor = Number.isFinite(n) ? n : 0;
      }

      return {
        ...prev,
        actividadesManuales: { ...prev.actividadesManuales, [equipoId]: lista },
      };
    });

  const eliminarActividad = (equipoId, idx) =>
    setData((prev) => ({
      ...prev,
      actividadesManuales: {
        ...prev.actividadesManuales,
        [equipoId]: (prev.actividadesManuales[equipoId] || []).filter(
          (_, i) => i !== idx
        ),
      },
    }));

  /* ─────────────────────────────
     Validaciones antes de guardar
  ───────────────────────────── */
  const validateBeforeSave = () => {
    const targets = [
      ...(aviso?.equiposRelacion || []).map((e) => e.equipoId),
      ...(aviso?.ubicacionesRelacion || []).map((u) => u.ubicacionTecnicaId),
    ];

    if (!targets.length) return "El aviso no tiene equipos ni ubicaciones asociadas.";

    // preventivo: plan por equipo
    if (esPreventivo && tieneEquipos) {
      for (const rel of aviso.equiposRelacion) {
        const planId = data.planesSeleccionados?.[rel.equipoId];
        if (!planId) {
          const info = getEquipoInfo(rel.equipoId);
          return `Seleccioná un plan para el equipo: ${info.nombre || info.tag || rel.equipoId}`;
        }

        const acts = data.preventivoPorEquipo?.[rel.equipoId]?.actividades || [];
        if (!acts.length) {
          const info = getEquipoInfo(rel.equipoId);
          return `No se cargaron actividades del plan para el equipo: ${info.nombre || info.tag || rel.equipoId}`;
        }

        for (const [i, a] of acts.entries()) {
          if (!a.cantidadTecnicos || Number(a.cantidadTecnicos) <= 0) {
            const info = getEquipoInfo(rel.equipoId);
            return `Equipo ${info.nombre || info.tag || rel.equipoId}: actividad #${i + 1} cantidadTecnicos inválida.`;
          }
        }
      }
    }

    // correctivo: actividades manuales
    if (esCorrectivo && tieneEquipos) {
      for (const rel of aviso.equiposRelacion) {
        const acts = data.actividadesManuales?.[rel.equipoId] || [];
        if (acts.length === 0) {
          const info = getEquipoInfo(rel.equipoId);
          return `Equipo ${info.nombre || info.tag || rel.equipoId}: agregá al menos 1 actividad.`;
        }

        for (const [idx, a] of acts.entries()) {
          if (!a.tarea || !String(a.tarea).trim()) {
            const info = getEquipoInfo(rel.equipoId);
            return `Equipo ${info.nombre || info.tag || rel.equipoId}: actividad #${idx + 1} sin tarea.`;
          }
          if (a.tipoTrabajo && !TIPOS_TRABAJO_CORRECTIVO.includes(a.tipoTrabajo)) {
            const info = getEquipoInfo(rel.equipoId);
            return `Equipo ${info.nombre || info.tag || rel.equipoId}: tipoTrabajo inválido (solo REPARACION/CAMBIO).`;
          }
          if (!a.rolTecnico) {
            const info = getEquipoInfo(rel.equipoId);
            return `Equipo ${info.nombre || info.tag || rel.equipoId}: actividad #${idx + 1} sin rolTecnico.`;
          }
          if (!a.cantidadTecnicos || Number(a.cantidadTecnicos) <= 0) {
            const info = getEquipoInfo(rel.equipoId);
            return `Equipo ${info.nombre || info.tag || rel.equipoId}: actividad #${idx + 1} cantidadTecnicos inválida.`;
          }
        }
      }
    }

    // backend exige solicitudGeneral
    if (!solicitudes?.solicitudGeneral) {
      return "Falta completar la Solicitud de Compra (General).";
    }

    return "";
  };

  /* ─────────────────────────────
     Construir payload (reusable)
  ───────────────────────────── */
  const buildPayload = () => {
    // 1) manuales normalizados
    const actividadesManualesNormalizadas = {};
    for (const [equipoId, acts] of Object.entries(data.actividadesManuales || {})) {
      actividadesManualesNormalizadas[equipoId] = (acts || []).map((a) => {
        const unidad = a.unidadDuracion || "min";
        const valor = Number(a.duracionEstimadaValor) || 0;

        return {
          sistema: a.sistema || null,
          subsistema: a.subsistema || null,
          componente: a.componente || null,
          tarea: a.tarea || null,
          descripcion: a.descripcion || null,
          tipoTrabajo: a.tipoTrabajo || "REPARACION",
          rolTecnico: a.rolTecnico || null,
          cantidadTecnicos: Number(a.cantidadTecnicos) || 1,
          duracionEstimadaValor: valor,
          unidadDuracion: unidad,
          duracionEstimadaMin: toMinutes(valor, unidad) || null,
          observaciones: a.observaciones || null,
        };
      });
    }

    // 2) preventivo overrides
    const actividadesPlanEditadas = {};
    for (const rel of aviso.equiposRelacion || []) {
      const equipoId = rel.equipoId;
      const pack = data.preventivoPorEquipo?.[equipoId];
      if (!pack?.actividades?.length) continue;

      actividadesPlanEditadas[equipoId] = pack.actividades.map((a) => ({
        planMantenimientoActividadId: a.planMantenimientoActividadId,
        duracionEstimadaValor: Number(a.duracionEstimadaValor) || 0,
        unidadDuracion: a.unidadDuracion || "min",
        duracionEstimadaMin: toMinutes(a.duracionEstimadaValor, a.unidadDuracion) || 0,
        cantidadTecnicos: Number(a.cantidadTecnicos) || 1,
        observaciones: a.observaciones || null,
      }));
    }

    return {
      tratamiento: {
        actividadesManuales: actividadesManualesNormalizadas,
        planesSeleccionados: data.planesSeleccionados,
        actividadesPlanEditadas,
      },
      solicitudGeneral: solicitudes?.solicitudGeneral || null,
      solicitudesPorEquipo: solicitudes?.solicitudesPorEquipo || {},
    };
  };

  /* ─────────────────────────────
     Guardar FINAL
  ───────────────────────────── */
  const handleGuardar = async () => {
    setErrorMsg("");
    const msg = validateBeforeSave();
    if (msg) {
      setErrorMsg(msg);
      return;
    }

    setLoading(true);
    try {
      await createTratamiento(aviso.id, buildPayload());
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.log("BACKEND ERROR:", err?.response?.data);
      setErrorMsg(
        err?.response?.data?.message || err?.message || "Error guardando tratamiento."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────────
     Guardar CAMBIOS (PENDIENTE)
  ───────────────────────────── */
  const handleGuardarCambios = async () => {
    setErrorMsg("");
    const msg = validateBeforeSave();
    if (msg) {
      setErrorMsg(msg);
      return;
    }

    setLoading(true);
    try {
      await saveTratamientoDraft(aviso.id, buildPayload());
      alert("✅ Cambios guardados como PENDIENTE.");
    } catch (err) {
      console.log("BACKEND ERROR:", err?.response?.data);
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "Error guardando cambios (pendiente)."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !aviso) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-center items-center p-4">
        <div className="bg-white w-full max-w-[92rem] h-[94vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200">
          {/* ── HEADER ── */}
          <div className="p-6 border-b bg-slate-50 flex justify-between items-center shrink-0">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-slate-900 rounded-xl">
                <FileText className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Tratamiento del Aviso
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm text-slate-600">Aviso #{aviso.numeroAviso}</p>
                  {aviso.tipoMantenimiento && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold border border-slate-200 bg-white text-slate-700">
                      {aviso.tipoMantenimiento}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200"
            >
              <X />
            </button>
          </div>

          {/* ── BODY ── */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* ERROR */}
            {errorMsg && (
              <div className="border border-rose-200 bg-rose-50 text-rose-700 rounded-2xl p-4 text-sm font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* INFORMACIÓN DEL AVISO */}
            <Section title="Información del Aviso">
              <Grid>
                {Object.entries(CAMPOS_AVISO).map(([key, label]) =>
                  aviso[key] ? <Info key={key} label={label} value={aviso[key]} /> : null
                )}
              </Grid>

              {aviso.descripcion && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    Descripción
                  </p>
                  <p className="text-sm text-slate-800">{aviso.descripcion}</p>
                </div>
              )}

              {tieneEquipos && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                    Equipos Asociados
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {aviso.equiposRelacion.map((e) => {
                      const info = getEquipoInfo(e.equipoId);
                      return (
                        <div
                          key={e.id}
                          className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl"
                        >
                          <div className="p-2 bg-slate-900 rounded-lg shrink-0">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {info.nombre || info.tag || "Sin nombre"}
                            </p>
                            {info.tag && info.nombre && (
                              <p className="text-xs text-slate-500 font-medium">
                                TAG: {info.tag}
                              </p>
                            )}
                            {info.ubicacion && (
                              <p className="text-xs text-slate-500">📍 {info.ubicacion}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {tieneUbicaciones && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                    Ubicaciones Técnicas Asociadas
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {aviso.ubicacionesRelacion.map((u) => {
                      const info = getUbicacionInfo(u.ubicacionTecnicaId);
                      return (
                        <div
                          key={u.id || u.ubicacionTecnicaId}
                          className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl"
                        >
                          <div className="p-2 bg-slate-900 rounded-lg shrink-0">
                            <Tag className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{info.nombre}</p>
                            <p className="text-xs text-slate-500 font-medium truncate">{info.tag}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Section>

            {/* ══ CORRECTIVO (VISTA SOBRIA) ══ */}
            {esCorrectivo && tieneEquipos && (
              <Section title="Actividades por Equipo (Correctivo)">
                <p className="text-sm text-slate-600">
                  Crea actividades manuales. Campos obligatorios: <b>Tarea</b>.
                </p>

                <div className="space-y-4">
                  {aviso.equiposRelacion.map((e) => {
                    const info = getEquipoInfo(e.equipoId);
                    const actividades = data.actividadesManuales[e.equipoId] || [];
                    const key = `corr-${e.equipoId}`;
                    const abierto = !collapsed[key];

                    return (
                      <div
                        key={e.equipoId}
                        className="border border-slate-200 rounded-xl bg-white overflow-hidden"
                      >
                        {/* Header equipo */}
                        <button
                          type="button"
                          onClick={() => toggleCollapse(key)}
                          className="w-full flex items-center justify-between gap-4 px-4 py-4 bg-white hover:bg-slate-50 transition border-b border-slate-200"
                        >
                          <div className="min-w-0 text-left">
                            <p className="font-semibold text-slate-900 truncate">
                              {info.nombre || info.tag || "Equipo"}
                            </p>
                            {info.tag && (
                              <p className="text-xs text-slate-500 truncate">TAG: {info.tag}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                              {actividades.length} actividad
                              {actividades.length !== 1 ? "es" : ""}
                            </span>

                            {abierto ? (
                              <ChevronUp className="w-5 h-5 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-500" />
                            )}
                          </div>
                        </button>

                        {abierto && (
                          <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-xs text-slate-500">
                                Agrega actividades y completa los campos.
                              </div>
                              <button
                                type="button"
                                onClick={() => agregarActividad(e.equipoId)}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 transition"
                              >
                                <Plus className="w-4 h-4" />
                                Agregar actividad
                              </button>
                            </div>

                            {actividades.length === 0 && (
                              <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-500">
                                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Aún no hay actividades.</p>
                              </div>
                            )}

                            {actividades.map((act, idx) => (
                              <ActividadCorrectivaForm
                                key={idx}
                                idx={idx}
                                act={act}
                                onChange={(campo, valor) =>
                                  actualizarActividad(e.equipoId, idx, campo, valor)
                                }
                                onDelete={() => eliminarActividad(e.equipoId, idx)}
                                toMinutes={toMinutes}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ══ PREVENTIVO (VISTA SOBRIA) ══ */}
            {esPreventivo && tieneEquipos && (
              <Section title="Plan por Equipo + Edición de Actividades">
                <p className="text-sm text-slate-600">
                  Selecciona un plan por equipo. Luego puedes ajustar: duración, unidad, técnicos y
                  observaciones.
                </p>

                <div className="space-y-4">
                  {aviso.equiposRelacion.map((rel) => {
                    const info = getEquipoInfo(rel.equipoId);
                    const equipoFull = getEquipoFull(rel.equipoId);

                    const planes = equipoFull?.planesMantenimiento || [];
                    const planIdSel = data.planesSeleccionados[rel.equipoId] || "";
                    const pack = data.preventivoPorEquipo?.[rel.equipoId];
                    const actividades = pack?.actividades || [];

                    const key = `prev-${rel.equipoId}`;
                    const abierto = !collapsed[key];

                    const totalMin = actividades.reduce(
                      (acc, a) =>
                        acc + (toMinutes(a.duracionEstimadaValor, a.unidadDuracion) || 0),
                      0
                    );

                    const sistemas = [
                      ...new Set(actividades.map((a) => a.sistema).filter(Boolean)),
                    ];

                    return (
                      <div
                        key={rel.equipoId}
                        className="border border-slate-200 rounded-xl bg-white overflow-hidden"
                      >
                        {/* Header + Plan selector */}
                        <div className="p-4 border-b border-slate-200 bg-white">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {info.nombre || info.tag || "Equipo"}
                              </p>
                              {info.tag && (
                                <p className="text-xs text-slate-500 truncate">TAG: {info.tag}</p>
                              )}
                              {info.ubicacion && (
                                <p className="text-xs text-slate-500">📍 {info.ubicacion}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {planIdSel && (
                                <>
                                  <MiniStat
                                    icon={ClipboardList}
                                    label={`${actividades.length} act.`}
                                  />
                                  {totalMin > 0 && (
                                    <MiniStat
                                      icon={Clock}
                                      label={
                                        totalMin >= 60
                                          ? `${Math.floor(totalMin / 60)}h ${
                                              totalMin % 60 ? `${totalMin % 60}m` : ""
                                            }`
                                          : `${totalMin}m`
                                      }
                                    />
                                  )}
                                  {sistemas.length > 0 && (
                                    <MiniStat
                                      icon={Layers}
                                      label={`${sistemas.length} sistema${
                                        sistemas.length !== 1 ? "s" : ""
                                      }`}
                                    />
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          <div className="mt-4">
                            <SelectField
                              label="Plan de mantenimiento *"
                              value={planIdSel}
                              onChange={(v) => seleccionarPlan(rel.equipoId, v)}
                            >
                              <option value="">Seleccionar plan...</option>
                              {planes.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                  {plan.codigoPlan} — {plan.nombre}
                                </option>
                              ))}
                            </SelectField>

                            {planes.length === 0 && (
                              <p className="text-xs text-amber-700 mt-2">
                                Este equipo no tiene planes asociados.
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

                                <button
                                  type="button"
                                  onClick={() => toggleCollapse(key)}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm text-slate-700 transition"
                                >
                                  {abierto ? (
                                    <>
                                      <ChevronUp className="w-4 h-4" />
                                      Ocultar actividades
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-4 h-4" />
                                      Ver / Editar actividades
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actividades */}
                        {planIdSel && actividades.length > 0 && abierto && (
                          <div className="p-4 space-y-3 bg-slate-50">
                            {actividades.map((act, idx) => (
                              <ActividadPreventivaEditable
                                key={act.planMantenimientoActividadId || idx}
                                act={act}
                                idx={idx}
                                onChange={(campo, valor) =>
                                  updatePreventivoActividad(rel.equipoId, idx, campo, valor)
                                }
                                toMinutes={toMinutes}
                              />
                            ))}
                          </div>
                        )}

                        {planIdSel && actividades.length === 0 && abierto && (
                          <div className="p-4 bg-slate-50">
                            <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-500">
                              <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                              <p className="text-sm">No se cargaron actividades del plan.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="p-6 border-t bg-white flex justify-between items-center shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
            >
              Cancelar
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSolicitud(true)}
                className={`flex items-center gap-2 px-6 py-3 border rounded-xl transition-colors ${
                  solicitudes
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {solicitudes
                  ? `Solicitud cargada ✓${
                      cantSolicitudesIndividuales > 0
                        ? ` (+${cantSolicitudesIndividuales} equipo${
                            cantSolicitudesIndividuales > 1 ? "s" : ""
                          })`
                        : ""
                    }`
                  : "Solicitud de Compra"}
              </button>

              <button
                onClick={handleGuardarCambios}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? "Guardando..." : "Guardar Cambios (Pendiente)"}
              </button>

              <button
                onClick={handleGuardar}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? "Guardando..." : "Cambio de estado a Tratado"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SOLICITUD */}
      <ModalSolicitudCompra
        isOpen={showSolicitud}
        onClose={() => setShowSolicitud(false)}
        onConfirm={(result) => {
          setSolicitudes(result);
          setShowSolicitud(false);
          setErrorMsg("");
        }}
        equiposRelacion={aviso?.equiposRelacion || []}
        equiposInfo={equipos}
        initialValue={solicitudes}
      />

      <ModalConfiguracionCampos
        isOpen={showConfigCampos}
        onClose={() => setShowConfigCampos(false)}
      />
    </>
  );
}

/* ══════════════════════════════════════════════
   CORRECTIVO: Form sobrio (3 columnas)
══════════════════════════════════════════════ */

function ActividadCorrectivaForm({ idx, act, onChange, onDelete, toMinutes }) {
  const normalizado = toMinutes(act.duracionEstimadaValor, act.unidadDuracion);

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">
            Actividad #{idx + 1}
            {act.tarea ? (
              <span className="text-slate-500 font-normal"> — {act.tarea}</span>
            ) : null}
          </p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <Badge text={act.tipoTrabajo || "—"} />
            <Badge text={act.rolTecnico || "—"} />
            <Badge text={`${normalizado} min`} icon={Clock} />
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar
        </button>
      </div>

      {/* Grid 3 columnas */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextField
          label="Sistema"
          value={act.sistema}
          onChange={(v) => onChange("sistema", v)}
        />
        <TextField
          label="Subsistema"
          value={act.subsistema}
          onChange={(v) => onChange("subsistema", v)}
        />
        <TextField
          label="Componente"
          value={act.componente}
          onChange={(v) => onChange("componente", v)}
        />

        <TextField
          label="Tarea *"
          value={act.tarea}
          onChange={(v) => onChange("tarea", v)}
        />
        <TextField
          label="Descripción"
          value={act.descripcion}
          onChange={(v) => onChange("descripcion", v)}
        />
        <SelectField
          label="Tipo de trabajo"
          value={act.tipoTrabajo}
          onChange={(v) => onChange("tipoTrabajo", v)}
        >
          {TIPOS_TRABAJO_CORRECTIVO.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Rol técnico"
          value={act.rolTecnico}
          onChange={(v) => onChange("rolTecnico", v)}
        >
          {ROLES_TECNICOS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </SelectField>

        <NumberField
          label="Cantidad técnicos"
          min={1}
          value={act.cantidadTecnicos}
          onChange={(v) => onChange("cantidadTecnicos", Number(v))}
        />

        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Duración"
            value={act.duracionEstimadaValor}
            onChange={(v) => onChange("duracionEstimadaValor", Number(v))}
          />
          <SelectField
            label="Unidad"
            value={act.unidadDuracion}
            onChange={(v) => onChange("unidadDuracion", v)}
          >
            <option value="min">Min</option>
            <option value="h">Hrs</option>
          </SelectField>
        </div>

        <div className="md:col-span-3">
          <TextAreaField
            label="Observaciones"
            value={act.observaciones || ""}
            onChange={(v) => onChange("observaciones", v)}
          />
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" />
        Normalizado: {normalizado} min
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PREVENTIVO: Actividad editable (sobria)
══════════════════════════════════════════════ */

function ActividadPreventivaEditable({ act, idx, onChange, toMinutes }) {
  const normalizado = toMinutes(act.duracionEstimadaValor, act.unidadDuracion);

  const resumen = [
    act?.codigoActividad ? `#${act.codigoActividad}` : null,
    act?.tarea ? act.tarea : "Sin tarea",
    act?.tipoTrabajo ? act.tipoTrabajo.replace(/_/g, " ") : null,
    act?.rolTecnico ? act.rolTecnico.replace(/_/g, " ") : null,
  ].filter(Boolean);

  const ruta = [act?.sistema, act?.subsistema, act?.componente].filter(Boolean);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      {/* HEADER RESUMEN */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {idx + 1}. {resumen.join(" · ")}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              {ruta.length ? ruta.join("  ›  ") : "Sin sistema / subsistema / componente"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
              {normalizado} min
            </span>

            {act?.cantidadTecnicos ? (
              <span className="text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                {act.cantidadTecnicos} técnico{act.cantidadTecnicos !== 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* BODY: Detalle + Edición */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-50">
        {/* DETALLES (tipo ficha) */}
        <div className="lg:col-span-7">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">
            Detalles de la actividad
          </p>

          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <FilaDetalle label="Código" value={act?.codigoActividad || "—"} />
                <FilaDetalle label="Sistema" value={act?.sistema || "—"} />
                <FilaDetalle label="Subsistema" value={act?.subsistema || "—"} />
                <FilaDetalle label="Componente" value={act?.componente || "—"} />
                <FilaDetalle label="Tarea" value={act?.tarea || "—"} />
                <FilaDetalle
                  label="Tipo trabajo"
                  value={act?.tipoTrabajo ? act.tipoTrabajo.replace(/_/g, " ") : "—"}
                />
                <FilaDetalle
                  label="Rol técnico"
                  value={act?.rolTecnico ? act.rolTecnico.replace(/_/g, " ") : "—"}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* EDICIÓN (claro y 3 por fila) */}
        <div className="lg:col-span-5">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">
            Ajustes (editables)
          </p>

          <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <NumberField
                label="Duración"
                value={act.duracionEstimadaValor}
                onChange={(v) => onChange("duracionEstimadaValor", Number(v))}
              />

              <SelectField
                label="Unidad"
                value={act.unidadDuracion}
                onChange={(v) => onChange("unidadDuracion", v)}
              >
                <option value="min">Min</option>
                <option value="h">Hrs</option>
              </SelectField>

              <NumberField
                label="Técnicos"
                min={1}
                value={act.cantidadTecnicos}
                onChange={(v) => onChange("cantidadTecnicos", Number(v))}
              />
            </div>

            <TextAreaField
              label="Observaciones"
              value={act.observaciones || ""}
              onChange={(v) => onChange("observaciones", v)}
            />

            <div className="text-xs text-slate-500">
              Normalizado: <b className="text-slate-700">{normalizado} min</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
/* ══════════════════════════════════════════════
   UI HELPERS (sobrios)
══════════════════════════════════════════════ */

function Section({ title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-lg text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Info({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function Badge({ text, icon: Icon }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
      {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
      {String(text || "").replace(/_/g, " ")}
    </span>
  );
}

function MiniStat({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function BaseField({ label, children }) {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-500 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <BaseField label={label}>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
      />
    </BaseField>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <BaseField label={label}>
      <textarea
        rows={3}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 resize-none"
      />
    </BaseField>
  );
}

function NumberField({ label, value, onChange, min }) {
  return (
    <BaseField label={label}>
      <input
        type="number"
        min={min}
        value={Number.isFinite(Number(value)) ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
      />
    </BaseField>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <BaseField label={label}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
      >
        {children}
      </select>
    </BaseField>
  );
}

function FilaDetalle({ label, value }) {
  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="w-[180px] px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50">
        {label}
      </td>
      <td className="px-3 py-2 text-sm text-slate-800">
        {String(value ?? "—")}
      </td>
    </tr>
  );
}