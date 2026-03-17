import { useEffect, useMemo, useState } from "react";
import { X, Loader2, FileText, Save } from "lucide-react";

export default function SeleccionAdjuntosPortalModal({
  isOpen,
  onClose,
  equipo,
  onGuardar,
  guardando = false,
}) {
  const [adjuntosEditados, setAdjuntosEditados] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const inicial = Array.isArray(equipo?.adjuntos)
        ? equipo.adjuntos.map((adj) => ({
            id: adj.id,
            nombre: adj.nombre || "Archivo",
            extension: adj.extension || "",
            mostrarEnPortal: Boolean(adj.mostrarEnPortal),
            tituloPortal: adj.tituloPortal || "",
            descripcionPortal: adj.descripcionPortal || "",
            ordenPortal: adj.ordenPortal || 0,
          }))
        : [];

      setAdjuntosEditados(inicial);
    }
  }, [isOpen, equipo]);

  const cantidadSeleccionados = useMemo(() => {
    return adjuntosEditados.filter((a) => a.mostrarEnPortal).length;
  }, [adjuntosEditados]);

  const actualizarAdjunto = (id, cambios) => {
    setAdjuntosEditados((prev) =>
      prev.map((adj) => (adj.id === id ? { ...adj, ...cambios } : adj))
    );
  };

  const handleGuardar = () => {
    const payload = adjuntosEditados
      .filter((adj) => adj.mostrarEnPortal)
      .map((adj, index) => ({
        adjuntoId: adj.id,
        tituloPortal: adj.tituloPortal.trim() || adj.nombre,
        descripcionPortal: adj.descripcionPortal.trim() || null,
        ordenPortal: Number(adj.ordenPortal) > 0 ? Number(adj.ordenPortal) : index + 1,
      }));

    onGuardar?.(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Archivos visibles en portal
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Equipo: <b>{equipo?.nombre || "-"}</b>
              {equipo?.codigo ? ` · ${equipo.codigo}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs text-gray-600">
          Seleccionados para portal: <b>{cantidadSeleccionados}</b>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {adjuntosEditados.length === 0 ? (
            <div className="text-sm text-gray-500 border border-dashed rounded-xl p-6 text-center">
              Este equipo no tiene archivos adjuntos.
            </div>
          ) : (
            <div className="space-y-3">
              {adjuntosEditados.map((adj) => (
                <div
                  key={adj.id}
                  className="border border-gray-200 rounded-xl p-3 bg-white"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={adj.mostrarEnPortal}
                      onChange={(e) =>
                        actualizarAdjunto(adj.id, {
                          mostrarEnPortal: e.target.checked,
                        })
                      }
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <p className="text-sm font-medium text-gray-900 break-all">
                          {adj.nombre}
                        </p>
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        {adj.extension || "Sin tipo"}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                        <input
                          type="text"
                          placeholder="Título visible"
                          value={adj.tituloPortal}
                          onChange={(e) =>
                            actualizarAdjunto(adj.id, {
                              tituloPortal: e.target.value,
                            })
                          }
                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400"
                        />

                        <input
                          type="text"
                          placeholder="Descripción"
                          value={adj.descripcionPortal}
                          onChange={(e) =>
                            actualizarAdjunto(adj.id, {
                              descripcionPortal: e.target.value,
                            })
                          }
                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400"
                        />

                        <input
                          type="number"
                          min="1"
                          placeholder="Orden"
                          value={adj.ordenPortal || ""}
                          onChange={(e) =>
                            actualizarAdjunto(adj.id, {
                              ordenPortal: e.target.value,
                            })
                          }
                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="px-3 py-2 text-sm rounded-lg bg-gray-800 text-white hover:bg-black disabled:opacity-60 flex items-center gap-2"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}