import { X, Save, Plus, Trash2, Calendar, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { itemService } from "../../PlanMantenimiento/services/itemService";
import { sapCatalogosService } from "../../PlanMantenimiento/services/sapCatalogosService";

export default function ModalEditarSolicitudAlmacen({
  isOpen,
  onClose,
  solicitud,
  onSave,
  ordenTrabajoId = null,
  tratamientoId = null,
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [formData, setFormData] = useState({ requiredDate: "", comments: "", lineas: [] });
  const [errores, setErrores] = useState([]);

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
        setItems(i || []);
        setRubros(r || []);
        setPaquetes(p || []);
      } catch (e) {
        console.error("Error cargando catálogos:", e);
      } finally {
        setLoadingCatalogos(false);
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !solicitud) return;
    setErrores([]);
    setFormData({
      requiredDate: solicitud.requiredDate ? String(solicitud.requiredDate).slice(0, 10) : "",
      comments: solicitud.comments || "",
      lineas: (solicitud.lineas || []).map((l) => ({
        itemId: l.itemId || "",
        itemCode: l.itemCode || "",
        description: l.description || "",
        quantity: Number(l.quantity) || 1,
        warehouseCode: l.warehouseCode || "01",
        costingCode: l.costingCode || l.costCenter || "",
        projectCode: l.projectCode || "",
        rubroId: l.rubroId || null,
        paqueteTrabajoId: l.paqueteTrabajoId || null,
      })),
    });
  }, [isOpen, solicitud]);

  const updateLinea = (idx, field, val) =>
    setFormData((prev) => {
      const next = [...prev.lineas];
      next[idx] = { ...next[idx], [field]: val };
      return { ...prev, lineas: next };
    });

  const handleSelectItem = (idx, selectedItemId) => {
    const item = items.find((i) => String(i.id) === String(selectedItemId));
    if (!item) {
      updateLinea(idx, "itemId", "");
      updateLinea(idx, "itemCode", "");
      return;
    }
    setFormData((prev) => {
      const next = [...prev.lineas];
      next[idx] = {
        ...next[idx],
        itemId: item.id,
        itemCode: item.sapCode || "",
        description: item.nombre || "",
        rubroId: item.rubroId ?? next[idx].rubroId ?? null,
      };
      return { ...prev, lineas: next };
    });
  };

  const agregarLinea = () =>
    setFormData((prev) => ({
      ...prev,
      lineas: [
        ...prev.lineas,
        { itemId: "", itemCode: "", description: "", quantity: 1, warehouseCode: "01", costingCode: "", projectCode: "", rubroId: null, paqueteTrabajoId: null },
      ],
    }));

  const eliminarLinea = (idx) =>
    setFormData((prev) => ({ ...prev, lineas: prev.lineas.filter((_, i) => i !== idx) }));

  const validar = () => {
    const errs = [];
    if (!formData.requiredDate) errs.push("Falta la fecha requerida");
    if (!formData.lineas.length) errs.push("Agrega al menos 1 ítem");
    formData.lineas.forEach((l, idx) => {
      const n = idx + 1;
      if (!l.itemCode?.trim()) errs.push(`Línea ${n}: falta el ítem`);
      if (!l.description?.trim()) errs.push(`Línea ${n}: falta la descripción`);
      if (!(Number(l.quantity) > 0)) errs.push(`Línea ${n}: cantidad inválida`);
      if (!l.warehouseCode?.trim()) errs.push(`Línea ${n}: falta el almacén`);
      if (!l.rubroId) errs.push(`Línea ${n}: falta el rubro`);
      if (!l.paqueteTrabajoId) errs.push(`Línea ${n}: falta el paquete de trabajo`);
    });
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validar();
    if (errs.length > 0) {
      setErrores(errs);
      return;
    }
    setLoading(true);
    try {
      await onSave(solicitud.id, {
        tratamiento_id: tratamientoId || solicitud.tratamiento_id || null,
        ordenTrabajoId: ordenTrabajoId || solicitud.ordenTrabajoId || null,
        requiredDate: formData.requiredDate || null,
        comments: formData.comments,
        lineas: formData.lineas.map((l) => ({
          itemId: l.itemId || null,
          itemCode: l.itemCode,
          description: l.description,
          quantity: Number(l.quantity) || 1,
          warehouseCode: l.warehouseCode || "01",
          costingCode: l.costingCode || "",
          projectCode: l.projectCode || "",
          rubroId: l.rubroId || null,
          paqueteTrabajoId: l.paqueteTrabajoId || null,
        })),
      });
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.join(", ") || err?.message || "Error al guardar";
      setErrores([msg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !solicitud) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-teal-700 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold">Editar Solicitud de Almacén</h3>
            <p className="text-xs text-white/70 mt-0.5">
              {solicitud.numeroSolicitud || `ID: ${solicitud.id?.slice(0, 8)}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errores.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 space-y-1">
              {errores.map((e, i) => <p key={i}>• {e}</p>)}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                <Calendar className="inline w-3.5 h-3.5 mr-1" />
                Fecha Requerida <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.requiredDate}
                onChange={(e) => setFormData((p) => ({ ...p, requiredDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Comentarios</label>
              <input
                value={formData.comments}
                onChange={(e) => setFormData((p) => ({ ...p, comments: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-400"
                placeholder="Comentarios adicionales..."
              />
            </div>
          </div>

          {/* Lineas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Package className="w-4 h-4 text-slate-500" /> Ítems ({formData.lineas.length})
              </h4>
              <button type="button" onClick={agregarLinea} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition">
                <Plus className="w-3.5 h-3.5" /> Agregar ítem
              </button>
            </div>
            {formData.lineas.length === 0 && (
              <p className="text-sm text-slate-400 border border-dashed border-slate-300 rounded-xl p-4 text-center">
                Sin ítems. Haz clic en "Agregar ítem".
              </p>
            )}
            <div className="space-y-2">
              {formData.lineas.map((l, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500">Ítem #{idx + 1}</span>
                    <button type="button" onClick={() => eliminarLinea(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Fila 1 */}
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Ítem *</p>
                      <select
                        className="w-full px-2 py-2 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-300"
                        value={l.itemId || ""}
                        onChange={(e) => handleSelectItem(idx, e.target.value)}
                        disabled={loadingCatalogos}
                      >
                        <option value="">{loadingCatalogos ? "Cargando..." : "Seleccione un ítem"}</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>{item.sapCode} - {item.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Código *</p>
                      <input value={l.itemCode} readOnly className="w-full px-2 py-1.5 border rounded-lg text-xs bg-gray-100" />
                    </div>
                    <div className="col-span-3">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Descripción *</p>
                      <input value={l.description} onChange={(e) => updateLinea(idx, "description", e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" placeholder="Descripción" />
                    </div>
                    <div className="col-span-1">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Cant. *</p>
                      <input type="number" min="1" value={l.quantity} onChange={(e) => updateLinea(idx, "quantity", Number(e.target.value) || 1)} className="w-full px-2 py-1.5 border rounded-lg text-xs text-center font-semibold" />
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Almacén *</p>
                      <input value={l.warehouseCode} onChange={(e) => updateLinea(idx, "warehouseCode", e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" placeholder="01" />
                    </div>
                  </div>

                  {/* Fila 2 */}
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">C. Costo</p>
                      <input value={l.costingCode} onChange={(e) => updateLinea(idx, "costingCode", e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" placeholder="CC-001" />
                    </div>
                    <div className="col-span-3">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Proyecto</p>
                      <input value={l.projectCode} onChange={(e) => updateLinea(idx, "projectCode", e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" placeholder="Opcional" />
                    </div>
                    <div className="col-span-3">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Rubro *</p>
                      <select
                        className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white"
                        value={l.rubroId != null ? String(l.rubroId) : ""}
                        onChange={(e) => updateLinea(idx, "rubroId", e.target.value || null)}
                      >
                        <option value="">Seleccione rubro</option>
                        {rubros.map((r) => (
                          <option key={r.id} value={r.id}>{r.codigo} - {r.descripcion}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Paquete trabajo *</p>
                      <select
                        className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white"
                        value={l.paqueteTrabajoId != null ? String(l.paqueteTrabajoId) : ""}
                        onChange={(e) => updateLinea(idx, "paqueteTrabajoId", e.target.value || null)}
                      >
                        <option value="">Seleccione paquete</option>
                        {paquetes.map((p) => (
                          <option key={p.id} value={p.id}>{p.codigo} - {p.descripcion}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-slate-50 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
            Cancelar
          </button>
          <button type="submit" onClick={handleSubmit} disabled={loading || !formData.lineas.length} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition">
            <Save className="w-4 h-4" />
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
