import { useEffect, useMemo, useState } from "react";
import { 
  X, 
  Loader2, 
  AlertCircle, 
  CalendarDays, 
  Package, 
  FileText, 
  Wrench, 
  ShoppingCart, 
  Building2, 
  Globe, 
  Info 
} from "lucide-react";

import { paisService } from "../../mantenimiento/services/paisService";
import { clienteService } from "../../mantenimiento/services/clienteService";

// --- HELPERS ---
const emptyForm = () => ({
  codigo: "",
  nombre: "",
  id_cliente: "",
  ClienteId: "", // Se usará en el select, pero se enviará como clienteId
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
});

const normalizeDate = (v) => (v ? v : null);
const normalizeStr = (v) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export default function UbicacionTecnicaModal({ isOpen, onClose, onSave, initialData }) {
  const mode = initialData ? "edit" : "create";

  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado para las Pestañas (Tabs)
  const [activeTab, setActiveTab] = useState("general");

  const [paises, setPaises] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);

  // Sincronización al abrir
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("general"); // Reiniciar a la primera pestaña al cerrar
      return;
    }
    setError(null);

    if (initialData) {
      setForm({
        ...emptyForm(),
        ...initialData,
        ClienteId: initialData.ClienteId || initialData.clienteId || initialData?.cliente?.id || "",
        paisId: initialData.paisId || initialData?.pais?.id || "",
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
        fechaOV: initialData.fechaOV ?? "",
        fechaOrdenCliente: initialData.fechaOrdenCliente ?? "",
        fechaEntregaPrevista: initialData.fechaEntregaPrevista ?? "",
        fechaEntregaReal: initialData.fechaEntregaReal ?? "",
        finGarantia: initialData.finGarantia ?? "",
      });
    } else {
      setForm(emptyForm());
    }
  }, [isOpen, initialData]);

  // Carga de listas (Países y Clientes)
  useEffect(() => {
    if (!isOpen) return;
    const loadCombos = async () => {
      setLoadingCombos(true);
      try {
        const [p, c] = await Promise.all([
          paisService.getAll?.() ?? paisService.getPaises?.(),
          clienteService.getAll?.() ?? clienteService.getClientes?.(),
        ]);
        setPaises(Array.isArray(p) ? p : []);
        setClientes(Array.isArray(c) ? c : []);
      } catch (err) {
        setError("No se pudo cargar la lista de Países o Clientes.");
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

  const buildPayload = () => {
    const rawPayload = {
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
    };

    return rawPayload; // Ya no filtramos los nulos para evitar el Error 400
  };

  const handleSubmit = async () => {
    setError(null);
    if (!requiredOk) {
      setError("Faltan campos obligatorios. Revisa la pestaña General y Orden de Venta.");
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

  const tabs = [
    { id: "general", label: "General", icon: Package },
    { id: "orden", label: "Orden de Venta", icon: FileText },
    { id: "fechas", label: "Fechas y Garantía", icon: CalendarDays },
  ];

  const getTipoPropiedadIcon = (tipo) => {
    switch (tipo) {
      case "Vendido": return <ShoppingCart size={24} />;
      case "Propio": return <Building2 size={24} />;
      case "Atendido": return <Wrench size={24} />;
      default: return <Package size={24} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white w-full max-w-4xl flex flex-col rounded-[1.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" style={{ maxHeight: '92vh' }}>
        
        {/* HEADER MODAL */}
        <div className="flex items-start justify-between px-8 py-6 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {mode === "edit" ? "Editar Ubicación Técnica" : "Nueva Ubicación Técnica"}
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {mode === "edit" ? "Actualiza la información geográfica y logística" : "Completa los datos para registrar la ubicación"}
            </p>
          </div>
          <button onClick={onClose} disabled={loading} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* TABS NAVEGABLES */}
        <div className="border-b border-slate-200 bg-slate-50/50 px-8">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-bold transition-all border-b-[3px] whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-700 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* BODY MODAL SCROLLABLE */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-slate-50/30">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 shadow-sm animate-in fade-in">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <div className="max-w-3xl mx-auto">
            
            {/* TAB: GENERAL */}
            {activeTab === "general" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Código" required>
                    <input value={form.codigo} onChange={update("codigo")} placeholder="Ej: UT-001" className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Nombre Ubicación" required>
                    <input value={form.nombre} onChange={update("nombre")} placeholder="Ej: Planta Principal Sur" className={inputCls} disabled={loading} />
                  </Field>

                  <Field label="Cliente" required className="md:col-span-2">
                    <select value={form.ClienteId} onChange={update("ClienteId")} className={inputCls} disabled={loading || loadingCombos}>
                      <option value="">Seleccionar cliente...</option>
                      {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nombre || c.razonSocial}</option>))}
                    </select>
                  </Field>

                  {/* 🔥 ID PLACA AHORA ESTÁ AQUÍ JUNTO A ID CLIENTE */}
                  <Field label="ID Cliente (Referencia)">
                    <input value={form.id_cliente} onChange={update("id_cliente")} placeholder="Ej: REF-CL-001" className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="ID Placa (Matrícula / Identificador)">
                    <input value={form.idPlaca} onChange={update("idPlaca")} placeholder="Ej: ABC-123" className={inputCls} disabled={loading} />
                  </Field>

                  <Field label="Especialidad" className="md:col-span-2">
                    <input value={form.especialidad} onChange={update("especialidad")} placeholder="Ej: Mecánica, Eléctrica" className={inputCls} disabled={loading} />
                  </Field>

                  {/* CARDS: TIPO PROPIEDAD */}
                  <div className="md:col-span-2 mt-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-1">
                      Tipo de Propiedad <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                  <Field label="País" required className="md:col-span-2 mt-2">
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select value={form.paisId} onChange={update("paisId")} className={`${inputCls} pl-12`} disabled={loading || loadingCombos}>
                        <option value="">Seleccionar país...</option>
                        {paises.map((p) => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
                      </select>
                    </div>
                  </Field>

                  <Field label="Sede / Proyecto">
                    <input value={form.sede} onChange={update("sede")} placeholder="Ej: Lima" className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Almacén Base">
                    <input value={form.almacen} onChange={update("almacen")} placeholder="Ej: Almacén Central" className={inputCls} disabled={loading} />
                  </Field>
                  
                  <Field label="Operador Logístico">
                    <input value={form.operadorLogistico} onChange={update("operadorLogistico")} placeholder="Ej: DHL, Shalom" className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Descripción / Notas" className="md:col-span-2 mt-2">
                    <textarea value={form.descripcion} onChange={update("descripcion")} placeholder="Detalles adicionales de la ubicación..." className={`${inputCls} min-h-[100px] resize-none`} disabled={loading} />
                  </Field>
                </div>
              </div>
            )}

            {/* TAB: ORDEN DE VENTA */}
            {activeTab === "orden" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Número Orden de Venta (OV) *" className="md:col-span-2">
                    <input value={form.numeroOV} onChange={update("numeroOV")} placeholder="Ej: OV-2026-0001" className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Fecha Orden de Venta">
                    <input type="date" value={form.fechaOV} onChange={update("fechaOV")} className={inputCls} disabled={loading} />
                  </Field>
                  <div className="hidden md:block"></div> {/* Espaciador */}
                  <Field label="N° Orden de Compra Cliente">
                    <input value={form.numeroOrdenCliente} onChange={update("numeroOrdenCliente")} placeholder="Ej: OC-999" className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Fecha Orden Cliente">
                    <input type="date" value={form.fechaOrdenCliente} onChange={update("fechaOrdenCliente")} className={inputCls} disabled={loading} />
                  </Field>
                  {/* ID Placa ya no está aquí, fue movido a General */}
                </div>
              </div>
            )}

            {/* TAB: FECHAS Y GARANTÍA */}
            {activeTab === "fechas" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Fecha de Entrega Prevista">
                    <input type="date" value={form.fechaEntregaPrevista} onChange={update("fechaEntregaPrevista")} className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Fecha de Entrega Real">
                    <input type="date" value={form.fechaEntregaReal || ""} onChange={update("fechaEntregaReal")} className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Fin de Garantía" className="md:col-span-2">
                    <input type="date" value={form.finGarantia} onChange={update("finGarantia")} className={inputCls} disabled={loading} />
                  </Field>
                  
                  <div className="md:col-span-2 mt-2 p-5 bg-slate-100/50 border border-slate-200 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Info size={20} /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Información sobre las fechas</p>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          La fecha de entrega prevista es estimada. La fecha real debe actualizarse cuando la ubicación sea habilitada físicamente. 
                          La garantía comenzará a calcularse a partir de esta fecha.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* FOOTER MODAL */}
        <div className="border-t border-slate-100 bg-white px-8 py-5 flex items-center justify-end gap-4 rounded-b-[1.5rem]">
          <button
            onClick={onClose}
            className="px-8 py-3.5 border-2 border-slate-100 text-slate-500 rounded-2xl hover:bg-slate-50 transition-colors font-bold text-sm uppercase tracking-widest"
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || !requiredOk}
            className="px-10 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all font-black shadow-xl shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {mode === "edit" ? "Actualizar" : "Guardar Ubicación"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES UI PARA EL MODAL ---

function PropertyCard({ active, onClick, icon, label }) {
  return (
    <div 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all hover:-translate-y-1 ${
        active 
          ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-500/20" 
          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      <div className={`p-3 rounded-xl ${active ? "bg-blue-600 text-white shadow-inner" : "bg-slate-50 text-slate-400"}`}>
        {icon}
      </div>
      <span className={`font-black text-sm tracking-tight ${active ? "text-blue-800" : "text-slate-500"}`}>{label}</span>
    </div>
  );
}

function Field({ label, required, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-[11px] font-black text-slate-500 ml-1 uppercase tracking-widest">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium disabled:bg-slate-50/50 disabled:text-slate-400 shadow-inner bg-slate-50/30";