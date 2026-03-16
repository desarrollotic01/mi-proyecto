import { useEffect, useMemo, useState } from "react";
import {
  X,
  Loader2,
  AlertCircle,
  CalendarDays,
  Package,
  User, // Icono para "Orden de Venta" según tu imagen
  Wrench, // Icono para "Planes" según tu imagen
  ShoppingCart,
  Building2,
  Globe,
  ClipboardList,
  CheckCircle2
} from "lucide-react";

import { paisService } from "../../mantenimiento/services/paisService";
import { clienteService } from "../../mantenimiento/services/clienteService";
import { planMantenimientoService } from "../../PlanMantenimiento/services/planMantenimientoService";

const emptyForm = () => ({
  codigo: "",
  nombre: "",
  id_cliente: "",
  ClienteId: "",
  tipoEquipoPropiedad: "Vendido",
  paisId: "",
  sede: "",
  almacen: "",
  operadorLogistico: "",
  idPlaca: "",
  numeroOV: "",
  fechaOV: "",
  numeroOrdenCliente: "",
  fechaOrdenCliente: "",
  descripcion: "",
  fechaEntregaPrevista: "",
  fechaEntregaReal: "",
  finGarantia: "",
  especialidad: "",
  planesMantenimientoIds: [],
});

const normalizeDate = (v) => (v ? v : null);
const normalizeStr = (v) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

const extractDate = (dateStr) => {
  if (!dateStr) return "";
  return String(dateStr).split('T')[0];
};

export default function UbicacionTecnicaModal({ isOpen, onClose, onSave, initialData }) {
  const mode = initialData ? "edit" : "create";

  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("general");

  const [paises, setPaises] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [planesDisponibles, setPlanesDisponibles] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);
  const [loadingPlanes, setLoadingPlanes] = useState(false);

  // 1. SINCRONIZACIÓN AL ABRIR
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("general");
      return;
    }
    setError(null);

    if (initialData) {
const planesRaw = initialData.planes || initialData.planesMantenimiento || initialData.Planes || [];
      const idsRaw = initialData.planesIds || initialData.planesMantenimientoIds || [];

      let idsIniciales = [];
      if (Array.isArray(planesRaw) && planesRaw.length > 0) {
        idsIniciales = planesRaw.map(p => String(p.id)); // Extrae IDs si vienen como objetos
      } else if (Array.isArray(idsRaw)) {
        idsIniciales = idsRaw.map(String); // Convierte a String si vienen directos
      }

      setForm({
        ...emptyForm(),
        ...initialData,
        ClienteId: String(initialData.ClienteId || initialData.clienteId || initialData?.cliente?.id || ""),
        paisId: String(initialData.paisId || initialData?.pais?.id || ""),
        planesMantenimientoIds: idsIniciales,
        
        codigo: String(initialData.codigo ?? ""),
        nombre: String(initialData.nombre ?? ""),
        numeroOV: String(initialData.numeroOV ?? ""),
        id_cliente: String(initialData.id_cliente ?? ""),
        sede: String(initialData.sede ?? ""),
        almacen: String(initialData.almacen ?? ""),
        operadorLogistico: String(initialData.operadorLogistico ?? ""),
        idPlaca: String(initialData.idPlaca ?? ""),
        numeroOrdenCliente: String(initialData.numeroOrdenCliente ?? ""),
        descripcion: String(initialData.descripcion ?? ""),
        especialidad: String(initialData.especialidad ?? ""),
        fechaOV: extractDate(initialData.fechaOV),
        fechaOrdenCliente: extractDate(initialData.fechaOrdenCliente),
        fechaEntregaPrevista: extractDate(initialData.fechaEntregaPrevista),
        fechaEntregaReal: extractDate(initialData.fechaEntregaReal),
        finGarantia: extractDate(initialData.finGarantia),
      });
    } else {
      setForm(emptyForm());
    }
  }, [isOpen, initialData]);

  // 2. CONSULTAR PLANES AL BACKEND
  // Efecto para buscar los planes al EDITAR
  useEffect(() => {
    if (isOpen && mode === "edit" && initialData?.id) {
      const fetchPlanes = async () => {
        try {
          // Ajusta esta ruta a tu servicio real
          const res = await planMantenimientoService.getPlanesByUbicacionTecnica(initialData.id);
          const planesDelBackend = Array.isArray(res) ? res : (res?.data || []);
          
          if (planesDelBackend.length > 0) {
            const ids = planesDelBackend.map(p => String(p.id));
            setForm(prev => ({ ...prev, planesMantenimientoIds: ids })); // ¡Aquí actualiza y marca los checks!
          }
        } catch (err) {
          console.error("No se pudieron cargar los planes", err);
        }
      };
      fetchPlanes();
    }
  }, [isOpen, mode, initialData?.id]);

  // 3. CARGA DE CATÁLOGOS
  useEffect(() => {
    if (!isOpen) return;
    const loadCombos = async () => {
      setLoadingCombos(true);
      try {
        const [p, c, pl] = await Promise.all([
          paisService.getAll?.() ?? paisService.getPaises?.(),
          clienteService.getAll?.() ?? clienteService.getClientes?.(),
          planMantenimientoService.getAll?.() ?? planMantenimientoService.getPlanes?.() ?? []
        ]);
        setPaises(Array.isArray(p) ? p : []);
        setClientes(Array.isArray(c) ? c : []);
        const planesData = Array.isArray(pl) ? pl : (pl?.data || []);
        setPlanesDisponibles(planesData.filter(plan => plan.activo !== false));
      } catch (err) {
        setError("Error de conexión al cargar catálogos.");
      } finally {
        setLoadingCombos(false);
      }
    };
    loadCombos();
  }, [isOpen]);

  const requiredOk = useMemo(() => {
    return (
      String(form.codigo || "").trim() &&
      String(form.nombre || "").trim() &&
      String(form.numeroOV || "").trim() &&
      String(form.tipoEquipoPropiedad || "").trim() &&
      String(form.paisId || "").trim() &&
      String(form.ClienteId || "").trim()
    );
  }, [form]);

  if (!isOpen) return null;

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setFormValue = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const togglePlan = (planId) => {
    const idStr = String(planId);
    setForm(f => {
      const exists = f.planesMantenimientoIds.includes(idStr);
      return {
        ...f,
        planesMantenimientoIds: exists
          ? f.planesMantenimientoIds.filter(id => id !== idStr)
          : [...f.planesMantenimientoIds, idStr]
      };
    });
  };

  const buildPayload = () => {
const planesLimpios = form.planesMantenimientoIds.map(String);
    return {
      codigo: String(form.codigo).trim(),
      nombre: String(form.nombre).trim(),
      id_cliente: normalizeStr(form.id_cliente),
      clienteId: form.ClienteId || null,
      paisId: form.paisId || null,
      tipoEquipoPropiedad: form.tipoEquipoPropiedad,
      sede: normalizeStr(form.sede),
      almacen: normalizeStr(form.almacen),
      operadorLogistico: normalizeStr(form.operadorLogistico),
      idPlaca: normalizeStr(form.idPlaca),
      numeroOV: String(form.numeroOV).trim(),
      fechaOV: normalizeDate(form.fechaOV),
      numeroOrdenCliente: normalizeStr(form.numeroOrdenCliente),
      fechaOrdenCliente: normalizeDate(form.fechaOrdenCliente),
      descripcion: normalizeStr(form.descripcion),
      fechaEntregaPrevista: normalizeDate(form.fechaEntregaPrevista),
      fechaEntregaReal: normalizeDate(form.fechaEntregaReal),
      finGarantia: normalizeDate(form.finGarantia),
      especialidad: normalizeStr(form.especialidad),


// 👇 Usamos la variable corregida
      planesMantenimientoIds: planesLimpios,
      planesIds: planesLimpios
    };
  };

  const handleSubmit = async () => {
    setError(null);
    if (!requiredOk) {
      setError("Faltan campos obligatorios. Revisa la pestaña General.");
      return;
    }
    setLoading(true);
    try {
      await onSave(buildPayload(), mode);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  // Pestañas mapeadas a los iconos de tu imagen
  const tabs = [
    { id: "general", label: "General", icon: Package },
    { id: "orden", label: "Orden de Venta", icon: User },
    { id: "fechas", label: "Fechas y Garantía", icon: CalendarDays },
    { id: "planes", label: "Planes", icon: Wrench },
  ];

  const getTipoPropiedadIcon = (tipo) => {
    switch (tipo) {
      case "Vendido": return <ShoppingCart size={22} />;
      case "Propio": return <Building2 size={22} />;
      case "Atendido": return <Wrench size={22} />;
      default: return <Package size={22} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white w-full max-w-4xl flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" style={{ maxHeight: '92vh' }}>

        {/* HEADER EXACTO A LA IMAGEN */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">
                {mode === "edit" ? "Editar Equipo" : "Nuevo Equipo"}
              </h2>
              <p className="text-[13px] text-slate-500 mt-1">
                Completa los datos del {mode === "edit" ? "equipo" : "nuevo equipo"}
              </p>
            </div>
            <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* TABS TIPO LÍNEA (Como en tu imagen) */}
        <div className="flex gap-6 px-6 border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 text-[13px] font-semibold transition-all border-b-2 -mb-[1px] ${
                  isSelected
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <Icon size={16} strokeWidth={isSelected ? 2.5 : 2} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-[13px] font-semibold">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {activeTab === "general" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 animate-in fade-in duration-200">
              <Field label="Código" required>
                <input value={form.codigo} onChange={update("codigo")} placeholder="Ej: EQ-001" className={inputCls} disabled={loading} />
              </Field>
              <Field label="Nombre del Equipo" required>
                <input value={form.nombre} onChange={update("nombre")} placeholder="Ej: Control de acceso vehicular principal" className={inputCls} disabled={loading} />
              </Field>

              <Field label="Cliente" required className="md:col-span-2">
                <select value={form.ClienteId} onChange={update("ClienteId")} className={inputCls} disabled={loading || loadingCombos}>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nombre || c.razonSocial}</option>))}
                </select>
              </Field>

              {/* TARJETAS TIPO DE PROPIEDAD */}
              <div className="md:col-span-2 mt-1">
                <label className="text-[13px] font-semibold text-slate-700 mb-2 block">
                  Tipo de Propiedad <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {["Vendido", "Propio", "Atendido"].map((tipo) => (
                    <PropertyCard
                      key={tipo}
                      active={form.tipoEquipoPropiedad === tipo}
                      onClick={() => setFormValue("tipoEquipoPropiedad", tipo)}
                      icon={getTipoPropiedadIcon(tipo)}
                      label={tipo}
                    />
                  ))}
                </div>
              </div>

              <Field label="País" required className="md:col-span-2 mt-1">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select value={form.paisId} onChange={update("paisId")} className={`${inputCls} pl-9`} disabled={loading || loadingCombos}>
                    <option value="">Seleccionar país...</option>
                    {paises.map((p) => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
                  </select>
                </div>
              </Field>

              <div className="grid grid-cols-3 gap-6 md:col-span-2 mt-1">
                <Field label="Sede"><input value={form.sede} onChange={update("sede")} className={inputCls} disabled={loading} /></Field>
                <Field label="Almacén"><input value={form.almacen} onChange={update("almacen")} className={inputCls} disabled={loading} /></Field>
                <Field label="Operador Logístico"><input value={form.operadorLogistico} onChange={update("operadorLogistico")} className={inputCls} disabled={loading} /></Field>
              </div>

              <div className="grid grid-cols-3 gap-6 md:col-span-2 mt-1">
                <Field label="ID Cliente"><input value={form.id_cliente} onChange={update("id_cliente")} className={inputCls} disabled={loading} /></Field>
                <Field label="Especialidad"><input value={form.especialidad} onChange={update("especialidad")} className={inputCls} disabled={loading} /></Field>
                <Field label="ID Placa"><input value={form.idPlaca} onChange={update("idPlaca")} className={inputCls} disabled={loading} /></Field>
              </div>

              <Field label="Descripción del Equipo" className="md:col-span-2 mt-1">
                <textarea value={form.descripcion} onChange={update("descripcion")} className={`${inputCls} resize-none`} rows={3} disabled={loading} />
              </Field>
            </div>
          )}

          {activeTab === "orden" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 animate-in fade-in duration-200">
              <Field label="Número Orden de Venta (OV)" required>
                <input value={form.numeroOV} onChange={update("numeroOV")} className={inputCls} disabled={loading} />
              </Field>
              <Field label="Fecha Orden de Venta">
                <input type="date" value={form.fechaOV} onChange={update("fechaOV")} className={inputCls} disabled={loading} />
              </Field>
              <Field label="N° Orden de Compra Cliente">
                <input value={form.numeroOrdenCliente} onChange={update("numeroOrdenCliente")} className={inputCls} disabled={loading} />
              </Field>
              <Field label="Fecha Orden Cliente">
                <input type="date" value={form.fechaOrdenCliente} onChange={update("fechaOrdenCliente")} className={inputCls} disabled={loading} />
              </Field>
            </div>
          )}

          {activeTab === "fechas" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 animate-in fade-in duration-200">
              <Field label="Fecha de Entrega Prevista">
                <input type="date" value={form.fechaEntregaPrevista} onChange={update("fechaEntregaPrevista")} className={inputCls} disabled={loading} />
              </Field>
              <Field label="Fecha de Entrega Real">
                <input type="date" value={form.fechaEntregaReal || ""} onChange={update("fechaEntregaReal")} className={inputCls} disabled={loading} />
              </Field>
              <Field label="Fin de Garantía" className="md:col-span-2">
                <input type="date" value={form.finGarantia} onChange={update("finGarantia")} className={inputCls} disabled={loading} />
              </Field>
            </div>
          )}

          {activeTab === "planes" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {loadingCombos || loadingPlanes ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Loader2 className="animate-spin text-blue-500" />
                  <p className="text-[13px] text-slate-500">Cargando planes...</p>
                </div>
              ) : planesDisponibles.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-300 rounded-lg">
                  <p className="text-[13px] text-slate-500">No hay planes registrados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {planesDisponibles.map((plan) => {
                    const isSelected = form.planesMantenimientoIds.includes(String(plan.id));
                    return (
                      <div
                        key={plan.id}
                        onClick={() => togglePlan(plan.id)}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                          isSelected ? "border-blue-600 bg-blue-50/50" : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={isSelected ? "text-blue-600" : "text-slate-400"}><ClipboardList size={20} /></div>
                          <div>
                            <p className={`text-[13px] font-semibold ${isSelected ? "text-blue-800" : "text-slate-700"}`}>
                              {plan.nombre || plan.codigoPlan}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{plan.frecuencia} • {plan.tipo}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="text-blue-600" size={20} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* FOOTER ESTILO IMAGEN */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-xl">
          <button 
            onClick={onClose} 
            disabled={loading} 
            className="px-5 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-[13px] font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !requiredOk}
            className="px-5 py-2 bg-[#6b8cff] hover:bg-blue-600 text-white rounded-lg text-[13px] font-semibold transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {mode === "edit" ? "Actualizar Equipo" : "Crear Equipo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES ACTUALIZADOS A LA IMAGEN
function PropertyCard({ active, onClick, icon, label }) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all cursor-pointer ${
        active
          ? "border-[#6b8cff] bg-[#f4f7ff] text-[#6b8cff] shadow-[0_0_0_1px_rgba(107,140,255,1)]"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
      }`}
    >
      <div className="mb-2">
        {icon}
      </div>
      <span className="text-[13px] font-semibold">{label}</span>
    </div>
  );
}

function Field({ label, required, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[13px] font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ESTILO DE INPUT EXACTO A LA IMAGEN (borde gris simple, outline azul)
const inputCls = "w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-[13px] text-slate-700 outline-none disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400";