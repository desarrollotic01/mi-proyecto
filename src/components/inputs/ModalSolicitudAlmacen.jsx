import { useEffect, useMemo, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Package,
  Calendar,
  CheckCircle,
  MapPinned,
  ClipboardList,
  Warehouse,
} from "lucide-react";

import { itemService } from "../../features/PlanMantenimiento/services/itemService";
import { sapCatalogosService } from "../../features/PlanMantenimiento/services/sapCatalogosService";

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */

const ensureId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const emptyLinea = (defaultProjectCode = "") => ({
  id: ensureId(),
  itemId: "",
  itemCode: "",
  description: "",
  quantity: 1,
  warehouseCode: "01",
  costCenter: "",
  projectCode: defaultProjectCode,
  rubroId: null,
  paqueteTrabajoId: null,
});

// Cabecera mínima — solo requiredDate
const emptyForm = () => ({
  requiredDate: "",
  lineas: [emptyLinea()],
});

const normalizeLinea = (l = {}, defaultProjectCode = "") => ({
  ...emptyLinea(defaultProjectCode),
  ...l,
  id: l.id || ensureId(),
  itemId: l.itemId || "",
  itemCode: l.itemCode || "",
  description: l.description || "",
  quantity:
    Number.isFinite(Number(l.quantity)) && Number(l.quantity) > 0
      ? Number(l.quantity)
      : 1,
  warehouseCode: l.warehouseCode || "01",
  costCenter: l.costCenter || l.costingCode || "",
  projectCode: l.projectCode || defaultProjectCode,
  rubroId: l.rubroId || null,
  paqueteTrabajoId: l.paqueteTrabajoId || null,
});

const normalizeForm = (form) => {
  const f = form || emptyForm();
  const lineas = Array.isArray(f.lineas) ? f.lineas : [];
  return {
    ...emptyForm(),
    requiredDate: f.requiredDate ? String(f.requiredDate).slice(0, 10) : "",
    lineas: lineas.length > 0 ? lineas.map(normalizeLinea) : [emptyLinea()],
  };
};

const isSolicitudVacia = (s) => {
  if (!s) return true;
  const hasDate = Boolean(s.requiredDate);
  const hasLineas =
    Array.isArray(s.lineas) &&
    s.lineas.some(
      (l) =>
        (l.itemCode?.trim() || l.description?.trim()) && Number(l.quantity) > 0
    );
  return !(hasDate || hasLineas);
};

// Payload que espera el backend — solo requiredDate + lineas
const buildPayloadSolicitud = (form) => ({
  requiredDate: form.requiredDate || "",
  lineas: (form.lineas || []).map((l) => ({
    itemId: l.itemId || null,
    itemCode: l.itemCode || "",
    description: l.description || "",
    quantity: Number(l.quantity) || 1,
    warehouseCode: l.warehouseCode || "01",
    costingCode: l.costCenter || "",
    projectCode: l.projectCode || "",
    rubroId: l.rubroId || null,
    paqueteTrabajoId: l.paqueteTrabajoId || null,
  })),
});

const getTargetTypeLabel = (type) =>
  type === "UBICACION_TECNICA" ? "Ubicación técnica" : "Equipo";

/* ══════════════════════════════════════════
   SUB-COMPONENTE: FORMULARIO
══════════════════════════════════════════ */

function FormSolicitudAlmacen({
  data,
  onChange,
  items = [],
  rubros = [],
  paquetes = [],
  loadingCatalogos = false,
  defaultProjectCode = "",
}) {
  const set = (field, value) => onChange({ ...data, [field]: value });

  const updateLinea = (id, field, value) =>
    set(
      "lineas",
      data.lineas.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );

  const addLinea = () => set("lineas", [...data.lineas, emptyLinea(defaultProjectCode)]);

  const removeLinea = (id) =>
    set(
      "lineas",
      data.lineas.filter((l) => l.id !== id)
    );

  const handleSelectItem = (lineaId, selectedItemId) => {
    const itemSeleccionado = items.find(
      (i) => String(i.id) === String(selectedItemId)
    );

    if (!itemSeleccionado) {
      set(
        "lineas",
        data.lineas.map((l) =>
          l.id === lineaId
            ? { ...l, itemId: "", itemCode: "", description: "", rubroId: null }
            : l
        )
      );
      return;
    }

    set(
      "lineas",
      data.lineas.map((l) => {
        if (l.id !== lineaId) return l;
        return {
          ...l,
          itemId: itemSeleccionado.id || "",
          itemCode: itemSeleccionado.sapCode || "",
          description: itemSeleccionado.nombre || "",
          rubroId: itemSeleccionado.rubroId ?? null,
        };
      })
    );
  };

  return (
    <div className="space-y-5">
      {/* Cabecera — solo fecha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
            <Calendar className="inline w-3.5 h-3.5 mr-1" />
            Fecha necesaria <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            value={data.requiredDate ?? ""}
            onChange={(e) => set("requiredDate", e.target.value)}
          />
        </div>
      </div>

      {/* Artículos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-gray-500" />
            Artículos de almacén
          </p>
          <span className="text-xs text-gray-400">
            {data.lineas.length} ítem{data.lineas.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="space-y-3">
          {data.lineas.map((l, idx) => (
            <div
              key={l.id}
              className="space-y-2 bg-red-50/40 border border-red-100 rounded-xl p-3"
            >
              {/* Fila 1 */}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <p className="text-xs text-gray-500 mb-1">Ítem *</p>
                  <select
                    className="w-full px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-300 bg-white"
                    value={l.itemId ?? ""}
                    onChange={(e) => handleSelectItem(l.id, e.target.value)}
                    disabled={loadingCatalogos}
                  >
                    <option value="">
                      {loadingCatalogos ? "Cargando items..." : "Seleccione un ítem"}
                    </option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.sapCode} - {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Código *</p>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 border rounded-lg text-sm bg-gray-100 focus:outline-none"
                    value={l.itemCode ?? ""}
                    readOnly
                  />
                </div>

                <div className="col-span-3">
                  <p className="text-xs text-gray-500 mb-1">Descripción *</p>
                  <input
                    type="text"
                    placeholder="Descripción"
                    className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-300"
                    value={l.description ?? ""}
                    onChange={(e) => updateLinea(l.id, "description", e.target.value)}
                  />
                </div>

                <div className="col-span-1">
                  <p className="text-xs text-gray-500 mb-1">Cant.</p>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-2 py-1.5 border rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-1 focus:ring-red-300"
                    value={l.quantity ?? 1}
                    onChange={(e) => updateLinea(l.id, "quantity", Number(e.target.value))}
                  />
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Almacén</p>
                  <input
                    type="text"
                    placeholder="01"
                    className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-300"
                    value={l.warehouseCode ?? ""}
                    onChange={(e) => updateLinea(l.id, "warehouseCode", e.target.value)}
                  />
                </div>
              </div>

              {/* Fila 2 */}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <p className="text-xs text-gray-500 mb-1">Centro de costo</p>
                  <input
                    type="text"
                    placeholder="CC-001"
                    className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-300"
                    value={l.costCenter ?? ""}
                    onChange={(e) => updateLinea(l.id, "costCenter", e.target.value)}
                  />
                </div>

                <div className="col-span-3">
                  <p className="text-xs text-gray-500 mb-1">Proyecto</p>
                  <input
                    type="text"
                    placeholder="Opcional"
                    className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-300"
                    value={l.projectCode ?? ""}
                    onChange={(e) => updateLinea(l.id, "projectCode", e.target.value)}
                  />
                </div>

                <div className="col-span-3">
                  <p className="text-xs text-gray-500 mb-1">Rubro</p>
                  <select
                    className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-300 bg-white"
                    value={l.rubroId != null ? String(l.rubroId) : ""}
                    onChange={(e) => updateLinea(l.id, "rubroId", e.target.value || null)}
                  >
                    <option value="">Seleccione rubro</option>
                    {rubros.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.codigo} - {r.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3">
                  <p className="text-xs text-gray-500 mb-1">Paquete trabajo</p>
                  <select
                    className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-300 bg-white"
                    value={l.paqueteTrabajoId != null ? String(l.paqueteTrabajoId) : ""}
                    onChange={(e) => updateLinea(l.id, "paqueteTrabajoId", e.target.value || null)}
                  >
                    <option value="">Seleccione paquete</option>
                    {paquetes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigo} - {p.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2">
                {data.lineas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLinea(l.id)}
                    className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                )}
                {idx === data.lineas.length - 1 && (
                  <button
                    type="button"
                    onClick={addLinea}
                    className="px-3 py-2 bg-red-100 border border-red-200 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar línea
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════ */

export default function ModalSolicitudAlmacen({
  isOpen,
  onClose,
  onConfirm,
  targets = [],
  equiposRelacion = [],
  ubicacionesRelacion = [],
  equiposInfo = [],
  initialValue = null,
  contextoOt = null,
  ordenVenta = "",
  centroCosto = "",
}) {
  const [tab, setTab] = useState("general");
  const [general, setGeneral] = useState(emptyForm());
  const [porTarget, setPorTarget] = useState({});
  const [items, setItems] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  const normalizedTargets = useMemo(() => {
    const sourceTargets =
      Array.isArray(contextoOt?.targets) && contextoOt.targets.length > 0
        ? contextoOt.targets
        : targets;

    if (Array.isArray(sourceTargets) && sourceTargets.length > 0) {
      return sourceTargets.map((t) => ({
        id: String(t.id),
        type: t.type || "EQUIPO",
        nombre: t.nombre || t.tag || t.id,
        tag: t.tag || t.id,
        equipoId: t.equipoId || null,
        ubicacionTecnicaId: t.ubicacionTecnicaId || null,
      }));
    }

    

    const fallbackEquipos = (equiposRelacion || []).map((rel) => {
      const equipoId = String(rel.equipoId);
      const eq = (equiposInfo || []).find((e) => String(e.id) === equipoId);
      return {
        id: equipoId,
        type: "EQUIPO",
        nombre: eq?.nombre || eq?.tag || equipoId,
        tag: eq?.tag || equipoId,
        equipoId,
        ubicacionTecnicaId: null,
      };
    });

    const fallbackUbicaciones = (ubicacionesRelacion || []).map((rel) => {
      const id = String(
        rel.ubicacionId ||
          rel.ubicacionTecnicaId ||
          rel?.ubicacion?.id ||
          rel?.ubicacionTecnica?.id
      );
      return {
        id,
        type: "UBICACION_TECNICA",
        nombre:
          rel?.ubicacionTecnica?.nombre ||
          rel?.ubicacion?.nombre ||
          rel?.ubicacionTecnica?.codigo ||
          rel?.ubicacion?.codigo ||
          `Ubicación técnica ${id}`,
        tag: rel?.ubicacionTecnica?.codigo || rel?.ubicacion?.codigo || id,
        equipoId: null,
        ubicacionTecnicaId: id,
      };
    });

    return [...fallbackEquipos, ...fallbackUbicaciones];
  }, [contextoOt, targets, equiposRelacion, ubicacionesRelacion, equiposInfo]);


  const targetsKey = useMemo(
    () => normalizedTargets.map((t) => `${t.type}-${t.id}`).join("|"),
    [normalizedTargets]
  );

  /* Catálogos */
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        setLoadingCatalogos(true);
        const [itemsData, rubrosData, paquetesData] = await Promise.all([
          itemService.getAll(),
          sapCatalogosService.getRubros(),
          sapCatalogosService.getPaquetes(),
        ]);
        setItems(itemsData || []);
        setRubros(rubrosData || []);
        setPaquetes(paquetesData || []);
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      } finally {
        setLoadingCatalogos(false);
      }
    })();
  }, [isOpen]);

  /* Inicializar formularios */
  useEffect(() => {
    if (!isOpen) return;

    // Inyecta ordenVenta→projectCode y centroCosto→costCenter en líneas que no tengan valor
    const injectDefaults = (form) => {
      return {
        ...form,
        lineas: (form.lineas || []).map((l) => ({
          ...l,
          projectCode: l.projectCode || ordenVenta || "",
          costCenter: l.costCenter || centroCosto || "",
        })),
      };
    };

    setGeneral(
      injectDefaults(
        initialValue?.solicitudGeneral
          ? normalizeForm(initialValue.solicitudGeneral)
          : normalizeForm(emptyForm())
      )
    );

    const nextPorTarget = {};
    for (const target of normalizedTargets) {
      const key = String(target.id);
      nextPorTarget[key] = injectDefaults(
        normalizeForm(initialValue?.solicitudesPorEquipo?.[key] || emptyForm())
      );
    }
    setPorTarget(nextPorTarget);
    setTab("general");
  }, [isOpen, initialValue, targetsKey, ordenVenta, centroCosto]);

  // Resolve rubroSapCode → rubroId and paqueteTrabajo code → paqueteTrabajoId
  // once catalog data is loaded (plan items carry codes; lineas need UUIDs)
  useEffect(() => {
    if (!isOpen || (rubros.length === 0 && paquetes.length === 0)) return;

    const resolveLineas = (lineas) => {
      let changed = false;
      const result = (lineas || []).map((l) => {
        const resolvedRubroId =
          l.rubroId ||
          (l.rubroSapCode
            ? rubros.find((r) => String(r.codigo) === String(l.rubroSapCode))?.id ?? null
            : null);
        const resolvedPaqueteId =
          l.paqueteTrabajoId ||
          (l.paqueteTrabajo
            ? paquetes.find((p) => p.codigo === l.paqueteTrabajo)?.id ?? null
            : null);
        if (resolvedRubroId === l.rubroId && resolvedPaqueteId === l.paqueteTrabajoId) return l;
        changed = true;
        return { ...l, rubroId: resolvedRubroId, paqueteTrabajoId: resolvedPaqueteId };
      });
      return changed ? result : lineas;
    };

    setGeneral((prev) => {
      const resolved = resolveLineas(prev.lineas);
      return resolved === prev.lineas ? prev : { ...prev, lineas: resolved };
    });

    setPorTarget((prev) => {
      let changed = false;
      const next = {};
      for (const [key, form] of Object.entries(prev)) {
        const resolved = resolveLineas(form.lineas);
        if (resolved !== form.lineas) {
          changed = true;
          next[key] = { ...form, lineas: resolved };
        } else {
          next[key] = form;
        }
      }
      return changed ? next : prev;
    });
  }, [isOpen, rubros, paquetes]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateTargetForm = (targetId, form) =>
    setPorTarget((prev) => ({ ...prev, [targetId]: form }));

  const solicitudesNoVaciasCount = useMemo(
    () =>
      normalizedTargets.reduce(
        (acc, t) => acc + (!isSolicitudVacia(porTarget[String(t.id)]) ? 1 : 0),
        0
      ),
    [normalizedTargets, porTarget]
  );

  const handleConfirm = () => {
    const solicitudesPorEquipo = {};

    normalizedTargets.forEach((target) => {
      const key = String(target.id);
      const f = porTarget[key];
      if (!isSolicitudVacia(f)) {
        solicitudesPorEquipo[key] = {
          ...buildPayloadSolicitud(f),
          equipo_id: target.equipoId || null,
          ubicacion_tecnica_id: target.ubicacionTecnicaId || null,
        };
      }
    });

    onConfirm({
      solicitudGeneral: isSolicitudVacia(general)
        ? null
        : { ...buildPayloadSolicitud(general), esGeneral: true },
      solicitudesPorEquipo,
    });
  };

  const currentData =
    tab === "general"
      ? general
      : porTarget[String(tab)] || normalizeForm(emptyForm());

  const currentSetFn =
    tab === "general"
      ? setGeneral
      : (form) => updateTargetForm(String(tab), form);

  const currentTarget = normalizedTargets.find(
    (t) => String(t.id) === String(tab)
  );
  const currentTargetHasData =
    tab !== "general" ? !isSolicitudVacia(porTarget[String(tab)]) : false;

  if (!isOpen) return null;
  

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl flex flex-col max-h-[92vh] shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-red-50 to-rose-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 rounded-xl">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Solicitudes de Almacén
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                General opcional ·{" "}
                {solicitudesNoVaciasCount} objetivo
                {solicitudesNoVaciasCount !== 1 ? "s" : ""} con solicitud individual
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/70 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r bg-red-50/40 flex flex-col shrink-0">
            <div className="p-3 space-y-1 flex-1 overflow-y-auto">
              <button
                type="button"
                onClick={() => setTab("general")}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${
                  tab === "general"
                    ? "bg-red-600 text-white shadow-sm"
                    : "hover:bg-red-100 text-gray-700"
                }`}
              >
                <Warehouse className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">General</span>
                {!isSolicitudVacia(general) ? (
                  <CheckCircle className="w-4 h-4 shrink-0 opacity-80" />
                ) : (
                  <Plus className="w-4 h-4 shrink-0 opacity-50" />
                )}
              </button>

              {normalizedTargets.length > 0 && (
                <div className="pt-2 pb-1">
                  <p className="text-xs text-red-400 uppercase font-semibold px-3">
                    Por objetivo
                  </p>
                </div>
              )}

              {normalizedTargets.map((target) => {
                const isActive = String(tab) === String(target.id);
                const f = porTarget[String(target.id)];
                const filled = f && !isSolicitudVacia(f);

                return (
                  <button
                    type="button"
                    key={`${target.type}-${target.id}`}
                    onClick={() => setTab(String(target.id))}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                      isActive
                        ? "bg-rose-600 text-white shadow-sm"
                        : filled
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "hover:bg-red-100 text-gray-500"
                    }`}
                  >
                    {target.type === "UBICACION_TECNICA" ? (
                      <MapPinned className="w-4 h-4 shrink-0" />
                    ) : (
                      <Package className="w-4 h-4 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-xs">{target.nombre}</p>
                      <p className={`text-xs truncate ${isActive ? "text-rose-200" : "text-gray-400"}`}>
                        {getTargetTypeLabel(target.type)} · {target.tag}
                      </p>
                    </div>
                    {filled ? (
                      <CheckCircle className="w-4 h-4 shrink-0 opacity-70" />
                    ) : (
                      <Plus className="w-4 h-4 shrink-0 opacity-40" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Resumen */}
            <div className="p-3 border-t bg-white">
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>General</span>
                  <span className={`font-semibold ${!isSolicitudVacia(general) ? "text-red-600" : "text-gray-400"}`}>
                    {!isSolicitudVacia(general) ? "Con datos" : "Vacía"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Individuales</span>
                  <span className={`font-semibold ${solicitudesNoVaciasCount > 0 ? "text-rose-600" : "text-gray-400"}`}>
                    {solicitudesNoVaciasCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Área principal */}
          <div className="flex-1 overflow-y-auto">
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${tab === "general" ? "bg-red-50" : "bg-rose-50"}`}>
              <div className="flex items-center gap-2 min-w-0">
                {tab === "general" ? (
                  <>
                    <Warehouse className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-gray-800">Solicitud General de Almacén</p>
                      <p className="text-xs text-gray-500">Aplicada a todo el tratamiento</p>
                    </div>
                  </>
                ) : (
                  <>
                    {currentTarget?.type === "UBICACION_TECNICA" ? (
                      <MapPinned className="w-5 h-5 text-rose-600" />
                    ) : (
                      <Package className="w-5 h-5 text-rose-600" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {currentTarget?.nombre || tab}
                      </p>
                      <p className="text-xs text-rose-500 truncate">
                        {getTargetTypeLabel(currentTarget?.type)} · {currentTarget?.tag}
                      </p>
                    </div>
                    {currentTargetHasData && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold border bg-red-100 border-red-300 text-red-700">
                        Con datos
                      </span>
                    )}
                  </>
                )}
              </div>

              {tab !== "general" && (
                <button
                  type="button"
                  onClick={() => updateTargetForm(String(tab), normalizeForm(emptyForm()))}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-white/60 transition"
                >
                  Limpiar este objetivo
                </button>
              )}
            </div>

            <div className="p-6">
              <FormSolicitudAlmacen
                data={currentData}
                onChange={currentSetFn}
                items={items}
                rubros={rubros}
                paquetes={paquetes}
                loadingCatalogos={loadingCatalogos}
                defaultProjectCode={ordenVenta}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t bg-gray-50 flex items-center justify-between shrink-0">
          <div className="text-sm text-gray-500 flex items-center gap-4">
            <span><span className="text-red-400">*</span> Campos obligatorios</span>
            {solicitudesNoVaciasCount > 0 && (
              <span className="flex items-center gap-1 text-rose-600 font-medium">
                <ClipboardList className="w-4 h-4" />
                {solicitudesNoVaciasCount} solicitud{solicitudesNoVaciasCount !== 1 ? "es" : ""} individual{solicitudesNoVaciasCount !== 1 ? "es" : ""}
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border rounded-xl hover:bg-white transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 font-medium text-sm shadow-lg shadow-red-500/20 flex items-center gap-2"
            >
              <Warehouse className="w-4 h-4" />
              Guardar solicitudes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}