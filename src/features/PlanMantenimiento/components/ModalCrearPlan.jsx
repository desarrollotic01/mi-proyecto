import { useEffect, useMemo, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Save,
  Wrench,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Upload,
  FileText,
  Sparkles,
  Package,
  CalendarDays,
  Hash,
} from "lucide-react";
import { planMantenimientoService } from "../services/planMantenimientoService";
import { equipoService } from "../../mantenimiento/services/equipoService";

/** UID simple para el front (no dependas del index) */
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `uid_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const normalize = (v) => (v === "" || v === undefined ? null : v);

/** Helpers duración UI */
const toMinutes = (valor, unidad) => {
  const v = Number(valor);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return unidad === "h" ? Math.round(v * 60) : Math.round(v);
};

const fromMinutes = (minutos, unidad) => {
  const m = Number(minutos);
  if (!Number.isFinite(m) || m <= 0) return 0;
  return unidad === "h" ? m / 60 : m;
};

const FRECUENCIAS = [
  { value: "POR_HORA", label: "Por hora" },
  { value: "DIARIA", label: "Diaria" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "QUINCENAL", label: "Quincenal" },
  { value: "MENSUAL", label: "Mensual" },
  { value: "TRIMESTRAL", label: "Trimestral" },
  { value: "SEMESTRAL", label: "Semestral" },
  { value: "ANUAL", label: "Anual" },
  { value: "BIENAL", label: "Bienal" },
  { value: "QUINQUENAL", label: "Quinquenal" },
];

const DEFAULT_ACTIVIDAD = () => ({
  uid: uid(),
  sistema: "",
  subsistema: "",
  componente: "",
  tarea: "",
  tipoTrabajo: "REVISION",
  rolTecnico: "tecnico_mecanico",

  duracionValor: 30,
  unidadDuracion: "min",

  cantidadTecnicos: 1,
  items: [],
  adjuntos: [],
});

const DEFAULT_ITEM_ACTIVIDAD = () => ({
  uid: uid(),
  recurso: "MATERIAL",
  itemCode: "",
  item: "",
  unidad: "",
  cantidad: 1,
  observacion: "",
});

const DEFAULT_ITEM_PLAN = () => ({
  uid: uid(),
  itemCode: "",
  description: "",
  quantity: 1,
  warehouseCode: "01",
  costCenter: "",
  projectCode: "",
  rubro: "",
  paqueteTrabajo: "",
  observacion: "",
});

export default function ModalCrearPlan({
  onClose,
  onCreated,
  equipoPreseleccionado,
}) {
  const [equipos, setEquipos] = useState([]);
  const [guardando, setGuardando] = useState(false);

  /** expanded por uid (no por index) */
  const [expandedByUid, setExpandedByUid] = useState({});

  // ✅ items/adjuntos generales del plan
  const [itemsPlan, setItemsPlan] = useState([DEFAULT_ITEM_PLAN()]);
  const [adjuntosPlan, setAdjuntosPlan] = useState([]);

  const [form, setForm] = useState({
    // ✅ Backend exige
    codigoPlan: "",

    familiaId: equipoPreseleccionado?.familia?.id || "",
    tipoEquipo: equipoPreseleccionado?.tipoEquipo || "",
    modeloEquipo: equipoPreseleccionado?.modelo || "",
    equipoId: equipoPreseleccionado?.id || "",
    nombre: equipoPreseleccionado
      ? `Plan de Mantenimiento - ${
          equipoPreseleccionado.nombre || equipoPreseleccionado.codigo
        }`
      : "",
    tipo: "PREVENTIVO",

    // ✅ NUEVO: frecuencia del plan (obligatorio en backend)
    frecuencia: "MENSUAL",
    // ✅ Solo si frecuencia = POR_HORA
    frecuenciaHoras: "",
  });

  const [actividades, setActividades] = useState([]);

  // =========================
  // CARGA EQUIPOS
  // =========================
  useEffect(() => {
    const loadEquipos = async () => {
      try {
        const data = await equipoService.getEquipos();
        const normalizados = (data || []).map((e) => ({
          ...e,
          familiaId: e.familia?.id || null,
          familiaNombre: e.familia?.nombre || "",
          tipoEquipo: e.tipoEquipo || "",
          modelo: e.modelo || "",
        }));
        setEquipos(normalizados);
      } catch (err) {
        console.error(err);
        setEquipos([]);
      }
    };
    loadEquipos();
  }, []);

  // =========================
  // SI CAMBIA equipoPreseleccionado: sincroniza form
  // =========================
  useEffect(() => {
    if (!equipoPreseleccionado) return;
    setForm((prev) => ({
      ...prev,
      familiaId: equipoPreseleccionado?.familia?.id || "",
      tipoEquipo: equipoPreseleccionado?.tipoEquipo || "",
      modeloEquipo: equipoPreseleccionado?.modelo || "",
      equipoId: equipoPreseleccionado?.id || "",
      nombre: `Plan de Mantenimiento - ${
        equipoPreseleccionado.nombre || equipoPreseleccionado.codigo
      }`,
    }));
  }, [equipoPreseleccionado]);

  // Si el usuario cambia frecuencia y ya no es POR_HORA, limpiamos frecuenciaHoras
  useEffect(() => {
    if (form.frecuencia !== "POR_HORA" && form.frecuenciaHoras) {
      setForm((p) => ({ ...p, frecuenciaHoras: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.frecuencia]);

  // =========================
  // MEMO FILTROS
  // =========================
  const familias = useMemo(() => {
    return [
      ...new Map(
        equipos
          .filter((e) => e.familiaId)
          .map((e) => [e.familiaId, { id: e.familiaId, nombre: e.familiaNombre }])
      ).values(),
    ];
  }, [equipos]);

  const tipos = useMemo(() => {
    return [
      ...new Set(
        equipos
          .filter((e) => !form.familiaId || e.familiaId === form.familiaId)
          .map((e) => e.tipoEquipo)
          .filter(Boolean)
      ),
    ];
  }, [equipos, form.familiaId]);

  const modelos = useMemo(() => {
    return [
      ...new Set(
        equipos
          .filter((e) => {
            if (form.familiaId && e.familiaId !== form.familiaId) return false;
            if (form.tipoEquipo && e.tipoEquipo !== form.tipoEquipo) return false;
            return true;
          })
          .map((e) => e.modelo)
          .filter(Boolean)
      ),
    ];
  }, [equipos, form.familiaId, form.tipoEquipo]);

  const equiposFiltrados = useMemo(() => {
    return equipos.filter((e) => {
      if (form.familiaId && e.familiaId !== form.familiaId) return false;
      if (form.tipoEquipo && e.tipoEquipo !== form.tipoEquipo) return false;
      if (form.modeloEquipo && e.modelo !== form.modeloEquipo) return false;
      return true;
    });
  }, [equipos, form.familiaId, form.tipoEquipo, form.modeloEquipo]);

  // =========================
  // CRUD ITEMS PLAN
  // =========================
  const addItemPlan = () => setItemsPlan((p) => [...p, DEFAULT_ITEM_PLAN()]);
  const updateItemPlan = (uidItem, patch) =>
    setItemsPlan((prev) =>
      prev.map((it) => (it.uid === uidItem ? { ...it, ...patch } : it))
    );
  const removeItemPlan = (uidItem) =>
    setItemsPlan((prev) => prev.filter((it) => it.uid !== uidItem));

  // =========================
  // CRUD ACTIVIDADES
  // =========================
  const agregarActividad = () => {
    const act = DEFAULT_ACTIVIDAD();
    setActividades((prev) => [...prev, act]);
    setExpandedByUid((prev) => ({ ...prev, [act.uid]: true }));
  };

  const eliminarActividad = (uidActividad) => {
    setActividades((prev) => prev.filter((a) => a.uid !== uidActividad));
    setExpandedByUid((prev) => {
      const copy = { ...prev };
      delete copy[uidActividad];
      return copy;
    });
  };

  const toggleActividad = (uidActividad) => {
    setExpandedByUid((prev) => ({
      ...prev,
      [uidActividad]: !prev[uidActividad],
    }));
  };

  const updateActividad = (uidActividad, patch) => {
    setActividades((prev) =>
      prev.map((a) => (a.uid === uidActividad ? { ...a, ...patch } : a))
    );
  };

  const addItemToActividad = (uidActividad) => {
    setActividades((prev) =>
      prev.map((a) => {
        if (a.uid !== uidActividad) return a;
        return { ...a, items: [...a.items, DEFAULT_ITEM_ACTIVIDAD()] };
      })
    );
  };

  const updateItemActividad = (uidActividad, uidItem, patch) => {
    setActividades((prev) =>
      prev.map((a) => {
        if (a.uid !== uidActividad) return a;
        return {
          ...a,
          items: a.items.map((it) =>
            it.uid === uidItem ? { ...it, ...patch } : it
          ),
        };
      })
    );
  };

  const removeItemActividad = (uidActividad, uidItem) => {
    setActividades((prev) =>
      prev.map((a) => {
        if (a.uid !== uidActividad) return a;
        return { ...a, items: a.items.filter((it) => it.uid !== uidItem) };
      })
    );
  };

  // =========================
  // UPLOAD ADJUNTOS (plan)
  // =========================
  const subirAdjuntosPlan = async (files) => {
    if (!files?.length) return;

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/adjuntos/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Error al subir adjuntos del plan");
      }
      const archivos = await res.json();
      setAdjuntosPlan((prev) => [...prev, ...(archivos || [])]);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error al subir archivos");
    }
  };

  // =========================
  // UPLOAD ADJUNTOS (por actividad)
  // =========================
  const subirAdjuntosActividad = async (uidActividad, files) => {
    if (!files?.length) return;

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/adjuntos/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Error al subir adjuntos");
      }
      const archivos = await res.json();

      setActividades((prev) =>
        prev.map((a) => {
          if (a.uid !== uidActividad) return a;
          return {
            ...a,
            adjuntos: [...(a.adjuntos || []), ...(archivos || [])],
          };
        })
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "Error al subir archivos");
    }
  };

  // =========================
  // VALIDACIONES (alineadas backend)
  // =========================
  const validarAntesDeGuardar = () => {
    // ✅ Backend: codigoPlan obligatorio
    if (!form.codigoPlan?.trim()) return "El código del plan (codigoPlan) es obligatorio";

    if (!form.nombre?.trim()) return "El nombre del plan es obligatorio";
    if (!form.tipo) return "El tipo de plan es obligatorio";

    // ✅ Backend: frecuencia obligatoria
    if (!form.frecuencia) return "La frecuencia del plan es obligatoria";

    // ✅ Solo si frecuencia = POR_HORA -> frecuenciaHoras obligatoria (>0)
    if (form.frecuencia === "POR_HORA") {
      const fh = Number(form.frecuenciaHoras);
      if (!Number.isFinite(fh) || fh <= 0) return "Si la frecuencia es POR_HORA, frecuenciaHoras debe ser > 0";
      if (!Number.isInteger(fh)) return "frecuenciaHoras debe ser un número entero";
    }

    // Backend exige al menos Familia / Tipo / Modelo
    if (!form.familiaId && !form.tipoEquipo && !form.modeloEquipo) {
      return "Debe especificar al menos Familia, Tipo o Modelo para el plan";
    }

    if (!Array.isArray(actividades) || actividades.length === 0) {
      return "El plan de mantenimiento debe tener al menos una actividad";
    }

    // Items plan (si hay)
    const filtradosPlan = (itemsPlan || []).filter(
      (x) => (x.itemCode || "").trim() || (x.description || "").trim()
    );
    for (let i = 0; i < filtradosPlan.length; i++) {
      const it = filtradosPlan[i];
      const n = i + 1;

      if (!it.itemCode?.trim()) return `ItemPlan ${n}: itemCode obligatorio`;
      const q = Number(it.quantity);
      if (!Number.isFinite(q) || q <= 0) return `ItemPlan ${n}: quantity debe ser > 0`;
      const wh = String(it.warehouseCode || "01").trim();
      if (!wh) return `ItemPlan ${n}: warehouseCode obligatorio`;
    }

    // Actividades + items
    for (let i = 0; i < actividades.length; i++) {
      const a = actividades[i];
      const n = i + 1;

      if (!a.tarea?.trim()) return `Actividad ${n}: tarea obligatoria`;
      if (!a.tipoTrabajo) return `Actividad ${n}: tipoTrabajo obligatorio`;
      if (!a.rolTecnico) return `Actividad ${n}: rolTecnico obligatorio`;

      const valor = Number(a.duracionValor);
      if (!Number.isFinite(valor) || valor <= 0) return `Actividad ${n}: duración inválida`;
      if (!a.unidadDuracion || !["min", "h"].includes(a.unidadDuracion))
        return `Actividad ${n}: unidadDuracion inválida`;

      const ct = Number(a.cantidadTecnicos);
      if (!Number.isFinite(ct) || ct <= 0)
        return `Actividad ${n}: cantidadTecnicos debe ser > 0`;

      if (Array.isArray(a.items) && a.items.length > 0) {
        for (let j = 0; j < a.items.length; j++) {
          const it = a.items[j];
          const m = j + 1;

          if (!it.recurso) return `Actividad ${n} Item ${m}: recurso obligatorio`;
          if (!it.item?.trim()) return `Actividad ${n} Item ${m}: item obligatorio`;
          if (!it.itemCode?.trim()) return `Actividad ${n} Item ${m}: itemCode obligatorio`;
          if (!it.unidad?.trim()) return `Actividad ${n} Item ${m}: unidad obligatoria`;

          const cant = Number(it.cantidad);
          if (!Number.isFinite(cant) || cant <= 0)
            return `Actividad ${n} Item ${m}: cantidad debe ser > 0`;
        }
      }
    }

    return null;
  };

  // =========================
  // GUARDAR PLAN
  // =========================
  const guardarPlan = async () => {
    const err = validarAntesDeGuardar();
    if (err) {
      alert(err);
      return;
    }

    setGuardando(true);

    try {
      const esEspecifico = !!equipoPreseleccionado?.id;
      const equipoObjetivoId = esEspecifico ? equipoPreseleccionado.id : null;

      const itemsPlanClean = (itemsPlan || [])
        .filter((x) => (x.itemCode || "").trim() || (x.description || "").trim())
        .map((it) => ({
          itemCode: it.itemCode?.trim(),
          description: it.description?.trim() || null,
          quantity: Number(it.quantity),
          warehouseCode: String(it.warehouseCode || "01").trim(),
          costCenter: it.costCenter?.trim() || null,
          projectCode: it.projectCode?.trim() || null,
          rubro: it.rubro?.trim() || null,
          paqueteTrabajo: it.paqueteTrabajo?.trim() || null,
          observacion: it.observacion?.trim() || null,
        }));

      const payload = {
        // ✅ requeridos según tu modelo
        codigoPlan: form.codigoPlan?.trim(),
        nombre: form.nombre?.trim(),
        tipo: form.tipo,
        frecuencia: form.frecuencia,
        frecuenciaHoras:
          form.frecuencia === "POR_HORA" ? Number(form.frecuenciaHoras) : null,

        familiaId: normalize(form.familiaId),
        tipoEquipo: normalize(form.tipoEquipo),
        modeloEquipo: normalize(form.modeloEquipo),

        esEspecifico,
        equipoObjetivoId,

        // ✅ items/adjuntos del plan
        itemsPlan: itemsPlanClean,
        adjuntosPlan: adjuntosPlan || [],

        // ✅ actividades siguen con items/adjuntos
        actividades: actividades.map((a) => ({
          sistema: normalize(a.sistema),
          subsistema: normalize(a.subsistema),
          componente: normalize(a.componente),
          tarea: a.tarea?.trim(),
          tipoTrabajo: a.tipoTrabajo,
          rolTecnico: a.rolTecnico,

          duracionValor: Number(a.duracionValor),
          unidadDuracion: a.unidadDuracion,

          cantidadTecnicos: Number(a.cantidadTecnicos),

          items: (a.items || []).map((it) => ({
            recurso: it.recurso,
            item: it.item?.trim(),
            itemCode: it.itemCode?.trim(),
            unidad: it.unidad?.trim(),
            cantidad: Number(it.cantidad),
            observacion: normalize(it.observacion),
          })),

          adjuntos: a.adjuntos || [],
        })),
      };

      await planMantenimientoService.createPlan(payload);

      onCreated?.();
      onClose?.();
    } catch (error) {
      console.error(error);
      alert(error?.message || "Error al guardar el plan");
    } finally {
      setGuardando(false);
    }
  };

  const disabledPorEquipo = !!equipoPreseleccionado;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-7xl max-h-[96vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col">
        {/* HEADER */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 text-white relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-xl p-3 rounded-2xl shadow-lg">
                <Wrench size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1 flex items-center gap-2">
                  Crear Plan de Mantenimiento
                  <Sparkles size={24} className="text-yellow-300" />
                </h2>
                <p className="text-blue-100 text-sm">
                  {equipoPreseleccionado
                    ? `📌 Plan específico para: ${equipoPreseleccionado.codigo} - ${
                        equipoPreseleccionado.nombre || "Sin nombre"
                      }`
                    : "Define actividades, recursos y adjuntos del plan"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50">
          {/* INFO PLAN */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-800">
                Información del Plan
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* CODIGO PLAN */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Hash size={16} />
                  Código del Plan <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border-2 border-slate-300 p-3.5 rounded-xl outline-none"
                  value={form.codigoPlan}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, codigoPlan: e.target.value }))
                  }
                  placeholder="PM-0001"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Debe ser único (según tu modelo).
                </p>
              </div>

              {/* FRECUENCIA */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <CalendarDays size={16} />
                  Frecuencia <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.frecuencia}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, frecuencia: e.target.value }))
                  }
                  className="w-full border-2 border-slate-300 p-3.5 rounded-xl outline-none bg-white"
                >
                  {FRECUENCIAS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* FRECUENCIA HORAS (solo POR_HORA) */}
              <div className="relative">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Clock size={16} />
                  Frecuencia (horas)
                  {form.frecuencia === "POR_HORA" && (
                    <span className="text-red-500">*</span>
                  )}
                </label>

                {form.frecuencia === "POR_HORA" ? (
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.frecuenciaHoras}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        frecuenciaHoras: e.target.value,
                      }))
                    }
                    className="w-full border-2 border-slate-300 p-3.5 rounded-xl outline-none"
                    placeholder="Ej: 8"
                  />
                ) : (
                  <div className="w-full border-2 border-slate-200 p-3.5 rounded-xl bg-slate-50 text-slate-500 text-sm">
                    Solo aplica si la frecuencia es <b>POR_HORA</b>
                  </div>
                )}
              </div>

              {/* FAMILIA */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Familia
                </label>
                <select
                  value={form.familiaId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, familiaId: e.target.value }))
                  }
                  disabled={disabledPorEquipo}
                  className={`w-full border-2 border-slate-300 p-3.5 rounded-xl outline-none ${
                    disabledPorEquipo
                      ? "bg-slate-100 cursor-not-allowed"
                      : "bg-white"
                  }`}
                >
                  <option value="">Todas las familias</option>
                  {familias.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* TIPO */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Tipo de Equipo
                </label>
                <select
                  value={form.tipoEquipo}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      tipoEquipo: e.target.value,
                      modeloEquipo: "",
                      equipoId: "",
                    }))
                  }
                  disabled={disabledPorEquipo}
                  className={`w-full border-2 border-slate-300 p-3.5 rounded-xl outline-none ${
                    disabledPorEquipo
                      ? "bg-slate-100 cursor-not-allowed"
                      : "bg-white"
                  }`}
                >
                  <option value="">Todos los tipos</option>
                  {tipos.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* MODELO */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Modelo
                </label>
                <select
                  value={form.modeloEquipo}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      modeloEquipo: e.target.value,
                      equipoId: "",
                    }))
                  }
                  disabled={disabledPorEquipo}
                  className={`w-full border-2 border-slate-300 p-3.5 rounded-xl outline-none ${
                    disabledPorEquipo
                      ? "bg-slate-100 cursor-not-allowed"
                      : "bg-white"
                  }`}
                >
                  <option value="">Todos los modelos</option>
                  {modelos.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* EQUIPO UI */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Equipo (solo filtro UI)
                </label>
                <select
                  value={form.equipoId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, equipoId: e.target.value }))
                  }
                  disabled={disabledPorEquipo}
                  className={`w-full border-2 border-slate-300 p-3.5 rounded-xl outline-none ${
                    disabledPorEquipo
                      ? "bg-green-100 cursor-not-allowed"
                      : "bg-white"
                  }`}
                >
                  <option value="">Todos los equipos</option>
                  {equiposFiltrados.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.codigo} - {eq.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* NOMBRE */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nombre del Plan <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border-2 border-slate-300 p-3.5 rounded-xl outline-none"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nombre: e.target.value }))
                  }
                />
              </div>

              {/* TIPO PLAN */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Tipo de Plan
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tipo: e.target.value }))
                  }
                  className="w-full border-2 border-slate-300 p-3.5 rounded-xl outline-none bg-white"
                >
                  <option>PREVENTIVO</option>
                  <option>CORRECTIVO</option>
                  <option>MEJORA</option>
                  <option>INSPECCION</option>
                </select>
              </div>
            </div>
          </div>

          {/* =========================
              ✅ ITEMS GENERALES DEL PLAN
          ========================= */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-6">
            <div className="flex justify-between items-center p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-600 to-purple-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  Recursos del Plan (General)
                  <Package className="w-5 h-5 text-indigo-600" />
                </h3>
              </div>

              <button
                type="button"
                onClick={addItemPlan}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
              >
                <Plus size={18} />
                Agregar Item Plan
              </button>
            </div>

            <div className="p-6 space-y-3 bg-gradient-to-br from-slate-50 to-white">
              {itemsPlan.map((it) => (
                <div
                  key={it.uid}
                  className="bg-white border-2 border-slate-200 rounded-xl p-4 relative"
                >
                  <button
                    type="button"
                    onClick={() => removeItemPlan(it.uid)}
                    className="absolute top-3 right-3 text-red-600 hover:text-red-800 bg-white rounded-lg p-1.5 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pr-10">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                        ItemCode <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={it.itemCode}
                        onChange={(e) =>
                          updateItemPlan(it.uid, { itemCode: e.target.value })
                        }
                        className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                        Descripción
                      </label>
                      <input
                        value={it.description}
                        onChange={(e) =>
                          updateItemPlan(it.uid, { description: e.target.value })
                        }
                        className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                        Cantidad <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) =>
                          updateItemPlan(it.uid, {
                            quantity: Number(e.target.value),
                          })
                        }
                        className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                        Almacén
                      </label>
                      <input
                        value={it.warehouseCode}
                        onChange={(e) =>
                          updateItemPlan(it.uid, {
                            warehouseCode: e.target.value,
                          })
                        }
                        className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                        Centro costo
                      </label>
                      <input
                        value={it.costCenter}
                        onChange={(e) =>
                          updateItemPlan(it.uid, { costCenter: e.target.value })
                        }
                        className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                        Proyecto
                      </label>
                      <input
                        value={it.projectCode}
                        onChange={(e) =>
                          updateItemPlan(it.uid, { projectCode: e.target.value })
                        }
                        className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                        Rubro
                      </label>
                      <input
                        value={it.rubro}
                        onChange={(e) =>
                          updateItemPlan(it.uid, { rubro: e.target.value })
                        }
                        className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                        Paquete trabajo
                      </label>
                      <input
                        value={it.paqueteTrabajo}
                        onChange={(e) =>
                          updateItemPlan(it.uid, {
                            paqueteTrabajo: e.target.value,
                          })
                        }
                        className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none"
                      />
                    </div>

                    <div className="md:col-span-6">
                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                        Observación
                      </label>
                      <input
                        value={it.observacion}
                        onChange={(e) =>
                          updateItemPlan(it.uid, { observacion: e.target.value })
                        }
                        className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =========================
              ✅ ADJUNTOS GENERALES DEL PLAN
          ========================= */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-6">
            <div className="flex justify-between items-center p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-amber-600 to-orange-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-slate-800">
                  Adjuntos del Plan (General)
                </h3>
              </div>

              <label className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-xl font-bold cursor-pointer">
                <Upload size={18} />
                Subir
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => subirAdjuntosPlan(e.target.files)}
                />
              </label>
            </div>

            <div className="p-6 bg-gradient-to-br from-slate-50 to-white">
              {adjuntosPlan.length === 0 ? (
                <div className="text-sm text-slate-500">
                  Sin adjuntos generales.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {adjuntosPlan.map((a, i) => (
                    <div
                      key={`${a?.id || a?.nombre || "adj"}_${i}`}
                      className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <FileText size={16} className="text-amber-600" />
                      <span className="text-amber-800 font-medium flex-1 truncate">
                        {a?.nombre || "archivo"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* =========================
              ACTIVIDADES (con items y adjuntos por actividad)
          ========================= */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-green-600 to-emerald-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-slate-800">
                  Actividades del Plan{" "}
                  <span className="ml-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                    {actividades.length}
                  </span>
                </h3>
              </div>

              <button
                onClick={agregarActividad}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
              >
                <Plus size={20} />
                Agregar Actividad
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
              {actividades.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-dashed border-slate-300">
                  <div className="bg-slate-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Plus className="text-slate-500" size={36} />
                  </div>
                  <p className="text-slate-700 font-bold text-lg">
                    Sin actividades
                  </p>
                </div>
              ) : (
                actividades.map((act, index) => {
                  const abierto = !!expandedByUid[act.uid];

                  return (
                    <div
                      key={act.uid}
                      className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden"
                    >
                      {/* HEADER ACTIVIDAD */}
                      <div
                        className="flex items-center gap-3 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer"
                        onClick={() => toggleActividad(act.uid)}
                      >
                        <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>

                        <div className="flex-1">
                          <span className="text-xs font-semibold text-blue-600 uppercase">
                            Actividad {index + 1}
                          </span>
                          <h4 className="font-bold text-slate-800 text-lg">
                            {act.tarea || "Nueva actividad"}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarActividad(act.uid);
                            }}
                            className="bg-red-100 hover:bg-red-200 text-red-600 p-2.5 rounded-xl"
                          >
                            <Trash2 size={18} />
                          </button>
                          {abierto ? (
                            <ChevronUp className="text-slate-400" size={24} />
                          ) : (
                            <ChevronDown className="text-slate-400" size={24} />
                          )}
                        </div>
                      </div>

                      {/* CONTENIDO */}
                      {abierto && (
                        <div className="p-6 space-y-6">
                          {/* Básico */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">
                                Sistema
                              </label>
                              <input
                                value={act.sistema}
                                onChange={(e) =>
                                  updateActividad(act.uid, {
                                    sistema: e.target.value,
                                  })
                                }
                                className="w-full border-2 border-slate-300 p-3 rounded-xl text-sm outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">
                                Subsistema
                              </label>
                              <input
                                value={act.subsistema}
                                onChange={(e) =>
                                  updateActividad(act.uid, {
                                    subsistema: e.target.value,
                                  })
                                }
                                className="w-full border-2 border-slate-300 p-3 rounded-xl text-sm outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">
                                Componente
                              </label>
                              <input
                                value={act.componente}
                                onChange={(e) =>
                                  updateActividad(act.uid, {
                                    componente: e.target.value,
                                  })
                                }
                                className="w-full border-2 border-slate-300 p-3 rounded-xl text-sm outline-none"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-slate-600 mb-2">
                                Tarea <span className="text-red-500">*</span>
                              </label>
                              <input
                                value={act.tarea}
                                onChange={(e) =>
                                  updateActividad(act.uid, {
                                    tarea: e.target.value,
                                  })
                                }
                                className="w-full border-2 border-slate-300 p-3 rounded-xl text-sm outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">
                                Tipo de Trabajo
                              </label>
                              <select
                                value={act.tipoTrabajo}
                                onChange={(e) =>
                                  updateActividad(act.uid, {
                                    tipoTrabajo: e.target.value,
                                  })
                                }
                                className="w-full border-2 border-slate-300 p-3 rounded-xl text-sm outline-none bg-white"
                              >
                                <option value="TORQUEO_REGULACION">
                                  Torqueo/Regulación
                                </option>
                                <option value="APLICACION">Aplicación</option>
                                <option value="REVISION">Revisión</option>
                                <option value="INSPECCION">Inspección</option>
                                <option value="CAMBIO">Cambio</option>
                                <option value="LIMPIEZA">Limpieza</option>
                                <option value="AJUSTE">Ajuste</option>
                                <option value="LUBRICACION">Lubricación</option>
                                <option value="REPARACION">Reparación</option>
                              </select>
                            </div>
                          </div>

                          {/* Duración + rol + técnicos */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                                <Clock size={14} /> Duración
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  value={act.duracionValor}
                                  onChange={(e) =>
                                    updateActividad(act.uid, {
                                      duracionValor:
                                        e.target.value === ""
                                          ? 0
                                          : Number(e.target.value),
                                    })
                                  }
                                  className="flex-1 border-2 border-slate-300 p-3 rounded-xl text-sm outline-none"
                                />
                                <select
                                  value={act.unidadDuracion}
                                  onChange={(e) => {
                                    const nuevaUnidad = e.target.value;
                                    const minutosActuales = toMinutes(
                                      act.duracionValor,
                                      act.unidadDuracion
                                    );
                                    const nuevoValor = fromMinutes(
                                      minutosActuales,
                                      nuevaUnidad
                                    );
                                    updateActividad(act.uid, {
                                      unidadDuracion: nuevaUnidad,
                                      duracionValor: Number(
                                        (nuevoValor || 0).toFixed(2)
                                      ),
                                    });
                                  }}
                                  className="border-2 border-slate-300 p-3 rounded-xl text-sm outline-none bg-white"
                                >
                                  <option value="min">min</option>
                                  <option value="h">h</option>
                                </select>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Normalizado:{" "}
                                <b>
                                  {toMinutes(
                                    act.duracionValor,
                                    act.unidadDuracion
                                  )}{" "}
                                  min
                                </b>
                              </p>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">
                                Rol requerido{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={act.rolTecnico}
                                onChange={(e) =>
                                  updateActividad(act.uid, {
                                    rolTecnico: e.target.value,
                                  })
                                }
                                className="w-full border-2 border-slate-300 p-3 rounded-xl text-sm outline-none bg-white"
                              >
                                <option value="tecnico_mecanico">
                                  Técnico Mecánico
                                </option>
                                <option value="tecnico_electrico">
                                  Técnico Eléctrico
                                </option>
                                <option value="supervisor">Supervisor</option>
                                <option value="operario_de_mantenimiento">
                                  Operario de Mantenimiento
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                                <Users size={14} /> Cantidad Técnicos
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={act.cantidadTecnicos}
                                onChange={(e) =>
                                  updateActividad(act.uid, {
                                    cantidadTecnicos: Number(e.target.value),
                                  })
                                }
                                className="w-full border-2 border-slate-300 p-3 rounded-xl text-sm outline-none"
                              />
                            </div>
                          </div>

                          {/* ITEMS ACTIVIDAD */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-sm font-bold text-slate-700">
                                Recursos por Actividad{" "}
                                {act.items.length > 0 && (
                                  <span className="ml-2 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-bold">
                                    {act.items.length}
                                  </span>
                                )}
                              </h5>

                              <button
                                type="button"
                                onClick={() => addItemToActividad(act.uid)}
                                className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold"
                              >
                                <Plus size={16} />
                                Agregar Item
                              </button>
                            </div>

                            {act.items.length > 0 && (
                              <div className="space-y-3">
                                {act.items.map((item) => (
                                  <div
                                    key={item.uid}
                                    className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 relative"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeItemActividad(act.uid, item.uid)
                                      }
                                      className="absolute top-3 right-3 text-red-600 bg-white rounded-lg p-1.5"
                                    >
                                      <Trash2 size={16} />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pr-10">
                                      <div>
                                        <label className="text-xs font-bold text-slate-600 mb-1 block">
                                          Código{" "}
                                          <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          value={item.itemCode}
                                          onChange={(e) =>
                                            updateItemActividad(
                                              act.uid,
                                              item.uid,
                                              { itemCode: e.target.value }
                                            )
                                          }
                                          className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none"
                                        />
                                      </div>

                                      <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-slate-600 mb-1 block">
                                          Item{" "}
                                          <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          value={item.item}
                                          onChange={(e) =>
                                            updateItemActividad(
                                              act.uid,
                                              item.uid,
                                              { item: e.target.value }
                                            )
                                          }
                                          className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-xs font-bold text-slate-600 mb-1 block">
                                          Tipo
                                        </label>
                                        <select
                                          value={item.recurso}
                                          onChange={(e) =>
                                            updateItemActividad(
                                              act.uid,
                                              item.uid,
                                              { recurso: e.target.value }
                                            )
                                          }
                                          className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none bg-white"
                                        >
                                          <option value="MATERIAL">
                                            📦 Material
                                          </option>
                                          <option value="MANO_OBRA">
                                            👷 Mano de Obra
                                          </option>
                                          <option value="SERVICIO">
                                            🧾 Servicio
                                          </option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="text-xs font-bold text-slate-600 mb-1 block">
                                          Unidad{" "}
                                          <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          value={item.unidad}
                                          onChange={(e) =>
                                            updateItemActividad(
                                              act.uid,
                                              item.uid,
                                              { unidad: e.target.value }
                                            )
                                          }
                                          className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-xs font-bold text-slate-600 mb-1 block">
                                          Cantidad{" "}
                                          <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.1"
                                          value={item.cantidad}
                                          onChange={(e) =>
                                            updateItemActividad(
                                              act.uid,
                                              item.uid,
                                              {
                                                cantidad: Number(
                                                  e.target.value
                                                ),
                                              }
                                            )
                                          }
                                          className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none"
                                        />
                                      </div>

                                      <div className="md:col-span-6">
                                        <label className="text-xs font-bold text-slate-600 mb-1 block">
                                          Observación
                                        </label>
                                        <input
                                          value={item.observacion || ""}
                                          onChange={(e) =>
                                            updateItemActividad(
                                              act.uid,
                                              item.uid,
                                              { observacion: e.target.value }
                                            )
                                          }
                                          className="w-full border-2 border-slate-300 rounded-xl p-2 text-sm outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* ADJUNTOS ACTIVIDAD */}
                          <div>
                            <h5 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                              Adjuntos de Actividad
                              {act.adjuntos.length > 0 && (
                                <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">
                                  {act.adjuntos.length}
                                </span>
                              )}
                            </h5>

                            <label className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">
                              <Upload size={16} />
                              Subir
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) =>
                                  subirAdjuntosActividad(
                                    act.uid,
                                    e.target.files
                                  )
                                }
                              />
                            </label>

                            {act.adjuntos.length > 0 && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {act.adjuntos.map((a, i) => (
                                  <div
                                    key={`${a?.id || a?.nombre || "adj"}_${i}`}
                                    className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm"
                                  >
                                    <FileText
                                      size={16}
                                      className="text-amber-600"
                                    />
                                    <span className="text-amber-800 font-medium flex-1 truncate">
                                      {a?.nombre || "archivo"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-50 p-6 border-t-2 border-slate-200">
          <div className="flex gap-4 justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3.5 rounded-xl font-bold text-slate-700 bg-white border-2 border-slate-300"
            >
              Cancelar
            </button>

            <button
              onClick={guardarPlan}
              disabled={guardando}
              className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-10 py-3.5 rounded-xl font-bold flex items-center gap-3"
            >
              {guardando ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={22} />
                  Guardar Plan
                </>
              )}
            </button>
          </div>
        </div>

        <style jsx>{`
          .border-3 {
            border-width: 3px;
          }
        `}</style>
      </div>
    </div>
  );
}