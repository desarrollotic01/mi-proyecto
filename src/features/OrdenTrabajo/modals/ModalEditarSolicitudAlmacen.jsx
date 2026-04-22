import { X, Save, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function ModalEditarSolicitudAlmacen({ isOpen, onClose, solicitud, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ requiredDate: "", comments: "", lineas: [] });

  useEffect(() => {
    if (!isOpen || !solicitud) return;
    setFormData({
      requiredDate: solicitud.requiredDate ? String(solicitud.requiredDate).slice(0, 10) : "",
      comments: solicitud.comments || "",
      lineas: (solicitud.lineas || []).map((l) => ({
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

  const agregarLinea = () =>
    setFormData((prev) => ({
      ...prev,
      lineas: [...prev.lineas, { itemCode: "", description: "", quantity: 1, warehouseCode: "01", costingCode: "", projectCode: "", rubroId: null, paqueteTrabajoId: null }],
    }));

  const eliminarLinea = (idx) =>
    setFormData((prev) => ({ ...prev, lineas: prev.lineas.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.lineas.length) { alert("Agrega al menos 1 ítem."); return; }
    setLoading(true);
    try {
      await onSave(solicitud.id, {
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
      alert(err?.response?.data?.message || err?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !solicitud) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Requerida</label>
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
              <h4 className="font-bold text-slate-900 text-sm">Ítems ({formData.lineas.length})</h4>
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
                <div key={idx} className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">Ítem #{idx + 1}</span>
                    <button type="button" onClick={() => eliminarLinea(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Código *</label>
                      <input value={l.itemCode} onChange={(e) => updateLinea(idx, "itemCode", e.target.value)} required className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="MAT-001" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Descripción *</label>
                      <input value={l.description} onChange={(e) => updateLinea(idx, "description", e.target.value)} required className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Descripción del ítem" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Cantidad *</label>
                      <input type="number" min="1" value={l.quantity} onChange={(e) => updateLinea(idx, "quantity", Number(e.target.value) || 1)} required className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Almacén</label>
                      <input value={l.warehouseCode} onChange={(e) => updateLinea(idx, "warehouseCode", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="01" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">C. Costo</label>
                      <input value={l.costingCode} onChange={(e) => updateLinea(idx, "costingCode", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Proyecto</label>
                      <input value={l.projectCode} onChange={(e) => updateLinea(idx, "projectCode", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" />
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
