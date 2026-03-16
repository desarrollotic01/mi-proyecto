import { useEffect, useState } from "react";
import { X, Link as LinkIcon, AlertCircle, Loader2, Ban, Copy } from "lucide-react";
import { portalClienteService } from "../../mantenimiento/services/portalClienteService";

export default function PortalModal({ isOpen, onClose, cliente }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && cliente) {
      cargarLinks();
    }
  }, [isOpen, cliente]);

  const cargarLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portalClienteService.listarLinks(cliente.id);
      setLinks(Array.isArray(data) ? data : data.links || data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "No se pudieron cargar los enlaces.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarLink = async () => {
    setLoading(true);
    setError(null);
    try {
      await portalClienteService.generarLink(cliente.id);
      await cargarLinks();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.statusText ||
          "Error al generar el enlace."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivar = async (linkId) => {
    setLoading(true);
    try {
      await portalClienteService.desactivarLink(linkId);
      await cargarLinks();
    } catch (err) {
      alert(err.response?.data?.error || "Error al cambiar el estado del enlace");
    } finally {
      setLoading(false);
    }
  };

  const copiarAlPortapapeles = async (token) => {
    const urlExterna = `${window.location.origin}/portal/cliente/${token}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(urlExterna);
        alert(`¡Enlace copiado!\n\n${urlExterna}`);
        return;
      }

      const textArea = document.createElement("textarea");
      textArea.value = urlExterna;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const ok = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (ok) {
        alert(`¡Enlace copiado!\n\n${urlExterna}`);
      } else {
        alert(`No se pudo copiar automáticamente.\n\nCopia este enlace:\n${urlExterna}`);
      }
    } catch (error) {
      alert(`No se pudo copiar automáticamente.\n\nCopia este enlace:\n${urlExterna}`);
    }
  };

  if (!isOpen) return null;

  const tieneLinkActivo = links.some((link) => link.activo);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <LinkIcon className="text-blue-600" /> Portal del Cliente
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Gestiona el acceso al visor para <b>{cliente?.razonSocial}</b>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {!tieneLinkActivo && (
            <button
              onClick={handleGenerarLink}
              disabled={loading}
              className="w-full mb-6 py-3 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors flex justify-center items-center gap-2"
              type="button"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LinkIcon size={18} />}
              Generar Nuevo Enlace
            </button>
          )}

          <h4 className="font-semibold text-gray-700 mb-3">Enlaces del Portal</h4>

          {links.length === 0 && !loading ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
              Aún no has generado el enlace para este cliente.
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div
                  key={link.id}
                  className={`p-5 border-2 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                    link.activo
                      ? "border-blue-300 bg-blue-50/30"
                      : "border-gray-200 bg-gray-100 opacity-75"
                  }`}
                >
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
                          link.activo
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {link.activo ? "ACCESO PERMITIDO" : "ACCESO DENEGADO"}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        Creado: {new Date(link.createdAt).toLocaleDateString("es-PE")}
                      </span>
                    </div>

                    <p className="text-sm font-mono text-gray-600 truncate bg-white px-3 py-2 rounded-lg border border-gray-200">
                      /portal/cliente/{link.token}
                    </p>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {link.activo && (
                      <>
                        <button
                          onClick={() => handleDesactivar(link.id)}
                          disabled={loading}
                          className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors bg-red-50 text-red-600 hover:bg-red-100"
                          type="button"
                        >
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                          Desactivar
                        </button>

                        <button
                          onClick={() => copiarAlPortapapeles(link.token)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                          type="button"
                        >
                          <Copy size={16} /> Copiar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}