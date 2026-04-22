import { FileText, Download, Eye, Paperclip, Image, FileSpreadsheet, File } from "lucide-react";
import { construirUrlArchivo, getExtension } from "../services/adjuntosService";

/* ── Icono y colores por tipo de archivo ── */
function getFileStyle(adjunto) {
  const ext = getExtension(adjunto);
  if (["pdf"].includes(ext))
    return { icon: FileText, color: "text-red-600 bg-red-50 border-red-200" };
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext))
    return { icon: Image, color: "text-blue-600 bg-blue-50 border-blue-200" };
  if (["xls", "xlsx", "csv"].includes(ext))
    return { icon: FileSpreadsheet, color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  if (["doc", "docx"].includes(ext))
    return { icon: FileText, color: "text-indigo-600 bg-indigo-50 border-indigo-200" };
  return { icon: File, color: "text-slate-500 bg-slate-50 border-slate-200" };
}

/* ── Formatea tamaño de archivo ── */
function formatSize(bytes) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/* ── Tarjeta individual de documento ── */
function AdjuntoCard({ adjunto }) {
  const { icon: Icon, color } = getFileStyle(adjunto);
  const url = construirUrlArchivo(adjunto.url);
  const ext = getExtension(adjunto);
  const nombre = adjunto.tituloPortal || adjunto.nombre || "Archivo";
  const nombreOriginal = adjunto.tituloPortal ? adjunto.nombre : null;
  const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);

  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Preview para imágenes */}
      {isImage && url !== "#" && (
        <div className="h-28 bg-slate-50 border-b border-slate-100 overflow-hidden">
          <img
            src={url}
            alt={nombre}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col gap-2">
        {/* Icono + nombre */}
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate" title={nombre}>{nombre}</p>
            {nombreOriginal && (
              <p className="text-[11px] text-slate-400 truncate" title={nombreOriginal}>{nombreOriginal}</p>
            )}
          </div>
        </div>

        {/* Descripción */}
        {adjunto.descripcionPortal && (
          <p className="text-xs text-slate-600 leading-relaxed">{adjunto.descripcionPortal}</p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          {ext && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-slate-50 text-slate-500 border-slate-200">
              {ext}
            </span>
          )}
          {adjunto.categoria && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-blue-50 text-blue-600 border-blue-200">
              {adjunto.categoria}
            </span>
          )}
          {adjunto.size && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-400 border border-slate-100">
              {formatSize(adjunto.size)}
            </span>
          )}
        </div>
      </div>

      {/* Botones */}
      {url !== "#" && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            <Eye size={12} />
            Ver
          </a>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            download
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Download size={12} />
            Descargar
          </a>
        </div>
      )}
    </div>
  );
}

/* ── Componente principal ── */
export default function AdjuntosViewer({
  adjuntos = [],
  titulo = "Documentos adjuntos",
  emptyMessage = "No hay documentos adjuntos.",
  className = "",
  compact = false,
}) {
  if (!Array.isArray(adjuntos) || adjuntos.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center ${className}`}>
        <Paperclip className="mx-auto mb-3 text-slate-300" size={28} />
        <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {titulo && (
        <div className="flex items-center gap-2 mb-3">
          <Paperclip size={15} className="text-slate-400" />
          <span className="text-sm font-bold text-slate-700">{titulo}</span>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{adjuntos.length}</span>
        </div>
      )}
      <div className={compact
        ? "space-y-2"
        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      }>
        {adjuntos.map((adj, i) => (
          compact ? (
            <CompactAdjuntoRow key={adj.id ?? adj.url ?? i} adjunto={adj} />
          ) : (
            <AdjuntoCard key={adj.id ?? adj.url ?? i} adjunto={adj} />
          )
        ))}
      </div>
    </div>
  );
}

/* ── Versión compacta (fila) ── */
function CompactAdjuntoRow({ adjunto }) {
  const { icon: Icon, color } = getFileStyle(adjunto);
  const url = construirUrlArchivo(adjunto.url);
  const ext = getExtension(adjunto);
  const nombre = adjunto.tituloPortal || adjunto.nombre || "Archivo";

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{nombre}</p>
        {ext && <p className="text-[10px] text-slate-400 uppercase">{ext}</p>}
      </div>
      {url !== "#" && (
        <div className="flex gap-1.5 flex-shrink-0">
          <a href={url} target="_blank" rel="noreferrer"
            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white transition-colors">
            <Eye size={13} />
          </a>
          <a href={url} target="_blank" rel="noreferrer" download
            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors">
            <Download size={13} />
          </a>
        </div>
      )}
    </div>
  );
}
