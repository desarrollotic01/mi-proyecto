import { useState } from "react";
import { X, Plus, Trash2, ShoppingCart, Package, Calendar, Mail, Building } from "lucide-react";

const emptyLinea = () => ({
  id: crypto.randomUUID(),
  itemCode: "",
  description: "",
  quantity: 1,
  costCenter: "",
  projectCode: "",
});

export default function ModalSolicitudCompra({
  isOpen,
  onClose,
  onConfirm,
}) {
  const [data, setData] = useState({
    branch: "",
    department: "",
    email: "",
    requiredDate: "",
    comments: "",
    lineas: [emptyLinea()],
  });

  if (!isOpen) return null;

  const updateLinea = (id, field, value) => {
    setData((prev) => ({
      ...prev,
      lineas: prev.lineas.map((l) =>
        l.id === id ? { ...l, [field]: value } : l
      ),
    }));
  };

  const addLinea = () => {
    setData((prev) => ({
      ...prev,
      lineas: [...prev.lineas, emptyLinea()],
    }));
  };

  const removeLinea = (id) => {
    setData((prev) => ({
      ...prev,
      lineas: prev.lineas.filter((l) => l.id !== id),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl flex flex-col max-h-[90vh] shadow-2xl">

        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-600 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Solicitud de Compra
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Completa los datos generales y el detalle de artículos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 overflow-auto flex-1">

          {/* DATOS GENERALES */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-green-600" />
              Datos Generales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sucursal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                  placeholder="Ej: Sucursal Lima"
                  value={data.branch}
                  onChange={(e) =>
                    setData({ ...data, branch: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Departamento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                  placeholder="Ej: Mantenimiento"
                  value={data.department}
                  onChange={(e) =>
                    setData({ ...data, department: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                  placeholder="correo@empresa.com"
                  value={data.email}
                  onChange={(e) =>
                    setData({ ...data, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha necesaria <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                  value={data.requiredDate}
                  onChange={(e) =>
                    setData({ ...data, requiredDate: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Comentarios
                </label>
                <textarea
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none resize-none"
                  rows={3}
                  placeholder="Comentarios adicionales..."
                  value={data.comments}
                  onChange={(e) =>
                    setData({ ...data, comments: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* ARTÍCULOS SOLICITADOS */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Artículos Solicitados
              </h3>
              <span className="text-sm text-gray-600">
                {data.lineas.length} artículo{data.lineas.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3">
              {data.lineas.map((l, index) => (
                <div
                  key={l.id}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-all"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Item Code */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Código <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Código"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-sm"
                        value={l.itemCode}
                        onChange={(e) =>
                          updateLinea(l.id, "itemCode", e.target.value)
                        }
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Descripción <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Descripción del artículo"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-sm"
                        value={l.description}
                        onChange={(e) =>
                          updateLinea(l.id, "description", e.target.value)
                        }
                      />
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Cant.
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-sm text-center font-semibold"
                        value={l.quantity}
                        onChange={(e) =>
                          updateLinea(l.id, "quantity", Number(e.target.value))
                        }
                      />
                    </div>

                    {/* Cost Center */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Centro Costo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="CC-001"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-sm"
                        value={l.costCenter}
                        onChange={(e) =>
                          updateLinea(l.id, "costCenter", e.target.value)
                        }
                      />
                    </div>

                    {/* Project Code */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Proyecto
                      </label>
                      <input
                        type="text"
                        placeholder="Opcional"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-sm"
                        value={l.projectCode}
                        onChange={(e) =>
                          updateLinea(l.id, "projectCode", e.target.value)
                        }
                      />
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-2 flex items-end gap-2">
                      {data.lineas.length > 1 && (
                        <button
                          onClick={() => removeLinea(l.id)}
                          className="flex-1 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 font-medium"
                          title="Eliminar línea"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {index === data.lineas.length - 1 && (
                        <button
                          onClick={addLinea}
                          className="flex-1 px-3 py-2 bg-green-50 border border-green-200 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2 font-medium"
                          title="Agregar línea"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="text-red-500">*</span> Campos obligatorios
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-white transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => onConfirm(data)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-lg shadow-green-500/30 flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Guardar Solicitud
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}