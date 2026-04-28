// helpers/otValidation.js
import {
  ROLES_TECNICOS,
  TIPOS_TRABAJO_CORRECTIVO,
} from "./otHelpers";

export const validateOTForm = ({
  formData,
  equipos,
  esPreventivo,
  esCorrectivo,
  esVenta = false,
  esInstalacion = false,
}) => {
  const newErrors = {};

  if (!esInstalacion && !formData.descripcionGeneral?.trim()) {
    newErrors.descripcionGeneral = "La descripción general es requerida";
  }

  if (!formData.supervisorId) {
    newErrors.supervisorId = "El supervisor es requerido";
  }

  if (esVenta && !formData.encargadoId) {
    newErrors.encargadoId = "El encargado es requerido para OT de venta";
  }

  if (!esInstalacion && !formData.fechaProgramadaInicio) {
    newErrors.fechaProgramadaInicio = "La fecha de inicio programada es requerida";
  }

  if (!esInstalacion && !formData.fechaProgramadaFin) {
    newErrors.fechaProgramadaFin = "La fecha de fin programada es requerida";
  }

  if (!esInstalacion && formData.fechaProgramadaInicio && formData.fechaProgramadaFin) {
    if (new Date(formData.fechaProgramadaFin) < new Date(formData.fechaProgramadaInicio)) {
      newErrors.fechaProgramadaFin =
        "La fecha de fin debe ser posterior a la de inicio";
    }
  }

  // Para venta no se validan equipos (son opcionales y sin personal por equipo)
  if (esVenta) return newErrors;

  equipos.forEach((equipo, index) => {
    const esRegistroInstalacion = !equipo.equipoId && !equipo.ubicacionTecnicaId;
    const descripcionTrabajo = (!esInstalacion && !esRegistroInstalacion && !equipo.equipoId)
      ? equipo.descripcionUbicacion
      : equipo.descripcionEquipo;

    if (!esInstalacion && !descripcionTrabajo?.trim()) {
      newErrors[`equipo_${index}_descripcion`] =
        "La descripción del trabajo es obligatoria";
    }

    if (esPreventivo && !equipo.planMantenimientoId) {
      newErrors[`equipo_${index}_plan`] =
        "En preventivo debe seleccionar un plan";
    }

    if (!equipo.trabajadoresAsignados || equipo.trabajadoresAsignados.length === 0) {
      newErrors[`equipo_${index}_trabajadores`] =
        "Debe asignar al menos un trabajador";
    }

    if (!equipo.encargadoId) {
      newErrors[`equipo_${index}_encargado`] =
        "Debe seleccionar un encargado";
    }

    if (!equipo.fechaInicioProgramada) {
      newErrors[`equipo_${index}_fechaInicioProgramada`] =
        "Fecha de inicio requerida";
    }

    if (!equipo.fechaFinProgramada) {
      newErrors[`equipo_${index}_fechaFinProgramada`] =
        "Fecha de fin requerida";
    }

    if (equipo.fechaInicioProgramada && equipo.fechaFinProgramada) {
      if (new Date(equipo.fechaFinProgramada) < new Date(equipo.fechaInicioProgramada)) {
        newErrors[`equipo_${index}_fechaFinProgramada`] =
          "La fecha fin debe ser posterior a inicio";
      }
    }

    const acts = equipo.actividadesOT || [];

    if (esCorrectivo) {
      if (!acts.length) {
        newErrors[`equipo_${index}_acts`] =
          "Debes agregar al menos 1 actividad";
      } else {
        const selected = acts.filter((a) => a.selected);

        if (selected.length === 0) {
          newErrors[`equipo_${index}_acts`] =
            "Debes dejar al menos 1 actividad seleccionada";
        } else if (selected.some((a) => !a.tarea?.trim())) {
          newErrors[`equipo_${index}_acts`] =
            "Hay actividades seleccionadas sin tarea";
        } else if (
          selected.some(
            (a) => a.tipoTrabajo && !TIPOS_TRABAJO_CORRECTIVO.includes(a.tipoTrabajo)
          )
        ) {
          newErrors[`equipo_${index}_acts`] =
            "En correctivo solo se permite REPARACION o CAMBIO";
        } else if (
          selected.some((a) => !ROLES_TECNICOS.some((r) => r.value === a.rolTecnico))
        ) {
          newErrors[`equipo_${index}_acts`] =
            "Hay actividades con rol técnico inválido";
        } else if (selected.some((a) => Number(a.cantidadTecnicos) <= 0)) {
          newErrors[`equipo_${index}_acts`] =
            "Hay actividades con cantidad de técnicos inválida";
        }
      }
    } else {
      if (equipo.planMantenimientoId && acts.length === 0) {
        newErrors[`equipo_${index}_acts`] =
          "El plan seleccionado no tiene actividades";
      }

      if (acts.some((a) => !ROLES_TECNICOS.some((r) => r.value === a.rolTecnico))) {
        newErrors[`equipo_${index}_acts`] =
          "Hay actividades con rol técnico inválido";
      }

      if (acts.some((a) => Number(a.cantidadTecnicos) <= 0)) {
        newErrors[`equipo_${index}_acts`] =
          "Hay actividades con cantidad de técnicos inválida";
      }
    }
  });

  return newErrors;
};