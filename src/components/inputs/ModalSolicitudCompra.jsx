import { useEffect, useMemo, useState } from "react";
import {
  X, Plus, Trash2, ShoppingCart, Package,
  Calendar, CheckCircle, MapPinned, ClipboardList,
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
      ? Number(l.quantity) : 1,
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
  const hasLineas = Array.isArray(s.lineas) &&
    s.lineas.some((l) =>
      (l.itemCode?.trim() || l.description?.trim()) && Number(l.quantity) > 0
    );
  return !(hasDate || hasLineas);
};

// Convierte el form local al payload que espera el backend
const buildPayloadSolicitud = (form) => ({
  department: "",
  requester: "",
  requiredDate: form.requiredDate || "",
  comments: "",
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
   FORMULARIO
══════════════════════════════════════════ */
function FormSolicitud({ data, onChange, items = [], rubros = [], paquetes = [], loadingCatalogos = false, defaultProjectCode = "" }) {
  const [warehousesByLinea, setWarehousesByLinea] = useState({});

  const set = (field, value) => onChange({ ...data, [field]: value });
  const updateLinea = (id, field, value) =>
    set("lineas", data.lineas.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  const addLinea = () => set("lineas", [...data.lineas, emptyLinea(defaultProjectCode)]);
  const removeLinea = (id) => set("lineas", data.lineas.filter((l) => l.id !== id));

  const handleSelectItem = async (lineaId, selectedItemId) => {
    const item = items.find((i) => String(i.id) === String(selectedItemId));
    if (!item) return;

    set("lineas", data.lineas.map((l) =>
      l.id === lineaId
        ? { ...l, itemId: item.id, itemCode: item.sapCode, description: item.nombre, warehouseCode: "" }
        : l
    ));

    try {
      const res = await itemService.getWarehouses(item.sapCode);
      setWarehousesByLinea((prev) => ({ ...prev, [lineaId]: res.data || [] }));
    } catch (e) {
      console.error("Error cargando warehouses:", e);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Cabecera: solo fecha ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
            <Calendar className="inline w-3.5 h-3.5 mr-1" />
            Fecha necesaria <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            value={data.requiredDate}
            onChange={(e) => set("requiredDate", e.target.value)}
          />
        </div>
      </div>

      {/* ── Líneas ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-gray-500" />
            Artículos
          </p>
          <span className="text-xs text-gray-400">
            {data.lineas.length} ítem{data.lineas.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="space-y-2">
          {data.lineas.map((l, idx) => (
            <div key={l.id} className="bg-gray-50 border rounded-xl p-3 space-y-2">
              {/* Fila 1 */}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <p className="text-xs text-gray-500 mb-1">Ítem *</p>
                  <select
                    className="w-full px-2 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-400"
                    value={l.itemId || ""}
                    onChange={(e) => handleSelectItem(l.id, e.target.value)}
                    disabled={loadingCatalogos}
                  >
                    <option value="">{loadingCatalogos ? "Cargando..." : "Seleccione"}</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.sapCode} - {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Código</p>
                  <input readOnly value={l.itemCode}
                    className="w-full px-2 py-1.5 border rounded-lg text-sm bg-gray-100" />
                </div>

                <div className="col-span-3">
                  <p className="text-xs text-gray-500 mb-1">Descripción *</p>
                  <input type="text" value={l.description}
                    onChange={(e) => updateLinea(l.id, "description", e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400" />
                </div>

                <div className="col-span-1">
                  <p className="text-xs text-gray-500 mb-1">Cant.</p>
                  <input type="number" min="1" value={l.quantity}
                    onChange={(e) => updateLinea(l.id, "quantity", Number(e.target.value))}
                    className="w-full px-2 py-1.5 border rounded-lg text-sm text-center font-semibold focus:outline-none" />
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Almacén</p>
                  <select value={l.warehouseCode || ""}
                    onChange={(e) => updateLinea(l.id, "warehouseCode", e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg text-sm">
                    <option value="">Seleccione</option>
                    {(warehousesByLinea[l.id] || []).map((w) => (
                      <option key={w.warehouseCode} value={w.warehouseCode}>
                        {w.warehouseCode} (Stock: {w.inStock})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fila 2 */}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <p className="text-xs text-gray-500 mb-1">Centro de costo</p>
                  <input type="text" placeholder="CC-001" value={l.costCenter}
                    onChange={(e) => updateLinea(l.id, "costCenter", e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400" />
                </div>

                <div className="col-span-3">
                  <p className="text-xs text-gray-500 mb-1">Proyecto</p>
                  <input type="text" placeholder="Opcional" value={l.projectCode}
                    onChange={(e) => updateLinea(l.id, "projectCode", e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400" />
                </div>

                <div className="col-span-3">
                  <p className="text-xs text-gray-500 mb-1">Rubro</p>
                  <select value={l.rubroId ?? ""}
                    onChange={(e) => updateLinea(l.id, "rubroId", e.target.value || null)}
                    className="w-full px-2 py-1.5 border rounded-lg text-sm bg-white">
                    <option value="">Seleccione</option>
                    {rubros.map((r) => (
                      <option key={r.id} value={r.id}>{r.codigo} - {r.descripcion}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3">
                  <p className="text-xs text-gray-500 mb-1">Paquete trabajo</p>
                  <select value={l.paqueteTrabajoId ?? ""}
                    onChange={(e) => updateLinea(l.id, "paqueteTrabajoId", e.target.value || null)}
                    className="w-full px-2 py-1.5 border rounded-lg text-sm bg-white">
                    <option value="">Seleccione</option>
                    {paquetes.map((p) => (
                      <option key={p.id} value={p.id}>{p.codigo} - {p.descripcion}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2">
                {data.lineas.length > 1 && (
                  <button type="button" onClick={() => removeLinea(l.id)}
                    className="px-3 py-2 bg-red-50 border border-red-200 text-red-500 rounded-lg hover:bg-red-100 flex items-center gap-1 text-sm">
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                )}
                {idx === data.lineas.length - 1 && (
                  <button type="button" onClick={addLinea}
                    className="px-3 py-2 bg-green-50 border border-green-200 text-green-600 rounded-lg hover:bg-green-100 flex items-center gap-1 text-sm">
                    <Plus className="w-3.5 h-3.5" /> Agregar línea
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
export default function ModalSolicitudCompra({
  isOpen, onClose, onConfirm,
  targets = [], equiposRelacion = [], ubicacionesRelacion = [], equiposInfo = [],
  initialValue = null, contextoOt = null, ordenVenta = "", centroCosto = "",
}) {
  const [tab, setTab] = useState("general");
  const [general, setGeneral] = useState(emptyForm());
  const [porTarget, setPorTarget] = useState({});
  const [items, setItems] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  const normalizedTargets = useMemo(() => {
    const source = Array.isArray(contextoOt?.targets) && contextoOt.targets.length > 0
      ? contextoOt.targets : targets;

    if (Array.isArray(source) && source.length > 0) {
      return source.map((t) => ({
        id: String(t.id), type: t.type || "EQUIPO",
        nombre: t.nombre || t.tag || t.id, tag: t.tag || t.id,
        equipoId: t.equipoId || null, ubicacionTecnicaId: t.ubicacionTecnicaId || null,
      }));
    }

    const eq = (equiposRelacion || []).map((rel) => {
      const id = String(rel.equipoId);
      const e = (equiposInfo || []).find((x) => String(x.id) === id);
      return { id, type: "EQUIPO", nombre: e?.nombre || id, tag: e?.tag || id, equipoId: id, ubicacionTecnicaId: null };
    });

    const ub = (ubicacionesRelacion || []).map((rel) => {
      const id = String(rel.ubicacionId || rel.ubicacionTecnicaId || rel?.ubicacionTecnica?.id);
      return {
        id, type: "UBICACION_TECNICA",
        nombre: rel?.ubicacionTecnica?.nombre || rel?.ubicacion?.nombre || `Ubicación ${id}`,
        tag: rel?.ubicacionTecnica?.codigo || id,
        equipoId: null, ubicacionTecnicaId: id,
      };
    });

    return [...eq, ...ub];
  }, [contextoOt, targets, equiposRelacion, ubicacionesRelacion, equiposInfo]);

  const targetsKey = useMemo(
    () => normalizedTargets.map((t) => `${t.type}-${t.id}`).join("|"),
    [normalizedTargets]
  );

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        setLoadingCatalogos(true);
        const [i, r, p] = await Promise.all([
          itemService.getAll(),
          sapCatalogosService.getRubros(),
          sapCatalogosService.getPaquetes(),
        ]);
        setItems(i || []); setRubros(r || []); setPaquetes(p || []);
      } catch (e) { console.error(e); }
      finally { setLoadingCatalogos(false); }
    })();
  }, [isOpen]);

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
    const next = {};
    for (const t of normalizedTargets) {
      const key = String(t.id);
      next[key] = injectDefaults(
        normalizeForm(initialValue?.solicitudesPorEquipo?.[key] || emptyForm())
      );
    }
    setPorTarget(next);
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

  const solicitudesNoVaciasCount = useMemo(() =>
    normalizedTargets.reduce((acc, t) => acc + (!isSolicitudVacia(porTarget[String(t.id)]) ? 1 : 0), 0),
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

  // ← CAMBIAR: usar solicitudGeneral y solicitudesPorEquipo
  onConfirm({
    solicitudGeneral: isSolicitudVacia(general) ? null : { ...buildPayloadSolicitud(general), esGeneral: true },
    solicitudesPorEquipo,
  });
};
  const currentData = tab === "general" ? general : (porTarget[String(tab)] || normalizeForm(emptyForm()));
  const currentSetFn = tab === "general" ? setGeneral : (form) => setPorTarget((p) => ({ ...p, [String(tab)]: form }));
  const currentTarget = normalizedTargets.find((t) => String(t.id) === String(tab));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl flex flex-col max-h-[92vh] shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Solicitudes de Compra</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {solicitudesNoVaciasCount} objetivo{solicitudesNoVaciasCount !== 1 ? "s" : ""} con solicitud individual
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 flex flex-col shrink-0">
            <div className="p-3 space-y-1 flex-1 overflow-y-auto">
              <button type="button" onClick={() => setTab("general")}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${
                  tab === "general" ? "bg-green-600 text-white shadow-sm" : "hover:bg-gray-100 text-gray-700"
                }`}>
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">General</span>
                {!isSolicitudVacia(general)
                  ? <CheckCircle className="w-4 h-4 shrink-0 opacity-70" />
                  : <Plus className="w-4 h-4 shrink-0 opacity-40" />}
              </button>

              {normalizedTargets.length > 0 && (
                <p className="text-xs text-gray-400 uppercase font-semibold px-3 pt-2 pb-1">Por objetivo</p>
              )}

              {normalizedTargets.map((target) => {
                const isActive = String(tab) === String(target.id);
                const filled = !isSolicitudVacia(porTarget[String(target.id)]);
                return (
                  <button type="button" key={`${target.type}-${target.id}`}
                    onClick={() => setTab(String(target.id))}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                      isActive ? "bg-indigo-600 text-white shadow-sm"
                      : filled ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "hover:bg-gray-100 text-gray-500"
                    }`}>
                    {target.type === "UBICACION_TECNICA"
                      ? <MapPinned className="w-4 h-4 shrink-0" />
                      : <Package className="w-4 h-4 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-xs">{target.nombre}</p>
                      <p className={`text-xs truncate ${isActive ? "text-indigo-200" : "text-gray-400"}`}>
                        {getTargetTypeLabel(target.type)} · {target.tag}
                      </p>
                    </div>
                    {filled ? <CheckCircle className="w-4 h-4 shrink-0 opacity-70" /> : <Plus className="w-4 h-4 shrink-0 opacity-40" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto">
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${tab === "general" ? "bg-green-50" : "bg-indigo-50"}`}>
              <div className="flex items-center gap-2">
                {tab === "general" ? (
                  <><ShoppingCart className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-gray-800">Solicitud General</p></>
                ) : (
                  <>{currentTarget?.type === "UBICACION_TECNICA"
                    ? <MapPinned className="w-5 h-5 text-indigo-600" />
                    : <Package className="w-5 h-5 text-indigo-600" />}
                  <p className="font-semibold text-gray-800">{currentTarget?.nombre || tab}</p></>
                )}
              </div>
              {tab !== "general" && (
                <button type="button"
                  onClick={() => setPorTarget((p) => ({ ...p, [String(tab)]: normalizeForm(emptyForm()) }))}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-white/60 transition">
                  Limpiar
                </button>
              )}
            </div>
            <div className="p-6">
              <FormSolicitud data={currentData} onChange={currentSetFn}
                items={items} rubros={rubros} paquetes={paquetes} loadingCatalogos={loadingCatalogos}
                defaultProjectCode={ordenVenta} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t bg-gray-50 flex items-center justify-between shrink-0">
          <div className="text-sm text-gray-500">
            {solicitudesNoVaciasCount > 0 && (
              <span className="flex items-center gap-1 text-indigo-600 font-medium">
                <ClipboardList className="w-4 h-4" />
                {solicitudesNoVaciasCount} solicitud{solicitudesNoVaciasCount !== 1 ? "es" : ""} individual{solicitudesNoVaciasCount !== 1 ? "es" : ""}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 border rounded-xl hover:bg-white transition-colors font-medium text-sm">
              Cancelar
            </button>
            <button type="button" onClick={handleConfirm}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-green-500/20 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Guardar solicitudes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}