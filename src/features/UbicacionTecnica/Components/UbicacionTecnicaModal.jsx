import { useEffect, useMemo, useState } from "react";
import {
  X, Loader2, AlertCircle, CalendarDays, Package, FileText,
  Wrench, ShoppingCart, Building2, Globe, Info, ClipboardList,
  CheckCircle2, Tag, Box, Truck, Zap, Hash
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

  // 1. SINCRONIZACIÓN AL ABRIR
  useEffect(() => {
    if (!isOpen) { setActiveTab("general"); return; }
    setError(null);

    if (initialData) {
      const planesRaw = initialData.planes || initialData.planesMantenimiento || initialData.Planes || [];
      const idsRaw = initialData.planesIds || initialData.planesMantenimientoIds || [];
      
      let idsIniciales = [];
      if (Array.isArray(planesRaw) && planesRaw.length > 0 && typeof planesRaw[0] === 'object') {
        idsIniciales = planesRaw.map(p => String(p.id));
      } else if (Array.isArray(idsRaw)) {
        idsIniciales = idsRaw.map(String);
      }

      setForm({
        ...emptyForm(),
        ...initialData,
        ClienteId: String(initialData.ClienteId || initialData.clienteId || initialData?.cliente?.id || ""),
        paisId: String(initialData.paisId || initialData?.pais?.id || ""),
        planesMantenimientoIds: idsIniciales,
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

  // 2. CARGA DE CATÁLOGOS
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
        setPaises(Array.isArray(p) ? p : (p?.data || []));
        setClientes(Array.isArray(c) ? c : (c?.data || []));
        setPlanesDisponibles((Array.isArray(pl) ? pl : (pl?.data || [])).filter(plan => plan.activo !== false));
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
      String(form.paisId || "").trim() &&
      String(form.ClienteId || "").trim()
    );
  }, [form]);

  if (!isOpen) return null;

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  
  const togglePlan = (id) => {
    const idStr = String(id);
    setForm(f => ({
      ...f,
      planesMantenimientoIds: f.planesMantenimientoIds.includes(idStr)
        ? f.planesMantenimientoIds.filter(x => x !== idStr)
        : [...f.planesMantenimientoIds, idStr]
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!requiredOk) {
      setError("Faltan campos obligatorios en la pestaña General.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        id_cliente: normalizeStr(form.id_cliente),
        clienteId: form.ClienteId || null,
        paisId: form.paisId || null,
        planesMantenimientoIds: form.planesMantenimientoIds.map(Number)
      };
      await onSave(payload, mode);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Package },
    { id: "orden", label: "Comercial", icon: FileText },
    { id: "fechas", label: "Tiempos", icon: CalendarDays },
    { id: "planes", label: "Mantenimiento", icon: ClipboardList },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={{ maxHeight: '92vh' }}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-200">
              <MapPin size={24} strokeWidth={2.5}/>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase leading-none tracking-tight">
                {mode === "edit" ? "Modificar Ubicación" : "Nuevo Registro Técnico"}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Área de Gestión de Activos Industriales</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* TABS ESTILO DASHBOARD */}
        <div className="flex bg-slate-50 border-b border-slate-200 px-8 gap-2 py-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 text-[11px] font-black transition-all rounded-xl uppercase tracking-wider ${
                activeTab === tab.id 
                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              }`}
            >
              <tab.icon size={14} strokeWidth={3} /> {tab.label}
              {tab.id === 'planes' && form.planesMantenimientoIds.length > 0 && (
                <span className={`ml-1 flex items-center justify-center text-[9px] h-4 w-4 rounded-full font-black ${activeTab === tab.id ? "bg-white text-blue-600" : "bg-blue-600 text-white"}`}>
                    {form.planesMantenimientoIds.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold shadow-sm">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="max-w-3xl mx-auto">
            {activeTab === "general" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Field label="CÓDIGO SISTEMA" icon={Hash} required>
                  <input value={form.codigo} onChange={update("codigo")} placeholder="Ej: 01" className={inputCls} disabled={loading} />
                </Field>
                <Field label="NOMBRE IDENTIFICADOR" icon={Package} required>
                  <input value={form.nombre} onChange={update("nombre")} placeholder="Ej: Motor 22" className={inputCls} disabled={loading} />
                </Field>
                <Field label="CLIENTE PROPIETARIO" icon={Building2} required className="md:col-span-2">
                  <select value={form.ClienteId} onChange={update("ClienteId")} className={inputCls} disabled={loading || loadingCombos}>
                    <option value="">Seleccionar Cliente...</option>
                    {clientes.map(c => <option key={c.id} value={String(c.id)}>{c.nombre || c.razonSocial}</option>)}
                  </select>
                </Field>
                <Field label="ID_CLI (REF EXTERNA)" icon={Tag}>
                  <input value={form.id_cliente} onChange={update("id_cliente")} className={inputCls} disabled={loading} />
                </Field>
                <Field label="N° PLACA / MATRÍCULA" icon={ClipboardList}>
                  <input value={form.idPlaca} onChange={update("idPlaca")} className={inputCls} disabled={loading} />
                </Field>
                <Field label="ESPECIALIDAD TÉCNICA" icon={Wrench}>
                  <input value={form.especialidad} onChange={update("especialidad")} className={inputCls} disabled={loading} />
                </Field>
                <Field label="PAÍS" icon={Globe} required>
                  <select value={form.paisId} onChange={update("paisId")} className={inputCls} disabled={loading || loadingCombos}>
                    <option value="">Seleccionar País...</option>
                    {paises.map(p => <option key={p.id} value={String(p.id)}>{p.nombre}</option>)}
                  </select>
                </Field>
                <Field label="SEDE / PROYECTO" icon={MapPin}>
                  <input value={form.sede} onChange={update("sede")} className={inputCls} disabled={loading} />
                </Field>
                <Field label="ALMACÉN BASE" icon={Box}>
                  <input value={form.almacen} onChange={update("almacen")} className={inputCls} disabled={loading} />
                </Field>
                <Field label="OPERADOR LOGÍSTICO" icon={Truck}>
                  <input value={form.operadorLogistico} onChange={update("operadorLogistico")} className={inputCls} disabled={loading} />
                </Field>
                
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">TIPO DE PROPIEDAD *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Vendido", "Propio", "Atendido"].map(t => (
                      <button key={t} type="button" onClick={() => setForm(f => ({...f, tipoEquipoPropiedad: t}))} className={`py-3 text-[11px] font-black rounded-xl border-2 transition-all ${form.tipoEquipoPropiedad === t ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-50 text-slate-300 hover:bg-slate-50'}`}>{t.toUpperCase()}</button>
                    ))}
                  </div>
                </div>

                <Field label="DESCRIPCIÓN / NOTAS" className="md:col-span-2">
                  <textarea value={form.descripcion} onChange={update("descripcion")} rows={2} className={`${inputCls} resize-none font-medium italic`} disabled={loading} />
                </Field>
              </div>
            )}

            {activeTab === "orden" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 animate-in fade-in duration-300">
                <Field label="ORDEN DE VENTA (OV)" icon={FileText} required>
                  <input value={form.numeroOV} onChange={update("numeroOV")} className={inputCls} disabled={loading} />
                </Field>
                <Field label="FECHA DE OV" icon={CalendarDays}>
                  <input type="date" value={form.fechaOV} onChange={update("fechaOV")} className={inputCls} disabled={loading} />
                </Field>
                <Field label="N° ORDEN COMPRA (OC)" icon={FileText}>
                  <input value={form.numeroOrdenCliente} onChange={update("numeroOrdenCliente")} className={inputCls} disabled={loading} />
                </Field>
                <Field label="FECHA DE OC" icon={CalendarDays}>
                  <input type="date" value={form.fechaOrdenCliente} onChange={update("fechaOrdenCliente")} className={inputCls} disabled={loading} />
                </Field>
              </div>
            )}

            {activeTab === "fechas" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 animate-in fade-in duration-300">
                <Field label="FECHA ENTREGA PREVISTA" icon={CalendarDays}>
                  <input type="date" value={form.fechaEntregaPrevista} onChange={update("fechaEntregaPrevista")} className={inputCls} disabled={loading} />
                </Field>
                <Field label="FECHA ENTREGA REAL" icon={CheckCircle2}>
                  <input type="date" value={form.fechaEntregaReal} onChange={update("fechaEntregaReal")} className={inputCls} disabled={loading} />
                </Field>
                <Field label="VENCIMIENTO GARANTÍA" icon={Zap} className="md:col-span-2">
                  <input type="date" value={form.finGarantia} onChange={update("finGarantia")} className={`${inputCls} border-emerald-100 bg-emerald-50/50 text-emerald-700 font-black`} disabled={loading} />
                </Field>
                <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                   <Info size={18} className="text-blue-500 shrink-0 mt-0.5"/>
                   <p className="text-[11px] text-blue-700 font-medium leading-relaxed">Los cálculos de garantía se validarán automáticamente basándose en la fecha de entrega real del activo.</p>
                </div>
              </div>
            )}

            {activeTab === "planes" && (
              <div className="space-y-2 animate-in fade-in duration-300">
                {planesDisponibles.map(p => (
                  <div key={p.id} onClick={() => togglePlan(p.id)} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${form.planesMantenimientoIds.includes(String(p.id)) ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-50 hover:bg-slate-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${form.planesMantenimientoIds.includes(String(p.id)) ? 'bg-blue-600 text-white' : 'bg-white text-slate-300 shadow-sm'}`}><ClipboardList size={18}/></div>
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase leading-none">{p.nombre}</p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1 block">{p.frecuencia} • {p.tipo}</span>
                      </div>
                    </div>
                    {form.planesMantenimientoIds.includes(String(p.id)) && <CheckCircle2 className="text-blue-600" size={22} strokeWidth={3}/>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="px-6 py-3 text-[11px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all">Cancelar</button>
          <button 
            type="button"
            onClick={handleSubmit} 
            disabled={loading || !requiredOk}
            className="bg-blue-600 text-white px-10 py-3 rounded-2xl text-[11px] font-black shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 uppercase tracking-widest"
          >
            {loading ? <Loader2 size={16} className="animate-spin"/> : null}
            {mode === "edit" ? "Actualizar Registro" : "Guardar Ubicación"}
          </button>
        </div>
      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES
function Field({ label, icon: Icon, required, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
        {Icon && <Icon size={12} className="text-blue-400"/>}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all placeholder:text-slate-200";