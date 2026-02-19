import { X, FileText, Calendar, AlertCircle, ClipboardCheck, Settings, Zap, Users, Wrench, Info, Upload, Trash2, CheckCircle2, Clock, Eye, MapPin, Building2, User, Phone, Mail, Package, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { getTratamientoByAviso } from "../mantenimiento/services/tratamientoService";
import { getTrabajadores } from "../mantenimiento/services/trabajadoresService";
import { equipoService } from "../mantenimiento/services/equipoService";
import { planMantenimientoService } from "../PlanMantenimiento/services/planMantenimientoService";
import { adjuntosService } from "../OrdenTrabajo/services/adjuntosService";
import ModalInfoAviso from "./modals/ModalInfoAviso";


export default function ModalOTIndividual({
  isOpen,
  onClose,
  aviso,
  onGuardar,
  onGenerarNumeroOT,
  equipoActual = null,
  progresoEquipos = null,
}) {
  const [mostrarConfirmacionSalida, setMostrarConfirmacionSalida] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarInfoAviso, setMostrarInfoAviso] = useState(false);
  const [tratamientoData, setTratamientoData] = useState(null);
  const [archivosAdjuntos, setArchivosAdjuntos] = useState([]);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);

  const [trabajadores, setTrabajadores] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [cargandoTrabajadores, setCargandoTrabajadores] = useState(false);
  const [equipoDetalleModal, setEquipoDetalleModal] = useState(false);
  const [equipoDetalleData, setEquipoDetalleData] = useState(null);
  const [cargandoEquipoDetalle, setCargandoEquipoDetalle] = useState(false);
  
  const [planesDisponibles, setPlanesDisponibles] = useState([]);
  const [numeroOTGenerado, setNumeroOTGenerado] = useState("");

  const [formData, setFormData] = useState({
    descripcionGeneral: "",
    supervisorId: "",
    fechaProgramadaInicio: "",
    fechaProgramadaFin: "",
    observaciones: "",
    // Datos específicos del equipo
    descripcionEquipo: "",
    tipoActividad: "Mantenimiento Preventivo",
    tipoActividadPersonalizada: "",
    prioridad: "MEDIA",
    planMantenimientoId: null,
    planMantenimiento: null,
    actividadesPlan: [],
    trabajadoresAsignados: [],
    encargadoId: null,
    fechaInicioProgramada: "",
    fechaFinProgramada: "",
    adjuntosEquipo: [],
    subiendoAdjuntosEquipo: false
  });

  const [errors, setErrors] = useState({});

  // Detectar si hay equipos pendientes
  const hayEquiposPendientes = progresoEquipos && progresoEquipos.actual < progresoEquipos.total;

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

  useEffect(() => {
    if (mostrarInfoAviso && aviso?.id && !tratamientoData) {
      getTratamientoByAviso(aviso.id)
        .then(data => {
          setTratamientoData(data);
        })
        .catch(err => {
          console.error("Error al cargar tratamiento:", err);
        });
    }
  }, [mostrarInfoAviso, aviso?.id]);

  const cargarPlanesEquipo = async () => {
    if (!equipoActual?.id) return;
    
    try {
      const planes = await planMantenimientoService.getPlanesByEquipo(equipoActual.id);
      setPlanesDisponibles(planes);
    } catch (error) {
      console.error("Error cargando planes del equipo", error);
    }
  };

  const handleVerDetallesEquipo = async () => {
    if (!equipoActual?.id) return;
    
    setEquipoDetalleModal(true);
    setCargandoEquipoDetalle(true);
    
    try {
      const equipos = await equipoService.getEquipos();
      const equipo = equipos.find(e => e.id === equipoActual.id);
      setEquipoDetalleData(equipo);
    } catch (err) {
      console.error("Error cargando detalles del equipo:", err);
    } finally {
      setCargandoEquipoDetalle(false);
    }
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

  const handleUploadAdjuntosEquipo = async (files) => {
    try {
      setFormData(prev => ({ ...prev, subiendoAdjuntosEquipo: true }));
      const data = await adjuntosService.uploadArchivos(files);
      setFormData(prev => ({
        ...prev,
        adjuntosEquipo: [...prev.adjuntosEquipo, ...data],
        subiendoAdjuntosEquipo: false
      }));
    } catch (err) {
      console.error("Error subiendo adjuntos equipo", err);
      alert("Error subiendo archivos del equipo");
      setFormData(prev => ({ ...prev, subiendoAdjuntosEquipo: false }));
    }
  };

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

    // Validaciones del equipo
    if (!formData.descripcionEquipo.trim()) {
      newErrors.descripcionEquipo = "La descripción del trabajo es obligatoria";
    }

    if (!formData.trabajadoresAsignados || formData.trabajadoresAsignados.length === 0) {
      newErrors.trabajadores = "Debe asignar al menos un trabajador";
    }

    if (!formData.encargadoId) {
      newErrors.encargado = "Debe seleccionar un encargado";
    }

    if (!formData.fechaInicioProgramada) {
      newErrors.fechaInicioProgramada = "Fecha de inicio requerida";
    }

    if (!formData.fechaFinProgramada) {
      newErrors.fechaFinProgramada = "Fecha de fin requerida";
    }

    if (formData.fechaInicioProgramada && formData.fechaFinProgramada) {
      if (new Date(formData.fechaFinProgramada) < new Date(formData.fechaInicioProgramada)) {
        newErrors.fechaFinProgramada = "La fecha fin debe ser posterior a inicio";
      }
    }

    if (formData.tipoActividad === "Otro" && !formData.tipoActividadPersonalizada?.trim()) {
      newErrors.tipoActividadPersonalizada = "Especifica el tipo de actividad";
    }

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
      equipos: [{
        equipoId: equipoActual.id,
        descripcionEquipo: formData.descripcionEquipo.trim(),
        tipoActividad:
          formData.tipoActividad === "Otro"
            ? formData.tipoActividadPersonalizada.trim()
            : formData.tipoActividad,
        prioridad: formData.prioridad,
        planMantenimientoId: formData.planMantenimientoId,
        actividades: formData.actividadesPlan,
        fechaInicioProgramada: new Date(formData.fechaInicioProgramada).toISOString(),
        fechaFinProgramada: new Date(formData.fechaFinProgramada).toISOString(),
        trabajadores: formData.trabajadoresAsignados.map(id => ({
          trabajadorId: id,
          esEncargado: id === formData.encargadoId
        })),
        adjuntos: formData.adjuntosEquipo
      }],
      adjuntos: archivosAdjuntos
    };

    onGuardar(payload);
    setMostrarConfirmacion(false);
  };

  const handleCerrar = () => {
    if (hayEquiposPendientes) {
      setMostrarConfirmacionSalida(true);
    } else {
      onClose();
    }
  };

  const confirmarSalida = () => {
    setMostrarConfirmacionSalida(false);
    onClose();
  };

  if (!isOpen) return null;

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

  const getPrioridadColor = (prioridad) => {
    const colores = {
      ALTA: "bg-red-100 text-red-700 border-red-300",
      MEDIA: "bg-yellow-100 text-yellow-700 border-yellow-300",
      BAJA: "bg-green-100 text-green-700 border-green-300",
      CRITICA: "bg-red-200 text-red-900 border-red-400",
      Alta: "bg-red-100 text-red-700 border-red-300",
      Media: "bg-yellow-100 text-yellow-700 border-yellow-300",
      Baja: "bg-green-100 text-green-700 border-green-300"
    };
    return colores[prioridad] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col border border-slate-200">
          
          {/* HEADER CON PROGRESO */}
          <div className="relative bg-gradient-to-r from-violet-600 via-purple-700 to-violet-600 p-8 rounded-t-3xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                    <FileText className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-1">
                      Crear Orden de Trabajo Individual
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-bold">
                        {numeroOTGenerado}
                      </span>
                      <span className="text-violet-200">•</span>
                      <span className="text-violet-200">
                        Aviso: <span className="text-white font-bold">{aviso?.numeroAviso}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => 
                      setMostrarInfoAviso(true)
                    }
                    className="px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl transition-all duration-200 flex items-center gap-2 text-white font-semibold border border-white/30 hover:border-white/50"
                  >
                    <FileText className="w-5 h-5" />
                    Info del Aviso
                  </button>
                  
                  <button
                    onClick={handleCerrar}
                    className="p-2.5 hover:bg-white/15 rounded-xl transition-all duration-200"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* 🆕 BARRA DE PROGRESO */}
              {progresoEquipos && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold text-sm">
                      Equipo {progresoEquipos.actual} de {progresoEquipos.total}
                    </span>
                    <span className="text-violet-200 text-xs font-semibold">
                      {Math.round((progresoEquipos.actual / progresoEquipos.total) * 100)}% completado
                    </span>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(progresoEquipos.actual / progresoEquipos.total) * 100}%` 
                      }}
                    ></div>
                  </div>

                  {/* Info del equipo actual */}
                  {equipoActual && (
                    <div className="mt-3 flex items-center gap-3 bg-white/10 rounded-lg p-3 border border-white/20">
                      <Settings className="w-5 h-5 text-violet-200" />
                      <div>
                        <p className="text-white font-bold text-sm">
                          {equipoActual.nombre}
                        </p>
                        <p className="text-violet-200 text-xs">
                          {equipoActual.tipo} • {equipoActual.codigo}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CONTENIDO DEL FORMULARIO */}
          <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-slate-50 to-violet-50">
            <div className="space-y-6">
              
              {/* ALERTA DE PROGRESO */}
              {hayEquiposPendientes && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-900 mb-1">
                        Creando OT Individual - Equipo {progresoEquipos.actual} de {progresoEquipos.total}
                      </p>
                      <p className="text-xs text-blue-700">
                        Complete los datos para generar la orden de trabajo de este equipo específico.
                        <span className="block mt-1 font-bold">
                          ⚠️ Después de guardar, continuará con los {progresoEquipos.total - progresoEquipos.actual} equipos restantes.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* INFORMACIÓN GENERAL */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl">
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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium bg-white ${
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
                      placeholder="Describe el alcance general de la orden de trabajo..."
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none font-medium ${
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
                </div>
              </div>

              {/* FECHAS PROGRAMADAS GENERALES */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Periodo de Ejecución General</h4>
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

              {/* CONFIGURACIÓN DEL EQUIPO */}
              {equipoActual && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">{equipoActual.nombre}</h4>
                        <p className="text-sm text-slate-600">{equipoActual.tipo} • {equipoActual.codigo}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleVerDetallesEquipo}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalles
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Descripción del Trabajo */}
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                      <label className="block text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Descripción del Trabajo <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="descripcionEquipo"
                        value={formData.descripcionEquipo}
                        onChange={handleChange}
                        rows={3}
                        placeholder={`Detalla el trabajo específico a realizar en ${equipoActual.nombre}...`}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium resize-none ${
                          errors.descripcionEquipo ? 'border-red-400 bg-red-50' : 'border-amber-300 bg-white'
                        }`}
                      />
                      {errors.descripcionEquipo && (
                        <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          {errors.descripcionEquipo}
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
                          name="tipoActividad"
                          value={formData.tipoActividad}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
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
                          name="prioridad"
                          value={formData.prioridad}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                        >
                          <option value="BAJA">🟢 Baja</option>
                          <option value="MEDIA">🟡 Media</option>
                          <option value="ALTA">🟠 Alta</option>
                          <option value="CRITICA">🔴 Crítica</option>
                        </select>
                      </div>

                      {/* Actividad Personalizada */}
                      {formData.tipoActividad === "Otro" && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Especificar Tipo de Actividad <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="tipoActividadPersonalizada"
                            value={formData.tipoActividadPersonalizada}
                            onChange={handleChange}
                            placeholder="Describe el tipo de actividad personalizada..."
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium ${
                              errors.tipoActividadPersonalizada ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
                            }`}
                          />
                          {errors.tipoActividadPersonalizada && (
                            <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3 h-3" />
                              {errors.tipoActividadPersonalizada}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Plan de Mantenimiento */}
                    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          Plan de Mantenimiento
                        </label>
                        <button
                          onClick={cargarPlanesEquipo}
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold transition-all"
                        >
                          Cargar Planes
                        </button>
                      </div>

                      {planesDisponibles.length > 0 && (
                        <select
                          className="w-full px-4 py-2.5 border-2 border-indigo-300 rounded-lg bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                          value={formData.planMantenimientoId || ""}
                          onChange={async (e) => {
                            const planId = e.target.value;
                            
                            if (!planId) {
                              setFormData(prev => ({
                                ...prev,
                                planMantenimientoId: null,
                                planMantenimiento: null,
                                actividadesPlan: []
                              }));
                              return;
                            }

                            const plan = await planMantenimientoService.getPlanById(planId);
                            setFormData(prev => ({
                              ...prev,
                              planMantenimientoId: planId,
                              planMantenimiento: plan,
                              actividadesPlan: plan.actividades.map((a) => ({
                                planMantenimientoActividadId: a.id,
                                componente: a.componente,
                                tarea: a.tarea,
                                tipoTrabajo: a.tipoTrabajo,
                                duracionEstimadaMin: a.duracionMinutos,
                                estado: "PENDIENTE",
                                observaciones: "",
                              }))
                            }));
                          }}
                        >
                          <option value="">— Trabajo manual (sin plan) —</option>
                          {planesDisponibles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Actividades del Plan */}
                      {formData.actividadesPlan.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-bold text-indigo-900 mb-2">Actividades incluidas:</p>
                          {formData.actividadesPlan.map((act, idx) => (
                            <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-indigo-200">
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
                          const seleccionado = formData.trabajadoresAsignados.includes(trab.id);
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
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      trabajadoresAsignados: [...prev.trabajadoresAsignados, trab.id]
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      trabajadoresAsignados: prev.trabajadoresAsignados.filter(id => id !== trab.id),
                                      encargadoId: prev.encargadoId === trab.id ? null : prev.encargadoId
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm font-medium text-slate-800">{trab.nombre}</span>
                            </label>
                          );
                        })}
                      </div>

                      {errors.trabajadores && (
                        <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          {errors.trabajadores}
                        </p>
                      )}

                      {/* Encargado */}
                      {formData.trabajadoresAsignados.length > 0 && (
                        <div className="mt-4">
                          <label className="block text-sm font-semibold text-purple-900 mb-2">
                            Encargado del Equipo <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="encargadoId"
                            value={formData.encargadoId || ""}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg bg-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                          >
                            <option value="">Seleccione un encargado</option>
                            {trabajadores
                              .filter(t => formData.trabajadoresAsignados.includes(t.id))
                              .map(t => (
                                <option key={t.id} value={t.id}>
                                  {t.nombre}
                                </option>
                              ))}
                          </select>
                          {errors.encargado && (
                            <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3 h-3" />
                              {errors.encargado}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Fechas Específicas */}
                    <div className="bg-sky-50 border-2 border-sky-200 rounded-xl p-4">
                      <h6 className="text-sm font-bold text-sky-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Programación Específica del Equipo
                      </h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-2">
                            Fecha/Hora Inicio <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            name="fechaInicioProgramada"
                            value={formData.fechaInicioProgramada}
                            onChange={handleChange}
                            className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-medium ${
                              errors.fechaInicioProgramada ? 'border-red-400 bg-red-50' : 'border-sky-300 bg-white'
                            }`}
                          />
                          {errors.fechaInicioProgramada && (
                            <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3 h-3" />
                              {errors.fechaInicioProgramada}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-2">
                            Fecha/Hora Fin <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            name="fechaFinProgramada"
                            value={formData.fechaFinProgramada}
                            onChange={handleChange}
                            className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-medium ${
                              errors.fechaFinProgramada ? 'border-red-400 bg-red-50' : 'border-sky-300 bg-white'
                            }`}
                          />
                          {errors.fechaFinProgramada && (
                            <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3 h-3" />
                              {errors.fechaFinProgramada}
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
                        onChange={(e) => handleUploadAdjuntosEquipo(e.target.files)}
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-600 file:text-white file:font-semibold hover:file:bg-violet-700 cursor-pointer"
                      />

                      {formData.subiendoAdjuntosEquipo && (
                        <div className="mt-3 flex items-center gap-2 text-violet-600">
                          <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-xs font-medium">Subiendo archivos...</p>
                        </div>
                      )}

                      {formData.adjuntosEquipo.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {formData.adjuntosEquipo.map((file, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-violet-600" />
                                <span className="text-sm font-medium text-slate-800">{file.nombre}</span>
                              </div>
                              <button
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    adjuntosEquipo: prev.adjuntosEquipo.filter((_, idx) => idx !== i)
                                  }));
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
              )}

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
                  className="w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-violet-600 file:to-purple-600 file:text-white file:font-bold hover:file:from-violet-700 hover:file:to-purple-700 cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-violet-400 transition-all"
                />

                {subiendoArchivos && (
                  <div className="mt-4 flex items-center gap-3 text-violet-600 bg-violet-50 p-4 rounded-xl border border-violet-200">
                    <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold">Subiendo archivos...</p>
                  </div>
                )}

                {archivosAdjuntos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Archivos adjuntos ({archivosAdjuntos.length})
                    </p>
                    {archivosAdjuntos.map((file, i) => (
                      <div key={i} className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-xl border border-violet-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-violet-600 rounded-lg">
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
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none font-medium bg-white"
                />
              </div>
            </div>
          </div>

          {/* FOOTER CON INFO DE EQUIPOS PENDIENTES */}
          <div className="p-6 border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-violet-50 rounded-b-3xl">
            {hayEquiposPendientes && (
              <div className="mb-4 bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">
                      Equipos pendientes de procesar
                    </p>
                    <p className="text-xs text-amber-700">
                      Quedan {progresoEquipos.total - progresoEquipos.actual} equipo(s) más después de este.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={handleCerrar}
                className="px-6 py-3 border-2 border-slate-400 rounded-xl hover:bg-white hover:border-slate-500 transition-all font-bold text-slate-700 flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                {hayEquiposPendientes ? "Cancelar Todo" : "Cancelar"}
              </button>

              <button
                onClick={handleSubmitInternal}
                className="px-8 py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700 text-white rounded-xl hover:from-violet-700 hover:via-purple-700 hover:to-violet-800 transition-all font-bold shadow-xl shadow-violet-500/40 flex items-center gap-3 transform hover:scale-105 active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                {hayEquiposPendientes ? `Guardar y Continuar (${progresoEquipos.actual}/${progresoEquipos.total})` : "Crear OT Individual"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE SALIDA */}
      {mostrarConfirmacionSalida && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-2 border-amber-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">¿Está seguro de salir?</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="text-slate-700">
                Está procesando <span className="font-bold text-violet-600">OTs individuales</span> para múltiples equipos.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-bold text-amber-900 mb-1">
                  ⚠️ Equipos pendientes de procesar:
                </p>
                <p className="text-sm text-amber-800">
                  <span className="font-bold text-lg">{progresoEquipos?.total - progresoEquipos?.actual}</span> de {progresoEquipos?.total} equipos aún sin OT
                </p>
              </div>
              <p className="text-sm text-slate-600">
                Si sale ahora, deberá volver a iniciar el proceso para los equipos restantes.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmacionSalida(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700"
              >
                Continuar procesando
              </button>
              <button
                onClick={confirmarSalida}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-bold shadow-lg shadow-red-500/30"
              >
                Salir de todos modos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-violet-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Confirmar Creación</h3>
            </div>
            
            <div className="space-y-2 mb-6 text-sm text-slate-700">
              <p><strong>OT:</strong> {numeroOTGenerado}</p>
              <p><strong>Equipo:</strong> {equipoActual?.nombre}</p>
              <p><strong>Supervisor:</strong> {supervisores.find(s => s.id === formData.supervisorId)?.nombre || 'N/A'}</p>
              {hayEquiposPendientes && (
                <p className="text-amber-600 font-bold">
                  Progreso: {progresoEquipos.actual}/{progresoEquipos.total} equipos
                </p>
              )}
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

     <ModalInfoAviso
  isOpen={mostrarInfoAviso}
  onClose={() => setMostrarInfoAviso(false)}
  aviso={aviso}
/>

    </>
  );
}