import { X, FileText, Calendar,Edit, AlertCircle, ClipboardCheck, Settings, Zap, Users, Wrench, Eye, Upload, Trash2, CheckCircle2, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { getEquiposDisponiblesPorAviso } from "../mantenimiento/services/ordenTrabajoService";
import { getTrabajadores } from "../mantenimiento/services/trabajadoresService";
import { equipoService } from "../mantenimiento/services/equipoService";
import { planMantenimientoService } from "../PlanMantenimiento/services/planMantenimientoService";
import { adjuntosService } from "../OrdenTrabajo/services/adjuntosService";
import ModalInfoAviso from "../OrdenTrabajo/modals/ModalInfoAviso";
import ModalDetallesEquipo from "../OrdenTrabajo/modals/ModalDetalleEquipo";    
import { getTratamientoByAviso } from "../mantenimiento/services/tratamientoService";
import { updateSolicitudCompra } from "../OrdenTrabajo/services/SolicitudCompraService";
import ModalEditarSolicitudCompra from "../OrdenTrabajo/modals/ModalEditarSolicitudCompra";
export default function ModalOTGrupal({
  isOpen,
  onClose,
  aviso,
  onGuardar,
  onGenerarNumeroOT,
}) {
  const [numeroOTGenerado, setNumeroOTGenerado] = useState("");
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarInfoAviso, setMostrarInfoAviso] = useState(false);
  const [archivosAdjuntos, setArchivosAdjuntos] = useState([]);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);

  const [trabajadores, setTrabajadores] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [cargandoTrabajadores, setCargandoTrabajadores] = useState(false);
  const [equipoDetalleModal, setEquipoDetalleModal] = useState(null);
  
  // 🔥 NUEVO: Gestión de planes por equipo
  const [planesDisponibles, setPlanesDisponibles] = useState({}); // { equipoId: [planes] }
  const [loadingPlanes, setLoadingPlanes] = useState({}); // { equipoId: boolean }
  
  // 🔥 NUEVO: Tipo de mantenimiento del aviso
  const tipoMantenimiento = aviso?.tipoMantenimiento;
  const esPreventivo = tipoMantenimiento === "Preventivo";
  const esCorrectivo = tipoMantenimiento === "Correctivo";


  const [modalEditarSolicitud, setModalEditarSolicitud] = useState(false);
const [tratamientoData, setTratamientoData] = useState(null);

  const [formData, setFormData] = useState({
    descripcionGeneral: "",
    descripcionDetallada: "",
    supervisorId: "",
    fechaProgramadaInicio: "",
    fechaProgramadaFin: "",
    observaciones: "",
  });

  const [equipos, setEquipos] = useState([]);
  const [errors, setErrors] = useState({});

  // Cargar trabajadores y supervisores
  useEffect(() => {
    if (!isOpen) return;

    setCargandoTrabajadores(true);
    
    Promise.all([
      getTrabajadores().then(data => {
        const trabajadoresNoSupervisores = data.filter(t => t.rol !== "supervisor");
        setTrabajadores(trabajadoresNoSupervisores);
      }),
      getTrabajadores("supervisor").then(data => {
        setSupervisores(data);
      })
    ])
    .catch(err => {
      console.error("Error cargando trabajadores:", err);
    })
    .finally(() => {
      setCargandoTrabajadores(false);
    });
  }, [isOpen]);


  useEffect(() => {
  if (!isOpen || !aviso?.id) return;
  
  getTratamientoByAviso(aviso.id)
    .then(data => setTratamientoData(data))
    .catch(err => console.error("Error cargando tratamiento:", err));
}, [isOpen, aviso?.id]);

  useEffect(() => {
    if (!isOpen || !aviso?.id) return;

    getEquiposDisponiblesPorAviso(aviso.id)
      .then(data => {
        const equiposIniciales = data.map(rel => ({
          equipoId: rel.equipo.id,
          equipoNombre: rel.equipo.nombre || rel.equipo.codigo,
          equipoTipo: rel.equipo.tipo,
          descripcionEquipo: "",
          tipoActividad: "Mantenimiento Preventivo",
          prioridad: "MEDIA",
          estado: "PENDIENTE",
          fechaInicioProgramada: "",
          fechaFinProgramada: "",
          trabajadoresAsignados: [],
          encargadoId: null,
          planMantenimientoId: null,      
          planMantenimiento: null,  
          
          
          actividadesPlan: [],      // preventivo (solo preview)
  actividadesManual: [],    // correctivo (editable)

          adjuntos: [],
          subiendoAdjuntos: false
        }));

        setEquipos(equiposIniciales);
        
        // 🔥 NUEVO: Cargar planes automáticamente para cada equipo
        equiposIniciales.forEach(equipo => {
          cargarPlanesEquipo(equipo.equipoId);
        });
      })
      .catch(err => {
        console.error("Error cargando equipos disponibles", err);
      });
  }, [isOpen, aviso?.id]);

  // 🔥 NUEVO: Cargar planes de un equipo automáticamente
  const cargarPlanesEquipo = async (equipoId) => {
    if (planesDisponibles[equipoId]) return; // Ya cargados

    setLoadingPlanes(prev => ({ ...prev, [equipoId]: true }));
    
    try {
      const planes = await planMantenimientoService.getPlanesByEquipo(equipoId);
      setPlanesDisponibles(prev => ({
        ...prev,
        [equipoId]: planes
      }));

      // 🔥 AUTO-SELECCIONAR primer plan si es PREVENTIVO
      if (esPreventivo && planes.length > 0) {
        const equipoIndex = equipos.findIndex(e => e.equipoId === equipoId);
        if (equipoIndex !== -1 && !equipos[equipoIndex].planMantenimientoId) {
          await seleccionarPlan(equipoIndex, planes[0].id);
        }
      }
    } catch (error) {
      console.error("Error cargando planes del equipo", error);
      setPlanesDisponibles(prev => ({
        ...prev,
        [equipoId]: []
      }));
    } finally {
      setLoadingPlanes(prev => ({ ...prev, [equipoId]: false }));
    }
  };

  // 🔥 NUEVO: Función para seleccionar un plan
  const seleccionarPlan = async (equipoIndex, planId) => {
    if (!planId) {
      handleEquipoChange(equipoIndex, "planMantenimientoId", null);
      handleEquipoChange(equipoIndex, "planMantenimiento", null);
      handleEquipoChange(equipoIndex, "actividadesPlan", []);
      return;
    }

    try {
      const plan = await planMantenimientoService.getPlanById(planId);
      handleEquipoChange(equipoIndex, "planMantenimientoId", planId);
      handleEquipoChange(equipoIndex, "planMantenimiento", plan);
      handleEquipoChange(
        equipoIndex,
        "actividadesPlan",
        plan.actividades.map((a) => ({
          planMantenimientoActividadId: a.id,
          componente: a.componente,
          tarea: a.tarea,
          tipoTrabajo: a.tipoTrabajo,
          duracionEstimadaMin: a.duracionMinutos,
          estado: "PENDIENTE",
          observaciones: "",
        }))
      );
    } catch (error) {
      console.error("Error cargando detalles del plan", error);
    }
  };


  // 🔥 agregar actividad manual (correctivo)
const agregarActividadManual = (indexEquipo) => {
  const nuevos = [...equipos];
  nuevos[indexEquipo].actividadesManual.push({
    componente: "",
    tarea: "",
    tipoTrabajo: "REVISION",
    duracionEstimadaMin: "",
    observaciones: "",
  });
  setEquipos(nuevos);
};

// 🔥 editar actividad manual
const handleActividadManualChange = (eqIndex, actIndex, field, value) => {
  const nuevos = [...equipos];
  nuevos[eqIndex].actividadesManual[actIndex][field] = value;
  setEquipos(nuevos);
};

// 🔥 eliminar actividad manual
const eliminarActividadManual = (eqIndex, actIndex) => {
  const nuevos = [...equipos];
  nuevos[eqIndex].actividadesManual.splice(actIndex, 1);
  setEquipos(nuevos);
};


  const handleUploadAdjuntos = async (files) => {
    try {
      setSubiendoArchivos(true);
      const data = await adjuntosService.uploadArchivos(files);
      setArchivosAdjuntos(prev => [...prev, ...data]);
    } catch (err) {
      console.error("Error subiendo archivos", err);
      alert("Error subiendo archivos");
    } finally {
      setSubiendoArchivos(false);
    }
  };

  const handleUploadAdjuntosEquipo = async (files, indexEquipo) => {
    try {
      handleEquipoChange(indexEquipo, "subiendoAdjuntos", true);
      const data = await adjuntosService.uploadArchivos(files);
      const nuevosEquipos = [...equipos];
      nuevosEquipos[indexEquipo].adjuntos = [
        ...nuevosEquipos[indexEquipo].adjuntos,
        ...data
      ];
      setEquipos(nuevosEquipos);
    } catch (err) {
      console.error("Error subiendo adjuntos equipo", err);
      alert("Error subiendo archivos del equipo");
    } finally {
      handleEquipoChange(indexEquipo, "subiendoAdjuntos", false);
    }
  };

  const handleGuardarSolicitud = async (data) => {
  try {
    await updateSolicitudCompra(tratamientoData.solicitudCompra.id, data);
    const updated = await getTratamientoByAviso(aviso.id);
    setTratamientoData(updated);
  } catch (error) {
    console.error("Error actualizando solicitud:", error);
    alert("Error al actualizar la solicitud");
  }
};

  useEffect(() => {
    if (isOpen && aviso) {
      const numeroGenerado = onGenerarNumeroOT ? onGenerarNumeroOT() : `OT-${Date.now().toString().slice(-6)}`;
      setNumeroOTGenerado(numeroGenerado);

      setFormData(prev => ({
        ...prev,
        descripcionGeneral: aviso.descripcion || "",
        fechaProgramadaInicio: aviso.fechaSugerida || "",
        fechaProgramadaFin: aviso.fechaSugeridaFin || "",
      }));
    }
  }, [isOpen, aviso, onGenerarNumeroOT]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleEquipoChange = (index, field, value) => {
    const newEquipos = [...equipos];
    newEquipos[index][field] = value;
    setEquipos(newEquipos);
    
    if (errors[`equipo_${index}_${field}`]) {
      setErrors(prev => ({ ...prev, [`equipo_${index}_${field}`]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.descripcionGeneral.trim()) {
      newErrors.descripcionGeneral = "La descripción general es requerida";
    }

    if (!formData.supervisorId) {
      newErrors.supervisorId = "El supervisor es requerido";
    }

    if (!formData.fechaProgramadaInicio) {
      newErrors.fechaProgramadaInicio = "La fecha de inicio programada es requerida";
    }

    if (!formData.fechaProgramadaFin) {
      newErrors.fechaProgramadaFin = "La fecha de fin programada es requerida";
    }

    if (formData.fechaProgramadaInicio && formData.fechaProgramadaFin) {
      if (new Date(formData.fechaProgramadaFin) < new Date(formData.fechaProgramadaInicio)) {
        newErrors.fechaProgramadaFin = "La fecha de fin debe ser posterior a la de inicio";
      }
    }

    equipos.forEach((equipo, index) => {
      if (!equipo.descripcionEquipo.trim()) {
        newErrors[`equipo_${index}_descripcionEquipo`] = "La descripción del trabajo es obligatoria";
      }

      // 🔥 VALIDAR PLAN EN PREVENTIVO
      if (esPreventivo && !equipo.planMantenimientoId) {
        newErrors[`equipo_${index}_plan`] = "En mantenimiento preventivo debe seleccionar un plan";
      }

      if (!equipo.trabajadoresAsignados || equipo.trabajadoresAsignados.length === 0) {
        newErrors[`equipo_${index}_trabajadores`] = "Debe asignar al menos un trabajador";
      }

      if (!equipo.encargadoId) {
        newErrors[`equipo_${index}_encargado`] = "Debe seleccionar un encargado";
      }

      if (!equipo.fechaInicioProgramada) {
        newErrors[`equipo_${index}_fechaInicioProgramada`] = "Fecha de inicio requerida";
      }

      if (!equipo.fechaFinProgramada) {
        newErrors[`equipo_${index}_fechaFinProgramada`] = "Fecha de fin requerida";
      }

      if (equipo.fechaInicioProgramada && equipo.fechaFinProgramada) {
        if (new Date(equipo.fechaFinProgramada) < new Date(equipo.fechaInicioProgramada)) {
          newErrors[`equipo_${index}_fechaFinProgramada`] = "La fecha fin debe ser posterior a inicio";
        }
      }

      if (equipo.tipoActividad === "Otro" && !equipo.tipoActividadPersonalizada?.trim()) {
        newErrors[`equipo_${index}_tipoActividadPersonalizada`] = "Especifica el tipo de actividad";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitInternal = () => {
    if (!validateForm()) return;
    setMostrarConfirmacion(true);
  };

  const confirmarCreacion = () => {
    if (!aviso?.tratamientos || aviso.tratamientos.length === 0) {
      alert("Este aviso no tiene tratamiento.");
      return;
    }

    const tratamientoId = aviso.tratamientos[0].id;

    const payload = {
      numeroOT: numeroOTGenerado,
      descripcionGeneral: formData.descripcionGeneral.trim(),
      descripcionDetallada: formData.descripcionDetallada?.trim() || null,
      avisoId: aviso.id,
      tratamientoId,
      supervisorId: formData.supervisorId,
      fechaProgramadaInicio: new Date(formData.fechaProgramadaInicio).toISOString(),
      fechaProgramadaFin: new Date(formData.fechaProgramadaFin).toISOString(),
      observaciones: formData.observaciones || null,
      equipos: equipos.map(eq => ({
        equipoId: eq.equipoId,
        descripcionEquipo: eq.descripcionEquipo.trim(),
        tipoActividad:
          eq.tipoActividad === "Otro"
            ? eq.tipoActividadPersonalizada.trim()
            : eq.tipoActividad,
        prioridad: eq.prioridad,
        planMantenimientoId: eq.planMantenimientoId,

        
        fechaInicioProgramada: new Date(eq.fechaInicioProgramada).toISOString(),
        fechaFinProgramada: new Date(eq.fechaFinProgramada).toISOString(),  

          actividades:
    esCorrectivo ? eq.actividadesManual : undefined,
        trabajadores: eq.trabajadoresAsignados.map(id => ({
          trabajadorId: id,
          esEncargado: id === eq.encargadoId
        })),
        adjuntos: eq.adjuntos
      })),
      adjuntos: archivosAdjuntos
    };

    onGuardar(payload);
  };

  const tiposActividad = [
    "Mantenimiento Preventivo",
    "Mantenimiento Correctivo",
    "Inspección",
    "Reparación",
    "Instalación",
    "Calibración",
    "Otro"
  ];

  const getEstadoBadgeColor = (estado) => {
    const colores = {
      PENDIENTE: "bg-amber-100 text-amber-700 border-amber-300",
      EN_PROCESO: "bg-blue-100 text-blue-700 border-blue-300",
      FINALIZADO: "bg-green-100 text-green-700 border-green-300"
    };
    return colores[estado] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-10">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col border border-slate-200">
          
          {/* HEADER MEJORADO */}
          <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 p-9 rounded-t-3xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="p-9 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                  <Users className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">Crear Orden de Trabajo Grupal</h3>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-bold">
                        {numeroOTGenerado}
                      </span>
                      <span className="text-blue-200">•</span>
                      <span className="text-blue-200 font-medium">
                        Aviso: <span className="text-white font-bold">{aviso?.numeroAviso}</span>
                      </span>
                      {/* 🔥 NUEVO: Mostrar tipo de mantenimiento */}
                      {tipoMantenimiento && (
                        <>
                          <span className="text-blue-200">•</span>
                          <span className={`px-3 py-1 backdrop-blur-sm border rounded-full text-sm font-bold ${
                            esPreventivo 
                              ? 'bg-green-500/30 border-green-400/40 text-green-100'
                              : 'bg-orange-500/30 border-orange-400/40 text-orange-100'
                          }`}>
                            {tipoMantenimiento}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="px-3 py-1 bg-cyan-500/30 backdrop-blur-sm border border-cyan-400/40 rounded-full text-cyan-100 text-sm font-bold">
                      {equipos.length} equipos
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMostrarInfoAviso(true)}
                  className="px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl transition-all duration-200 flex items-center gap-2 text-white font-semibold border border-white/30 hover:border-white/50"
                >
                  <FileText className="w-5 h-5" />
                  Info del Aviso
                </button>
                
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-white/15 rounded-xl transition-all duration-200 group"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* CONTENIDO CON SCROLL */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="p-8 space-y-6">
              
              {/* 🔥 NUEVO: Alerta de tipo de mantenimiento */}
              {tipoMantenimiento && (
                <div className={`p-5 rounded-2xl border-l-4 ${
                  esPreventivo 
                    ? 'bg-green-50 border-green-500'
                    : 'bg-orange-50 border-orange-500'
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-6 h-6 mt-0.5 flex-shrink-0 ${
                      esPreventivo ? 'text-green-600' : 'text-orange-600'
                    }`} />
                    <div>
                      <p className={`font-bold text-lg ${
                        esPreventivo ? 'text-green-900' : 'text-orange-900'
                      }`}>
                        Mantenimiento {tipoMantenimiento}
                      </p>
                      <p className={`text-sm mt-1 ${
                        esPreventivo ? 'text-green-700' : 'text-orange-700'
                      }`}>
                        {esPreventivo 
                          ? "Los planes de mantenimiento se asignarán automáticamente a cada equipo. Es obligatorio tener un plan asignado."
                          : "Puedes personalizar los planes de mantenimiento para cada equipo o trabajar sin plan."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* INFORMACIÓN GENERAL */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <ClipboardCheck className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Información General</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Número OT */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Número de Orden de Trabajo
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                      <Zap className="w-5 h-5 text-green-600" />
                      <span className="font-bold text-green-700 text-lg">{numeroOTGenerado}</span>
                      <span className="ml-auto text-xs bg-green-600 text-white px-3 py-1 rounded-full font-bold">
                        Autogenerado
                      </span>
                    </div>
                  </div>

                  {/* Supervisor */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Supervisor Responsable <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="supervisorId"
                      value={formData.supervisorId}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium bg-white ${
                        errors.supervisorId ? 'border-red-400 bg-red-50' : 'border-slate-300'
                      }`}
                    >
                      <option value="">Seleccione un supervisor</option>
                      {supervisores.map(supervisor => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.nombre} - {supervisor.empresa}
                        </option>
                      ))}
                    </select>
                    {errors.supervisorId && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        {errors.supervisorId}
                      </p>
                    )}
                  </div>

                  {/* Descripción General */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Descripción General del Trabajo <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="descripcionGeneral"
                      value={formData.descripcionGeneral}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe el alcance general de la orden de trabajo grupal..."
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-medium ${
                        errors.descripcionGeneral ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
                      }`}
                    />
                    {errors.descripcionGeneral && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        {errors.descripcionGeneral}
                      </p>
                    )}
                  </div>

                  {/* Descripción Detallada */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Descripción Detallada <span className="text-xs text-slate-500 font-normal">(Opcional)</span>
                    </label>
                    <textarea
                      name="descripcionDetallada"
                      value={formData.descripcionDetallada}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Procedimientos específicos, consideraciones de seguridad, recursos necesarios..."
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-medium bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* FECHAS PROGRAMADAS */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Periodo de Ejecución General</h4>
                  <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">Referencial</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Fecha y Hora de Inicio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="fechaProgramadaInicio"
                      value={formData.fechaProgramadaInicio}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium ${
                        errors.fechaProgramadaInicio ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
                      }`}
                    />
                    {errors.fechaProgramadaInicio && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        {errors.fechaProgramadaInicio}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Fecha y Hora de Fin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="fechaProgramadaFin"
                      value={formData.fechaProgramadaFin}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium ${
                        errors.fechaProgramadaFin ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
                      }`}
                    />
                    {errors.fechaProgramadaFin && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        {errors.fechaProgramadaFin}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* EQUIPOS */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900">Equipos</h4>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                      {equipos.length} {equipos.length === 1 ? 'equipo' : 'equipos'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {equipos.map((equipo, index) => {
                    // 🔥 NUEVO: Obtener planes del equipo
                    const planesEquipo = planesDisponibles[equipo.equipoId] || [];
                    const cargandoPlanes = loadingPlanes[equipo.equipoId];

                    return (
                    <div key={index} className="relative bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-blue-300 transition-all">
                      
                      {/* HEADER DEL EQUIPO */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg">
                            {index + 1}
                          </div>
                          <div>
                            <h5 className="text-lg font-bold text-slate-900">{equipo.equipoNombre}</h5>
                            <p className="text-sm text-slate-600">{equipo.equipoTipo}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEquipoDetalleModal(equipo.equipoId)}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalles
                          </button>
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${getEstadoBadgeColor(equipo.estado)}`}>
                            {equipo.estado}
                          </span>
                        </div>
                      </div>

                      {/* CONFIGURACIÓN DEL EQUIPO */}
                      <div className="space-y-4">
                        
                        {/* Descripción del Trabajo */}
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                          <label className="block text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Descripción del Trabajo <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={equipo.descripcionEquipo}
                            onChange={(e) => handleEquipoChange(index, 'descripcionEquipo', e.target.value)}
                            rows={2}
                            placeholder={`Detalla el trabajo específico a realizar en ${equipo.equipoNombre}...`}
                            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium resize-none ${
                              errors[`equipo_${index}_descripcionEquipo`] ? 'border-red-400 bg-red-50' : 'border-amber-300 bg-white'
                            }`}
                          />
                          {errors[`equipo_${index}_descripcionEquipo`] && (
                            <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3 h-3" />
                              {errors[`equipo_${index}_descripcionEquipo`]}
                            </p>
                          )}
                        </div>

                        {/* Grid de configuración */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Tipo de Actividad */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Tipo de Actividad <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={equipo.tipoActividad}
                              onChange={(e) => handleEquipoChange(index, 'tipoActividad', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            >
                              {tiposActividad.map(tipo => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                              ))}
                            </select>
                          </div>

                          {/* Prioridad */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Prioridad <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={equipo.prioridad}
                              onChange={(e) => handleEquipoChange(index, "prioridad", e.target.value)}
                              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            >
                              <option value="BAJA">🟢 Baja</option>
                              <option value="MEDIA">🟡 Media</option>
                              <option value="ALTA">🟠 Alta</option>
                              <option value="CRITICA">🔴 Crítica</option>
                            </select>
                          </div>

                          {/* Actividad Personalizada */}
                          {equipo.tipoActividad === "Otro" && (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Especificar Tipo de Actividad <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={equipo.tipoActividadPersonalizada || ""}
                                onChange={(e) => handleEquipoChange(index, 'tipoActividadPersonalizada', e.target.value)}
                                placeholder="Describe el tipo de actividad personalizada..."
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${
                                  errors[`equipo_${index}_tipoActividadPersonalizada`] ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
                                }`}
                              />
                              {errors[`equipo_${index}_tipoActividadPersonalizada`] && (
                                <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                                  <AlertCircle className="w-3 h-3" />
                                  {errors[`equipo_${index}_tipoActividadPersonalizada`]}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 🔥 NUEVO: Plan de Mantenimiento Mejorado */}
                        <div className={`border-2 rounded-xl p-4 ${
                          esPreventivo ? 'bg-green-50 border-green-200' : 'bg-indigo-50 border-indigo-200'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <label className={`text-sm font-bold flex items-center gap-2 ${
                              esPreventivo ? 'text-green-900' : 'text-indigo-900'
                            }`}>
                              <Wrench className="w-4 h-4" />
                              Plan de Mantenimiento
                              {esPreventivo && <span className="text-red-500">*</span>}
                            </label>
                            {cargandoPlanes && (
                              <div className="flex items-center gap-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs font-medium">Cargando...</span>
                              </div>
                            )}
                          </div>

                          <select
                            className={`w-full px-4 py-2.5 border-2 rounded-lg bg-white focus:ring-4 transition-all font-medium ${
                              esPreventivo 
                                ? 'border-green-300 focus:ring-green-500/20 focus:border-green-500'
                                : 'border-indigo-300 focus:ring-indigo-500/20 focus:border-indigo-500'
                            } ${errors[`equipo_${index}_plan`] ? 'border-red-400 bg-red-50' : ''}`}
                            value={equipo.planMantenimientoId || ""}
                            onChange={(e) => seleccionarPlan(index, e.target.value)}
                            disabled={cargandoPlanes}
                          >
                            {esCorrectivo && <option value="">— Trabajo manual (sin plan) —</option>}
                            {planesEquipo.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nombre}
                              </option>
                            ))}
                            {!cargandoPlanes && planesEquipo.length === 0 && (
                              <option value="" disabled>
                                {esPreventivo ? "⚠️ No hay planes disponibles" : "No hay planes disponibles"}
                              </option>
                            )}
                          </select>

                          {esPreventivo && planesEquipo.length > 0 && (
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1.5 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Plan asignado automáticamente (obligatorio)
                            </p>
                          )}

                          {errors[`equipo_${index}_plan`] && (
                            <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3 h-3" />
                              {errors[`equipo_${index}_plan`]}
                            </p>
                          )}

                          {/* Actividades del Plan */}
                          {equipo.actividadesPlan.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className={`text-xs font-bold mb-2 ${
                                esPreventivo ? 'text-green-900' : 'text-indigo-900'
                              }`}>
                                Actividades incluidas ({equipo.actividadesPlan.length}):
                              </p>
                              <div className="max-h-48 overflow-y-auto space-y-2">
                                {equipo.actividadesPlan.map((act, idx) => (
                                  <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="font-semibold text-sm text-slate-900">
                                        {act.componente} — {act.tarea}
                                      </p>
                                      <p className="text-xs text-slate-600 mt-1">
                                        {act.tipoTrabajo} • {act.duracionEstimadaMin} min
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 🔴 ACTIVIDADES MANUALES (SOLO CORRECTIVO) */}
{esCorrectivo && (
  <div className="mt-4 bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-bold text-orange-900">
        Actividades Manuales
      </p>
      <button
        type="button"
        onClick={() => agregarActividadManual(index)}
        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700"
      >
        + Agregar actividad
      </button>
    </div>

    {equipo.actividadesManual.length === 0 && (
      <p className="text-xs text-orange-700 italic">
        No hay actividades manuales. Agrega las que necesites.
      </p>
    )}

    <div className="space-y-3">
      {equipo.actividadesManual.map((act, actIdx) => (
        <div
          key={actIdx}
          className="bg-white border border-orange-200 rounded-lg p-3 space-y-2"
        >
          {/* Fila 1: Componente y Tarea */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Componente
              </label>
              <input
                placeholder="Ej: Motor, Bomba..."
                value={act.componente}
                onChange={(e) =>
                  handleActividadManualChange(index, actIdx, "componente", e.target.value)
                }
                className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-lg text-sm font-medium focus:border-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tarea <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Ej: Revisar fugas..."
                value={act.tarea}
                onChange={(e) =>
                  handleActividadManualChange(index, actIdx, "tarea", e.target.value)
                }
                className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-lg text-sm font-medium focus:border-orange-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Fila 2: Tipo de Trabajo y Duración */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tipo de Trabajo
              </label>
              {/* ✅ SELECT con los valores exactos del ENUM */}
              <select
                value={act.tipoTrabajo}
                onChange={(e) =>
                  handleActividadManualChange(index, actIdx, "tipoTrabajo", e.target.value)
                }
                className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-lg text-sm font-medium focus:border-orange-400 focus:outline-none bg-white"
              >
                <option value="REVISION">Revisión</option>
                <option value="INSPECCION">Inspección</option>
                <option value="LIMPIEZA">Limpieza</option>
                <option value="AJUSTE">Ajuste</option>
                <option value="LUBRICACION">Lubricación</option>
                <option value="CAMBIO">Cambio</option>
                <option value="APLICACION">Aplicación</option>
                <option value="TORQUEO_REGULACION">Torqueo / Regulación</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Duración (min)
              </label>
              <input
                placeholder="Ej: 30"
                type="number"
                min="1"
                value={act.duracionEstimadaMin}
                onChange={(e) =>
                  handleActividadManualChange(
                    index,
                    actIdx,
                    "duracionEstimadaMin",
                    e.target.value
                  )
                }
                className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-lg text-sm font-medium focus:border-orange-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Fila 3: Observaciones + Eliminar */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Observaciones <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                placeholder="Notas adicionales..."
                value={act.observaciones}
                onChange={(e) =>
                  handleActividadManualChange(index, actIdx, "observaciones", e.target.value)
                }
                className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-lg text-sm font-medium focus:border-orange-400 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => eliminarActividadManual(index, actIdx)}
              className="px-3 py-1.5 bg-red-100 hover:bg-red-600 text-red-600 hover:text-white border-2 border-red-200 hover:border-red-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}




                        </div>

                        {/* Trabajadores Asignados */}
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                          <label className="block text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Trabajadores Asignados <span className="text-red-500">*</span>
                          </label>

                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-lg border border-purple-200">
                            {trabajadores.map(trab => {
                              const seleccionado = equipo.trabajadoresAsignados.includes(trab.id);
                              return (
                                <label 
                                  key={trab.id} 
                                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                                    seleccionado ? 'bg-purple-100 border-2 border-purple-300' : 'bg-slate-50 border-2 border-transparent hover:bg-purple-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={seleccionado}
                                    onChange={(e) => {
                                      const nuevos = [...equipos];
                                      if (e.target.checked) {
                                        nuevos[index].trabajadoresAsignados.push(trab.id);
                                      } else {
                                        nuevos[index].trabajadoresAsignados =
                                          nuevos[index].trabajadoresAsignados.filter(id => id !== trab.id);
                                        if (nuevos[index].encargadoId === trab.id) {
                                          nuevos[index].encargadoId = null;
                                        }
                                      }
                                      setEquipos(nuevos);
                                    }}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                  />
                                  <span className="text-sm font-medium text-slate-800">{trab.nombre}</span>
                                </label>
                              );
                            })}
                          </div>

                          {errors[`equipo_${index}_trabajadores`] && (
                            <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3 h-3" />
                              {errors[`equipo_${index}_trabajadores`]}
                            </p>
                          )}

                          {/* Encargado */}
                          {equipo.trabajadoresAsignados.length > 0 && (
                            <div className="mt-4">
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Encargado del Equipo <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={equipo.encargadoId || ""}
                                onChange={(e) => handleEquipoChange(index, "encargadoId", e.target.value)}
                                className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg bg-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                              >
                                <option value="">Seleccione un encargado</option>
                                {trabajadores
                                  .filter(t => equipo.trabajadoresAsignados.includes(t.id))
                                  .map(t => (
                                    <option key={t.id} value={t.id}>
                                      {t.nombre}
                                    </option>
                                  ))}
                              </select>
                              {errors[`equipo_${index}_encargado`] && (
                                <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                                  <AlertCircle className="w-3 h-3" />
                                  {errors[`equipo_${index}_encargado`]}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Fechas Específicas */}
                        <div className="bg-sky-50 border-2 border-sky-200 rounded-xl p-4">
                          <h6 className="text-sm font-bold text-sky-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Programación Específica
                          </h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-2">
                                Fecha/Hora Inicio <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="datetime-local"
                                value={equipo.fechaInicioProgramada}
                                onChange={(e) => handleEquipoChange(index, 'fechaInicioProgramada', e.target.value)}
                                className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-medium ${
                                  errors[`equipo_${index}_fechaInicioProgramada`] ? 'border-red-400 bg-red-50' : 'border-sky-300 bg-white'
                                }`}
                              />
                              {errors[`equipo_${index}_fechaInicioProgramada`] && (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
                                  <AlertCircle className="w-3 h-3" />
                                  {errors[`equipo_${index}_fechaInicioProgramada`]}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-2">
                                Fecha/Hora Fin <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="datetime-local"
                                value={equipo.fechaFinProgramada}
                                onChange={(e) => handleEquipoChange(index, 'fechaFinProgramada', e.target.value)}
                                className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-medium ${
                                  errors[`equipo_${index}_fechaFinProgramada`] ? 'border-red-400 bg-red-50' : 'border-sky-300 bg-white'
                                }`}
                              />
                              {errors[`equipo_${index}_fechaFinProgramada`] && (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
                                  <AlertCircle className="w-3 h-3" />
                                  {errors[`equipo_${index}_fechaFinProgramada`]}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Adjuntos del Equipo */}
                        <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                          <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Archivos Adjuntos del Equipo
                          </label>

                          <input
                            type="file"
                            multiple
                            onChange={(e) => handleUploadAdjuntosEquipo(e.target.files, index)}
                            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-semibold hover:file:bg-blue-700 cursor-pointer"
                          />

                          {equipo.subiendoAdjuntos && (
                            <div className="mt-3 flex items-center gap-2 text-blue-600">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-xs font-medium">Subiendo archivos...</p>
                            </div>
                          )}

                          {equipo.adjuntos.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {equipo.adjuntos.map((file, i) => (
                                <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-slate-800">{file.nombre}</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const nuevosEquipos = [...equipos];
                                      nuevosEquipos[index].adjuntos =
                                        nuevosEquipos[index].adjuntos.filter((_, idx) => idx !== i);
                                      setEquipos(nuevosEquipos);
                                    }}
                                    className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  )})}
                </div>
              </div>


              {/* ADJUNTOS GENERALES */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Archivos Adjuntos Generales</h4>
                  <span className="text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-full">(Opcional)</span>
                </div>

                <input
                  type="file"
                  multiple
                  onChange={(e) => handleUploadAdjuntos(e.target.files)}
                  className="w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-blue-600 file:to-cyan-600 file:text-white file:font-bold hover:file:from-blue-700 hover:file:to-cyan-700 cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-blue-400 transition-all"
                />

                {subiendoArchivos && (
                  <div className="mt-4 flex items-center gap-3 text-blue-600 bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold">Subiendo archivos...</p>
                  </div>
                )}

                {archivosAdjuntos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Archivos adjuntos ({archivosAdjuntos.length})
                    </p>
                    {archivosAdjuntos.map((file, i) => (
                      <div key={i} className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-600 rounded-lg">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-slate-800">{file.nombre}</span>
                        </div>
                        <button
                          onClick={() => setArchivosAdjuntos(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>


              
              {/* SOLICITUD DE COMPRA */}
{tratamientoData?.solicitudCompra && (
  <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h4 className="text-xl font-bold text-slate-900">Requerimientos</h4>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
          {tratamientoData.solicitudCompra.estado}
        </span>
      </div>
      <button
        onClick={() => setModalEditarSolicitud(true)}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
      >
        <Edit className="w-4 h-4" />
        Editar Solicitud
      </button>
    </div>

    {/* Lista de ítems */}
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-600 mb-3">
        Ítems solicitados ({tratamientoData.solicitudCompra.lineas?.length || 0}):
      </p>
      {tratamientoData.solicitudCompra.lineas?.map((linea, i) => (
        <div key={i} className="flex items-center justify-between bg-amber-50 p-3 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-amber-600 text-white rounded-full text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-sm font-medium text-slate-800">{linea.description}</span>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
            Cant: {linea.quantity}
          </span>
        </div>
      ))}
    </div>
  </div>
)}

              {/* OBSERVACIONES */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  Observaciones Generales
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Notas adicionales, consideraciones especiales, información relevante..."
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-medium bg-white"
                />
              </div>

            </div>
          </div>

          {/* FOOTER */}
          <div className="p-6 border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 flex items-center justify-between rounded-b-3xl">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-slate-400 rounded-xl hover:bg-white hover:border-slate-500 transition-all font-bold text-slate-700 flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>

            <button
              onClick={handleSubmitInternal}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:via-cyan-700 hover:to-blue-800 transition-all font-bold shadow-xl shadow-blue-500/40 flex items-center gap-3 transform hover:scale-105 active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
              Crear Orden de Trabajo Grupal
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {equipos.length} equipos
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL LATERAL - AHORA USA EL COMPONENTE SEPARADO */}
      <ModalInfoAviso 
        isOpen={mostrarInfoAviso}
        onClose={() => setMostrarInfoAviso(false)}
        aviso={aviso}
      />

      {/* MODAL DE DETALLES DEL EQUIPO - AHORA USA EL COMPONENTE SEPARADO */}
      <ModalDetallesEquipo
        equipoId={equipoDetalleModal}
        isOpen={!!equipoDetalleModal}
        onClose={() => setEquipoDetalleModal(null)}
      />

      <ModalEditarSolicitudCompra
  isOpen={modalEditarSolicitud}
  onClose={() => setModalEditarSolicitud(false)}
  solicitudCompra={tratamientoData?.solicitudCompra}
  onSave={handleGuardarSolicitud}
/>

      {/* MODAL DE CONFIRMACIÓN */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Confirmar Creación</h3>
            </div>
            
            <div className="space-y-2 mb-6 text-sm text-slate-700">
              <p><strong>OT:</strong> {numeroOTGenerado}</p>
              <p><strong>Tipo:</strong> {tipoMantenimiento || 'N/A'}</p>
              <p><strong>Equipos:</strong> {equipos.length} equipos incluidos</p>
              <p><strong>Supervisor:</strong> {supervisores.find(s => s.id === formData.supervisorId)?.nombre || 'N/A'}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmarCreacion();
                  setMostrarConfirmacion(false);
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold shadow-lg shadow-green-500/30"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

