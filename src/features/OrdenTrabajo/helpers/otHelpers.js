// helpers/otHelpers.js

export const TIPOS_TRABAJO_ENUM = [
  "REVISION",
  "INSPECCION",
  "LIMPIEZA",
  "AJUSTE",
  "LUBRICACION",
  "CAMBIO",
  "APLICACION",
  "TORQUEO_REGULACION",
  "REPARACION",
];

export const TIPOS_TRABAJO_CORRECTIVO = ["REPARACION", "CAMBIO"];

export const ROLES_TECNICOS = [
  { value: "tecnico_electrico", label: "Técnico Eléctrico" },
  { value: "operario_de_mantenimiento", label: "Operario de Mantenimiento" },
  { value: "tecnico_mecanico", label: "Técnico Mecánico" },
  { value: "supervisor", label: "Supervisor" },
];

export const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const toMinutes = (valor, unidad) => {
  const v = Number(valor);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return unidad === "h" ? Math.round(v * 60) : Math.round(v);
};

export const getRegistroId = (r) => r.equipoId || r.ubicacionTecnicaId || null;
export const esEquipoRegistro = (r) => !!r.equipoId;
export const esUbicacionRegistro = (r) => !!r.ubicacionTecnicaId;
export const esInstalacionRegistro = (r) => !r.equipoId && !r.ubicacionTecnicaId;

export const getRegistroNombre = (r) => {
  if (r.equipoId) return r.equipoNombre || `Equipo ${r.equipoId}`;
  if (r.ubicacionTecnicaId) return r.ubicacionTecnicaNombre || `Ubicación técnica ${r.ubicacionTecnicaId}`;
  return r.equipoNombre || "Instalación";
};

export const getRegistroSubtitulo = (r) => {
  if (r.equipoId) return r.equipoTipo || "Equipo";
  if (r.ubicacionTecnicaId) return r.ubicacionTecnicaCodigo || "Ubicación técnica";
  return r.equipoTipo || "General";
};

export const getRegistroLabel = (r) => {
  if (r.equipoId) return "Equipo";
  if (r.ubicacionTecnicaId) return "Ubicación técnica";
  return "Instalación";
};

export const getRolLabel = (value) =>
  ROLES_TECNICOS.find((r) => r.value === value)?.label || value || "—";

export const getEstadoBadgeColor = (estado) => {
  const colores = {
    PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
    EN_PROCESO: "bg-blue-50 text-blue-700 border-blue-200",
    FINALIZADO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return colores[estado] || "bg-slate-50 text-slate-700 border-slate-200";
};

export const mkActOT = (base = {}, opts = {}) => {
  const unidad = base.unidadDuracion || "min";

  const durVal =
    base.duracionEstimadaValor ??
    base.duracionValor ??
    (typeof base.duracionMinutos === "number" ? base.duracionMinutos : 0);

  const durMin =
    base.duracionEstimadaMin ??
    (typeof base.duracionMinutos === "number" ? base.duracionMinutos : null) ??
    (durVal ? toMinutes(durVal, unidad) : null);

  return {
    id: base.id || createId(),
    selected: opts.forceSelected ?? true,

    planMantenimientoActividadId: base.planMantenimientoActividadId || null,
    codigoActividad: base.codigoActividad || null,

    sistema: base.sistema || "",
    subsistema: base.subsistema || "",
    componente: base.componente || "",
    tarea: base.tarea || "",
    descripcion: base.descripcion || "",

    tipoTrabajo:
      base.tipoTrabajo || (opts.esCorrectivo ? "REPARACION" : "REVISION"),

    tipo: base.tipo === "EXTERNO" ? "EXTERNO" : "INTERNO",

    rolTecnico: ROLES_TECNICOS.some((r) => r.value === base.rolTecnico)
      ? base.rolTecnico
      : "tecnico_mecanico",

    cantidadTecnicos:
      Number(base.cantidadTecnicos) > 0 ? Number(base.cantidadTecnicos) : 1,

    duracionEstimadaValor: Number(durVal) || 0,
    unidadDuracion: unidad,
    duracionEstimadaMin: durMin ?? null,

    observaciones: base.observaciones || "",
    estado: base.estado || "PENDIENTE",
    origen: base.origen || "TRATAMIENTO",
  };
};

export const normalizeActOTForPayload = (a) => {
  const unidad = a.unidadDuracion || "min";
  const valor = Number(a.duracionEstimadaValor) || 0;
  const durMin = toMinutes(valor, unidad);

  return {
    planMantenimientoActividadId: a.planMantenimientoActividadId || null,
    codigoActividad: a.codigoActividad || null,

    sistema: a.sistema?.trim() || null,
    subsistema: a.subsistema?.trim() || null,
    componente: a.componente?.trim() || null,
    tarea: a.tarea?.trim() || null,
    descripcion: a.descripcion?.trim() || null,

    tipoTrabajo: a.tipoTrabajo || "REVISION",
    tipo: a.tipo === "EXTERNO" ? "EXTERNO" : "INTERNO",
    rolTecnico: ROLES_TECNICOS.some((r) => r.value === a.rolTecnico)
      ? a.rolTecnico
      : "tecnico_mecanico",
    cantidadTecnicos:
      Number(a.cantidadTecnicos) > 0 ? Number(a.cantidadTecnicos) : 1,

    duracionEstimadaValor: valor,
    unidadDuracion: unidad,
    duracionEstimadaMin: durMin || null,

    observaciones: a.observaciones?.trim() || null,
    estado: a.estado || "PENDIENTE",
    origen: a.origen || "TRATAMIENTO",
  };
};

export const buildOTPayload = ({
  numeroOT,
  formData,
  aviso,
  tratamientoId,
  equipos,
  archivosAdjuntos,
  esPreventivo,
}) => {
  return {
    numeroOT,
    descripcionGeneral: formData.descripcionGeneral.trim(),
    descripcionDetallada: formData.descripcionDetallada?.trim() || null,
    avisoId: aviso.id,
    tratamientoId,
    supervisorId: formData.supervisorId,

    fechaProgramadaInicio: new Date(formData.fechaProgramadaInicio).toISOString(),
    fechaProgramadaFin: new Date(formData.fechaProgramadaFin).toISOString(),
    observaciones: formData.observaciones || null,
    modo: "GRUPAL",

    targets: equipos.map((eq) => ({
      equipoId: eq.equipoId || null,
      ubicacionTecnicaId: eq.ubicacionTecnicaId || null,

      descripcionEquipo: eq.equipoId ? eq.descripcionEquipo?.trim() || null : null,
      descripcionUbicacion: eq.ubicacionTecnicaId
        ? eq.descripcionUbicacion?.trim() || null
        : null,

      prioridad: eq.prioridad,
      planMantenimientoId: eq.planMantenimientoId || null,

      fechaInicioProgramada: new Date(eq.fechaInicioProgramada).toISOString(),
      fechaFinProgramada: new Date(eq.fechaFinProgramada).toISOString(),

      actividades: (eq.actividadesOT || [])
        .filter((a) => (esPreventivo ? true : a.selected))
        .map(normalizeActOTForPayload),

      trabajadores: (eq.trabajadoresAsignados || []).map((id) => ({
        trabajadorId: id,
        esEncargado: id === eq.encargadoId,
      })),

      adjuntos: eq.adjuntos || [],
      observacionesEquipo: eq.observacionesEquipo || null,
    })),

    adjuntos: archivosAdjuntos || [],
  };
};