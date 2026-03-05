import { X, Save, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/**
 * ModalEditarSolicitudCompra (UNIVERSAL)
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - solicitudes: SolicitudCompra[]   // ✅ lista (general + por equipo)
 * - defaultSolicitudId?: string      // ✅ opcional: abre editando una en específico
 * - equiposInfo?: Array<{ id: string, nombre?: string, codigo?: string, tag?: string }>
 * - onSave: (solicitudId: string, payload: any) => Promise<void>
 *
 * NOTA:
 * - Este modal NO asume “general”.
 * - Tú decides qué solicitudes le pasas (por ahora: general + equipos).
 * - Mañana para “individual” le pasas otra lista y listo.
 */

export default function ModalEditarSolicitudCompra({
  isOpen,
  onClose,
  solicitudes = [],
  defaultSolicitudId = "",
  equiposInfo = [],
  onSave,
}) {
  const [selectedId, setSelectedId] = useState(defaultSolicitudId || "");
  const [loading, setLoading] = useState(false);

  const solicitudesArr = useMemo(() => (Array.isArray(solicitudes) ? solicitudes : []), [solicitudes]);

  const selectedSolicitud = useMemo(() => {
    if (!solicitudesArr.length) return null;

    // si me dan defaultSolicitudId y existe, lo uso
    const byDefault = defaultSolicitudId
      ? solicitudesArr.find((s) => s?.id === defaultSolicitudId)
      : null;
    if (byDefault) return byDefault;

    // si selectedId existe y está en lista
    const bySelected = selectedId ? solicitudesArr.find((s) => s?.id === selectedId) : null;
    if (bySelected) return bySelected;

    // si no, preferir general si hay
    const general = solicitudesArr.find((s) => s?.esGeneral === true) || null;
    return general || solicitudesArr[0] || null;
  }, [solicitudesArr, defaultSolicitudId, selectedId]);


  

  // setear selectedId cuando abre
  useEffect(() => {
    if (!isOpen) return;

    if (defaultSolicitudId) {
      setSelectedId(defaultSolicitudId);
      return;
    }

    const general = solicitudesArr.find((s) => s?.esGeneral === true);
    if (general?.id) setSelectedId(general.id);
    else if (solicitudesArr[0]?.id) setSelectedId(solicitudesArr[0].id);
  }, [isOpen, defaultSolicitudId, solicitudesArr]);

  const [formData, setFormData] = useState({
    requiredDate: "",
    department: "Mantenimiento",
    requester: "",
    comments: "",
    docCurrency: "PEN",
    docRate: 1,
    branchId: 1,
    lineas: [],
  });

  // cargar form cuando cambia la solicitud seleccionada
  useEffect(() => {
    if (!isOpen) return;
    if (!selectedSolicitud) return;

    setFormData({
      requiredDate: selectedSolicitud.requiredDate || "",
      department: selectedSolicitud.department || "Mantenimiento",
      requester: selectedSolicitud.requester || "",
      comments: selectedSolicitud.comments || "",
      docCurrency: selectedSolicitud.docCurrency || "PEN",
      docRate: Number(selectedSolicitud.docRate) || 1,
      branchId: selectedSolicitud.branchId || 1,
      lineas:
        selectedSolicitud.lineas?.map((linea) => ({
          itemCode: linea.itemCode || "",
          description: linea.description || linea.item || "",
          quantity: Number(linea.quantity ?? linea.cantidad) || 1,
          warehouseCode: linea.warehouseCode || "01",

          // opcional: si tu backend soporta rubro/paqueteTrabajo/costCenter/etc
          rubro: linea.rubro || "",
          paqueteTrabajo: linea.paqueteTrabajo || "",
          costCenter: linea.costCenter || "",
          projectCode: linea.projectCode || "",
        })) || [],
    });
  }, [isOpen, selectedSolicitud]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineaChange = (index, field, value) => {
    setFormData((prev) => {
      const newLineas = [...(prev.lineas || [])];
      newLineas[index] = { ...newLineas[index], [field]: value };
      return { ...prev, lineas: newLineas };
    });
  };

  const agregarLinea = () => {
    setFormData((prev) => ({
      ...prev,
      lineas: [
        ...(prev.lineas || []),
        {
          itemCode: "",
          description: "",
          quantity: 1,
          warehouseCode: "01",
          rubro: "",
          paqueteTrabajo: "",
          costCenter: "",
          projectCode: "",
        },
      ],
    }));
  };

  const eliminarLinea = (index) => {
    setFormData((prev) => ({
      ...prev,
      lineas: (prev.lineas || []).filter((_, i) => i !== index),
    }));
  };

  const getEquipoLabel = (equipoId) => {
    if (!equipoId) return "—";
    const eq = (equiposInfo || []).find((e) => e?.id === equipoId);
    if (!eq) return `Equipo ${equipoId}`;
    return eq.nombre || eq.codigo || eq.tag || `Equipo ${equipoId}`;
  };

  const headerLabel = useMemo(() => {
    if (!selectedSolicitud) return "Editar Solicitud de Compra";

    if (selectedSolicitud.esGeneral) return "Editar Solicitud de Compra (GENERAL)";
    if (selectedSolicitud.equipo_id) return `Editar Solicitud (Equipo: ${getEquipoLabel(selectedSolicitud.equipo_id)})`;
    if (selectedSolicitud.ubicacion_tecnica_id) return `Editar Solicitud (Ubicación técnica: ${selectedSolicitud.ubicacion_tecnica_id})`;
    return "Editar Solicitud de Compra";
  }, [selectedSolicitud, equiposInfo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSolicitud?.id) {
      alert("No hay solicitud seleccionada.");
      return;
    }

    if (!formData.requiredDate || !formData.department || !formData.requester) {
      alert("Completa requiredDate, department y requester.");
      return;
    }

    if (!formData.lineas || formData.lineas.length === 0) {
      alert("Agrega al menos 1 ítem.");
      return;
    }

    setLoading(true);
    try {
      // ✅ payload limpio
      const payload = {
        requiredDate: formData.requiredDate,
        department: formData.department,
        requester: formData.requester,
        comments: formData.comments,
        docCurrency: formData.docCurrency,
        docRate: Number(formData.docRate) || 1,
        branchId: formData.branchId || 1,
        lineas: (formData.lineas || []).map((l) => ({
          itemCode: l.itemCode,
          description: l.description,
          quantity: Number(l.quantity) || 1,
          warehouseCode: l.warehouseCode || "01",

          // opcionales
          rubro: l.rubro || "",
          paqueteTrabajo: l.paqueteTrabajo || "",
          costCenter: l.costCenter || "",
          projectCode: l.projectCode || "",
        })),
      };

      await onSave(selectedSolicitud.id, payload);
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar la solicitud de compra");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasMany = solicitudesArr.length > 1;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-xl font-bold truncate">{headerLabel}</h3>
              {selectedSolicitud && (
                <p className="text-xs text-white/90 mt-1">
                  ID: <span className="font-mono">{selectedSolicitud.id}</span> · Estado:{" "}
                  <span className="font-semibold">{selectedSolicitud.estado || "—"}</span>
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Selector (GENERAL / EQUIPOS / ... ) */}
          {hasMany && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-white/90 mb-1">
                Selecciona solicitud a editar
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg text-slate-900 font-semibold"
                value={selectedSolicitud?.id || ""}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {solicitudesArr.map((s) => {
                  const label = s.esGeneral
                    ? "GENERAL"
                    : s.equipo_id
                    ? `EQUIPO: ${getEquipoLabel(s.equipo_id)}`
                    : s.ubicacion_tecnica_id
                    ? `UBICACIÓN: ${s.ubicacion_tecnica_id}`
                    : "SOLICITUD";

                  return (
                    <option key={s.id} value={s.id}>
                      {label} · {s.department || "—"} · {s.requiredDate || "—"}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Info general */}
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

            {/* Lineas */}
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
                {(formData.lineas || []).map((linea, index) => (
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
                          onChange={(e) => handleLineaChange(index, "itemCode", e.target.value)}
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
                          onChange={(e) => handleLineaChange(index, "description", e.target.value)}
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
                          onChange={(e) =>
                            handleLineaChange(index, "quantity", parseInt(e.target.value || "1", 10))
                          }
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
                          onChange={(e) => handleLineaChange(index, "warehouseCode", e.target.value)}
                          required
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="01"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {(formData.lineas || []).length === 0 && (
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
            type="submit"
            onClick={handleSubmit}
            disabled={loading || (formData.lineas || []).length === 0}
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