import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image, FileSpreadsheet, File, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { uploadArchivos, getExtension } from "../services/adjuntosService";

/* ── Icono por extensión ── */
function getFileIcon(filename) {
  const ext = filename?.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { Icon: FileText, color: "text-red-500" };
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return { Icon: Image, color: "text-blue-500" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { Icon: FileSpreadsheet, color: "text-emerald-500" };
  if (["doc", "docx"].includes(ext)) return { Icon: FileText, color: "text-indigo-500" };
  return { Icon: File, color: "text-slate-400" };
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * AdjuntoUploader — uploader de archivos con 2 modos:
 *
 * mode="local"  → no sube inmediatamente; llama onFilesChange(File[])
 *                 Úsalo cuando el formulario padre maneja el upload (FormData)
 *
 * mode="upload" → sube inmediatamente al servidor y llama onUploaded([{nombre,url,tipo}])
 *                 Úsalo cuando necesitas URLs persistentes antes de guardar el form
 */
export default function AdjuntoUploader({
  mode = "upload",
  multiple = true,
  accept = "*",
  label = "Documentos adjuntos",
  placeholder = "Arrastra archivos aquí o haz clic para seleccionar",
  onFilesChange,    // mode=local → File[]
  onUploaded,       // mode=upload → [{nombre,url,tipo}]
  initialFiles = [], // adjuntos ya guardados [{nombre,url,tipo}] para mostrar
  maxFiles = 10,
  className = "",
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]); // File[] (local mode)
  const [uploadedFiles, setUploadedFiles] = useState(initialFiles); // {nombre,url,tipo,status}[]
  const [uploadError, setUploadError] = useState("");

  /* ── Procesa archivos seleccionados ── */
  const processFiles = useCallback(async (rawFiles) => {
    const files = Array.from(rawFiles);
    if (!files.length) return;
    setUploadError("");

    if (mode === "local") {
      const updated = multiple ? [...pendingFiles, ...files].slice(0, maxFiles) : [files[0]];
      setPendingFiles(updated);
      onFilesChange?.(updated);
      return;
    }

    // mode="upload" → subir inmediatamente
    const placeholders = files.map((f) => ({
      nombre: f.name,
      url: null,
      tipo: f.name.split(".").pop(),
      status: "uploading",
      _file: f,
    }));
    setUploadedFiles((prev) => (multiple ? [...prev, ...placeholders].slice(0, maxFiles) : placeholders));

    try {
      const result = await uploadArchivos(files);
      setUploadedFiles((prev) => {
        const withoutPlaceholders = prev.filter((f) => f.status !== "uploading");
        const uploaded = result.map((r) => ({ ...r, status: "done" }));
        const next = multiple ? [...withoutPlaceholders, ...uploaded] : uploaded;
        onUploaded?.(next.filter((f) => f.status === "done"));
        return next;
      });
    } catch {
      setUploadError("Error al subir archivos. Intenta de nuevo.");
      setUploadedFiles((prev) => prev.filter((f) => f.status !== "uploading"));
    }
  }, [mode, multiple, maxFiles, pendingFiles, onFilesChange, onUploaded]);

  /* ── Drag & Drop ── */
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  /* ── Eliminar archivo ── */
  const removeLocalFile = (idx) => {
    const updated = pendingFiles.filter((_, i) => i !== idx);
    setPendingFiles(updated);
    onFilesChange?.(updated);
  };

  const removeUploadedFile = (idx) => {
    const updated = uploadedFiles.filter((_, i) => i !== idx);
    setUploadedFiles(updated);
    onUploaded?.(updated.filter((f) => f.status === "done"));
  };

  const files = mode === "local" ? pendingFiles : uploadedFiles;
  const hasFiles = files.length > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <p className="text-sm font-semibold text-slate-700">{label}</p>
      )}

      {/* Zona de drop */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer
          transition-all duration-200 select-none
          ${isDragging
            ? "border-blue-500 bg-blue-50 scale-[1.01]"
            : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
        <Upload className={`mx-auto mb-2 transition-colors ${isDragging ? "text-blue-500" : "text-slate-400"}`} size={28} />
        <p className="text-sm text-slate-600 font-medium">{placeholder}</p>
        <p className="text-xs text-slate-400 mt-1">
          {multiple ? `Hasta ${maxFiles} archivos` : "Un archivo"} · PDF, imágenes, Word, Excel
        </p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          className="mt-3 px-4 py-1.5 text-sm font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors inline-block"
        >
          Seleccionar archivos
        </button>
      </div>

      {/* Error */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />
          {uploadError}
        </div>
      )}

      {/* Lista de archivos */}
      {hasFiles && (
        <div className="space-y-2">
          {files.map((file, idx) => {
            const nombre = file.nombre || file.name || "Archivo";
            const { Icon, color } = getFileIcon(nombre);
            const isUploading = file.status === "uploading";
            const isDone = mode === "local" ? true : file.status === "done";

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isUploading
                    ? "border-blue-200 bg-blue-50"
                    : isDone
                    ? "border-slate-200 bg-white"
                    : "border-red-200 bg-red-50"
                }`}
              >
                {/* Icono */}
                <div className={`flex-shrink-0 ${color}`}>
                  {isUploading ? (
                    <Loader2 size={18} className="animate-spin text-blue-500" />
                  ) : (
                    <Icon size={18} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{nombre}</p>
                  {file.size && (
                    <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
                  )}
                  {isUploading && (
                    <p className="text-xs text-blue-500 font-medium">Subiendo...</p>
                  )}
                </div>

                {/* Estado */}
                {isDone && !isUploading && (
                  <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                )}

                {/* Eliminar */}
                <button
                  type="button"
                  onClick={() => mode === "local" ? removeLocalFile(idx) : removeUploadedFile(idx)}
                  disabled={isUploading}
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
