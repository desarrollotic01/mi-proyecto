import { useEffect, useMemo, useState } from "react";
import { X, AlertCircle, Loader2, Save } from "lucide-react";

import { paisService } from "../../mantenimiento/services/paisService";
import { clienteService } from "../../mantenimiento/services/clienteService";

const emptyForm = () => ({
  codigo: "",
  nombre: "",

  // campo extra (string) - SOLO un dato
  id_cliente: "",

  // ✅ ESTE ES EL CLIENTE REAL
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
});

const normalizeDate = (v) => (v ? v : null);
const normalizeStr = (v) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export default function UbicacionTecnicaModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}) {
  const mode = initialData ? "edit" : "create";

  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [paises, setPaises] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setError(null);

    if (initialData) {
      setForm({
        ...emptyForm(),
        ...initialData,

        // ✅ prioridad: ClienteId real
        ClienteId:
          initialData.ClienteId ||
          initialData.clienteId ||
          initialData?.cliente?.id ||
          "",

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
        setError("No se pudo cargar Países/Clientes.");
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

  const update = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const buildPayload = () => {
    const payload = {
      codigo: String(form.codigo).trim(),
      nombre: String(form.nombre).trim(),

      // solo un string adicional
      id_cliente: normalizeStr(form.id_cliente),

      // ✅ FK real
      ClienteId: form.ClienteId || null,

      // (opcional) si en algún endpoint tu backend espera clienteId también, lo mandas duplicado:
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

    return payload;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!requiredOk) {
      setError(
        "Completa los obligatorios: Código, Nombre, Cliente, País, Tipo de Propiedad y Número OV."
      );
      return;
    }

    setLoading(true);
    try {
      await onSave(buildPayload(), mode);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Error al guardar la Ubicación Técnica");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center">
      {/* ✅ max-h + overflow-hidden para que NO se salga */}
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* ✅ Header sticky */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              {mode === "edit"
                ? "Editar Ubicación Técnica"
                : "Nueva Ubicación Técnica"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 truncate">
              Modal responsive (scroll interno) • Cliente / País / OV / Fechas
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
            title="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* ✅ Body con scroll */}
        <div className="flex-1 overflow-auto px-5 py-5">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* ✅ Grid más amigable con pantallas bajas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionTitle title="Identificación" className="md:col-span-2" />

            <Field label="Código *">
              <input
                value={form.codigo}
                onChange={update("codigo")}
                placeholder="Ej: UT-0001"
                className={inputCls}
                disabled={loading}
              />
            </Field>

            <Field label="Nombre *">
              <input
                value={form.nombre}
                onChange={update("nombre")}
                placeholder="Ej: Planta Trujillo"
                className={inputCls}
                disabled={loading}
              />
            </Field>

            <Field label="Especialidad">
              <input
                value={form.especialidad || ""}
                onChange={update("especialidad")}
                placeholder="Ej: Eléctrica / Mecánica"
                className={inputCls}
                disabled={loading}
              />
            </Field>

            <Field label="Descripción" className="md:col-span-2">
              <textarea
                value={form.descripcion || ""}
                onChange={update("descripcion")}
                placeholder="Descripción…"
                className={[inputCls, "min-h-[90px] resize-none"].join(" ")}
                disabled={loading}
              />
            </Field>

            <Divider />

            <SectionTitle title="Cliente y País" className="md:col-span-2" />

            <Field label="Cliente *">
              <select
                value={form.ClienteId}
                onChange={update("ClienteId")}
                className={inputCls}
                disabled={loading || loadingCombos}
              >
                <option value="">
                  {loadingCombos ? "Cargando clientes…" : "Selecciona cliente"}
                </option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre || c.razonSocial || c.codigo || c.id}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="País *">
              <select
                value={form.paisId}
                onChange={update("paisId")}
                className={inputCls}
                disabled={loading || loadingCombos}
              >
                <option value="">
                  {loadingCombos ? "Cargando países…" : "Selecciona país"}
                </option>
                {paises.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre || p.descripcion || p.codigo || p.id}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="id_cliente (string)">
              <input
                value={form.id_cliente || ""}
                onChange={update("id_cliente")}
                placeholder="ID externo (opcional)"
                className={inputCls}
                disabled={loading}
              />
            </Field>

            <Field label="Tipo Propiedad *">
              <select
                value={form.tipoEquipoPropiedad}
                onChange={update("tipoEquipoPropiedad")}
                className={inputCls}
                disabled={loading}
              >
                <option value="Vendido">Vendido</option>
                <option value="Propio">Propio</option>
                <option value="Atendido">Atendido</option>
              </select>
            </Field>

            <Divider />

            <SectionTitle title="OV y Orden del Cliente" className="md:col-span-2" />

            <Field label="Número OV *">
              <input
                value={form.numeroOV}
                onChange={update("numeroOV")}
                placeholder="Ej: OV-1002"
                className={inputCls}
                disabled={loading}
              />
            </Field>

            <Field label="Fecha OV">
              <input
                type="date"
                value={form.fechaOV || ""}
                onChange={update("fechaOV")}
                className={inputCls}
                disabled={loading}
              />
            </Field>

            <Field label="Número Orden Cliente">
              <input
                value={form.numeroOrdenCliente || ""}
                onChange={update("numeroOrdenCliente")}
                className={inputCls}
                disabled={loading}
              />
            </Field>

            <Field label="Fecha Orden Cliente">
              <input
                type="date"
                value={form.fechaOrdenCliente || ""}
                onChange={update("fechaOrdenCliente")}
                className={inputCls}
                disabled={loading}
              />
            </Field>

            <Divider />

            <SectionTitle title="Logística" className="md:col-span-2" />

            <Field label="Sede">
              <input
                value={form.sede || ""}
                onChange={update("sede")}
                className={inputCls}
                disabled={loading}
              />
            </Field>

            <Field label="Almacén">
              <input
                value={form.almacen || ""}
                onChange={update("almacen")}
                className={inputCls}
                disabled={loading}
              />
            </Field>

            <Field label="Operador Logístico">
              <input
                value={form.operadorLogistico || ""}
                onChange={update("operadorLogistico")}
                className={inputCls}
                disabled={loading}
              />
            </Field>

            <Field label="ID Placa">
              <input
                value={form.idPlaca || ""}
                onChange={update("idPlaca")}
                className={inputCls}
                disabled={loading}
              />
            </Field>

            <Divider />

            <SectionTitle title="Fechas" className="md:col-span-2" />

            <Field label="Entrega Prevista">
              <input
                type="date"
                value={form.fechaEntregaPrevista || ""}
                onChange={update("fechaEntregaPrevista")}
                className={inputCls}
                disabled={loading}
              />
            </Field>

            <Field label="Entrega Real">
              <input
                type="date"
                value={form.fechaEntregaReal || ""}
                onChange={update("fechaEntregaReal")}
                className={inputCls}
                disabled={loading}
              />
            </Field>

            <Field label="Fin Garantía">
              <input
                type="date"
                value={form.finGarantia || ""}
                onChange={update("finGarantia")}
                className={inputCls}
                disabled={loading}
              />
            </Field>

            {/* para que no se vea raro en 2 cols */}
            <div className="hidden md:block" />
          </div>
        </div>

        {/* ✅ Footer sticky */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition font-medium shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !requiredOk}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {mode === "edit" ? "Actualizar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== UI ===== */

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function SectionTitle({ title, className = "" }) {
  return (
    <div className={["flex items-center gap-2", className].join(" ")}>
      <div className="h-px bg-gray-200 flex-1" />
      <div className="text-xs font-bold text-gray-700 tracking-wide uppercase">
        {title}
      </div>
      <div className="h-px bg-gray-200 flex-1" />
    </div>
  );
}

function Divider() {
  return <div className="md:col-span-2 h-px bg-gray-200 my-1" />;
}

const inputCls =
  "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:bg-gray-50 text-sm";