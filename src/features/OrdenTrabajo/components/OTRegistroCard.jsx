// components/OTRegistroCard.jsx
import {
  Eye,
  Package,
  MapPin,
  AlertCircle,
  Upload,
  FileText,
  Trash2,
  ListChecks,
} from "lucide-react";

import {
  esEquipoRegistro,
  getEstadoBadgeColor,
  getRegistroId,
  getRegistroLabel,
  getRegistroNombre,
  getRegistroSubtitulo,
} from "../helpers/otHelpers";

import OTActividadPreventivaItem from "./OTActividadPreventivaItem";
import OTActividadCorrectivaItem from "./OTActividadCorrectivaItem";

export default function OTRegistroCard({
  registro,
  index,
  planes = [],
  cargandoPlanes = false,
  trabajadores = [],
  errors = {},
  esPreventivo = false,
  esCorrectivo = false,
  onOpenDetalleEquipo,
  onRegistroChange,
  onSeleccionarPlan,
  onUploadAdjuntos,
  onRemoveAdjunto,
  onAddActividad,
  onActividadChange,
  onRemoveActividad,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 bg-slate-900 text-white rounded-xl font-bold shrink-0">
            {index + 1}
          </div>

          <div className="min-w-0">
            <h5 className="text-lg font-semibold text-slate-900">
              {getRegistroNombre(registro)}
            </h5>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              {esEquipoRegistro(registro) ? (
                <Package className="w-4 h-4" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              {getRegistroLabel(registro)} · {getRegistroSubtitulo(registro)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {esEquipoRegistro(registro) && (
            <button
              onClick={() => onOpenDetalleEquipo?.(registro.equipoId)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition"
              type="button"
            >
              <Eye className="w-4 h-4" />
              Ver Detalles
            </button>
          )}

          <span
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getEstadoBadgeColor(
              registro.estado
            )}`}
          >
            {registro.estado}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
            <Label>
              Descripción del Trabajo <span className="text-red-500">*</span>
            </Label>
            <textarea
              value={
                esEquipoRegistro(registro)
                  ? registro.descripcionEquipo
                  : registro.descripcionUbicacion
              }
              onChange={(e) =>
                onRegistroChange(
                  esEquipoRegistro(registro)
                    ? "descripcionEquipo"
                    : "descripcionUbicacion",
                  e.target.value
                )
              }
              rows={3}
              className={textareaClass(errors[`equipo_${index}_descripcion`])}
            />
            <FieldError message={errors[`equipo_${index}_descripcion`]} />
          </div>

          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <Label>Prioridad</Label>
            <select
              value={registro.prioridad}
              onChange={(e) => onRegistroChange("prioridad", e.target.value)}
              className={inputClass()}
            >
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="CRITICA">Crítica</option>
            </select>
          </div>

          {esPreventivo && (
            <div className="rounded-xl border border-emerald-200 p-4 bg-emerald-50">
              <Label>
                Plan de Mantenimiento <span className="text-red-500">*</span>
              </Label>

              {cargandoPlanes && planes.length === 0 && !registro.planMantenimientoId ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Cargando planes...
                </div>
              ) : null}

              <select
                value={registro.planMantenimientoId || ""}
                onChange={(e) => onSeleccionarPlan(e.target.value)}
                className={inputClass(errors[`equipo_${index}_plan`])}
              >
                <option value="">— Seleccione un plan —</option>
                {planes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {(p.codigoPlan ? `${p.codigoPlan} — ` : "") + (p.nombre || "Plan")}
                  </option>
                ))}
              </select>

              {planes.length === 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  Este registro no tiene planes asociados.
                </p>
              )}

              <FieldError message={errors[`equipo_${index}_plan`]} />
            </div>
          )}

          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <p className="text-sm font-semibold text-slate-900 mb-3">
              Asignación de Personal
            </p>

            <Label>
              Trabajadores <span className="text-red-500">*</span>
            </Label>

            <div
              className={`p-3 rounded-xl border bg-slate-50 ${
                errors[`equipo_${index}_trabajadores`] ? "border-red-300" : "border-slate-200"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {trabajadores.map((t) => {
                  const checked = (registro.trabajadoresAsignados || []).includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const current = new Set(registro.trabajadoresAsignados || []);
                          if (current.has(t.id)) current.delete(t.id);
                          else current.add(t.id);

                          const nuevos = Array.from(current);
                          let encargadoId = registro.encargadoId;
                          if (encargadoId && !current.has(encargadoId)) encargadoId = null;

                          onRegistroChange("trabajadoresAsignados", nuevos);
                          onRegistroChange("encargadoId", encargadoId);
                        }}
                        className="w-4 h-4"
                      />
                      <span>
                        {t.nombre}{" "}
                        <span className="text-xs text-slate-400">({t.empresa || "—"})</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <FieldError message={errors[`equipo_${index}_trabajadores`]} />

            <div className="mt-4">
              <Label>
                Encargado <span className="text-red-500">*</span>
              </Label>
              <select
                value={registro.encargadoId || ""}
                onChange={(e) => onRegistroChange("encargadoId", e.target.value)}
                className={inputClass(errors[`equipo_${index}_encargado`])}
              >
                <option value="">Seleccione encargado</option>
                {(registro.trabajadoresAsignados || []).map((id) => {
                  const t = trabajadores.find((x) => x.id === id);
                  if (!t) return null;
                  return (
                    <option key={id} value={id}>
                      {t.nombre} {t.empresa ? `- ${t.empresa}` : ""}
                    </option>
                  );
                })}
              </select>
              <FieldError message={errors[`equipo_${index}_encargado`]} />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <p className="text-sm font-semibold text-slate-900 mb-3">
              Programación por registro
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>
                  Inicio programado <span className="text-red-500">*</span>
                </Label>
                <input
                  type="datetime-local"
                  value={registro.fechaInicioProgramada}
                  onChange={(e) =>
                    onRegistroChange("fechaInicioProgramada", e.target.value)
                  }
                  className={inputClass(errors[`equipo_${index}_fechaInicioProgramada`])}
                />
                <FieldError message={errors[`equipo_${index}_fechaInicioProgramada`]} />
              </div>

              <div>
                <Label>
                  Fin programado <span className="text-red-500">*</span>
                </Label>
                <input
                  type="datetime-local"
                  value={registro.fechaFinProgramada}
                  onChange={(e) => onRegistroChange("fechaFinProgramada", e.target.value)}
                  className={inputClass(errors[`equipo_${index}_fechaFinProgramada`])}
                />
                <FieldError message={errors[`equipo_${index}_fechaFinProgramada`]} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-slate-600" />
              Adjuntos del registro
            </p>

            <input
              type="file"
              multiple
              onChange={(e) => onUploadAdjuntos(e.target.files)}
              className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white file:font-medium hover:file:bg-slate-800 cursor-pointer border border-dashed border-slate-300 rounded-xl p-3"
            />

            {registro.subiendoAdjuntos && (
              <div className="mt-3 flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-xl border border-blue-200">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Subiendo adjuntos...</p>
              </div>
            )}

            {(registro.adjuntos || []).length > 0 && (
              <div className="mt-3 space-y-2">
                {(registro.adjuntos || []).map((file, i) => (
                  <div
                    key={file.id || i}
                    className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-slate-700 shrink-0" />
                      <span className="text-sm text-slate-800 truncate">
                        {file.nombre || file.filename || "Archivo"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAdjunto(i)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-slate-600" />
                  Actividades
                  {(registro.actividadesOT || []).length > 0 && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                      {(registro.actividadesOT || []).length}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {esPreventivo
                    ? "Solo puedes editar duración, unidad, técnicos y observaciones."
                    : "Actividades completamente editables."}
                </p>
              </div>

              {esCorrectivo && (
                <button
                  type="button"
                  onClick={onAddActividad}
                  className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
                >
                  Agregar actividad
                </button>
              )}
            </div>

            <FieldError message={errors[`equipo_${index}_acts`]} />

            {(registro.actividadesOT || []).length === 0 ? (
              <div className="text-center py-8 text-slate-400 border border-dashed border-slate-300 rounded-xl">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {esPreventivo
                    ? "Selecciona un plan para cargar actividades."
                    : "No hay actividades. Agrega una."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(registro.actividadesOT || []).map((act, actIdx) =>
                  esPreventivo ? (
                    <OTActividadPreventivaItem
                      key={act.id || actIdx}
                      act={act}
                      index={actIdx}
                      onChange={(field, value) => onActividadChange(actIdx, field, value)}
                    />
                  ) : (
                    <OTActividadCorrectivaItem
                      key={act.id || actIdx}
                      act={act}
                      index={actIdx}
                      esCorrectivo={esCorrectivo}
                      onChange={(field, value) => onActividadChange(actIdx, field, value)}
                      onDelete={() => onRemoveActividad(actIdx)}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <label className="block text-sm font-medium text-slate-700 mb-2">{children}</label>;
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
      <AlertCircle className="w-4 h-4" /> {message}
    </p>
  );
}

function inputClass(hasError) {
  return `w-full px-4 py-2.5 border rounded-xl bg-white text-sm text-slate-800 ${
    hasError ? "border-red-400 bg-red-50" : "border-slate-300"
  } focus:outline-none focus:ring-2 focus:ring-slate-200`;
}

function textareaClass(hasError) {
  return `w-full px-4 py-3 border rounded-xl bg-white text-sm text-slate-800 resize-none ${
    hasError ? "border-red-400 bg-red-50" : "border-slate-300"
  } focus:outline-none focus:ring-2 focus:ring-slate-200`;
}