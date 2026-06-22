import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, FileText, Image, FileSpreadsheet, File, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { uploadArchivos } from "../services/adjuntosService";

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

export default function AdjuntoUploader({
  mode = "upload",
  multiple = true,
  accept = "*",
  label = "Documentos adjuntos",
  placeholder = "Arrastra archivos aquí o haz clic para seleccionar",
  onFilesChange,
  onUploaded,
  initialFiles = [],
  initialLocalFiles,
  maxFiles = 15,
  className = "",
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState(initialFiles);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (mode === "local" && initialLocalFiles && initialLocalFiles.length > 0 && pendingFiles.length === 0) {
      setPendingFiles(initialLocalFiles);
    }
  }, []);

  const addLocalFiles = useCallback((newFiles) => {
    setPendingFiles((prev) => {
      const updated = multiple ? [...prev, ...newFiles].slice(0, maxFiles) : [newFiles[0]];
      onFilesChange?.(updated);
      return updated;
    });
  }, [multiple, maxFiles, onFilesChange]);

  const addUploadFiles = useCallback(async (newFiles) => {
    const placeholders = newFiles.map((f) => ({
      nombre: f.name,
      url: null,
      tipo: f.name.split(".").pop(),
      status: "uploading",
    }));

    setUploadedFiles((prev) => (multiple ? [...prev, ...placeholders].slice(0, maxFiles) : placeholders));

    try {
      const result = await uploadArchivos(newFiles);
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
  }, [multiple, maxFiles, onUploaded]);

  const processFiles = useCallback((rawFiles) => {
    const files = Array.from(rawFiles);
    if (!files.length) return;
    setUploadError("");

    if (mode === "local") {
      addLocalFiles(files);
    } else {
      addUploadFiles(files);
    }
  }, [mode, addLocalFiles, addUploadFiles]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const removeLocalFile = useCallback((idx) => {
    setPendingFiles((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      onFilesChange?.(updated);
      return updated;
    });
  }, [onFilesChange]);

  const removeUploadedFile = useCallback((idx) => {
    setUploadedFiles((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      onUploaded?.(updated.filter((f) => f.status === "done"));
      return updated;
    });
  }, [onUploaded]);

  const files = mode === "local" ? pendingFiles : uploadedFiles;
  const hasFiles = files.length > 0;
  const atLimit = files.length >= maxFiles;

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <span className="text-xs text-slate-400">{files.length}/{maxFiles}</span>
        </div>
      )}

      {!atLimit && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer
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
            onChange={(e) => { processFiles(e.target.files); e.target.value = ""; }}
          />
          <Upload className={`mx-auto mb-2 transition-colors ${isDragging ? "text-blue-500" : "text-slate-400"}`} size={24} />
          <p className="text-sm text-slate-600 font-medium">{placeholder}</p>
          <p className="text-xs text-slate-400 mt-1">
            {multiple ? `Hasta ${maxFiles} archivos` : "Un archivo"} · PDF, imágenes, Word, Excel
          </p>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />
          {uploadError}
        </div>
      )}

      {hasFiles && (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {files.map((file, idx) => {
            const nombre = file.nombre || file.name || "Archivo";
            const { Icon, color } = getFileIcon(nombre);
            const isUploading = file.status === "uploading";
            const isDone = mode === "local" ? true : file.status === "done";

            return (
              <div
                key={`${nombre}-${idx}`}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                  isUploading
                    ? "border-blue-200 bg-blue-50"
                    : isDone
                    ? "border-slate-200 bg-white"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className={`flex-shrink-0 ${color}`}>
                  {isUploading ? (
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                  ) : (
                    <Icon size={16} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{nombre}</p>
                  {file.size && (
                    <p className="text-[10px] text-slate-400">{formatSize(file.size)}</p>
                  )}
                </div>

                {isDone && !isUploading && (
                  <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                )}

                <button
                  type="button"
                  onClick={() => mode === "local" ? removeLocalFile(idx) : removeUploadedFile(idx)}
                  disabled={isUploading}
                  className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
