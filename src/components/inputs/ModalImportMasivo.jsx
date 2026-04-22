import { useState, useRef } from "react";
import {
  X,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Loader2,
  Users,
  Settings,
  MapPinned,
} from "lucide-react";
import api from "../../services/api";

const ENTIDADES = [
  {
    key: "trabajadores",
    label: "Trabajadores",
    icon: Users,
    color: "blue",
    descripcion: "nombre, apellido, dni, rol, empresa, zona, dirección, etc.",
  },
  {
    key: "equipos",
    label: "Equipos",
    icon: Settings,
    color: "violet",
    descripcion: "código, nombre, OV, cliente, país, tipo, marca, modelo, etc.",
  },
  {
    key: "ubicaciones",
    label: "Ubicaciones Técnicas",
    icon: MapPinned,
    color: "emerald",
    descripcion: "código, nombre, OV, cliente, país, especialidad, etc.",
  },
];

const COLOR_MAP = {
  blue: {
    ring: "ring-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "bg-blue-600",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    btn: "bg-blue-600 hover:bg-blue-700",
  },
  violet: {
    ring: "ring-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-200",
    icon: "bg-violet-600",
    text: "text-violet-700",
    badge: "bg-violet-100 text-violet-700 border-violet-200",
    btn: "bg-violet-600 hover:bg-violet-700",
  },
  emerald: {
    ring: "ring-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "bg-emerald-600",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    btn: "bg-emerald-600 hover:bg-emerald-700",
  },
};

export default function ModalImportMasivo({ isOpen, onClose, entidadInicial = null, onSuccess }) {
  const [entidad, setEntidad] = useState(entidadInicial);
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const fileRef = useRef();

  if (!isOpen) return null;

  const entidadInfo = ENTIDADES.find((e) => e.key === entidad);
  const colores = entidad ? COLOR_MAP[entidadInfo.color] : null;

  const resetear = () => {
    setArchivo(null);
    setResultado(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    resetear();
    if (!entidadInicial) setEntidad(null);
    onClose();
  };

  const handleArchivoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivo(file);
    setResultado(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setArchivo(file);
    setResultado(null);
  };

  const descargarPlantilla = async () => {
    if (!entidad) return;
    setDescargando(true);
    try {
      const res = await api.get(`/import-masivo/plantilla/${entidad}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      const nombres = {
        trabajadores: "plantilla_trabajadores.xlsx",
        equipos: "plantilla_equipos.xlsx",
        ubicaciones: "plantilla_ubicaciones_tecnicas.xlsx",
      };
      a.download = nombres[entidad];
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al descargar la plantilla");
    } finally {
      setDescargando(false);
    }
  };

  const importar = async () => {
    if (!archivo || !entidad) return;
    setCargando(true);
    setResultado(null);
    try {
      const form = new FormData();
      form.append("archivo", archivo);
      const res = await api.post(`/import-masivo/${entidad}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultado(res.data);
      if (res.data.exitosos?.length > 0) onSuccess?.();
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Error al importar";
      setResultado({ error: msg });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200">

        {/* Header */}
        <div className="px-6 py-5 border-b bg-slate-50 flex items-center justify-between shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Carga Masiva por Excel</h2>
              <p className="text-xs text-slate-500">
                {entidadInfo ? entidadInfo.descripcion : "Selecciona el tipo de datos a importar"}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Paso 1: Selección de entidad — solo visible si no viene pre-fijada */}
          {!entidadInicial && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                1. ¿Qué deseas importar?
              </p>
              <div className="grid grid-cols-3 gap-3">
                {ENTIDADES.map((e) => {
                  const c = COLOR_MAP[e.color];
                  const Icon = e.icon;
                  const sel = entidad === e.key;
                  return (
                    <button
                      key={e.key}
                      onClick={() => { setEntidad(e.key); resetear(); }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                        sel
                          ? `${c.bg} ${c.border} ${c.ring} ring-2`
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${sel ? c.icon : "bg-slate-100"}`}>
                        <Icon className={`w-5 h-5 ${sel ? "text-white" : "text-slate-500"}`} />
                      </div>
                      <span className={`text-sm font-semibold ${sel ? c.text : "text-slate-700"}`}>
                        {e.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {entidad && (
            <>
              {/* Paso 2: Descargar plantilla */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  {entidadInicial ? "1" : "2"}. Descarga la plantilla y llénala
                </p>
                <div className={`flex items-center justify-between p-4 rounded-xl border ${colores.border} ${colores.bg}`}>
                  <div>
                    <p className={`text-sm font-semibold ${colores.text}`}>
                      Plantilla de {entidadInfo.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Incluye cabeceras, ejemplo y hoja con valores válidos.
                      Las columnas con <span className="text-violet-600 font-semibold">* (morado)</span> son obligatorias.
                    </p>
                  </div>
                  <button
                    onClick={descargarPlantilla}
                    disabled={descargando}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-60 ${colores.btn}`}
                  >
                    {descargando ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Descargar
                  </button>
                </div>
              </div>

              {/* Paso 3: Subir archivo */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  {entidadInicial ? "2" : "3"}. Sube el archivo con los datos
                </p>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    archivo
                      ? `${colores.border} ${colores.bg}`
                      : "border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-white"
                  }`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleArchivoChange}
                  />
                  {archivo ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileSpreadsheet className={`w-6 h-6 ${colores.text}`} />
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${colores.text}`}>{archivo.name}</p>
                        <p className="text-xs text-slate-500">{(archivo.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); resetear(); }}
                        className="ml-2 p-1 rounded-lg hover:bg-white text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600">
                        Arrastra el archivo aquí o <span className="underline">haz clic</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Solo archivos .xlsx</p>
                    </>
                  )}
                </div>
              </div>

              {/* Resultado */}
              {resultado && (
                <div className="space-y-3">
                  {resultado.error ? (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-700 font-medium">{resultado.error}</p>
                    </div>
                  ) : (
                    <>
                      {/* Resumen */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                          <p className="text-2xl font-black text-slate-900">{resultado.total}</p>
                          <p className="text-xs text-slate-500 font-medium">Filas procesadas</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-200">
                          <p className="text-2xl font-black text-emerald-600">{resultado.exitosos?.length ?? 0}</p>
                          <p className="text-xs text-emerald-600 font-medium">Importados OK</p>
                        </div>
                        <div className={`p-3 rounded-xl text-center border ${resultado.errores?.length ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
                          <p className={`text-2xl font-black ${resultado.errores?.length ? "text-red-600" : "text-slate-400"}`}>
                            {resultado.errores?.length ?? 0}
                          </p>
                          <p className={`text-xs font-medium ${resultado.errores?.length ? "text-red-600" : "text-slate-400"}`}>
                            Con errores
                          </p>
                        </div>
                      </div>

                      {/* Filas con error */}
                      {resultado.errores?.length > 0 && (
                        <div className="border border-red-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <p className="text-sm font-semibold text-red-700">
                              Filas que no se importaron
                            </p>
                          </div>
                          <div className="max-h-52 overflow-y-auto divide-y divide-red-100">
                            {resultado.errores.map((e, i) => (
                              <div key={i} className="px-4 py-2.5 flex gap-3 items-start">
                                <span className="shrink-0 text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200">
                                  Fila {e.fila}
                                </span>
                                <ul className="flex-1">
                                  {e.errores.map((err, j) => (
                                    <li key={j} className="text-xs text-red-700">• {err}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resumen de valores no encontrados */}
                      {resultado.resumenNoEncontrados && Object.keys(resultado.resumenNoEncontrados).length > 0 && (
                        <div className="border border-amber-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <p className="text-sm font-semibold text-amber-700">
                              Valores no encontrados — se importaron con campo vacío
                            </p>
                          </div>
                          <div className="p-4 space-y-3">
                            <p className="text-xs text-amber-700 font-medium">
                              Puedes corregirlos en tu Excel con Ctrl+H (Buscar y Reemplazar) y volver a importar.
                            </p>
                            {Object.entries(resultado.resumenNoEncontrados).map(([campo, info]) => (
                              <div key={campo}>
                                <p className="text-xs font-bold text-amber-800 uppercase mb-1">{campo} no encontrados:</p>
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {info.valores.map((v, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-mono rounded border border-red-200">"{v}"</span>
                                  ))}
                                </div>
                                <p className="text-xs text-slate-500">
                                  Disponibles: <span className="font-medium text-slate-700">{info.disponibles.join(", ")}</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Filas exitosas */}
                      {resultado.exitosos?.length > 0 && (
                        <div className="border border-emerald-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <p className="text-sm font-semibold text-emerald-700">
                              Registros importados ({resultado.exitosos.length})
                            </p>
                          </div>
                          <div className="max-h-40 overflow-y-auto divide-y divide-emerald-50">
                            {resultado.exitosos.map((e, i) => (
                              <div key={i} className={`px-4 py-2 flex items-center gap-2 ${e.advertencias?.length ? "bg-amber-50/50" : ""}`}>
                                <span className="text-xs font-bold text-slate-400 shrink-0">Fila {e.fila}</span>
                                <span className={`text-xs font-medium ${e.advertencias?.length ? "text-amber-700" : "text-emerald-700"}`}>{e.detalle}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white flex justify-between items-center shrink-0 rounded-b-2xl">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Cerrar
          </button>
          {entidad && archivo && !resultado && (
            <button
              onClick={importar}
              disabled={cargando}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-60 ${colores.btn}`}
            >
              {cargando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importar
                </>
              )}
            </button>
          )}
          {resultado && !resultado.error && (
            <button
              onClick={resetear}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition ${colores.btn}`}
            >
              <Upload className="w-4 h-4" />
              Importar otro archivo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
