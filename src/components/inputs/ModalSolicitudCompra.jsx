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
} from "lucide-react";

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */

const emptyLinea = () => ({
  id: crypto.randomUUID(),
  itemCode: "",
  description: "",
  quantity: 1,
  warehouseCode: "01",
  costCenter: "",
  projectCode: "",
  rubro: "",          // ✅ NUEVO
  paqueteTrabajo: "", // ✅ NUEVO
});

const emptyForm = () => ({
  department: "",
  email: "",
  requiredDate: "",
  comments: "",
  lineas: [emptyLinea()],
});

/* ══════════════════════════════════════════
   SUB-COMPONENTE: FORMULARIO DE SOLICITUD
══════════════════════════════════════════ */

function FormSolicitud({ data, onChange }) {
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

  return (
    <div className="space-y-5">
      {/* Datos generales */}
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

      {/* Líneas */}
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
              {/* Código */}
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Código *</p>
                <input
                  type="text"
                  placeholder="MAT-001"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.itemCode}
                  onChange={(e) => updateLinea(l.id, "itemCode", e.target.value)}
                />
              </div>

              {/* Descripción */}
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

              {/* Cantidad */}
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

              {/* Almacén */}
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

              {/* Centro Costo */}
              <div className="col-span-1">
                <p className="text-xs text-gray-500 mb-1">C. Costo</p>
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

              {/* Proyecto */}
              <div className="col-span-1">
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

              {/* Rubro */}
              <div className="col-span-1">
                <p className="text-xs text-gray-500 mb-1">Rubro</p>
                <input
                  type="text"
                  placeholder="Ej: Electricidad"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.rubro || ""}
                  onChange={(e) => updateLinea(l.id, "rubro", e.target.value)}
                />
              </div>

              {/* Paquete de Trabajo */}
              <div className="col-span-1">
                <p className="text-xs text-gray-500 mb-1">Paquete</p>
                <input
                  type="text"
                  placeholder="Ej: PT-001"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.paqueteTrabajo || ""}
                  onChange={(e) =>
                    updateLinea(l.id, "paqueteTrabajo", e.target.value)
                  }
                />
              </div>

              {/* Acciones */}
              <div className="col-span-1 flex gap-1">
                {data.lineas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLinea(l.id)}
                    className="flex-1 py-1.5 bg-red-50 border border-red-200 text-red-500 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                    title="Eliminar línea"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {idx === data.lineas.length - 1 && (
                  <button
                    type="button"
                    onClick={addLinea}
                    className="flex-1 py-1.5 bg-green-50 border border-green-200 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center"
                    title="Agregar línea"
                  >
                    <Plus className="w-3.5 h-3.5" />
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
  equiposRelacion = [], // aviso.equiposRelacion (array con {equipoId})
  equiposInfo = [], 
    initialValue = null,
}) {
  // Tab activo: "general" | equipoId
  const [tab, setTab] = useState("general");

  // Solicitud general (siempre se envía)
  const [general, setGeneral] = useState(emptyForm());

  // Solicitudes por equipo (si está vacía no se envía)
  const [porEquipo, setPorEquipo] = useState(() => {
    const init = {};
    equiposRelacion.forEach((rel) => {
      init[rel.equipoId] = emptyForm();
    });
    return init;
  });


// helper: asegura ids en lineas
const normalizeForm = (form) => {
  const f = form || emptyForm();
  const lineas = Array.isArray(f.lineas) ? f.lineas : [];
  const normalizedLineas =
    lineas.length > 0
      ? lineas.map((l) => ({ ...l, id: l.id || crypto.randomUUID() }))
      : [emptyLinea()];

  return {
    ...emptyForm(),
    ...f,
    lineas: normalizedLineas,
  };
};

useEffect(() => {
  if (!isOpen) return;

  // 1) General
  setGeneral((prev) =>
    initialValue?.solicitudGeneral
      ? normalizeForm(initialValue.solicitudGeneral)
      : prev
  );

  // 2) Por equipo (siempre crear keys por equiposRelacion)
  setPorEquipo((prev) => {
    const next = {};
    for (const rel of equiposRelacion) {
      const k = rel.equipoId;

      const fromInitial = initialValue?.solicitudesPorEquipo?.[k];
      const fromPrev = prev?.[k];

      next[k] = normalizeForm(fromInitial || fromPrev || emptyForm());
    }
    return next;
  });

  // Si abres el modal en "general" siempre
  setTab("general");
}, [isOpen, equiposRelacion, initialValue]);



  const getEquipoNombre = (equipoId) => {
    const eq = equiposInfo.find((e) => e.id === equipoId);
    return eq ? eq.nombre || eq.tag || equipoId : equipoId;
  };

  const getEquipoTag = (equipoId) => {
    const eq = equiposInfo.find((e) => e.id === equipoId);
    return eq?.tag || null;
  };

  const updateEquipoForm = (equipoId, form) => {
    setPorEquipo((prev) => ({ ...prev, [equipoId]: form }));
  };

  const isSolicitudVacia = (s) => {
    if (!s) return true;

    const hasHeader = Boolean(
      s.department?.trim() ||
        s.email?.trim() ||
        s.requiredDate ||
        s.comments?.trim()
    );

    const hasLineas = Array.isArray(s.lineas) &&
      s.lineas.some((l) => {
        const hasBasics =
          (l.itemCode?.trim() || l.description?.trim()) && Number(l.quantity) > 0;
        // rubro/paquete NO hacen “no vacía” solos, pero sí viajan si hay línea
        return hasBasics;
      });

    return !(hasHeader || hasLineas);
  };

  const solicitudesNoVaciasCount = useMemo(() => {
    return equiposRelacion.reduce((acc, rel) => {
      const f = porEquipo[rel.equipoId];
      return acc + (!isSolicitudVacia(f) ? 1 : 0);
    }, 0);
  }, [equiposRelacion, porEquipo]);

  const handleConfirm = () => {
    const solicitudesPorEquipo = {};

    equiposRelacion.forEach((rel) => {
      const f = porEquipo[rel.equipoId];
      if (!isSolicitudVacia(f)) {
        solicitudesPorEquipo[rel.equipoId] = f;
      }
    });

    onConfirm({ solicitudGeneral: general, solicitudesPorEquipo });
  };

  const tabs = [
    { id: "general", label: "General", isGeneral: true },
    ...equiposRelacion.map((rel) => ({
      id: rel.equipoId,
      label: getEquipoNombre(rel.equipoId),
      tag: getEquipoTag(rel.equipoId),
      isGeneral: false,
    })),
  ];

  const currentData =
    tab === "general" ? general : porEquipo[tab] || emptyForm();

  const currentSetFn =
    tab === "general" ? setGeneral : (form) => updateEquipoForm(tab, form);

  // Marcar si el tab actual de equipo tiene datos
  const currentEquipoHasData =
    tab !== "general" ? !isSolicitudVacia(porEquipo[tab]) : false;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl flex flex-col max-h-[92vh] shadow-2xl">
        {/* ── HEADER ── */}
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
                General obligatoria · {solicitudesNoVaciasCount} equipo
                {solicitudesNoVaciasCount !== 1 ? "s" : ""} con solicitud
                individual
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
          {/* ── SIDEBAR DE TABS ── */}
          <div className="w-56 border-r bg-gray-50 flex flex-col shrink-0">
            <div className="p-3 space-y-1 flex-1 overflow-y-auto">
              {/* Tab General */}
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

              {/* Separador equipos */}
              {equiposRelacion.length > 0 && (
                <div className="pt-2 pb-1">
                  <p className="text-xs text-gray-400 uppercase font-semibold px-3">
                    Por Equipo
                  </p>
                </div>
              )}

              {/* Tabs por equipo (sin activar/desactivar) */}
              {equiposRelacion.map((rel) => {
                const nombre = getEquipoNombre(rel.equipoId);
                const tag = getEquipoTag(rel.equipoId);
                const isActive = tab === rel.equipoId;

                const f = porEquipo[rel.equipoId];
                const filled = f && !isSolicitudVacia(f);

                return (
                  <button
                    type="button"
                    key={rel.equipoId}
                    onClick={() => setTab(rel.equipoId)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : filled
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "hover:bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Package className="w-4 h-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-xs">{nombre}</p>
                      {tag && (
                        <p
                          className={`text-xs truncate ${
                            isActive ? "text-indigo-200" : "text-gray-400"
                          }`}
                        >
                          TAG: {tag}
                        </p>
                      )}
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

            {/* Resumen sidebar */}
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

          {/* ── CONTENIDO PRINCIPAL ── */}
          <div className="flex-1 overflow-y-auto">
            {/* Banner tab actual */}
            <div
              className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
                tab === "general" ? "bg-green-50" : "bg-indigo-50"
              }`}
            >
              <div className="flex items-center gap-2">
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
                    <Package className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {getEquipoNombre(tab)}
                      </p>
                      {getEquipoTag(tab) && (
                        <p className="text-xs text-indigo-500">
                          TAG: {getEquipoTag(tab)}
                        </p>
                      )}
                    </div>
                    {currentEquipoHasData && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold border bg-green-100 border-green-300 text-green-700">
                        Con datos
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Botón limpiar solo para equipos */}
              {tab !== "general" && (
                <button
                  type="button"
                  onClick={() => updateEquipoForm(tab, emptyForm())}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-white/60 transition"
                  title="Dejar vacío este equipo (no se enviará)"
                >
                  Limpiar este equipo
                </button>
              )}
            </div>

            {/* Formulario */}
            <div className="p-6">
              <FormSolicitud data={currentData} onChange={currentSetFn} />
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="p-5 border-t bg-gray-50 flex items-center justify-between shrink-0">
          <div className="text-sm text-gray-500 flex items-center gap-4">
            <span>
              <span className="text-red-400">*</span> Campos obligatorios
            </span>

            {solicitudesNoVaciasCount > 0 && (
              <span className="flex items-center gap-1 text-indigo-600 font-medium">
                <Package className="w-4 h-4" />
                {solicitudesNoVaciasCount} solicitud
                {solicitudesNoVaciasCount !== 1 ? "es" : ""} por equipo incluida
                {solicitudesNoVaciasCount !== 1 ? "s" : ""}
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