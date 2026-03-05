import { useEffect, useMemo, useState } from "react";
import { 
  X, 
  AlertCircle, 
  Loader2, 
  Save, 
  MapPin, 
  Hash, 
  Globe, 
  Truck, 
  CalendarDays 
} from "lucide-react";

import { paisService } from "../../mantenimiento/services/paisService";
import { clienteService } from "../../mantenimiento/services/clienteService";

// --- HELPERS ---
const emptyForm = () => ({
  codigo: "",
  nombre: "",
  id_cliente: "",
  ClienteId: "", // FK Real
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

  const [paises, setPaises] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);

  // Carga de datos iniciales al abrir el modal
  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    if (initialData) {
      setForm({
        ...emptyForm(),
        ...initialData,
        // Prioridad del ClienteId para evitar fallos en el select
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

  // Carga de listas desplegables (Países y Clientes)
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
        console.error(err);
        setError("No se pudo cargar la lista de Países o Clientes.");
      } finally {
        setLoadingCombos(false);
      }
    };

    loadCombos();
  }, [isOpen]);

  // Validación de campos obligatorios
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

  // Construcción del Payload con limpieza estricta (Solución al Error 400)
  const buildPayload = () => {
    const rawPayload = {
      codigo: String(form.codigo).trim(),
      nombre: String(form.nombre).trim(),
      id_cliente: normalizeStr(form.id_cliente),
      ClienteId: form.ClienteId || null, // Solo enviamos el ClienteId oficial
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

    // Eliminamos todo lo que sea null para evitar que Sequelize o la DB lo rechace
    const cleanPayload = Object.fromEntries(
      Object.entries(rawPayload).filter(([_, value]) => value !== null)
    );

    return cleanPayload;
  };

 const handleSubmit = async () => {
    setError(null);

    if (!requiredOk) {
      setError("Completa los campos obligatorios (*).");
      return;
    }

    setLoading(true);
    try {
      // PREPARAMOS EL PAYLOAD CON LOS NOMBRES EXACTOS QUE EXIGE TU BACKEND
      const rawPayload = {
        codigo: String(form.codigo).trim(),
        nombre: String(form.nombre).trim(),
        id_cliente: normalizeStr(form.id_cliente),
        
        // 🔥 EL FIX ESTÁ AQUÍ: Tu backend pide "clienteId" en minúscula
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

      // Eliminamos todo lo que sea null para evitar que Sequelize o la DB lo rechace
      const cleanPayload = Object.fromEntries(
        Object.entries(rawPayload).filter(([_, value]) => value !== null)
      );

      await onSave(cleanPayload, mode);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "Error al guardar la Ubicación Técnica");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center font-sans">
      <div className="w-full max-w-5xl max-h-[92vh] bg-slate-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
              <MapPin size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {mode === "edit" ? "Editar Ubicación Técnica" : "Nueva Ubicación Técnica"}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configuración de parámetros logísticos y geográficos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            disabled={loading}
            title="Cerrar"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* BODY CON SCROLL */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* SECCIÓN 1: IDENTIFICACIÓN */}
              <Section icon={<Hash />} title="Identificación del Activo">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Código Activo *">
                    <input value={form.codigo} onChange={update("codigo")} placeholder="Ej: UT-0001" className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Nombre Comercial *">
                    <input value={form.nombre} onChange={update("nombre")} placeholder="Ej: Planta Trujillo" className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Tipo Propiedad *">
                    <select value={form.tipoEquipoPropiedad} onChange={update("tipoEquipoPropiedad")} className={inputCls} disabled={loading}>
                      <option value="Vendido">Vendido</option>
                      <option value="Propio">Propio</option>
                      <option value="Atendido">Atendido</option>
                    </select>
                  </Field>
                  <Field label="Especialidad">
                    <input value={form.especialidad} onChange={update("especialidad")} placeholder="Mecánica / Eléctrica" className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Descripción" className="md:col-span-2">
                    <textarea value={form.descripcion} onChange={update("descripcion")} placeholder="Detalles o notas adicionales..." className={`${inputCls} min-h-[80px] resize-none`} disabled={loading} />
                  </Field>
                </div>
              </Section>

              {/* SECCIÓN 2: ASIGNACIÓN */}
              <Section icon={<Globe />} title="Asignación y Entorno">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Cliente Titular *">
                    <select value={form.ClienteId} onChange={update("ClienteId")} className={inputCls} disabled={loading || loadingCombos}>
                      <option value="">{loadingCombos ? "Cargando clientes..." : "Selecciona cliente"}</option>
                      {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nombre || c.razonSocial || c.codigo}</option>))}
                    </select>
                  </Field>
                  <Field label="País *">
                    <select value={form.paisId} onChange={update("paisId")} className={inputCls} disabled={loading || loadingCombos}>
                      <option value="">{loadingCombos ? "Cargando países..." : "Selecciona país"}</option>
                      {paises.map((p) => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
                    </select>
                  </Field>
                  <Field label="ID Externo (Opcional)">
                    <input value={form.id_cliente} onChange={update("id_cliente")} placeholder="Referencia ERP / SAP" className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Sede / Proyecto">
                    <input value={form.sede} onChange={update("sede")} placeholder="Unidad Minera / Ciudad" className={inputCls} disabled={loading} />
                  </Field>
                </div>
              </Section>

              {/* SECCIÓN 3: LOGÍSTICA */}
              <Section icon={<Truck />} title="Logística y Documentación">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Número Orden de Venta (OV) *">
                    <input value={form.numeroOV} onChange={update("numeroOV")} placeholder="Ej: OV-1002" className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Fecha OV">
                    <input type="date" value={form.fechaOV} onChange={update("fechaOV")} className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="N° Orden Cliente">
                    <input value={form.numeroOrdenCliente} onChange={update("numeroOrdenCliente")} className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Fecha Orden Cliente">
                    <input type="date" value={form.fechaOrdenCliente} onChange={update("fechaOrdenCliente")} className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Almacén">
                    <input value={form.almacen} onChange={update("almacen")} className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="ID Placa">
                    <input value={form.idPlaca} onChange={update("idPlaca")} className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Operador Logístico" className="md:col-span-2">
                    <input value={form.operadorLogistico} onChange={update("operadorLogistico")} className={inputCls} disabled={loading} />
                  </Field>
                </div>
              </Section>

              {/* SECCIÓN 4: FECHAS */}
              <Section icon={<CalendarDays />} title="Control de Tiempos y Garantía">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Field label="Entrega Prevista">
                    <input type="date" value={form.fechaEntregaPrevista} onChange={update("fechaEntregaPrevista")} className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Entrega Real">
                    <input type="date" value={form.fechaEntregaReal} onChange={update("fechaEntregaReal")} className={inputCls} disabled={loading} />
                  </Field>
                  <Field label="Fin de Garantía">
                    <input type="date" value={form.finGarantia} onChange={update("finGarantia")} className={inputCls} disabled={loading} />
                  </Field>
                </div>
              </Section>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 z-10 bg-white border-t border-slate-200 px-6 py-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-semibold text-sm"
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || !requiredOk}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {mode === "edit" ? "Actualizar Registro" : "Guardar Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES UI ---

function Section({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="text-blue-600 bg-blue-100 p-1.5 rounded-lg">
          {/* Clonamos el icono para asegurarnos de que tenga el tamaño y grosor adecuado */}
          {icon && <icon.type size={18} strokeWidth={2.5} />}
        </div>
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-xs font-bold text-slate-700 ml-1">
        {label}
      </label>
      {children}
    </div>
  );
}

// Clase unificada para los inputs idéntica a la de Mantenimiento
const inputCls =
  "w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400";