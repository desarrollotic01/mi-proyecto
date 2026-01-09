import { useState } from "react";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[900px] rounded-xl flex flex-col max-h-[90vh]">

        {/* HEADER */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Solicitud de Compra</h2>
          <p className="text-xs text-gray-500">
            Datos generales y detalle de artículos
          </p>
        </div>

        {/* BODY */}
        <div className="p-4 space-y-5 overflow-auto">

          {/* CABECERA */}
          <div className="grid grid-cols-3 gap-4 text-sm">

            <div>
              <label className="text-xs text-gray-500">Sucursal *</label>
              <input
                className="border rounded px-2 py-1 w-full"
                value={data.branch}
                onChange={(e) =>
                  setData({ ...data, branch: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Departamento *</label>
              <input
                className="border rounded px-2 py-1 w-full"
                value={data.department}
                onChange={(e) =>
                  setData({ ...data, department: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">
                Correo electrónico *
              </label>
              <input
                type="email"
                className="border rounded px-2 py-1 w-full"
                value={data.email}
                onChange={(e) =>
                  setData({ ...data, email: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Fecha necesaria *</label>
              <input
                type="date"
                className="border rounded px-2 py-1 w-full"
                value={data.requiredDate}
                onChange={(e) =>
                  setData({ ...data, requiredDate: e.target.value })
                }
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-gray-500">Comentarios</label>
              <textarea
                className="border rounded px-2 py-1 w-full"
                rows={2}
                value={data.comments}
                onChange={(e) =>
                  setData({ ...data, comments: e.target.value })
                }
              />
            </div>
          </div>

          {/* LINEAS */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Artículos solicitados</div>

            {data.lineas.map((l, index) => (
              <div
                key={l.id}
                className="grid grid-cols-7 gap-2 text-sm items-center"
              >
                <input
                  placeholder="ItemCode *"
                  className="border rounded px-2 py-1"
                  value={l.itemCode}
                  onChange={(e) =>
                    updateLinea(l.id, "itemCode", e.target.value)
                  }
                />

                <input
                  placeholder="Descripción *"
                  className="border rounded px-2 py-1 col-span-2"
                  value={l.description}
                  onChange={(e) =>
                    updateLinea(l.id, "description", e.target.value)
                  }
                />

                <input
                  type="number"
                  min="1"
                  placeholder="Cant."
                  className="border rounded px-2 py-1"
                  value={l.quantity}
                  onChange={(e) =>
                    updateLinea(l.id, "quantity", Number(e.target.value))
                  }
                />

                <input
                  placeholder="Centro de Costo *"
                  className="border rounded px-2 py-1"
                  value={l.costCenter}
                  onChange={(e) =>
                    updateLinea(l.id, "costCenter", e.target.value)
                  }
                />

                <input
                  placeholder="Proyecto"
                  className="border rounded px-2 py-1"
                  value={l.projectCode}
                  onChange={(e) =>
                    updateLinea(l.id, "projectCode", e.target.value)
                  }
                />

                {/* BOTONES */}
                <div className="flex gap-1">
                  {data.lineas.length > 1 && (
                    <button
                      onClick={() => removeLinea(l.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded"
                    >
                      🗑️
                    </button>
                  )}

                  {index === data.lineas.length - 1 && (
                    <button
                      onClick={addLinea}
                      className="px-2 py-1 bg-gray-200 rounded"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(data)}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Guardar Solicitud
          </button>
        </div>
      </div>
    </div>
  );
}
