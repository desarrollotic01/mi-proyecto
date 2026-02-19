
import { X, Save, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function ModalEditarSolicitudCompra({ 
  isOpen, 
  onClose, 
  solicitudCompra,
  onSave 
}) {
  const [formData, setFormData] = useState({
    requiredDate: "",
    department: "Mantenimiento",
    requester: "",
    comments: "",
    docCurrency: "PEN",
    docRate: 1,
    branchId: 1,
    lineas: []
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && solicitudCompra) {
      setFormData({
        requiredDate: solicitudCompra.requiredDate || "",
        department: solicitudCompra.department || "Mantenimiento",
        requester: solicitudCompra.requester || "",
        comments: solicitudCompra.comments || "",
        docCurrency: solicitudCompra.docCurrency || "PEN",
        docRate: solicitudCompra.docRate || 1,
        branchId: solicitudCompra.branchId || 1,
        lineas: solicitudCompra.lineas?.map(linea => ({
          itemCode: linea.itemCode || "",
          description: linea.description || "",
          quantity: linea.quantity || 1,
          warehouseCode: linea.warehouseCode || "01"
        })) || []
      });
    }
  }, [isOpen, solicitudCompra]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLineaChange = (index, field, value) => {
    const newLineas = [...formData.lineas];
    newLineas[index] = {
      ...newLineas[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      lineas: newLineas
    }));
  };

  const agregarLinea = () => {
    setFormData(prev => ({
      ...prev,
      lineas: [
        ...prev.lineas,
        {
          itemCode: "",
          description: "",
          quantity: 1,
          warehouseCode: "01"
        }
      ]
    }));
  };

  const eliminarLinea = (index) => {
    setFormData(prev => ({
      ...prev,
      lineas: prev.lineas.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar la solicitud de compra");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Editar Solicitud de Compra</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Información General */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-4">
              <h4 className="font-bold text-slate-900 mb-3">Información General</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Fecha Requerida *
                  </label>
                  <input
                    type="date"
                    name="requiredDate"
                    value={formData.requiredDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Departamento *
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Solicitante *
                  </label>
                  <input
                    type="text"
                    name="requester"
                    value={formData.requester}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Moneda
                  </label>
                  <select
                    name="docCurrency"
                    value={formData.docCurrency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="PEN">PEN - Soles</option>
                    <option value="USD">USD - Dólares</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Comentarios
                </label>
                <textarea
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Comentarios adicionales..."
                />
              </div>
            </div>

            {/* Líneas de Productos */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900">Ítems Solicitados</h4>
                <button
                  type="button"
                  onClick={agregarLinea}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Ítem
                </button>
              </div>

              <div className="space-y-3">
                {formData.lineas.map((linea, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-bold text-slate-700">Ítem #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => eliminarLinea(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Código de Artículo *
                        </label>
                        <input
                          type="text"
                          value={linea.itemCode}
                          onChange={(e) => handleLineaChange(index, 'itemCode', e.target.value)}
                          required
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="MAT-001"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Descripción *
                        </label>
                        <input
                          type="text"
                          value={linea.description}
                          onChange={(e) => handleLineaChange(index, 'description', e.target.value)}
                          required
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Grasa industrial"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={linea.quantity}
                          onChange={(e) => handleLineaChange(index, 'quantity', parseInt(e.target.value))}
                          required
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Código Almacén *
                        </label>
                        <input
                          type="text"
                          value={linea.warehouseCode}
                          onChange={(e) => handleLineaChange(index, 'warehouseCode', e.target.value)}
                          required
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="01"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {formData.lineas.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No hay ítems agregados. Haz clic en "Agregar Ítem" para comenzar.
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors font-semibold text-slate-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || formData.lineas.length === 0}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}