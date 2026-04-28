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
  X,
  UserCheck,
} from "lucide-react";
import { useState, useEffect } from "react";

import {
  esEquipoRegistro,
  esInstalacionRegistro,
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

// ─── Modal selector de trabajadores ──────────────────────────────────────────
function TrabajadoresModal({ isOpen, trabajadores, seleccionados, encargadoId, onClose, onConfirm }) {
  const [busqueda, setBusqueda] = useState("");
  const [tempSel, setTempSel] = useState([]);
  const [tempLider, setTempLider] = useState(null);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTempSel(seleccionados);
      setTempLider(encargadoId);
      setBusqueda("");
      setExpandido(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtrados = trabajadores.filter((t) => {
    const q = busqueda.toLowerCase();
    return (
      t.nombre?.toLowerCase().includes(q) ||
      t.empresa?.toLowerCase().includes(q)
    );
  });

  const toggle = (id) => {
    const current = new Set(tempSel);
    if (current.has(id)) {
      current.delete(id);
      setTempSel(Array.from(current));
      if (tempLider === id) setTempLider(null);
    } else {
      current.add(id);
      setTempSel(Array.from(current));
    }
  };

  const setLider = (id) => {
    if (!tempSel.includes(id)) return;
    setTempLider(tempLider === id ? null : id);
  };

  const ordenados = [
    ...filtrados.filter((t) => tempSel.includes(t.id)),
    ...filtrados.filter((t) => !tempSel.includes(t.id)),
  ];

  const VISIBLE = 10;
  const mostrados = expandido ? ordenados : ordenados.slice(0, VISIBLE);
  const hayMas = ordenados.length > VISIBLE;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[110] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-[#003087] rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-white" />
            <h3 className="text-base font-bold text-white">Seleccionar trabajadores</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition" type="button">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Summary bar */}
        {tempSel.length > 0 && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs text-slate-600 shrink-0">
            <UserCheck className="w-3.5 h-3.5 text-[#003087] shrink-0" />
            <span>
              <span className="font-semibold">{tempSel.length}</span> seleccionado{tempSel.length !== 1 ? "s" : ""}.
            </span>
            {tempLider ? (
              <span>
                Líder:{" "}
                <span className="font-semibold">
                  {trabajadores.find((t) => t.id === tempLider)?.nombre ?? "—"}
                </span>
              </span>
            ) : (
              <span className="text-amber-600">Sin líder asignado.</span>
            )}
          </div>
        )}

        {/* Search */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre o empresa..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="px-5 pb-2 flex-1 overflow-y-auto">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-[1fr_64px_64px] bg-slate-50 border-b border-slate-200">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trabajador</div>
              <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Asignar</div>
              <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Líder</div>
            </div>

            {trabajadores.length === 0 && (
              <div className="px-3 py-6 text-sm text-slate-400 text-center">
                No hay trabajadores disponibles
              </div>
            )}
            {mostrados.length === 0 && busqueda && (
              <div className="px-3 py-6 text-sm text-slate-400 text-center">
                Sin resultados para &ldquo;{busqueda}&rdquo;
              </div>
            )}

            {mostrados.map((t) => {
              const asignado = tempSel.includes(t.id);
              const esLider = tempLider === t.id;
              return (
                <div
                  key={t.id}
                  className={`grid grid-cols-[1fr_64px_64px] items-center border-b border-slate-100 last:border-b-0 transition-colors ${
                    asignado ? "bg-blue-50/40" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="px-3 py-2.5">
                    <p className={`text-sm ${asignado ? "text-slate-900 font-medium" : "text-slate-500"}`}>
                      {t.nombre}
                    </p>
                    {t.empresa && <p className="text-xs text-slate-400">{t.empresa}</p>}
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={asignado}
                      onChange={() => toggle(t.id)}
                      className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-[#003087]"
                    />
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="radio"
                      checked={esLider}
                      disabled={!asignado}
                      onChange={() => setLider(t.id)}
                      className="w-4 h-4 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed accent-[#003087]"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {hayMas && (
            <button
              type="button"
              onClick={() => setExpandido((v) => !v)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              {expandido ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Mostrar menos</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Ver {ordenados.length - VISIBLE} más</>
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 transition text-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(tempSel, tempLider)}
            className="flex-1 px-4 py-2.5 bg-[#003087] hover:bg-[#002266] text-white rounded-xl text-sm font-bold transition"
          >
            Confirmar ({tempSel.length})
          </button>
        </div>
      </div>
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
  equiposReferencia = [],
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
  const esInstalacion = esInstalacionRegistro(registro);
  const [modalTrabOpen, setModalTrabOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

      {/* ── Cabecera ── */}
      <div className="bg-[#003087] px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 bg-white/15 text-white rounded-xl font-bold shrink-0 text-sm">
              {index + 1}
            </div>
            <div className="min-w-0">
              <h5 className="text-base font-semibold text-white leading-tight">
                {getRegistroNombre(registro)}
              </h5>
              <p className="text-xs text-blue-200 flex items-center gap-1.5 mt-0.5">
                {esInstalacion
                  ? <Package className="w-3.5 h-3.5" />
                  : esEquipoRegistro(registro)
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
        {equiposReferencia.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {equiposReferencia.map((eq, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-white/80 text-xs rounded-lg border border-white/15"
              >
                {eq.tipo === "EQUIPO"
                  ? <Package className="w-3 h-3 shrink-0" />
                  : <MapPin className="w-3 h-3 shrink-0" />}
                {eq.nombre}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Secciones ── */}
      <div className="divide-y divide-slate-100">

        {/* Descripción — oculta para instalación */}
        {!esInstalacion && (
          <Section title="Descripción del trabajo">
            <Label>
              Descripción <span className="text-red-500">*</span>
            </Label>
            <textarea
              value={
                !esEquipoRegistro(registro)
                  ? registro.descripcionUbicacion
                  : registro.descripcionEquipo
              }
              onChange={(e) =>
                onRegistroChange(
                  !esEquipoRegistro(registro)
                    ? "descripcionUbicacion"
                    : "descripcionEquipo",
                  e.target.value
                )
              }
              rows={3}
              className={textareaClass(errors[`equipo_${index}_descripcion`])}
            />
            <FieldError message={errors[`equipo_${index}_descripcion`]} />
          </Section>
        )}

        {/* Prioridad y Programación — en una sola fila */}
        <Section title="Prioridad y Programación">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
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

        {/* Asignación de personal */}
        <Section
          title="Asignación de personal"
          subtitle="Selecciona los trabajadores y el líder del equipo."
          icon={<Users className="w-4 h-4 text-slate-400" />}
        >
          {/* Chips de trabajadores seleccionados */}
          {(registro.trabajadoresAsignados || []).length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {(registro.trabajadoresAsignados || []).map((id) => {
                const t = trabajadores.find((w) => w.id === id);
                if (!t) return null;
                const esLider = registro.encargadoId === id;
                return (
                  <span
                    key={id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      esLider
                        ? "bg-[#003087] text-white border-[#003087]"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {esLider && <UserCheck className="w-3 h-3" />}
                    {t.nombre}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 mb-3">No hay trabajadores asignados.</p>
          )}

          <button
            type="button"
            onClick={() => setModalTrabOpen(true)}
            className="px-4 py-2 bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-sm font-medium flex items-center gap-2 transition"
          >
            <Users className="w-4 h-4" />
            {(registro.trabajadoresAsignados || []).length > 0
              ? "Editar trabajadores"
              : "Seleccionar trabajadores"}
          </button>

          {errors?.[`equipo_${index}_trabajadores`] && (
            <div className="mt-2">
              <FieldError message={errors[`equipo_${index}_trabajadores`]} />
            </div>
          )}
          {errors?.[`equipo_${index}_encargado`] && (
            <div className="mt-1">
              <FieldError message={errors[`equipo_${index}_encargado`]} />
            </div>
          )}

          <TrabajadoresModal
            isOpen={modalTrabOpen}
            trabajadores={trabajadores}
            seleccionados={registro.trabajadoresAsignados || []}
            encargadoId={registro.encargadoId}
            onClose={() => setModalTrabOpen(false)}
            onConfirm={(nuevos, nuevoLider) => {
              onRegistroChange("trabajadoresAsignados", nuevos);
              onRegistroChange("encargadoId", nuevoLider);
              setModalTrabOpen(false);
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
                className="px-4 py-2 bg-[#003087] text-white rounded-lg text-xs font-medium hover:bg-[#002266] transition"
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

        {/* Adjuntos */}
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
  } focus:outline-none focus:ring-2 focus:ring-blue-100`;
}

function textareaClass(hasError) {
  return `w-full px-3 py-3 border rounded-xl bg-white text-sm text-slate-800 resize-none ${
    hasError ? "border-red-400 bg-red-50" : "border-slate-300"
  } focus:outline-none focus:ring-2 focus:ring-blue-100`;
}
