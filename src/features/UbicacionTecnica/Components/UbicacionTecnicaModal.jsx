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
  Info,
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


// para seleccion de
const normalizeDate = (v) => (v ? v : null);
const normalizeStr = (v) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

const extractDate = (dateStr) => {
  if (!dateStr) return "";
  // Corta el string para quedarse solo con la fecha "YYYY-MM-DD", ignorando las horas
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

      console.log("Datos exactos que llegan al editar:", initialData);
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

        // 🛠️ FORZAMOS A STRING PARA QUE LOS SELECTS COINCIDAN
        ClienteId: String(initialData.ClienteId || initialData.clienteId || initialData?.cliente?.id || ""),
        paisId: String(initialData.paisId || initialData?.pais?.id || ""),
        planesMantenimientoIds: idsIniciales,

        // 🛠️ LIMPIAMOS NULOS EN TEXTOS
        codigo: String(initialData.codigo || ""),
        nombre: String(initialData.nombre || ""),
        numeroOV: String(initialData.numeroOV || ""),
        id_cliente: String(initialData.id_cliente || ""),
        sede: String(initialData.sede || ""),
        almacen: String(initialData.almacen || ""),
        operadorLogistico: String(initialData.operadorLogistico || ""),
        idPlaca: String(initialData.idPlaca || ""),
        numeroOrdenCliente: String(initialData.numeroOrdenCliente || ""),
        descripcion: String(initialData.descripcion || ""),
        especialidad: String(initialData.especialidad || ""),

        // 🛠️ APLICAMOS EL EXTRACTOR A LAS FECHAS
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

  // 2. INTENTO 2: CONSULTAR LOS PLANES AL BACKEND (Por si no venían en la tabla)
  useEffect(() => {
    if (isOpen && mode === "edit" && initialData?.id) {
      const fetchPlanesAsignados = async () => {
        setLoadingPlanes(true);
        try {
          // Si tu backend tiene esta ruta, nos devolverá los planes de esta ubicación
          const planesDelBackend = await planMantenimientoService.getPlanesByUbicacionTecnica(initialData.id);

          if (Array.isArray(planesDelBackend) && planesDelBackend.length > 0) {
            const idsDelBackend = planesDelBackend.map(p => String(p.id));
            setForm(prev => ({
              ...prev,
              planesMantenimientoIds: idsDelBackend
            }));
          }
        } catch (err) {
          console.warn("No se pudieron cargar los planes asignados por el backend.", err);
        } finally {
          setLoadingPlanes(false);
        }
      };
      fetchPlanesAsignados();
    }
  }, [isOpen, mode, initialData?.id]);

  // 3. CARGA DE LISTAS MAESTRAS (Catálogos)
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

      const planesData = Array.isArray(pl) ? pl : (pl?.data || []);
      setPlanesDisponibles(planesData.filter(plan => plan.activo !== false));

      } catch (err) {
        console.error("Error cargando combos:", err);
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

  // SELECCIONAR / DESELECCIONAR PLAN
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
    // Convertimos los IDs seleccionados a números, que es lo que suelen esperar los backends.
    const planesNumericos = form.planesMantenimientoIds.map(Number);

    const payload = {
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
      // Solo enviamos los IDs como números
      planesMantenimientoIds: planesNumericos,
      planesIds: planesNumericos // Mantenemos este por si es el que esperaba tu API originalmente
    };

    return payload;
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

  const tabs = [
    { id: "general", label: "General", icon: Package },
    { id: "orden", label: "Orden de Venta", icon: FileText },
    { id: "fechas", label: "Fechas y Garantía", icon: CalendarDays },
    { id: "planes", label: "Planes de Mantenimiento", icon: ClipboardList },
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white w-full max-w-4xl flex flex-col rounded-[1.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" style={{ maxHeight: '92vh' }}>

        {/* HEADER */}
        <div className="flex items-start justify-between px-8 py-6 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {mode === "edit" ? "Editar Ubicación Técnica" : "Nueva Ubicación Técnica"}
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Gestión de activos y logística geográfica
            </p>
          </div>
          <button onClick={onClose} disabled={loading} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* TABS CON CONTADOR ESTILO NOTIFICACIÓN */}
        <div className="border-b border-slate-200 bg-slate-50/50 px-8 pt-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold transition-all border-b-[3px] whitespace-nowrap ${isSelected
                    ? "border-blue-600 text-blue-700 bg-white rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    }`}
                >
                  <Icon size={18} strokeWidth={isSelected ? 2.5 : 2} />
                  {tab.label}
                  {tab.id === 'planes' && form.planesMantenimientoIds.length > 0 && (
                    <span className="ml-1.5 flex items-center justify-center bg-blue-600 text-white text-[11px] font-black h-5 w-5 rounded-full shadow-sm">
                      {form.planesMantenimientoIds.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-slate-50/30">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 shadow-sm">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <div className="max-w-3xl mx-auto">

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
                    <select value={String(form.ClienteId)} onChange={update("ClienteId")} className={inputCls} disabled={loading || loadingCombos}>
                      <option value="">Seleccionar cliente...</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={String(c.id)}>{c.nombre || c.razonSocial}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="ID Cliente (Referencia)">
                    <input value={form.id_cliente} onChange={update("id_cliente")} placeholder="Ej: REF-CL-001" className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="ID Placa (Matrícula / Identificador)">
                    <input value={form.idPlaca} onChange={update("idPlaca")} placeholder="Ej: ABC-123" className={inputCls} disabled={loading} />
                  </Field>

                  <Field label="Especialidad" className="md:col-span-2">
                    <input value={form.especialidad} onChange={update("especialidad")} placeholder="Ej: Mecánica, Eléctrica" className={inputCls} disabled={loading} />
                  </Field>

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
                     <select value={String(form.paisId)} onChange={update("paisId")} className={`${inputCls} pl-12`} disabled={loading || loadingCombos}>
  <option value="">Seleccionar país...</option>
  {paises.map((p) => (
    <option key={p.id} value={String(p.id)}>{p.nombre}</option>
  ))}
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
                    <textarea value={form.descripcion} onChange={update("descripcion")} placeholder="Detalles adicionales..." className={`${inputCls} min-h-[100px] resize-none`} disabled={loading} />
                  </Field>
                </div>
              </div>
            )}

            {activeTab === "orden" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Número Orden de Venta (OV) *" className="md:col-span-2">
                    <input value={form.numeroOV} onChange={update("numeroOV")} placeholder="Ej: OV-2026-0001" className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Fecha Orden de Venta">
                    <input type="date" value={form.fechaOV} onChange={update("fechaOV")} className={inputCls} disabled={loading} />
                  </Field>
                  <div className="hidden md:block"></div>
                  <Field label="N° Orden de Compra Cliente">
                    <input value={form.numeroOrdenCliente} onChange={update("numeroOrdenCliente")} placeholder="Ej: OC-999" className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Fecha Orden Cliente">
                    <input type="date" value={form.fechaOrdenCliente} onChange={update("fechaOrdenCliente")} className={inputCls} disabled={loading} />
                  </Field>
                </div>
              </div>
            )}

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

                  <div className="md:col-span-2 mt-2 p-5 bg-slate-100/50 border border-slate-200 rounded-2xl flex gap-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shrink-0 h-fit"><Info size={20} /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Cálculo de Garantía</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        La garantía se habilitará a partir de la fecha de entrega real.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "planes" && (
              <div className="space-y-5 animate-in fade-in duration-200 pb-10">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 shadow-sm">
                  <ClipboardList className="text-blue-500 shrink-0" size={20} />
                  <p className="text-xs text-blue-700 font-medium leading-relaxed">
                    Selecciona los planes de mantenimiento que se aplicarán a esta ubicación técnica.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {loadingCombos || loadingPlanes ? (
                    <div className="flex flex-col items-center py-10 gap-3">
                      <Loader2 className="animate-spin text-blue-600" />
                      <p className="text-sm text-slate-400 font-bold">Buscando planes asignados...</p>
                    </div>
                  ) : planesDisponibles.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                      <p className="text-slate-400 font-bold text-sm">No hay planes registrados en el sistema.</p>
                    </div>
                  ) : (
                    planesDisponibles.map((plan) => {
                      const isSelected = form.planesMantenimientoIds.includes(String(plan.id));

                      return (
                        <div
                          key={plan.id}
                          onClick={() => togglePlan(plan.id)}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-300"
                            }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : "bg-slate-100 text-slate-400"}`}>
                              <ClipboardList size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                              <p className={`text-sm font-black ${isSelected ? "text-blue-900" : "text-slate-700"}`}>
                                {plan.nombre || plan.codigoPlan}
                              </p>
                              <div className="flex gap-2 mt-1.5">
                                <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${isSelected ? "bg-blue-200/50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                                  {plan.frecuencia}
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${isSelected ? "bg-blue-200/50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                                  {plan.tipo}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            {isSelected ? (
                              <CheckCircle2 className="text-blue-600" size={28} strokeWidth={2.5} />
                            ) : (
                              <div className="w-[26px] h-[26px] rounded-full border-2 border-slate-200 bg-slate-50/50" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-100 bg-white px-8 py-5 flex items-center justify-end gap-4 rounded-b-[1.5rem]">
          <button onClick={onClose} disabled={loading} className="px-8 py-3.5 border-2 border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-colors font-bold text-sm uppercase tracking-widest">
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

function PropertyCard({ active, onClick, icon, label }) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all hover:-translate-y-1 ${active
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