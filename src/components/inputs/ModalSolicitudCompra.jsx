import { useState } from "react";
import {
  X, Plus, Trash2, ShoppingCart, Package, Calendar,
  Mail, Building, ChevronRight, ToggleLeft, ToggleRight,
  CheckCircle, AlertCircle
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

function FormSolicitud({ data, onChange, accentColor = "green" }) {
  const ring    = `focus:ring-${accentColor}-500`;
  const btnAdd  = `bg-${accentColor}-50 border-${accentColor}-200 text-${accentColor}-600 hover:bg-${accentColor}-100`;

  const set = (field, value) => onChange({ ...data, [field]: value });

  const updateLinea = (id, field, value) =>
    set("lineas", data.lineas.map(l => l.id === id ? { ...l, [field]: value } : l));

  const addLinea = () => set("lineas", [...data.lineas, emptyLinea()]);

  const removeLinea = (id) =>
    set("lineas", data.lineas.filter(l => l.id !== id));

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
            onChange={e => set("department", e.target.value)}
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
            onChange={e => set("email", e.target.value)}
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
            onChange={e => set("requiredDate", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Comentarios</label>
          <input
            type="text"
            placeholder="Notas adicionales..."
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            value={data.comments}
            onChange={e => set("comments", e.target.value)}
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
          <span className="text-xs text-gray-400">{data.lineas.length} ítem{data.lineas.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="space-y-2">
          {data.lineas.map((l, idx) => (
            <div key={l.id} className="grid grid-cols-12 gap-2 items-end bg-gray-50 border rounded-xl p-3">
              {/* Código */}
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Código *</p>
                <input
                  type="text" placeholder="MAT-001"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.itemCode}
                  onChange={e => updateLinea(l.id, "itemCode", e.target.value)}
                />
              </div>
              {/* Descripción */}
              <div className="col-span-3">
                <p className="text-xs text-gray-500 mb-1">Descripción *</p>
                <input
                  type="text" placeholder="Descripción"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.description}
                  onChange={e => updateLinea(l.id, "description", e.target.value)}
                />
              </div>
              {/* Cantidad */}
              <div className="col-span-1">
                <p className="text-xs text-gray-500 mb-1">Cant.</p>
                <input
                  type="number" min="1"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.quantity}
                  onChange={e => updateLinea(l.id, "quantity", +e.target.value)}
                />
              </div>
              {/* Almacén */}
              <div className="col-span-1">
                <p className="text-xs text-gray-500 mb-1">Almacén</p>
                <input
                  type="text" placeholder="01"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.warehouseCode}
                  onChange={e => updateLinea(l.id, "warehouseCode", e.target.value)}
                />
              </div>
              {/* Centro Costo */}
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">C. Costo</p>
                <input
                  type="text" placeholder="CC-001"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.costCenter}
                  onChange={e => updateLinea(l.id, "costCenter", e.target.value)}
                />
              </div>
              {/* Proyecto */}
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Proyecto</p>
                <input
                  type="text" placeholder="Opcional"
                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={l.projectCode}
                  onChange={e => updateLinea(l.id, "projectCode", e.target.value)}
                />
              </div>
              {/* Acciones */}
              <div className="col-span-1 flex gap-1">
                {data.lineas.length > 1 && (
                  <button
                    onClick={() => removeLinea(l.id)}
                    className="flex-1 py-1.5 bg-red-50 border border-red-200 text-red-500 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {idx === data.lineas.length - 1 && (
                  <button
                    onClick={addLinea}
                    className="flex-1 py-1.5 bg-green-50 border border-green-200 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center"
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
  equiposRelacion = [],   // ← aviso.equiposRelacion
  equiposInfo = [],       // ← lista completa de equipos (para nombre/tag)
}) {
  // Tab activo: "general" | equipoId
  const [tab, setTab] = useState("general");

  // Solicitud general
  const [general, setGeneral] = useState(emptyForm());

  // Solicitudes por equipo: { [equipoId]: { activa: bool, form: FormData } }
  const [porEquipo, setPorEquipo] = useState(() => {
    const init = {};
    equiposRelacion.forEach(rel => {
      init[rel.equipoId] = { activa: false, form: emptyForm() };
    });
    return init;
  });

  if (!isOpen) return null;

  const getEquipoNombre = (equipoId) => {
    const eq = equiposInfo.find(e => e.id === equipoId);
    return eq ? (eq.nombre || eq.tag || equipoId) : equipoId;
  };

  const getEquipoTag = (equipoId) => {
    const eq = equiposInfo.find(e => e.id === equipoId);
    return eq?.tag || null;
  };

  const toggleEquipo = (equipoId) => {
    setPorEquipo(prev => ({
      ...prev,
      [equipoId]: { ...prev[equipoId], activa: !prev[equipoId].activa },
    }));
    // Si se activa, abrir ese tab
    if (!porEquipo[equipoId]?.activa) setTab(equipoId);
  };

  const updateEquipoForm = (equipoId, form) => {
    setPorEquipo(prev => ({
      ...prev,
      [equipoId]: { ...prev[equipoId], form },
    }));
  };

  const solicitudesActivas = equiposRelacion.filter(rel => porEquipo[rel.equipoId]?.activa);

  const handleConfirm = () => {
    const solicitudesPorEquipo = {};
    solicitudesActivas.forEach(rel => {
      solicitudesPorEquipo[rel.equipoId] = porEquipo[rel.equipoId].form;
    });
    onConfirm({ solicitudGeneral: general, solicitudesPorEquipo });
  };

  /* ── Tabs disponibles ── */
  const tabs = [
    { id: "general", label: "General", isGeneral: true },
    ...equiposRelacion.map(rel => ({
      id: rel.equipoId,
      label: getEquipoNombre(rel.equipoId),
      tag: getEquipoTag(rel.equipoId),
      activa: porEquipo[rel.equipoId]?.activa || false,
      isGeneral: false,
    })),
  ];

  const currentData  = tab === "general" ? general : porEquipo[tab]?.form || emptyForm();
  const currentSetFn = tab === "general"
    ? setGeneral
    : (form) => updateEquipoForm(tab, form);

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
              <h2 className="text-2xl font-bold text-gray-900">Solicitudes de Compra</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                General obligatoria · {solicitudesActivas.length} equipo{solicitudesActivas.length !== 1 ? "s" : ""} con solicitud individual
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* ── SIDEBAR DE TABS ── */}
          <div className="w-56 border-r bg-gray-50 flex flex-col shrink-0">
            <div className="p-3 space-y-1 flex-1 overflow-y-auto">

              {/* Tab General */}
              <button
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
                  <p className="text-xs text-gray-400 uppercase font-semibold px-3">Por Equipo</p>
                </div>
              )}

              {/* Tabs por equipo */}
              {equiposRelacion.map(rel => {
                const nombre  = getEquipoNombre(rel.equipoId);
                const tag     = getEquipoTag(rel.equipoId);
                const activa  = porEquipo[rel.equipoId]?.activa || false;
                const isActive = tab === rel.equipoId;

                return (
                  <div key={rel.equipoId} className="relative">
                    <button
                      onClick={() => { setTab(rel.equipoId); if (!activa) toggleEquipo(rel.equipoId); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-sm"
                          : activa
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "hover:bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Package className="w-4 h-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-xs">{nombre}</p>
                        {tag && <p className={`text-xs truncate ${isActive ? "text-indigo-200" : "text-gray-400"}`}>TAG: {tag}</p>}
                      </div>
                      {activa
                        ? <CheckCircle className="w-4 h-4 shrink-0 opacity-70" />
                        : <Plus className="w-4 h-4 shrink-0 opacity-40" />
                      }
                    </button>

                    {/* Toggle activa/inactiva */}
                    {isActive && (
                      <button
                        onClick={() => toggleEquipo(rel.equipoId)}
                        className={`absolute -top-1 -right-1 text-xs px-1.5 py-0.5 rounded-full font-semibold border transition-colors z-10 ${
                          activa
                            ? "bg-green-100 border-green-300 text-green-700 hover:bg-red-100 hover:border-red-300 hover:text-red-700"
                            : "bg-gray-100 border-gray-300 text-gray-500"
                        }`}
                        title={activa ? "Quitar solicitud de este equipo" : "Solicitud inactiva"}
                      >
                        {activa ? "ON" : "OFF"}
                      </button>
                    )}
                  </div>
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
                  <span className={`font-semibold ${solicitudesActivas.length > 0 ? "text-indigo-600" : "text-gray-400"}`}>
                    {solicitudesActivas.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── CONTENIDO PRINCIPAL ── */}
          <div className="flex-1 overflow-y-auto">

            {/* Banner tab actual */}
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
              tab === "general"
                ? "bg-green-50"
                : (porEquipo[tab]?.activa ? "bg-indigo-50" : "bg-gray-50")
            }`}>
              <div className="flex items-center gap-2">
                {tab === "general" ? (
                  <>
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-800">Solicitud General</p>
                      <p className="text-xs text-gray-500">Aplicada a todo el tratamiento</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="font-semibold text-gray-800">{getEquipoNombre(tab)}</p>
                      {getEquipoTag(tab) && <p className="text-xs text-indigo-500">TAG: {getEquipoTag(tab)}</p>}
                    </div>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold border ${
                      porEquipo[tab]?.activa
                        ? "bg-green-100 border-green-300 text-green-700"
                        : "bg-gray-100 border-gray-300 text-gray-500"
                    }`}>
                      {porEquipo[tab]?.activa ? "Activa" : "No incluida"}
                    </span>
                  </>
                )}
              </div>

              {/* Toggle para equipos */}
              {tab !== "general" && (
                <button
                  onClick={() => toggleEquipo(tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    porEquipo[tab]?.activa
                      ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                      : "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {porEquipo[tab]?.activa ? (
                    <><ToggleRight className="w-4 h-4" /> Quitar solicitud</>
                  ) : (
                    <><ToggleLeft className="w-4 h-4" /> Incluir solicitud</>
                  )}
                </button>
              )}
            </div>

            {/* Formulario */}
            <div className={`p-6 ${tab !== "general" && !porEquipo[tab]?.activa ? "opacity-40 pointer-events-none" : ""}`}>
              {tab !== "general" && !porEquipo[tab]?.activa && (
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 bg-gray-100 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4" />
                  Esta solicitud no se incluirá. Activala para editar.
                </div>
              )}
              <FormSolicitud
                data={currentData}
                onChange={currentSetFn}
              />
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="p-5 border-t bg-gray-50 flex items-center justify-between shrink-0">
          <div className="text-sm text-gray-500 flex items-center gap-4">
            <span><span className="text-red-400">*</span> Campos obligatorios</span>
            {solicitudesActivas.length > 0 && (
              <span className="flex items-center gap-1 text-indigo-600 font-medium">
                <Package className="w-4 h-4" />
                {solicitudesActivas.length} solicitud{solicitudesActivas.length !== 1 ? "es" : ""} por equipo incluida{solicitudesActivas.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border rounded-xl hover:bg-white transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
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