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
  Package,
  CalendarDays,
  Hash,
} from "lucide-react";
import { planMantenimientoService } from "../services/planMantenimientoService";
import { equipoService } from "../../mantenimiento/services/equipoService";
import { itemService } from "../services/itemService";
import {rubroService } from "../services/rubroService";

/** UID simple para el front */
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
  itemId: "",
  itemCode: "",
  description: "",
  quantity: 1,
  warehouseCode: "01",
  costCenter: "",
  projectCode: "",
  rubroSapCode: "",
  paqueteTrabajo: "",
  observacion: "",
});

const DEFAULT_ITEM_PLAN = () => ({
  uid: uid(),
  itemId: "",
  itemCode: "",
  description: "",
  quantity: 1,
  warehouseCode: "01",
  costCenter: "",
  projectCode: "",
  rubroSapCode: "",
  paqueteTrabajo: "",
  observacion: "",
});

function Field({ label, required = false, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 bg-white ${
        props.className || ""
      }`}
    />
  );
}

function Select(props) {
  const { children, className = "", ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 bg-white ${className}`}
    >
      {children}
    </select>
  );
}

function Section({ title, action, children }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function EmptyState({ text }) {
  return (
    <div className="border border-dashed border-slate-300 rounded-lg px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

export default function ModalCrearPlan({
  onClose,
  onCreated,
  equipoPreseleccionado,
}) {
  const [equipos, setEquipos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [expandedByUid, setExpandedByUid] = useState({});

  const [itemsPlan, setItemsPlan] = useState([DEFAULT_ITEM_PLAN()]);
  const [adjuntosPlan, setAdjuntosPlan] = useState([]);

  const [itemsCatalogo, setItemsCatalogo] = useState([]);
const [loadingItems, setLoadingItems] = useState(false);


const [rubros, setRubros] = useState([]);
const [loadingRubros, setLoadingRubros] = useState(false);

  const [form, setForm] = useState({
    codigoPlan: "",
    contextoObjetivo: "EQUIPO",
    ubicacionId: "",
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
    frecuencia: "MENSUAL",
    frecuenciaHoras: "",
  });

  const [actividades, setActividades] = useState([]);

  const handleEquipoChange = (e) => {
    const selectedId = e.target.value;

    if (!selectedId) {
      setForm((prev) => ({
        ...prev,
        equipoId: "",
        familiaId: "",
        tipoEquipo: "",
        modeloEquipo: "",
        nombre: "",
      }));
      setActividades([]);
      return;
    }

    const equipo = equipos.find((eq) => String(eq.id) === String(selectedId));

    if (equipo) {
      setForm((prev) => ({
        ...prev,
        equipoId: equipo.id,
        familiaId: equipo.familiaId || "",
        tipoEquipo: equipo.tipoEquipo || "",
        modeloEquipo: equipo.modelo || "",
        nombre: `Plan de Mantenimiento - ${equipo.nombre || equipo.codigo}`,
      }));

      if (equipo.actividades?.length > 0) {
        const actividadesAuto = equipo.actividades.map((a) => ({
          ...DEFAULT_ACTIVIDAD(),
          uid: uid(),
          sistema: a.sistema || "",
          subsistema: a.subsistema || "",
          componente: a.componente || "",
          tarea: a.tarea || "",
          tipoTrabajo: a.tipoTrabajo || "REVISION",
          rolTecnico: a.rolTecnico || "tecnico_mecanico",
          duracionValor: a.duracionValor || 30,
          unidadDuracion: a.unidadDuracion || "min",
          cantidadTecnicos: a.cantidadTecnicos || 1,
          items: (a.items || []).map((it) => ({
            ...DEFAULT_ITEM_ACTIVIDAD(),
            uid: uid(),
            itemId: it.itemId || "",
            itemCode: it.itemCode || "",
            description: it.description || "",
            quantity: it.quantity || 1,
            warehouseCode: it.warehouseCode || "01",
            costCenter: it.costingCode || "",
            projectCode: it.projectCode || "",
            rubroSapCode: it.rubroSapCode || "",
            paqueteTrabajo: it.paqueteTrabajo || "",
            observacion: it.observacion || "",
          })),
        }));
        setActividades(actividadesAuto);
      } else {
        setActividades([DEFAULT_ACTIVIDAD()]);
      }
    }
  };

  const handleSelectItemPlan = (uidItem, selectedItemId) => {
  const itemSeleccionado = itemsCatalogo.find(
    (it) => String(it.id) === String(selectedItemId)
  );

  if (!itemSeleccionado) {
    updateItemPlan(uidItem, {
      itemId: "",
      itemCode: "",
      description: "",
      rubroSapCode: "",
    });
    return;
  }

  updateItemPlan(uidItem, {
    itemId: itemSeleccionado.id || "",
    itemCode: itemSeleccionado.sapCode || "",
    description: itemSeleccionado.nombre || "",
    rubroSapCode: itemSeleccionado.rubroSapCode || "",
  });
};

const handleSelectItemActividad = (uidActividad, uidItem, selectedItemId) => {
  const itemSeleccionado = itemsCatalogo.find(
    (it) => String(it.id) === String(selectedItemId)
  );

  if (!itemSeleccionado) {
    updateItemActividad(uidActividad, uidItem, {
      itemId: "",
      itemCode: "",
      description: "",
      rubroSapCode: "",
    });
    return;
  }

  updateItemActividad(uidActividad, uidItem, {
    itemId: itemSeleccionado.id || "",
    itemCode: itemSeleccionado.sapCode || "",
    description: itemSeleccionado.nombre || "",
    rubroSapCode: itemSeleccionado.rubroSapCode || "",
  });
};

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

  useEffect(() => {
  const loadRubros = async () => {
    try {
      setLoadingRubros(true);
      const data = await rubroService.getAll();
      setRubros(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando rubros:", error);
      setRubros([]);
    } finally {
      setLoadingRubros(false);
    }
  };

  loadRubros();
}, []);


  useEffect(() => {
  const loadItems = async () => {
    try {
      setLoadingItems(true);
      const data = await itemService.getAll();
      setItemsCatalogo(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando items:", error);
      setItemsCatalogo([]);
    } finally {
      setLoadingItems(false);
    }
  };

  loadItems();
}, []);

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

  useEffect(() => {
    if (form.frecuencia !== "POR_HORA" && form.frecuenciaHoras) {
      setForm((p) => ({ ...p, frecuenciaHoras: "" }));
    }
  }, [form.frecuencia]);

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

  const equiposFiltrados = useMemo(() => equipos, [equipos]);

  const addItemPlan = () => setItemsPlan((p) => [...p, DEFAULT_ITEM_PLAN()]);
  const updateItemPlan = (uidItem, patch) =>
    setItemsPlan((prev) =>
      prev.map((it) => (it.uid === uidItem ? { ...it, ...patch } : it))
    );
  const removeItemPlan = (uidItem) =>
    setItemsPlan((prev) => prev.filter((it) => it.uid !== uidItem));

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

  const toggleActividad = (uidActividad) =>
    setExpandedByUid((prev) => ({
      ...prev,
      [uidActividad]: !prev[uidActividad],
    }));

  const updateActividad = (uidActividad, patch) =>
    setActividades((prev) =>
      prev.map((a) => (a.uid === uidActividad ? { ...a, ...patch } : a))
    );

  const addItemToActividad = (uidActividad) => {
    setActividades((prev) =>
      prev.map((a) =>
        a.uid !== uidActividad
          ? a
          : { ...a, items: [...a.items, DEFAULT_ITEM_ACTIVIDAD()] }
      )
    );
  };

  const updateItemActividad = (uidActividad, uidItem, patch) => {
    setActividades((prev) =>
      prev.map((a) =>
        a.uid !== uidActividad
          ? a
          : {
              ...a,
              items: a.items.map((it) =>
                it.uid === uidItem ? { ...it, ...patch } : it
              ),
            }
      )
    );
  };

  const removeItemActividad = (uidActividad, uidItem) => {
    setActividades((prev) =>
      prev.map((a) =>
        a.uid !== uidActividad
          ? a
          : { ...a, items: a.items.filter((it) => it.uid !== uidItem) }
      )
    );
  };

  const subirAdjuntosPlan = async (files) => {
    if (!files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    try {
      const res = await fetch("/api/adjuntos/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al subir adjuntos del plan");
      const archivos = await res.json();
      setAdjuntosPlan((prev) => [...prev, ...(archivos || [])]);
    } catch (err) {
      alert(err.message);
    }
  };

  const subirAdjuntosActividad = async (uidActividad, files) => {
    if (!files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    try {
      const res = await fetch("/api/adjuntos/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al subir adjuntos");
      const archivos = await res.json();
      setActividades((prev) =>
        prev.map((a) =>
          a.uid !== uidActividad
            ? a
            : { ...a, adjuntos: [...(a.adjuntos || []), ...(archivos || [])] }
        )
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const validarAntesDeGuardar = () => {
    if (!form.codigoPlan?.trim())
      return "El código del plan (codigoPlan) es obligatorio";
    if (!form.nombre?.trim()) return "El nombre del plan es obligatorio";
    if (!form.tipo) return "El tipo de plan es obligatorio";
    if (!form.frecuencia) return "La frecuencia del plan es obligatoria";

    if (form.frecuencia === "POR_HORA") {
      const fh = Number(form.frecuenciaHoras);
      if (!Number.isFinite(fh) || fh <= 0)
        return "Si la frecuencia es POR_HORA, frecuenciaHoras debe ser > 0";
      if (!Number.isInteger(fh))
        return "frecuenciaHoras debe ser un número entero";
    }

    if (
      form.contextoObjetivo === "EQUIPO" &&
      !form.familiaId &&
      !form.tipoEquipo &&
      !form.modeloEquipo
    ) {
      return "Debe especificar al menos Familia, Tipo o Modelo para el plan de equipo";
    }

    if (!Array.isArray(actividades) || actividades.length === 0) {
      return "El plan de mantenimiento debe tener al menos una actividad";
    }

    return null;
  };

  const guardarPlan = async () => {
    const err = validarAntesDeGuardar();
    if (err) {
      alert(err);
      return;
    }

    setGuardando(true);

    try {
      const itemsPlanClean = (itemsPlan || [])
  .filter((x) => (x.itemCode || "").trim() || (x.description || "").trim())
  .map((it) => ({
    itemId: it.itemId || null,
    itemCode: it.itemCode?.trim(),
    description: it.description?.trim() || null,
    quantity: Number(it.quantity),
    warehouseCode: String(it.warehouseCode || "01").trim(),
    costCenter: it.costCenter?.trim() || null,
    projectCode: it.projectCode?.trim() || null,
    rubroSapCode: it.rubroSapCode ? Number(it.rubroSapCode) : null,
    paqueteTrabajo: it.paqueteTrabajo?.trim() || null,
    observacion: it.observacion?.trim() || null,
  }));
      const payload = {
        codigoPlan: form.codigoPlan?.trim(),
        nombre: form.nombre?.trim(),
        tipo: form.tipo,
        frecuencia: form.frecuencia,
        frecuenciaHoras:
          form.frecuencia === "POR_HORA"
            ? Number(form.frecuenciaHoras)
            : null,

        contextoObjetivo: form.contextoObjetivo,
        equipoObjetivoId:
          form.contextoObjetivo === "EQUIPO" ? form.equipoId : null,
        ubicacionTecnicaObjetivoId:
          form.contextoObjetivo === "UBICACION_TECNICA" ? form.ubicacionId : null,

        familiaId:
          form.contextoObjetivo === "EQUIPO" ? normalize(form.familiaId) : null,
        tipoEquipo:
          form.contextoObjetivo === "EQUIPO" ? normalize(form.tipoEquipo) : null,
        modeloEquipo:
          form.contextoObjetivo === "EQUIPO" ? normalize(form.modeloEquipo) : null,
        esEspecifico: form.contextoObjetivo === "EQUIPO" && !!form.equipoId,

        itemsPlan: itemsPlanClean,
        adjuntosPlan: adjuntosPlan || [],
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
            itemId: it.itemId || null,
            itemCode: it.itemCode?.trim(),
            description: it.description?.trim() || null,
            quantity: Number(it.quantity),
            warehouseCode: String(it.warehouseCode || "01").trim(),
            costCenter: it.costCenter?.trim() || null,
            projectCode: it.projectCode?.trim() || null,
            rubroSapCode: it.rubroSapCode ? Number(it.rubroSapCode) : null,
            paqueteTrabajo: it.paqueteTrabajo?.trim() || null,
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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-slate-50 w-full max-w-6xl max-h-[94vh] overflow-hidden rounded-2xl shadow-xl flex flex-col border border-slate-200">
        {/* HEADER */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
              <Wrench size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-slate-900">
                Crear Plan de Mantenimiento
              </h2>
              <p className="text-sm text-slate-500 truncate">
                {equipoPreseleccionado
                  ? `Equipo seleccionado: ${
                      equipoPreseleccionado.codigo
                    } - ${equipoPreseleccionado.nombre || "Sin nombre"}`
                  : "Configure la información general, recursos y actividades del plan"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* INFORMACIÓN GENERAL */}
          <Section title="Información general">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="ctx"
                    checked={form.contextoObjetivo === "EQUIPO"}
                    onChange={() =>
                      setForm((p) => ({
                        ...p,
                        contextoObjetivo: "EQUIPO",
                        ubicacionId: "",
                      }))
                    }
                  />
                  Plan para equipo
                </label>

                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="ctx"
                    checked={form.contextoObjetivo === "UBICACION_TECNICA"}
                    onChange={() =>
                      setForm((p) => ({
                        ...p,
                        contextoObjetivo: "UBICACION_TECNICA",
                        equipoId: "",
                        familiaId: "",
                        tipoEquipo: "",
                        modeloEquipo: "",
                      }))
                    }
                  />
                  Plan para ubicación técnica
                </label>
              </div>

              {form.contextoObjetivo === "EQUIPO" && (
                <Field label="Equipo">
                  <Select
                    value={form.equipoId}
                    onChange={handleEquipoChange}
                    disabled={disabledPorEquipo}
                    className={disabledPorEquipo ? "bg-slate-100 cursor-not-allowed" : ""}
                  >
                    <option value="">Seleccione un equipo...</option>
                    {equiposFiltrados.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.codigo} - {eq.nombre}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              <Field label="Código del plan" required>
                <Input
                  value={form.codigoPlan}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, codigoPlan: e.target.value }))
                  }
                  placeholder="PM-0001"
                />
              </Field>

              <Field label="Frecuencia" required>
                <Select
                  value={form.frecuencia}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, frecuencia: e.target.value }))
                  }
                >
                  {FRECUENCIAS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Frecuencia (horas)"
                required={form.frecuencia === "POR_HORA"}
              >
                {form.frecuencia === "POR_HORA" ? (
                  <Input
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
                    placeholder="Ej: 8"
                  />
                ) : (
                  <div className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-100 text-sm text-slate-500">
                    Solo aplica para frecuencia POR_HORA
                  </div>
                )}
              </Field>

              {form.contextoObjetivo === "EQUIPO" && (
                <>
                  <Field label="Familia">
                    <Select
                      value={form.familiaId}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, familiaId: e.target.value }))
                      }
                      disabled={disabledPorEquipo}
                      className={disabledPorEquipo ? "bg-slate-100 cursor-not-allowed" : ""}
                    >
                      <option value="">Todas las familias</option>
                      {familias.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nombre}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Tipo de equipo">
                    <Select
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
                      className={disabledPorEquipo ? "bg-slate-100 cursor-not-allowed" : ""}
                    >
                      <option value="">Todos los tipos</option>
                      {tipos.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Modelo">
                    <Select
                      value={form.modeloEquipo}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          modeloEquipo: e.target.value,
                          equipoId: "",
                        }))
                      }
                      disabled={disabledPorEquipo}
                      className={disabledPorEquipo ? "bg-slate-100 cursor-not-allowed" : ""}
                    >
                      <option value="">Todos los modelos</option>
                      {modelos.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </>
              )}

              <div className={form.contextoObjetivo === "EQUIPO" ? "xl:col-span-2" : ""}>
                <Field label="Nombre del plan" required>
                  <Input
                    value={form.nombre}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, nombre: e.target.value }))
                    }
                  />
                </Field>
              </div>

              <Field label="Tipo de plan">
                <Select
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tipo: e.target.value }))
                  }
                >
                  <option>PREVENTIVO</option>
                </Select>
              </Field>
            </div>
          </Section>

          {/* ITEMS GENERALES */}
          <Section
            title="Recursos generales del plan"
            action={
              <button
                type="button"
                onClick={addItemPlan}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
              >
                <Plus size={16} />
                Agregar
              </button>
            }
          >
            <div className="space-y-3">
              {itemsPlan.map((it) => (
                <div
                  key={it.uid}
                  className="border border-slate-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex justify-end mb-3">
                    <button
                      type="button"
                      onClick={() => removeItemPlan(it.uid)}
                      className="inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 size={15} />
                      Eliminar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    <Field label="Ítem" required>
  <Select
    value={it.itemId || ""}
    onChange={(e) => handleSelectItemPlan(it.uid, e.target.value)}
  >
    <option value="">
      {loadingItems ? "Cargando items..." : "Seleccione un ítem"}
    </option>
    {itemsCatalogo.map((item) => (
      <option key={item.id} value={item.id}>
        {item.sapCode} - {item.nombre}
      </option>
    ))}
  </Select>
</Field>

<Field label="ItemCode" required>
  <Input value={it.itemCode} readOnly className="bg-slate-100" />
</Field>

<Field label="Descripción">
  <Input
    value={it.description}
    onChange={(e) =>
      updateItemPlan(it.uid, { description: e.target.value })
    }
  />
</Field>

                    <Field label="Cantidad" required>
                      <Input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) =>
                          updateItemPlan(it.uid, {
                            quantity: Number(e.target.value),
                          })
                        }
                      />
                    </Field>

                    <Field label="Almacén">
                      <Input
                        value={it.warehouseCode}
                        onChange={(e) =>
                          updateItemPlan(it.uid, {
                            warehouseCode: e.target.value,
                          })
                        }
                      />
                    </Field>

                    <Field label="Centro de costo">
                      <Input
                        value={it.costCenter}
                        onChange={(e) =>
                          updateItemPlan(it.uid, { costCenter: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Proyecto">
                      <Input
                        value={it.projectCode}
                        onChange={(e) =>
                          updateItemPlan(it.uid, { projectCode: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Rubro">
  <Select
    value={it.rubroSapCode || ""}
    onChange={(e) =>
      updateItemPlan(it.uid, {
        rubroSapCode: e.target.value,
      })
    }
  >
    <option value="">
      {loadingRubros ? "Cargando..." : "Seleccione rubro"}
    </option>

    {rubros.map((r) => (
      <option key={r.codigo} value={r.codigo}>
        {r.codigo} - {r.nombre}
      </option>
    ))}
  </Select>
</Field>

                    <Field label="Paquete de trabajo">
                      <Input
                        value={it.paqueteTrabajo}
                        onChange={(e) =>
                          updateItemPlan(it.uid, {
                            paqueteTrabajo: e.target.value,
                          })
                        }
                      />
                    </Field>

                    <div className="md:col-span-2 xl:col-span-4">
                      <Field label="Observación">
                        <Input
                          value={it.observacion}
                          onChange={(e) =>
                            updateItemPlan(it.uid, {
                              observacion: e.target.value,
                            })
                          }
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ADJUNTOS PLAN */}
          <Section
            title="Adjuntos del plan"
            action={
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
                <Upload size={16} />
                Subir
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => subirAdjuntosPlan(e.target.files)}
                />
              </label>
            }
          >
            {adjuntosPlan.length === 0 ? (
              <EmptyState text="No hay adjuntos cargados." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {adjuntosPlan.map((a, i) => (
                  <div
                    key={`${a?.id || a?.nombre || "adj"}_${i}`}
                    className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50"
                  >
                    <FileText size={16} className="text-slate-500" />
                    <span className="text-slate-700 truncate">
                      {a?.nombre || "archivo"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ACTIVIDADES */}
          <Section
            title={`Actividades del plan (${actividades.length})`}
            action={
              <button
                onClick={agregarActividad}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
              >
                <Plus size={16} />
                Agregar actividad
              </button>
            }
          >
            <div className="space-y-4">
              {actividades.length === 0 ? (
                <EmptyState text="No hay actividades registradas." />
              ) : (
                actividades.map((act, index) => {
                  const abierto = !!expandedByUid[act.uid];

                  return (
                    <div
                      key={act.uid}
                      className="border border-slate-200 rounded-xl bg-white overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleActividad(act.uid)}
                        className="w-full px-4 py-4 flex items-center justify-between gap-4 bg-slate-50 hover:bg-slate-100 border-b border-slate-200"
                      >
                        <div className="text-left min-w-0">
                          <p className="text-xs font-semibold text-slate-500 uppercase">
                            Actividad {index + 1}
                          </p>
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {act.tarea || "Nueva actividad"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarActividad(act.uid);
                            }}
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={16} />
                          </button>
                          {abierto ? (
                            <ChevronUp size={18} className="text-slate-500" />
                          ) : (
                            <ChevronDown size={18} className="text-slate-500" />
                          )}
                        </div>
                      </button>

                      {abierto && (
                        <div className="p-4 space-y-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <Field label="Sistema">
                              <Input
                                value={act.sistema}
                                onChange={(e) =>
                                  updateActividad(act.uid, { sistema: e.target.value })
                                }
                              />
                            </Field>

                            <Field label="Subsistema">
                              <Input
                                value={act.subsistema}
                                onChange={(e) =>
                                  updateActividad(act.uid, {
                                    subsistema: e.target.value,
                                  })
                                }
                              />
                            </Field>

                            <Field label="Componente">
                              <Input
                                value={act.componente}
                                onChange={(e) =>
                                  updateActividad(act.uid, {
                                    componente: e.target.value,
                                  })
                                }
                              />
                            </Field>

                            <div className="md:col-span-2">
                              <Field label="Tarea" required>
                                <Input
                                  value={act.tarea}
                                  onChange={(e) =>
                                    updateActividad(act.uid, {
                                      tarea: e.target.value,
                                    })
                                  }
                                />
                              </Field>
                            </div>

                            <Field label="Tipo de trabajo">
                              <Select
                                value={act.tipoTrabajo}
                                onChange={(e) =>
                                  updateActividad(act.uid, {
                                    tipoTrabajo: e.target.value,
                                  })
                                }
                              >
                                <option value="TORQUEO_REGULACION">
                                  Torqueo / Regulación
                                </option>
                                <option value="APLICACION">Aplicación</option>
                                <option value="REVISION">Revisión</option>
                                <option value="INSPECCION">Inspección</option>
                                <option value="CAMBIO">Cambio</option>
                                <option value="LIMPIEZA">Limpieza</option>
                                <option value="AJUSTE">Ajuste</option>
                                <option value="LUBRICACION">Lubricación</option>
                                <option value="REPARACION">Reparación</option>
                              </Select>
                            </Field>

                            <Field label="Duración">
                              <div className="flex gap-2">
                                <Input
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
                                />
                                <Select
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
                                  className="w-28"
                                >
                                  <option value="min">min</option>
                                  <option value="h">h</option>
                                </Select>
                              </div>
                            </Field>

                            <Field label="Rol técnico" required>
                              <Select
                                value={act.rolTecnico}
                                onChange={(e) =>
                                  updateActividad(act.uid, {
                                    rolTecnico: e.target.value,
                                  })
                                }
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
                              </Select>
                            </Field>

                            <Field label="Cantidad de técnicos">
                              <Input
                                type="number"
                                min="1"
                                value={act.cantidadTecnicos}
                                onChange={(e) =>
                                  updateActividad(act.uid, {
                                    cantidadTecnicos: Number(e.target.value),
                                  })
                                }
                              />
                            </Field>
                          </div>

                          {/* ITEMS ACTIVIDAD */}
                          <div className="border border-slate-200 rounded-lg">
                            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                              <h5 className="text-sm font-semibold text-slate-700">
                                Recursos de la actividad
                              </h5>
                              <button
                                type="button"
                                onClick={() => addItemToActividad(act.uid)}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50"
                              >
                                <Plus size={15} />
                                Agregar
                              </button>
                            </div>

                            <div className="p-4 space-y-3">
                              {act.items.length === 0 ? (
                                <EmptyState text="No hay recursos agregados en esta actividad." />
                              ) : (
                                act.items.map((item) => (
                                  <div
                                    key={item.uid}
                                    className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                                  >
                                    <div className="flex justify-end mb-3">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeItemActividad(act.uid, item.uid)
                                        }
                                        className="inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700"
                                      >
                                        <Trash2 size={15} />
                                        Eliminar
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                                     <Field label="Ítem" required>
  <Select
    value={item.itemId || ""}
    onChange={(e) =>
      handleSelectItemActividad(act.uid, item.uid, e.target.value)
    }
  >
    <option value="">
      {loadingItems ? "Cargando items..." : "Seleccione un ítem"}
    </option>
    {itemsCatalogo.map((itSel) => (
      <option key={itSel.id} value={itSel.id}>
        {itSel.sapCode} - {itSel.nombre}
      </option>
    ))}
  </Select>
</Field>

<Field label="ItemCode" required>
  <Input value={item.itemCode} readOnly className="bg-slate-100" />
</Field>

<Field label="Descripción">
  <Input
    value={item.description}
    onChange={(e) =>
      updateItemActividad(act.uid, item.uid, {
        description: e.target.value,
      })
    }
  />
</Field>
                                      <Field label="Cantidad" required>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={item.quantity}
                                          onChange={(e) =>
                                            updateItemActividad(act.uid, item.uid, {
                                              quantity: Number(e.target.value),
                                            })
                                          }
                                        />
                                      </Field>

                                      <Field label="Almacén">
                                        <Input
                                          value={item.warehouseCode}
                                          onChange={(e) =>
                                            updateItemActividad(act.uid, item.uid, {
                                              warehouseCode: e.target.value,
                                            })
                                          }
                                        />
                                      </Field>

                                      <Field label="Centro de costo">
                                        <Input
                                          value={item.costCenter}
                                          onChange={(e) =>
                                            updateItemActividad(act.uid, item.uid, {
                                              costCenter: e.target.value,
                                            })
                                          }
                                        />
                                      </Field>

                                      <Field label="Proyecto">
                                        <Input
                                          value={item.projectCode}
                                          onChange={(e) =>
                                            updateItemActividad(act.uid, item.uid, {
                                              projectCode: e.target.value,
                                            })
                                          }
                                        />
                                      </Field>
<Field label="Rubro">
  <Select
    value={item.rubroSapCode || ""}
    onChange={(e) =>
      updateItemActividad(act.uid, item.uid, {
        rubroSapCode: e.target.value,
      })
    }
  >
    <option value="">
      {loadingRubros ? "Cargando..." : "Seleccione rubro"}
    </option>

    {rubros.map((r) => (
      <option key={r.codigo} value={r.codigo}>
        {r.codigo} - {r.nombre}
      </option>
    ))}
  </Select>
</Field>
                                      <Field label="Paquete de trabajo">
                                        <Input
                                          value={item.paqueteTrabajo}
                                          onChange={(e) =>
                                            updateItemActividad(act.uid, item.uid, {
                                              paqueteTrabajo: e.target.value,
                                            })
                                          }
                                        />
                                      </Field>

                                      <div className="md:col-span-2 xl:col-span-4">
                                        <Field label="Observación">
                                          <Input
                                            value={item.observacion || ""}
                                            onChange={(e) =>
                                              updateItemActividad(act.uid, item.uid, {
                                                observacion: e.target.value,
                                              })
                                            }
                                          />
                                        </Field>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* ADJUNTOS ACTIVIDAD */}
                          <div className="border border-slate-200 rounded-lg">
                            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                              <h5 className="text-sm font-semibold text-slate-700">
                                Adjuntos de la actividad
                              </h5>
                              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
                                <Upload size={15} />
                                Subir
                                <input
                                  type="file"
                                  multiple
                                  className="hidden"
                                  onChange={(e) =>
                                    subirAdjuntosActividad(act.uid, e.target.files)
                                  }
                                />
                              </label>
                            </div>

                            <div className="p-4">
                              {act.adjuntos.length === 0 ? (
                                <EmptyState text="No hay adjuntos en esta actividad." />
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {act.adjuntos.map((a, i) => (
                                    <div
                                      key={`${a?.id || a?.nombre || "adj"}_${i}`}
                                      className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50"
                                    >
                                      <FileText
                                        size={16}
                                        className="text-slate-500"
                                      />
                                      <span className="text-slate-700 truncate">
                                        {a?.nombre || "archivo"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Section>
        </div>

        {/* FOOTER */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            onClick={guardarPlan}
            disabled={guardando}
            className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 inline-flex items-center gap-2"
          >
            {guardando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}