import { useEffect, useMemo, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  ShoppingCart,
  Package,
  Calendar,
  Mail,
  CheckCircle,
  MapPinned,
  ClipboardList,
} from "lucide-react";

import { itemService } from "../../features/PlanMantenimiento/services/itemService";
import { rubroService } from "../../features/PlanMantenimiento/services/rubroService";

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */

const ensureId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const emptyLinea = () => ({
  id: ensureId(),
  itemId: "",
  itemCode: "",
  description: "",
  quantity: 1,
  warehouseCode: "",
  costCenter: "",
  projectCode: "",
  rubro: "",
  rubroSapCode: "",
  paqueteTrabajo: "",
});

const emptyForm = () => ({
  department: "",
  email: "",
  requiredDate: "",
  comments: "",
  lineas: [emptyLinea()],
});

const normalizeForm = (form) => {
  const f = form || emptyForm();
  const lineas = Array.isArray(f.lineas) ? f.lineas : [];

  const normalizedLineas =
    lineas.length > 0
      ? lineas.map((l) => ({
          ...emptyLinea(),
          ...l,
          id: l.id || ensureId(),
          quantity:
            Number.isFinite(Number(l.quantity)) && Number(l.quantity) > 0
              ? Number(l.quantity)
              : 1,
        }))
      : [emptyLinea()];

  return {
    ...emptyForm(),
    ...f,
    lineas: normalizedLineas,
  };
};

const isSolicitudVacia = (s) => {
  if (!s) return true;

  const hasHeader = Boolean(
    s.department?.trim() ||
      s.email?.trim() ||
      s.requiredDate ||
      s.comments?.trim()
  );

  const hasLineas =
    Array.isArray(s.lineas) &&
    s.lineas.some((l) => {
      const hasBasics =
        (l.itemCode?.trim() || l.description?.trim()) && Number(l.quantity) > 0;
      return hasBasics;
    });

  return !(hasHeader || hasLineas);
};

const getTargetTypeLabel = (type) =>
  type === "UBICACION_TECNICA" ? "Ubicación técnica" : "Equipo";

/* ══════════════════════════════════════════
   SUB-COMPONENTE: FORMULARIO DE SOLICITUD
══════════════════════════════════════════ */

function FormSolicitud({ data, onChange, items = [], rubros = [], loadingCatalogos = false }) {
  const set = (field, value) => onChange({ ...data, [field]: value });

  const updateLinea = (id, field, value) =>
    set(
      "lineas",
      data.lineas.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );

  const addLinea = () => set("lineas", [...data.lineas, emptyLinea()]);

  const removeLinea = (id) =>
    set(
      "lineas",
      data.lineas.filter((l) => l.id !== id)
    );

  const handleSelectItem = (lineaId, selectedItemId) => {
    const itemSeleccionado = items.find((i) => String(i.id) === String(selectedItemId));

    if (!itemSeleccionado) {
      updateLinea(lineaId, "itemId", "");
      updateLinea(lineaId, "itemCode", "");
      updateLinea(lineaId, "description", "");
      updateLinea(lineaId, "rubroSapCode", "");
      updateLinea(lineaId, "rubro", "");
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
          rubroSapCode: itemSeleccionado.rubroSapCode ?? "",
          rubro:
            itemSeleccionado.rubro?.nombre ||
            itemSeleccionado.rubroNombre ||
            "",
        };
      })
    );
  };

  const handleSelectRubro = (lineaId, selectedSapCode) => {
    const rubroSeleccionado = rubros.find(
      (r) => String(r.sapCode) === String(selectedSapCode)
    );

    set(
      "lineas",
      data.lineas.map((l) => {
        if (l.id !== lineaId) return l;

        return {
          ...l,
          rubroSapCode: rubroSeleccionado?.sapCode ?? "",
          rubro: rubroSeleccionado?.nombre || "",
        };
      })
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
            Departamento <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="Ej: Mantenimiento"
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            value={data.department}
            onChange={(e) => set("department", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
            <Mail className="inline w-3.5 h-3.5 mr-1" />
            Email solicitante <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            placeholder="correo@empresa.com"
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            value={data.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>

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

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
            Comentarios
          </label>
          <input
            type="text"
            placeholder="Notas adicionales..."
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            value={data.comments}
            onChange={(e) => set("comments", e.target.value)}
          />
        </div>
      </div>

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
            <div
              key={l.id}
              className="grid grid-cols-12 gap-2 items-end bg-gray-50 border rounded-xl p-3"
            >
              <div className="col-span-3">
                <p className="text-xs text-gray-500 mb-1">Ítem *</p>
                <select
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
                  value={l.itemId || ""}
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
                  placeholder="MAT-001"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm bg-gray-100 focus:outline-none"
                  value={l.itemCode}
                  readOnly
                />
              </div>

              <div className="col-span-3">
                <p className="text-xs text-gray-500 mb-1">Descripción *</p>
                <input
                  type="text"
                  placeholder="Descripción"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.description}
                  onChange={(e) =>
                    updateLinea(l.id, "description", e.target.value)
                  }
                />
              </div>

              <div className="col-span-1">
                <p className="text-xs text-gray-500 mb-1">Cant.</p>
                <input
                  type="number"
                  min="1"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.quantity}
                  onChange={(e) =>
                    updateLinea(l.id, "quantity", Number(e.target.value))
                  }
                />
              </div>

              <div className="col-span-1">
                <p className="text-xs text-gray-500 mb-1">Almacén</p>
                <input
                  type="text"
                  placeholder="01"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.warehouseCode}
                  onChange={(e) =>
                    updateLinea(l.id, "warehouseCode", e.target.value)
                  }
                />
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Centro de costo</p>
                <input
                  type="text"
                  placeholder="CC-001"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.costCenter}
                  onChange={(e) =>
                    updateLinea(l.id, "costCenter", e.target.value)
                  }
                />
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Proyecto</p>
                <input
                  type="text"
                  placeholder="Opcional"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.projectCode}
                  onChange={(e) =>
                    updateLinea(l.id, "projectCode", e.target.value)
                  }
                />
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Rubro</p>
                <select
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
                  value={l.rubroSapCode || ""}
                  onChange={(e) => handleSelectRubro(l.id, e.target.value)}
                  disabled={loadingCatalogos}
                >
                  <option value="">
                    {loadingCatalogos ? "Cargando rubros..." : "Seleccione rubro"}
                  </option>
                  {rubros.map((rubro) => (
                    <option key={rubro.id} value={rubro.sapCode}>
                      {rubro.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <p className="text-xs text-gray-500 mb-1">Paquete</p>
                <input
                  type="text"
                  placeholder="PT-001"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.paqueteTrabajo || ""}
                  onChange={(e) =>
                    updateLinea(l.id, "paqueteTrabajo", e.target.value)
                  }
                />
              </div>

              <div className="col-span-12 flex justify-end gap-2">
                {data.lineas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLinea(l.id)}
                    className="px-3 py-2 bg-red-50 border border-red-200 text-red-500 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                    title="Eliminar línea"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                )}

                {idx === data.lineas.length - 1 && (
                  <button
                    type="button"
                    onClick={addLinea}
                    className="px-3 py-2 bg-green-50 border border-green-200 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                    title="Agregar línea"
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

export default function ModalSolicitudCompra({
  isOpen,
  onClose,
  onConfirm,
  targets = [],
  equiposRelacion = [],
  ubicacionesRelacion = [],
  equiposInfo = [],
  initialValue = null,
}) {
  const [tab, setTab] = useState("general");
  const [general, setGeneral] = useState(emptyForm());
  const [porTarget, setPorTarget] = useState({});
  const [items, setItems] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  const normalizedTargets = useMemo(() => {
    if (Array.isArray(targets) && targets.length > 0) {
      return targets.map((t) => ({
        id: String(t.id),
        type: t.type || "EQUIPO",
        nombre: t.nombre || t.tag || t.id,
        tag: t.tag || t.id,
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
        tag:
          rel?.ubicacionTecnica?.codigo ||
          rel?.ubicacion?.codigo ||
          id,
      };
    });

    return [...fallbackEquipos, ...fallbackUbicaciones];
  }, [targets, equiposRelacion, ubicacionesRelacion, equiposInfo]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        setLoadingCatalogos(true);

        const [itemsData, rubrosData] = await Promise.all([
          itemService.getAll(),
          rubroService.getAll(),
        ]);

        setItems(Array.isArray(itemsData) ? itemsData : []);
        setRubros(Array.isArray(rubrosData) ? rubrosData : []);
      } catch (error) {
        console.error("Error cargando catálogos de solicitud de compra:", error);
        setItems([]);
        setRubros([]);
      } finally {
        setLoadingCatalogos(false);
      }
    };

    if (isOpen) {
      cargarCatalogos();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setGeneral(
      initialValue?.solicitudGeneral
        ? normalizeForm(initialValue.solicitudGeneral)
        : normalizeForm(emptyForm())
    );

    setPorTarget(() => {
      const next = {};
      for (const target of normalizedTargets) {
        const key = String(target.id);
        const fromInitial = initialValue?.solicitudesPorEquipo?.[key];
        next[key] = normalizeForm(fromInitial || emptyForm());
      }
      return next;
    });

    setTab("general");
  }, [isOpen, normalizedTargets, initialValue]);

  const updateTargetForm = (targetId, form) => {
    setPorTarget((prev) => ({ ...prev, [targetId]: form }));
  };

  const solicitudesNoVaciasCount = useMemo(() => {
    return normalizedTargets.reduce((acc, target) => {
      const f = porTarget[String(target.id)];
      return acc + (!isSolicitudVacia(f) ? 1 : 0);
    }, 0);
  }, [normalizedTargets, porTarget]);

  const handleConfirm = () => {
    const solicitudesPorEquipo = {};

    normalizedTargets.forEach((target) => {
      const key = String(target.id);
      const f = porTarget[key];

      if (!isSolicitudVacia(f)) {
        solicitudesPorEquipo[key] = {
          ...f,
          lineas: (f.lineas || []).map((linea) => ({
            ...linea,
            costingCode: linea.costCenter || "",
          })),
        };
      }
    });

    onConfirm({
      solicitudGeneral: {
        ...general,
        lineas: (general.lineas || []).map((linea) => ({
          ...linea,
          costingCode: linea.costCenter || "",
        })),
      },
      solicitudesPorEquipo,
    });
  };

  const tabs = [
    { id: "general", label: "General", isGeneral: true },
    ...normalizedTargets.map((target) => ({
      id: String(target.id),
      label: target.nombre,
      tag: target.tag,
      type: target.type,
      isGeneral: false,
    })),
  ];

  const currentData =
    tab === "general"
      ? general
      : porTarget[String(tab)] || normalizeForm(emptyForm());

  const currentSetFn =
    tab === "general" ? setGeneral : (form) => updateTargetForm(String(tab), form);

  const currentTarget = normalizedTargets.find((t) => String(t.id) === String(tab));
  const currentTargetHasData =
    tab !== "general" ? !isSolicitudVacia(porTarget[String(tab)]) : false;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl flex flex-col max-h-[92vh] shadow-2xl">
        <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Solicitudes de Compra
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                General obligatoria · {solicitudesNoVaciasCount} objetivo
                {solicitudesNoVaciasCount !== 1 ? "s" : ""} con solicitud individual
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r bg-gray-50 flex flex-col shrink-0">
            <div className="p-3 space-y-1 flex-1 overflow-y-auto">
              <button
                type="button"
                onClick={() => setTab("general")}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${
                  tab === "general"
                    ? "bg-green-600 text-white shadow-sm"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">General</span>
                <CheckCircle className="w-4 h-4 shrink-0 opacity-60" />
              </button>

              {normalizedTargets.length > 0 && (
                <div className="pt-2 pb-1">
                  <p className="text-xs text-gray-400 uppercase font-semibold px-3">
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
                        ? "bg-indigo-600 text-white shadow-sm"
                        : filled
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "hover:bg-gray-100 text-gray-500"
                    }`}
                  >
                    {target.type === "UBICACION_TECNICA" ? (
                      <MapPinned className="w-4 h-4 shrink-0" />
                    ) : (
                      <Package className="w-4 h-4 shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-xs">{target.nombre}</p>
                      <p
                        className={`text-xs truncate ${
                          isActive ? "text-indigo-200" : "text-gray-400"
                        }`}
                      >
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

            <div className="p-3 border-t bg-white">
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>General</span>
                  <span className="text-green-600 font-semibold">✓ siempre</span>
                </div>
                <div className="flex justify-between">
                  <span>Individuales</span>
                  <span
                    className={`font-semibold ${
                      solicitudesNoVaciasCount > 0
                        ? "text-indigo-600"
                        : "text-gray-400"
                    }`}
                  >
                    {solicitudesNoVaciasCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div
              className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
                tab === "general" ? "bg-green-50" : "bg-indigo-50"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {tab === "general" ? (
                  <>
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        Solicitud General
                      </p>
                      <p className="text-xs text-gray-500">
                        Aplicada a todo el tratamiento
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {currentTarget?.type === "UBICACION_TECNICA" ? (
                      <MapPinned className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Package className="w-5 h-5 text-indigo-600" />
                    )}

                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {currentTarget?.nombre || tab}
                      </p>
                      <p className="text-xs text-indigo-500 truncate">
                        {getTargetTypeLabel(currentTarget?.type)} · {currentTarget?.tag}
                      </p>
                    </div>

                    {currentTargetHasData && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold border bg-green-100 border-green-300 text-green-700">
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
                  title="Dejar vacío este objetivo (no se enviará)"
                >
                  Limpiar este objetivo
                </button>
              )}
            </div>

            <div className="p-6">
              <FormSolicitud
                data={currentData}
                onChange={currentSetFn}
                items={items}
                rubros={rubros}
                loadingCatalogos={loadingCatalogos}
              />
            </div>
          </div>
        </div>

        <div className="p-5 border-t bg-gray-50 flex items-center justify-between shrink-0">
          <div className="text-sm text-gray-500 flex items-center gap-4">
            <span>
              <span className="text-red-400">*</span> Campos obligatorios
            </span>

            {solicitudesNoVaciasCount > 0 && (
              <span className="flex items-center gap-1 text-indigo-600 font-medium">
                <ClipboardList className="w-4 h-4" />
                {solicitudesNoVaciasCount} solicitud
                {solicitudesNoVaciasCount !== 1 ? "es" : ""} individual
                {solicitudesNoVaciasCount !== 1 ? "es" : ""}
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
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-medium text-sm shadow-lg shadow-green-500/20 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Guardar solicitudes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}