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
  Users,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

import {
  esEquipoRegistro,
  getEstadoBadgeColor,
  getRegistroLabel,
  getRegistroNombre,
  getRegistroSubtitulo,
} from "../helpers/otHelpers";

import OTActividadPreventivaItem, {
  OTActividadesPreventivasHeader,
} from "./OTActividadPreventivaItem";
import OTActividadCorrectivaItem, {
  OTActividadesCorrectivasHeader,
} from "./OTActividadCorrectivaItem";

// ─── Selector de trabajadores con búsqueda ────────────────────────────────────
function TrabajadoresSelector({ trabajadores, seleccionados, encargadoId, errors, onChange }) {
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState(false);

  const filtrados = trabajadores.filter((t) => {
    const q = busqueda.toLowerCase();
    return (
      t.nombre?.toLowerCase().includes(q) ||
      t.empresa?.toLowerCase().includes(q)
    );
  });

  const toggle = (id) => {
    const current = new Set(seleccionados);
    if (current.has(id)) {
      current.delete(id);
      onChange(Array.from(current), encargadoId === id ? null : encargadoId);
    } else {
      current.add(id);
      onChange(Array.from(current), encargadoId);
    }
  };

  const setEncargado = (id) => {
    if (!seleccionados.includes(id)) return;
    onChange(seleccionados, encargadoId === id ? null : id);
  };

  // Seleccionados siempre arriba
  const ordenados = [
    ...filtrados.filter((t) => seleccionados.includes(t.id)),
    ...filtrados.filter((t) => !seleccionados.includes(t.id)),
  ];

  const VISIBLE_SIN_EXPANDIR = 8;
  const mostrados = expandido ? ordenados : ordenados.slice(0, VISIBLE_SIN_EXPANDIR);
  const hayMas = ordenados.length > VISIBLE_SIN_EXPANDIR;

  const errorMsg = errors?.trabajadores || errors?.encargado;

  return (
    <div>
      {/* Buscador */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nombre o empresa..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </div>

      {/* Resumen de seleccionados */}
      {seleccionados.length > 0 && (
        <div className="mb-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
          <span className="font-medium">{seleccionados.length}</span> asignado{seleccionados.length !== 1 ? "s" : ""}.
          {encargadoId
            ? <> Líder: <span className="font-medium">{trabajadores.find((t) => t.id === encargadoId)?.nombre ?? "—"}</span></>
            : <span className="text-amber-600"> Sin líder asignado.</span>
          }
        </div>
      )}

      {/* Tabla */}
      <div className={`rounded-xl border overflow-hidden ${errorMsg ? "border-red-300" : "border-slate-200"}`}>
        <div className="grid grid-cols-[1fr_64px_64px] bg-slate-50 border-b border-slate-200">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Trabajador
          </div>
          <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">
            Asignar
          </div>
          <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">
            Líder
          </div>
        </div>

        {trabajadores.length === 0 && (
          <div className="px-3 py-4 text-sm text-slate-400 text-center">
            No hay trabajadores disponibles
          </div>
        )}

        {mostrados.length === 0 && busqueda && (
          <div className="px-3 py-4 text-sm text-slate-400 text-center">
            Sin resultados para "{busqueda}"
          </div>
        )}

        {mostrados.map((t) => {
          const asignado = seleccionados.includes(t.id);
          const esLider = encargadoId === t.id;
          return (
            <div
              key={t.id}
              className={`grid grid-cols-[1fr_64px_64px] items-center border-b border-slate-100 last:border-b-0 transition-colors ${
                asignado ? "bg-white" : "bg-slate-50/40"
              }`}
            >
              <div className="px-3 py-2.5">
                <p className={`text-sm ${asignado ? "text-slate-900 font-medium" : "text-slate-500"}`}>
                  {t.nombre}
                </p>
                {t.empresa && (
                  <p className="text-xs text-slate-400">{t.empresa}</p>
                )}
              </div>
              <div className="flex justify-center">
                <input
                  type="checkbox"
                  checked={asignado}
                  onChange={() => toggle(t.id)}
                  className="w-4 h-4 rounded border-slate-300 accent-slate-800 cursor-pointer"
                />
              </div>
              <div className="flex justify-center">
                <input
                  type="radio"
                  checked={esLider}
                  disabled={!asignado}
                  onChange={() => setEncargado(t.id)}
                  className="w-4 h-4 accent-slate-800 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Expandir / colapsar */}
      {hayMas && (
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
        >
          {expandido ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Mostrar menos</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Ver {ordenados.length - VISIBLE_SIN_EXPANDIR} más</>
          )}
        </button>
      )}

      {errorMsg && <FieldError message={errorMsg} />}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
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
  onOpenObservacion,
  onOpenDescripcion,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

      {/* ── Cabecera oscura ── */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-900">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 bg-white/15 text-white rounded-xl font-bold shrink-0 text-sm">
            {index + 1}
          </div>
          <div className="min-w-0">
            <h5 className="text-base font-semibold text-white leading-tight">
              {getRegistroNombre(registro)}
            </h5>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              {esEquipoRegistro(registro)
                ? <Package className="w-3.5 h-3.5" />
                : <MapPin className="w-3.5 h-3.5" />}
              {getRegistroLabel(registro)} · {getRegistroSubtitulo(registro)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {esEquipoRegistro(registro) && (
            <button
              onClick={() => onOpenDetalleEquipo?.(registro.equipoId)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              type="button"
            >
              <Eye className="w-3.5 h-3.5" />
              Ver detalles
            </button>
          )}
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getEstadoBadgeColor(registro.estado)}`}>
            {registro.estado}
          </span>
        </div>
      </div>

      {/* ── Secciones divididas por línea ── */}
      <div className="divide-y divide-slate-100">

        {/* Descripción */}
        <Section title="Descripción del trabajo">
          <Label>
            Descripción <span className="text-red-500">*</span>
          </Label>
          <textarea
            value={
              esEquipoRegistro(registro)
                ? registro.descripcionEquipo
                : registro.descripcionUbicacion
            }
            onChange={(e) =>
              onRegistroChange(
                esEquipoRegistro(registro) ? "descripcionEquipo" : "descripcionUbicacion",
                e.target.value
              )
            }
            rows={3}
            className={textareaClass(errors[`equipo_${index}_descripcion`])}
          />
          <FieldError message={errors[`equipo_${index}_descripcion`]} />
        </Section>

        {/* Prioridad */}
        <Section title="Prioridad">
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
        </Section>

        {/* Plan de mantenimiento — solo preventivo */}
        {esPreventivo && (
          <Section title="Plan de mantenimiento">
            {cargandoPlanes && planes.length === 0 && !registro.planMantenimientoId && (
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Cargando planes...
              </div>
            )}
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
              <p className="mt-1.5 text-xs text-slate-500">
                Este registro no tiene planes asociados.
              </p>
            )}
            <FieldError message={errors[`equipo_${index}_plan`]} />
          </Section>
        )}

        {/* Programación */}
        <Section title="Programación">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>
                Inicio programado <span className="text-red-500">*</span>
              </Label>
              <input
                type="datetime-local"
                value={registro.fechaInicioProgramada}
                onChange={(e) => onRegistroChange("fechaInicioProgramada", e.target.value)}
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
        </Section>

        {/* Asignación de personal */}
        <Section
          title="Asignación de personal"
          subtitle="Marca los trabajadores a asignar y selecciona el líder."
          icon={<Users className="w-4 h-4 text-slate-400" />}
        >
          <TrabajadoresSelector
            trabajadores={trabajadores}
            seleccionados={registro.trabajadoresAsignados || []}
            encargadoId={registro.encargadoId}
            errors={{
              trabajadores: errors[`equipo_${index}_trabajadores`],
              encargado: errors[`equipo_${index}_encargado`],
            }}
            onChange={(nuevos, nuevoLider) => {
              onRegistroChange("trabajadoresAsignados", nuevos);
              onRegistroChange("encargadoId", nuevoLider);
            }}
          />
        </Section>

        {/* Actividades */}
        <Section
          title="Actividades"
          subtitle={
            esPreventivo
              ? "Solo puedes editar duración, unidad, técnicos y observaciones."
              : "Actividades completamente editables."
          }
          icon={<ListChecks className="w-4 h-4 text-slate-400" />}
          action={
            esCorrectivo && (
              <button
                type="button"
                onClick={onAddActividad}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition border border-slate-900"
              >
                + Agregar actividad
              </button>
            )
          }
        >
          {errors[`equipo_${index}_acts`] && (
            <div className="mb-3">
              <FieldError message={errors[`equipo_${index}_acts`]} />
            </div>
          )}

          {(registro.actividadesOT || []).length === 0 ? (
            <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <AlertCircle className="w-7 h-7 mx-auto mb-2 opacity-25" />
              <p className="text-sm">
                {esPreventivo
                  ? "Selecciona un plan para cargar actividades."
                  : "No hay actividades. Agrega una."}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              {esPreventivo
                ? <OTActividadesPreventivasHeader />
                : <OTActividadesCorrectivasHeader />
              }
              {(registro.actividadesOT || []).map((act, actIdx) =>
                esPreventivo ? (
                  <OTActividadPreventivaItem
                    key={act.id || actIdx}
                    act={act}
                    index={actIdx}
                    onChange={(field, value) => onActividadChange(actIdx, field, value)}
                    onOpenObservacion={() => onOpenObservacion?.(actIdx)}
                    onOpenDescripcion={() => onOpenDescripcion?.(actIdx)}
                  />
                ) : (
                  <OTActividadCorrectivaItem
                    key={act.id || actIdx}
                    act={act}
                    index={actIdx}
                    onChange={(field, value) => onActividadChange(actIdx, field, value)}
                    onDelete={() => onRemoveActividad(actIdx)}
                    onOpenObservacion={() => onOpenObservacion?.(actIdx)}
                    onOpenDescripcion={() => onOpenDescripcion?.(actIdx)}
                  />
                )
              )}
            </div>
          )}
        </Section>

        {/* Adjuntos — siempre al final */}
        <Section
          title="Adjuntos"
          subtitle="Archivos del equipo o ubicación técnica."
          icon={<Upload className="w-4 h-4 text-slate-400" />}
        >
          <label className="flex items-center justify-center gap-2 w-full py-3 px-4 border border-slate-300 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition text-sm text-slate-600 font-medium">
            <Upload className="w-4 h-4 text-slate-400" />
            Seleccionar archivos
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onUploadAdjuntos(e.target.files)}
            />
          </label>

          {registro.subiendoAdjuntos && (
            <div className="mt-3 flex items-center gap-2 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Subiendo adjuntos...</p>
            </div>
          )}

          {(registro.adjuntos || []).length > 0 && (
            <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
              {(registro.adjuntos || []).map((file, i) => (
                <div
                  key={file.id || i}
                  className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700 truncate">
                      {file.nombre || file.filename || "Archivo"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveAdjunto(i)}
                    className="ml-2 shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, subtitle, icon, action, children }) {
  return (
    <div className="px-6 py-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}
    </label>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </p>
  );
}

function inputClass(hasError) {
  return `w-full px-3 py-2.5 border rounded-xl bg-white text-sm text-slate-800 ${
    hasError ? "border-red-400 bg-red-50" : "border-slate-300"
  } focus:outline-none focus:ring-2 focus:ring-slate-200`;
}

function textareaClass(hasError) {
  return `w-full px-3 py-3 border rounded-xl bg-white text-sm text-slate-800 resize-none ${
    hasError ? "border-red-400 bg-red-50" : "border-slate-300"
  } focus:outline-none focus:ring-2 focus:ring-slate-200`;
}