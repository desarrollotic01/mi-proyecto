import { X, FileText, Download, Eye, Paperclip } from "lucide-react";

const getFileIconColor = (extension = "") => {
  const ext = String(extension).toLowerCase();

  if (ext.includes("pdf")) return "text-red-600 bg-red-50 border-red-100";
  if (ext.includes("image")) return "text-blue-600 bg-blue-50 border-blue-100";
  if (ext.includes("word")) return "text-indigo-600 bg-indigo-50 border-indigo-100";
  if (ext.includes("excel") || ext.includes("sheet"))
    return "text-emerald-600 bg-emerald-50 border-emerald-100";

  return "text-slate-600 bg-slate-50 border-slate-200";
};

const construirUrlArchivo = (url) => {
  if (!url) return "#";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const base = import.meta.env.VITE_API_URL || "";
  return `${base}${url}`;
};

export default function AdjuntosEquipoModal({
  isOpen,
  onClose,
  equipo,
  adjuntos = [],
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase">
              Adjuntos del equipo
            </h2>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              {equipo?.nombre || "Equipo"} {equipo?.codigo ? `• ${equipo.codigo}` : ""}
            </p>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center"
          >
            <X size={18} className="text-slate-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {adjuntos.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <Paperclip className="mx-auto mb-3 text-slate-400" size={28} />
              <p className="text-slate-600 font-bold">
                Este equipo no tiene adjuntos visibles en el portal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adjuntos.map((adjunto) => {
                const archivoUrl = construirUrlArchivo(adjunto.url);

                return (
                  <div
                    key={adjunto.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl border flex items-center justify-center ${getFileIconColor(
                          adjunto.extension
                        )}`}
                      >
                        <FileText size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 uppercase break-words">
                          {adjunto.tituloPortal || adjunto.nombre || "Archivo"}
                        </p>

                        <p className="text-[11px] text-slate-500 font-semibold mt-1 break-words">
                          {adjunto.nombre || "-"}
                        </p>

                        {adjunto.descripcionPortal && (
                          <p className="text-sm text-slate-600 mt-3">
                            {adjunto.descripcionPortal}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {adjunto.categoria && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-slate-50 text-slate-500 border-slate-200 uppercase">
                              {adjunto.categoria}
                            </span>
                          )}

                          {adjunto.extension && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-slate-50 text-slate-500 border-slate-200 uppercase">
                              {adjunto.extension}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={archivoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-600 text-white text-[11px] font-black uppercase hover:bg-gray-700 transition-all"
                      >
                        <Eye size={14} />
                        Ver archivo
                      </a>

                      <a
                        href={archivoUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[11px] font-black uppercase hover:bg-slate-50 transition-all"
                      >
                        <Download size={14} />
                        Descargar
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}