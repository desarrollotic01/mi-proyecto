import { useEffect, useMemo, useState } from "react";
import {
  X, Plus, Trash2, Save, Wrench, ChevronDown, ChevronUp,
  Upload, FileText, Search,
} from "lucide-react";
import { planMantenimientoService } from "../services/planMantenimientoService";
import { equipoService } from "../../mantenimiento/services/equipoService";
import { sapCatalogosService } from "../services/sapCatalogosService";
import ModalSeleccionItem from "./ModalSeleccionItem";

/** UID simple para el front */
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `uid_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const normalize = (v) => (v === "" || v === undefined ? null : v);

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
  { value: "POR_HORA",    label: "Por hora" },
  { value: "DIARIA",      label: "Diaria" },
  { value: "SEMANAL",     label: "Semanal" },
  { value: "QUINCENAL",   label: "Quincenal" },
  { value: "MENSUAL",     label: "Mensual" },
  { value: "TRIMESTRAL",  label: "Trimestral" },
  { value: "SEMESTRAL",   label: "Semestral" },
  { value: "ANUAL",       label: "Anual" },
  { value: "BIENAL",      label: "Bienal" },
  { value: "QUINQUENAL",  label: "Quinquenal" },
];

/* ── Defaults sin costCenter ni projectCode ── */
const DEFAULT_ACTIVIDAD = () => ({
  uid: uid(),
  sistema: "", subsistema: "", componente: "", tarea: "",
  tipoTrabajo: "REVISION", rolTecnico: "tecnico_mecanico",
  duracionValor: 30, unidadDuracion: "min", cantidadTecnicos: 1,
  items: [], adjuntos: [],
});

const DEFAULT_ITEM = () => ({
  uid: uid(),
  itemId: "", itemCode: "", description: "",
  quantity: 1, warehouseCode: "01",
  rubroSapCode: "", paqueteTrabajo: "", observacion: "",
});

/* ── Mini-componentes ── */
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
      className={`w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 bg-white ${props.className || ""}`}
    />
  );
}

function SelectField(props) {
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

/* ── Botón para abrir el modal de ítem ── */
function ItemSelector({ itemCode, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm border rounded-lg transition text-left ${
        itemCode
          ? "border-slate-300 bg-white text-slate-800 hover:border-slate-400"
          : "border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-slate-400 hover:bg-white"
      }`}
    >
      <Search className="w-4 h-4 shrink-0 text-slate-400" />
      <span className="truncate">
        {itemCode ? `${itemCode} — ${description || ""}` : "Buscar ítem..."}
      </span>
    </button>
  );
}

/* ================================================================
   COMPONENTE PRINCIPAL
================================================================ */
export default function ModalCrearPlan({ onClose, onCreated, equipoPreseleccionado }) {
  const [equipos, setEquipos]         = useState([]);
  const [guardando, setGuardando]     = useState(false);
  const [expandedByUid, setExpanded]  = useState({});

  const [itemsPlan, setItemsPlan]         = useState([DEFAULT_ITEM()]);
  const [adjuntosPlan, setAdjuntosPlan]   = useState([]);

  /* ── Catálogos ── */
  const [rubros,    setRubros]    = useState([]);
  const [paquetes,  setPaquetes]  = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  /* ── Modal selección ítem ── */
  // target: { context: "plan", uidItem } | { context: "actividad", uidActividad, uidItem }
  const [itemModal, setItemModal] = useState({ open: false, target: null });

  const [form, setForm] = useState({
    codigoPlan: "",
    contextoObjetivo: "EQUIPO",
    ubicacionId: "",
    familiaId:    equipoPreseleccionado?.familia?.id || "",
    tipoEquipo:   equipoPreseleccionado?.tipoEquipo  || "",
    modeloEquipo: equipoPreseleccionado?.modelo      || "",
    equipoId:     equipoPreseleccionado?.id          || "",
    nombre: equipoPreseleccionado
      ? `Plan de Mantenimiento - ${equipoPreseleccionado.nombre || equipoPreseleccionado.codigo}`
      : "",
    tipo: "PREVENTIVO",
    frecuencia: "MENSUAL",
    frecuenciaHoras: "",
  });

  const [actividades, setActividades] = useState([]);

  /* ── Carga de equipos ── */
  useEffect(() => {
    equipoService.getEquipos()
      .then((data) =>
        setEquipos(
          (data || []).map((e) => ({
            ...e,
            familiaId:   e.familia?.id || null,
            familiaNombre: e.familia?.nombre || "",
            tipoEquipo:  e.tipoEquipo || "",
            modelo:      e.modelo || "",
          }))
        )
      )
      .catch(() => setEquipos([]));
  }, []);

  /* ── Carga de catálogos (rubros + paquetes) ── */
  useEffect(() => {
    setLoadingCatalogos(true);
    Promise.allSettled([
      sapCatalogosService.getRubros(),
      sapCatalogosService.getPaquetes(),
    ]).then(([resRubros, resPaquetes]) => {
      if (resRubros.status === "fulfilled")
        setRubros(Array.isArray(resRubros.value) ? resRubros.value : []);
      if (resPaquetes.status === "fulfilled")
        setPaquetes(Array.isArray(resPaquetes.value) ? resPaquetes.value : []);
    }).finally(() => setLoadingCatalogos(false));
  }, []);

  useEffect(() => {
    if (!equipoPreseleccionado) return;
    setForm((p) => ({
      ...p,
      familiaId:    equipoPreseleccionado?.familia?.id || "",
      tipoEquipo:   equipoPreseleccionado?.tipoEquipo  || "",
      modeloEquipo: equipoPreseleccionado?.modelo      || "",
      equipoId:     equipoPreseleccionado?.id          || "",
      nombre: `Plan de Mantenimiento - ${equipoPreseleccionado.nombre || equipoPreseleccionado.codigo}`,
    }));
  }, [equipoPreseleccionado]);

  useEffect(() => {
    if (form.frecuencia !== "POR_HORA" && form.frecuenciaHoras)
      setForm((p) => ({ ...p, frecuenciaHoras: "" }));
  }, [form.frecuencia]);

  /* ── Handlers equipo ── */
  const handleEquipoChange = (e) => {
    const id = e.target.value;
    if (!id) {
      setForm((p) => ({ ...p, equipoId: "", familiaId: "", tipoEquipo: "", modeloEquipo: "", nombre: "" }));
      setActividades([]);
      return;
    }
    const eq = equipos.find((x) => String(x.id) === String(id));
    if (!eq) return;
    setForm((p) => ({
      ...p,
      equipoId: eq.id,
      familiaId: eq.familiaId || "",
      tipoEquipo: eq.tipoEquipo || "",
      modeloEquipo: eq.modelo || "",
      nombre: `Plan de Mantenimiento - ${eq.nombre || eq.codigo}`,
    }));
    if (eq.actividades?.length > 0) {
      setActividades(eq.actividades.map((a) => ({
        ...DEFAULT_ACTIVIDAD(),
        uid: uid(),
        sistema: a.sistema || "", subsistema: a.subsistema || "",
        componente: a.componente || "", tarea: a.tarea || "",
        tipoTrabajo: a.tipoTrabajo || "REVISION",
        rolTecnico: a.rolTecnico || "tecnico_mecanico",
        duracionValor: a.duracionValor || 30,
        unidadDuracion: a.unidadDuracion || "min",
        cantidadTecnicos: a.cantidadTecnicos || 1,
        items: (a.items || []).map((it) => ({
          ...DEFAULT_ITEM(), uid: uid(),
          itemId: it.itemId || "", itemCode: it.itemCode || "",
          description: it.description || "",
          quantity: it.quantity || 1,
          warehouseCode: it.warehouseCode || "01",
          rubroSapCode: it.rubroSapCode || "",
          paqueteTrabajo: it.paqueteTrabajo || "",
          observacion: it.observacion || "",
        })),
      })));
    } else {
      setActividades([DEFAULT_ACTIVIDAD()]);
    }
  };

  /* ── Catálogos derivados ── */
  const familias = useMemo(() => [
    ...new Map(
      equipos.filter((e) => e.familiaId)
        .map((e) => [e.familiaId, { id: e.familiaId, nombre: e.familiaNombre }])
    ).values(),
  ], [equipos]);

  const tipos = useMemo(() => [
    ...new Set(
      equipos
        .filter((e) => !form.familiaId || e.familiaId === form.familiaId)
        .map((e) => e.tipoEquipo).filter(Boolean)
    ),
  ], [equipos, form.familiaId]);

  const modelos = useMemo(() => [
    ...new Set(
      equipos
        .filter((e) => {
          if (form.familiaId && e.familiaId !== form.familiaId) return false;
          if (form.tipoEquipo && e.tipoEquipo !== form.tipoEquipo) return false;
          return true;
        })
        .map((e) => e.modelo).filter(Boolean)
    ),
  ], [equipos, form.familiaId, form.tipoEquipo]);

  /* ── CRUD items del plan ── */
  const addItemPlan    = () => setItemsPlan((p) => [...p, DEFAULT_ITEM()]);
  const updateItemPlan = (uidItem, patch) =>
    setItemsPlan((prev) => prev.map((it) => it.uid === uidItem ? { ...it, ...patch } : it));
  const removeItemPlan = (uidItem) =>
    setItemsPlan((prev) => prev.filter((it) => it.uid !== uidItem));

  /* ── CRUD actividades ── */
  const agregarActividad = () => {
    const act = DEFAULT_ACTIVIDAD();
    setActividades((p) => [...p, act]);
    setExpanded((p) => ({ ...p, [act.uid]: true }));
  };
  const eliminarActividad  = (uidA) => {
    setActividades((p) => p.filter((a) => a.uid !== uidA));
    setExpanded((p) => { const c = { ...p }; delete c[uidA]; return c; });
  };
  const toggleActividad    = (uidA) => setExpanded((p) => ({ ...p, [uidA]: !p[uidA] }));
  const updateActividad    = (uidA, patch) =>
    setActividades((p) => p.map((a) => a.uid === uidA ? { ...a, ...patch } : a));
  const addItemToActividad = (uidA) =>
    setActividades((p) => p.map((a) => a.uid !== uidA ? a : { ...a, items: [...a.items, DEFAULT_ITEM()] }));
  const updateItemActividad = (uidA, uidItem, patch) =>
    setActividades((p) => p.map((a) =>
      a.uid !== uidA ? a : { ...a, items: a.items.map((it) => it.uid === uidItem ? { ...it, ...patch } : it) }
    ));
  const removeItemActividad = (uidA, uidItem) =>
    setActividades((p) => p.map((a) =>
      a.uid !== uidA ? a : { ...a, items: a.items.filter((it) => it.uid !== uidItem) }
    ));

  /* ── Modal de ítems ── */
  const openItemModal = (target) => setItemModal({ open: true, target });
  const closeItemModal = () => setItemModal({ open: false, target: null });

  const handleItemSelected = (item) => {
    const patch = {
      itemId:      item.id || "",
      itemCode:    item.sapCode || "",
      description: item.nombre || "",
    };
    const { target } = itemModal;
    if (!target) return;
    if (target.context === "plan") {
      updateItemPlan(target.uidItem, patch);
    } else {
      updateItemActividad(target.uidActividad, target.uidItem, patch);
    }
  };

  /* ── Adjuntos ── */
  const subirAdjuntosPlan = async (files) => {
    if (!files?.length) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    try {
      const res = await fetch("/api/adjuntos/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Error al subir adjuntos del plan");
      const arch = await res.json();
      setAdjuntosPlan((p) => [...p, ...(arch || [])]);
    } catch (err) { alert(err.message); }
  };

  const subirAdjuntosActividad = async (uidA, files) => {
    if (!files?.length) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    try {
      const res = await fetch("/api/adjuntos/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Error al subir adjuntos");
      const arch = await res.json();
      setActividades((p) => p.map((a) =>
        a.uid !== uidA ? a : { ...a, adjuntos: [...(a.adjuntos || []), ...(arch || [])] }
      ));
    } catch (err) { alert(err.message); }
  };

  /* ── Validación y guardado ── */
  const validarAntesDeGuardar = () => {
    if (!form.codigoPlan?.trim()) return "El código del plan es obligatorio";
    if (!form.nombre?.trim())     return "El nombre del plan es obligatorio";
    if (!form.tipo)               return "El tipo de plan es obligatorio";
    if (!form.frecuencia)         return "La frecuencia del plan es obligatoria";
    if (form.frecuencia === "POR_HORA") {
      const fh = Number(form.frecuenciaHoras);
      if (!Number.isFinite(fh) || fh <= 0) return "frecuenciaHoras debe ser > 0";
      if (!Number.isInteger(fh))           return "frecuenciaHoras debe ser entero";
    }
    if (form.contextoObjetivo === "EQUIPO" && !form.familiaId && !form.tipoEquipo && !form.modeloEquipo)
      return "Especifique al menos Familia, Tipo o Modelo";
    if (!actividades.length) return "Debe agregar al menos una actividad";
    return null;
  };

  const mapItem = (it) => ({
    itemId:        it.itemId || null,
    itemCode:      it.itemCode?.trim(),
    description:   it.description?.trim() || null,
    quantity:      Number(it.quantity),
    warehouseCode: String(it.warehouseCode || "01").trim(),
    rubroSapCode:  it.rubroSapCode ? Number(it.rubroSapCode) : null,
    paqueteTrabajo: it.paqueteTrabajo?.trim() || null,
    observacion:   it.observacion?.trim() || null,
  });

  const guardarPlan = async () => {
    const err = validarAntesDeGuardar();
    if (err) { alert(err); return; }
    setGuardando(true);
    try {
      const payload = {
        codigoPlan: form.codigoPlan?.trim(),
        nombre:     form.nombre?.trim(),
        tipo:       form.tipo,
        frecuencia: form.frecuencia,
        frecuenciaHoras: form.frecuencia === "POR_HORA" ? Number(form.frecuenciaHoras) : null,
        contextoObjetivo: form.contextoObjetivo,
        equipoObjetivoId: form.contextoObjetivo === "EQUIPO" ? form.equipoId : null,
        ubicacionTecnicaObjetivoId: form.contextoObjetivo === "UBICACION_TECNICA" ? form.ubicacionId : null,
        familiaId:    form.contextoObjetivo === "EQUIPO" ? normalize(form.familiaId)    : null,
        tipoEquipo:   form.contextoObjetivo === "EQUIPO" ? normalize(form.tipoEquipo)   : null,
        modeloEquipo: form.contextoObjetivo === "EQUIPO" ? normalize(form.modeloEquipo) : null,
        esEspecifico: form.contextoObjetivo === "EQUIPO" && !!form.equipoId,
        itemsPlan: itemsPlan
          .filter((x) => (x.itemCode || "").trim() || (x.description || "").trim())
          .map(mapItem),
        adjuntosPlan: adjuntosPlan || [],
        actividades: actividades.map((a) => ({
          sistema:          normalize(a.sistema),
          subsistema:       normalize(a.subsistema),
          componente:       normalize(a.componente),
          tarea:            a.tarea?.trim(),
          tipoTrabajo:      a.tipoTrabajo,
          rolTecnico:       a.rolTecnico,
          duracionValor:    Number(a.duracionValor),
          unidadDuracion:   a.unidadDuracion,
          cantidadTecnicos: Number(a.cantidadTecnicos),
          items:   (a.items || []).map(mapItem),
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

  /* ── Render de una fila de ítem (reutilizado en plan y actividades) ── */
  const renderItemRow = ({ it, onSelectItem, onUpdate, onRemove }) => (
    <div key={it.uid} className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="flex justify-end mb-3">
        <button type="button" onClick={onRemove}
          className="inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700">
          <Trash2 size={15} /> Eliminar
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">

        {/* Ítem — abre modal */}
        <div className="md:col-span-2">
          <Field label="Ítem" required>
            <ItemSelector
              itemCode={it.itemCode}
              description={it.description}
              onClick={onSelectItem}
            />
          </Field>
        </div>

        {/* ItemCode (read-only) */}
        <Field label="Código SAP">
          <Input value={it.itemCode} readOnly className="bg-slate-100" />
        </Field>

        {/* Descripción */}
        <Field label="Descripción">
          <Input value={it.description}
            onChange={(e) => onUpdate({ description: e.target.value })} />
        </Field>

        {/* Cantidad */}
        <Field label="Cantidad" required>
          <Input type="number" min="1" value={it.quantity}
            onChange={(e) => onUpdate({ quantity: Number(e.target.value) })} />
        </Field>

        {/* Almacén */}
        <Field label="Almacén">
          <Input value={it.warehouseCode}
            onChange={(e) => onUpdate({ warehouseCode: e.target.value })} />
        </Field>

        {/* Rubro */}
        <Field label="Rubro">
          <SelectField value={it.rubroSapCode || ""}
            onChange={(e) => onUpdate({ rubroSapCode: e.target.value })}>
            <option value="">{loadingCatalogos ? "Cargando..." : "Seleccione rubro"}</option>
            {rubros.map((r) => (
              <option key={r.codigo} value={r.codigo}>
                {r.codigo} — {r.descripcion}
              </option>
            ))}
          </SelectField>
        </Field>

        {/* Paquete de trabajo */}
        <Field label="Paquete de trabajo">
          <SelectField value={it.paqueteTrabajo || ""}
            onChange={(e) => onUpdate({ paqueteTrabajo: e.target.value })}>
            <option value="">{loadingCatalogos ? "Cargando..." : "Seleccione paquete"}</option>
            {paquetes.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.codigo} — {p.descripcion}
              </option>
            ))}
          </SelectField>
        </Field>

        {/* Observación */}
        <div className="md:col-span-2 xl:col-span-4">
          <Field label="Observación">
            <Input value={it.observacion}
              onChange={(e) => onUpdate({ observacion: e.target.value })} />
          </Field>
        </div>
      </div>
    </div>
  );

  /* ================================================================
     JSX
  ================================================================ */
  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
        <div className="bg-slate-50 w-full max-w-6xl max-h-[94vh] overflow-hidden rounded-2xl shadow-xl flex flex-col border border-slate-200">

          {/* HEADER */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                <Wrench size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-slate-900">Crear Plan de Mantenimiento</h2>
                <p className="text-sm text-slate-500 truncate">
                  {equipoPreseleccionado
                    ? `Equipo: ${equipoPreseleccionado.codigo} - ${equipoPreseleccionado.nombre || ""}`
                    : "Configure la información general, recursos y actividades del plan"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
              <X size={20} />
            </button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* ── INFORMACIÓN GENERAL ── */}
            <Section title="Información general">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Contexto */}
                <div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  {[
                    { val: "EQUIPO",            label: "Plan para equipo" },
                    { val: "UBICACION_TECNICA",  label: "Plan para ubicación técnica" },
                  ].map(({ val, label }) => (
                    <label key={val} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input type="radio" name="ctx" checked={form.contextoObjetivo === val}
                        onChange={() => setForm((p) => ({ ...p, contextoObjetivo: val, ubicacionId: "", equipoId: "" }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {/* Código plan */}
                <Field label="Código del plan" required>
                  <Input value={form.codigoPlan}
                    onChange={(e) => setForm((p) => ({ ...p, codigoPlan: e.target.value }))} />
                </Field>

                {/* Frecuencia */}
                <Field label="Frecuencia" required>
                  <SelectField value={form.frecuencia}
                    onChange={(e) => setForm((p) => ({ ...p, frecuencia: e.target.value }))}>
                    {FRECUENCIAS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </SelectField>
                </Field>

                {form.frecuencia === "POR_HORA" && (
                  <Field label="Cada N horas" required>
                    <Input type="number" min="1" value={form.frecuenciaHoras}
                      onChange={(e) => setForm((p) => ({ ...p, frecuenciaHoras: e.target.value }))} />
                  </Field>
                )}

                {/* Campos EQUIPO */}
                {form.contextoObjetivo === "EQUIPO" && (
                  <>
                    <Field label="Familia">
                      <SelectField value={form.familiaId} disabled={disabledPorEquipo}
                        onChange={(e) => setForm((p) => ({ ...p, familiaId: e.target.value, tipoEquipo: "", modeloEquipo: "", equipoId: "" }))}>
                        <option value="">Todas las familias</option>
                        {familias.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                      </SelectField>
                    </Field>

                    <Field label="Tipo de equipo">
                      <SelectField value={form.tipoEquipo} disabled={disabledPorEquipo}
                        onChange={(e) => setForm((p) => ({ ...p, tipoEquipo: e.target.value, modeloEquipo: "", equipoId: "" }))}>
                        <option value="">Todos los tipos</option>
                        {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
                      </SelectField>
                    </Field>

                    <Field label="Modelo">
                      <SelectField value={form.modeloEquipo} disabled={disabledPorEquipo}
                        onChange={(e) => setForm((p) => ({ ...p, modeloEquipo: e.target.value, equipoId: "" }))}>
                        <option value="">Todos los modelos</option>
                        {modelos.map((m) => <option key={m} value={m}>{m}</option>)}
                      </SelectField>
                    </Field>

                    <Field label="Equipo específico (opcional)">
                      <SelectField value={form.equipoId} disabled={disabledPorEquipo} onChange={handleEquipoChange}>
                        <option value="">Aplica a todos los equipos del modelo</option>
                        {equipos
                          .filter((e) => {
                            if (form.familiaId && e.familiaId !== form.familiaId) return false;
                            if (form.tipoEquipo && e.tipoEquipo !== form.tipoEquipo) return false;
                            if (form.modeloEquipo && e.modelo !== form.modeloEquipo) return false;
                            return true;
                          })
                          .map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.codigo} – {e.nombre || "Sin nombre"}
                            </option>
                          ))}
                      </SelectField>
                    </Field>
                  </>
                )}

                {/* Nombre plan */}
                <div className={form.contextoObjetivo === "EQUIPO" ? "xl:col-span-2" : ""}>
                  <Field label="Nombre del plan" required>
                    <Input value={form.nombre}
                      onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
                  </Field>
                </div>

                <Field label="Tipo de plan">
                  <SelectField value={form.tipo}
                    onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
                    <option>PREVENTIVO</option>
                  </SelectField>
                </Field>
              </div>
            </Section>

            {/* ── RECURSOS GENERALES ── */}
            <Section
              title="Recursos generales del plan"
              action={
                <button type="button" onClick={addItemPlan}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800">
                  <Plus size={16} /> Agregar
                </button>
              }
            >
              <div className="space-y-3">
                {itemsPlan.map((it) =>
                  renderItemRow({
                    it,
                    onSelectItem: () => openItemModal({ context: "plan", uidItem: it.uid }),
                    onUpdate: (patch) => updateItemPlan(it.uid, patch),
                    onRemove: () => removeItemPlan(it.uid),
                  })
                )}
              </div>
            </Section>

            {/* ── ADJUNTOS PLAN ── */}
            <Section
              title="Adjuntos del plan"
              action={
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
                  <Upload size={16} /> Subir
                  <input type="file" multiple className="hidden"
                    onChange={(e) => subirAdjuntosPlan(e.target.files)} />
                </label>
              }
            >
              {adjuntosPlan.length === 0 ? (
                <EmptyState text="No hay adjuntos cargados." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {adjuntosPlan.map((a, i) => (
                    <div key={`${a?.id || a?.nombre || "adj"}_${i}`}
                      className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50">
                      <FileText size={16} className="text-slate-500" />
                      <span className="text-slate-700 truncate">{a?.nombre || "archivo"}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* ── ACTIVIDADES ── */}
            <Section
              title={`Actividades del plan (${actividades.length})`}
              action={
                <button onClick={agregarActividad}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800">
                  <Plus size={16} /> Agregar actividad
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
                      <div key={act.uid} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                        <button type="button" onClick={() => toggleActividad(act.uid)}
                          className="w-full px-4 py-4 flex items-center justify-between gap-4 bg-slate-50 hover:bg-slate-100 border-b border-slate-200">
                          <div className="text-left min-w-0">
                            <p className="text-xs font-semibold text-slate-500 uppercase">Actividad {index + 1}</p>
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {act.tarea || "Nueva actividad"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button"
                              onClick={(e) => { e.stopPropagation(); eliminarActividad(act.uid); }}
                              className="p-2 rounded-lg text-rose-600 hover:bg-rose-50">
                              <Trash2 size={16} />
                            </button>
                            {abierto
                              ? <ChevronUp size={18} className="text-slate-500" />
                              : <ChevronDown size={18} className="text-slate-500" />}
                          </div>
                        </button>

                        {abierto && (
                          <div className="p-4 space-y-5">
                            {/* Campos de la actividad */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                              <Field label="Sistema">
                                <Input value={act.sistema}
                                  onChange={(e) => updateActividad(act.uid, { sistema: e.target.value })} />
                              </Field>
                              <Field label="Subsistema">
                                <Input value={act.subsistema}
                                  onChange={(e) => updateActividad(act.uid, { subsistema: e.target.value })} />
                              </Field>
                              <Field label="Componente">
                                <Input value={act.componente}
                                  onChange={(e) => updateActividad(act.uid, { componente: e.target.value })} />
                              </Field>
                              <div className="md:col-span-2">
                                <Field label="Tarea" required>
                                  <Input value={act.tarea}
                                    onChange={(e) => updateActividad(act.uid, { tarea: e.target.value })} />
                                </Field>
                              </div>
                              <Field label="Tipo de trabajo">
                                <SelectField value={act.tipoTrabajo}
                                  onChange={(e) => updateActividad(act.uid, { tipoTrabajo: e.target.value })}>
                                  {["TORQUEO_REGULACION","APLICACION","REVISION","INSPECCION","CAMBIO",
                                    "LIMPIEZA","AJUSTE","LUBRICACION","REPARACION"].map((v) => (
                                    <option key={v} value={v}>
                                      {v.replace(/_/g, " / ").replace(/^./, (c) => c)}
                                    </option>
                                  ))}
                                </SelectField>
                              </Field>
                              <Field label="Duración">
                                <div className="flex gap-2">
                                  <Input type="number" min="0.1" step="0.1"
                                    value={act.duracionValor}
                                    onChange={(e) => updateActividad(act.uid, { duracionValor: e.target.value === "" ? 0 : Number(e.target.value) })} />
                                  <SelectField value={act.unidadDuracion} className="w-28"
                                    onChange={(e) => {
                                      const nu = e.target.value;
                                      const nv = fromMinutes(toMinutes(act.duracionValor, act.unidadDuracion), nu);
                                      updateActividad(act.uid, { unidadDuracion: nu, duracionValor: Number((nv || 0).toFixed(2)) });
                                    }}>
                                    <option value="min">min</option>
                                    <option value="h">h</option>
                                  </SelectField>
                                </div>
                              </Field>
                              <Field label="Rol técnico" required>
                                <SelectField value={act.rolTecnico}
                                  onChange={(e) => updateActividad(act.uid, { rolTecnico: e.target.value })}>
                                  <option value="tecnico_mecanico">Técnico Mecánico</option>
                                  <option value="tecnico_electrico">Técnico Eléctrico</option>
                                  <option value="supervisor">Supervisor</option>
                                  <option value="operario_de_mantenimiento">Operario de Mantenimiento</option>
                                </SelectField>
                              </Field>
                              <Field label="Cantidad de técnicos">
                                <Input type="number" min="1" value={act.cantidadTecnicos}
                                  onChange={(e) => updateActividad(act.uid, { cantidadTecnicos: Number(e.target.value) })} />
                              </Field>
                            </div>

                            {/* Recursos de la actividad */}
                            <div className="border border-slate-200 rounded-lg">
                              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                <h5 className="text-sm font-semibold text-slate-700">Recursos de la actividad</h5>
                                <button type="button" onClick={() => addItemToActividad(act.uid)}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50">
                                  <Plus size={15} /> Agregar
                                </button>
                              </div>
                              <div className="p-4 space-y-3">
                                {act.items.length === 0 ? (
                                  <EmptyState text="No hay recursos en esta actividad." />
                                ) : (
                                  act.items.map((item) =>
                                    renderItemRow({
                                      it: item,
                                      onSelectItem: () => openItemModal({ context: "actividad", uidActividad: act.uid, uidItem: item.uid }),
                                      onUpdate: (patch) => updateItemActividad(act.uid, item.uid, patch),
                                      onRemove: () => removeItemActividad(act.uid, item.uid),
                                    })
                                  )
                                )}
                              </div>
                            </div>

                            {/* Adjuntos de la actividad */}
                            <div className="border border-slate-200 rounded-lg">
                              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                <h5 className="text-sm font-semibold text-slate-700">Adjuntos de la actividad</h5>
                                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
                                  <Upload size={15} /> Subir
                                  <input type="file" multiple className="hidden"
                                    onChange={(e) => subirAdjuntosActividad(act.uid, e.target.files)} />
                                </label>
                              </div>
                              <div className="p-4">
                                {act.adjuntos.length === 0 ? (
                                  <EmptyState text="No hay adjuntos en esta actividad." />
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {act.adjuntos.map((a, i) => (
                                      <div key={`${a?.id || a?.nombre || "adj"}_${i}`}
                                        className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50">
                                        <FileText size={16} className="text-slate-500" />
                                        <span className="text-slate-700 truncate">{a?.nombre || "archivo"}</span>
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
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={guardarPlan} disabled={guardando}
              className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 inline-flex items-center gap-2">
              {guardando
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                : <><Save size={16} />Guardar plan</>}
            </button>
          </div>
        </div>
      </div>

      {/* Modal selección de ítem */}
      <ModalSeleccionItem
        isOpen={itemModal.open}
        onClose={closeItemModal}
        onSelect={handleItemSelected}
      />
    </>
  );
}
