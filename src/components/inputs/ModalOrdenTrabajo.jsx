import { X, FileText, Calendar, User, AlertCircle, ClipboardCheck, Plus, Trash2, Settings, Info, Zap, Users } from "lucide-react";
import { useState, useEffect } from "react";

export default function ModalOrdenTrabajo({
  isOpen,
  onClose,
  aviso,
  onGuardar,
  supervisores = [], // Lista de supervisores disponibles
  onGenerarNumeroOT, // Función para obtener el número autogenerado
}) {
  const [modoAgrupacion] = useState("grupal"); // siempre grupal
  const [numeroOTGenerado, setNumeroOTGenerado] = useState("");
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  
  const [formData, setFormData] = useState({
    descripcionGeneral: "",
    supervisorId: "",
    fechaProgramadaInicio: "",
    fechaProgramadaFin: "",
    observaciones: "",
  });

  const [equipos, setEquipos] = useState([]);
  const [errors, setErrors] = useState({});

  // Inicializar con datos del aviso al abrir
  useEffect(() => {
    if (isOpen && aviso) {
      // Generar número de OT automáticamente
      const numeroGenerado = onGenerarNumeroOT ? onGenerarNumeroOT() : `OT-${Date.now().toString().slice(-6)}`;
      setNumeroOTGenerado(numeroGenerado);

      // Prellenar descripción desde aviso
      setFormData(prev => ({
        ...prev,
        descripcionGeneral: aviso.descripcion || "",
        supervisorId: aviso.supervisorSugerido || "",
        fechaProgramadaInicio: aviso.fechaSugerida || "",
        fechaProgramadaFin: aviso.fechaSugeridaFin || "",
      }));

      // Prellenar equipos desde aviso.equiposRelacion
      if (aviso.equiposRelacion && aviso.equiposRelacion.length > 0) {
        const equiposIniciales = aviso.equiposRelacion.map(equipoRel => {
          // Buscar personal asignado desde tratamientos si existe
          const tratamiento = aviso.tratamientos?.find(t => 
            t.requerimientos?.some(r => r.equipoId === equipoRel.id)
          );
          const requerimiento = tratamiento?.requerimientos?.find(r => r.equipoId === equipoRel.id);

          return {
            equipoId: equipoRel.id,
            equipoNombre: equipoRel.nombre || equipoRel.codigo || "Equipo sin nombre",
            descripcionEquipo: equipoRel.descripcionSugerida || "",
            personalAsignado: requerimiento?.personalAsignado || "",
            tipoActividad: requerimiento?.tipoActividad || "Mantenimiento Preventivo",
            tipoActividadPersonalizada: "",
            fechaInicioProgramada: "",
            fechaFinProgramada: "",
            estado: "PENDIENTE"
          };
        });
        setEquipos(equiposIniciales);
      } else if (aviso?.tipoAviso === "venta") {
        // Venta: equipos opcionales, empezar vacío
        setEquipos([]);
      } else {
        // Si no hay equipos, inicializar con uno vacío
        setEquipos([{
          equipoId: "",
          equipoNombre: "",
          descripcionEquipo: "",
          personalAsignado: "",
          tipoActividad: "Mantenimiento Preventivo",
          tipoActividadPersonalizada: "",
          fechaInicioProgramada: "",
          fechaFinProgramada: "",
          estado: "PENDIENTE"
        }]);
      }
    }
  }, [isOpen, aviso, onGenerarNumeroOT]);

  if (!isOpen) return null;

  const esVenta = aviso?.tipoAviso === "venta";

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
    
    // Si cambia el equipoId, actualizar también el nombre
    if (field === 'equipoId') {
      const equipoSeleccionado = aviso?.equiposRelacion?.find(e => e.id === value);
      newEquipos[index].equipoNombre = equipoSeleccionado?.nombre || equipoSeleccionado?.codigo || "";
    }
    
    newEquipos[index][field] = value;
    setEquipos(newEquipos);
    
    if (errors[`equipo_${index}_${field}`]) {
      setErrors(prev => ({ ...prev, [`equipo_${index}_${field}`]: null }));
    }
  };

  const agregarEquipo = () => {
    setEquipos([...equipos, {
      equipoId: "",
      equipoNombre: "",
      descripcionEquipo: "",
      personalAsignado: "",
      tipoActividad: "Mantenimiento Preventivo",
      tipoActividadPersonalizada: "",
      fechaInicioProgramada: "",
      fechaFinProgramada: "",
      estado: "PENDIENTE"
    }]);
  };

  const eliminarEquipo = (index) => {
    if (equipos.length > 1) {
      setEquipos(equipos.filter((_, i) => i !== index));
    }
  };

  const validarEquiposDuplicados = () => {
    const equiposIds = equipos.map(e => e.equipoId).filter(id => id);
    const duplicados = equiposIds.filter((id, index) => equiposIds.indexOf(id) !== index);
    return duplicados.length === 0;
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

    // Para venta no se validan equipos (son opcionales)
    if (!esVenta) {
    // Validar equipos duplicados
    if (!validarEquiposDuplicados()) {
      newErrors.equiposDuplicados = "No puedes asignar el mismo equipo más de una vez";
    }

    // Validar equipos
    equipos.forEach((equipo, index) => {
      if (!equipo.equipoId) {
        newErrors[`equipo_${index}_equipoId`] = "Debes seleccionar un equipo";
      }
      
      if (!equipo.descripcionEquipo.trim()) {
        newErrors[`equipo_${index}_descripcionEquipo`] = "La descripción del trabajo es obligatoria";
      }
      
      if (!equipo.personalAsignado.trim()) {
        newErrors[`equipo_${index}_personalAsignado`] = "El personal asignado es requerido";
      }

      if (equipo.tipoActividad === "Otro" && !equipo.tipoActividadPersonalizada.trim()) {
        newErrors[`equipo_${index}_tipoActividadPersonalizada`] = "Especifica el tipo de actividad";
      }
      
      if (!equipo.fechaInicioProgramada) {
        newErrors[`equipo_${index}_fechaInicioProgramada`] = "La fecha de inicio es requerida";
      }
      
      if (!equipo.fechaFinProgramada) {
        newErrors[`equipo_${index}_fechaFinProgramada`] = "La fecha de fin es requerida";
      }
      
      if (equipo.fechaInicioProgramada && equipo.fechaFinProgramada) {
        if (new Date(equipo.fechaFinProgramada) < new Date(equipo.fechaInicioProgramada)) {
          newErrors[`equipo_${index}_fechaFinProgramada`] = "La fecha de fin debe ser posterior a la de inicio";
        }
      }

      // Validación cruzada: fechas de equipo deben estar dentro del rango de la OT
      if (formData.fechaProgramadaInicio && equipo.fechaInicioProgramada) {
        const inicioOT = new Date(formData.fechaProgramadaInicio);
        const inicioEquipo = new Date(equipo.fechaInicioProgramada);
        if (inicioEquipo < inicioOT) {
          newErrors[`equipo_${index}_fechaInicioProgramada`] = "Debe estar dentro del periodo de la OT";
        }
      }

      if (formData.fechaProgramadaFin && equipo.fechaFinProgramada) {
        const finOT = new Date(formData.fechaProgramadaFin);
        const finEquipo = new Date(equipo.fechaFinProgramada);
        if (finEquipo > finOT) {
          newErrors[`equipo_${index}_fechaFinProgramada`] = "Debe estar dentro del periodo de la OT";
        }
      }
    });
    } // fin if (!esVenta)

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitInternal = () => {
    if (!validateForm()) return;
    setMostrarConfirmacion(true);
  };

  const confirmarCreacion = () => {
    const tratamientoId = aviso?.tratamientos?.[0]?.id || null;

    if (!aviso?.id) {
      alert("El aviso no es válido");
      return;
    }

    // Para venta: equipos solo si existen y tienen equipoId
    const equiposPayload = esVenta
      ? equipos.filter(eq => eq.equipoId).map(eq => ({
          equipoId: eq.equipoId,
          descripcionEquipo: eq.descripcionEquipo?.trim() || "",
          personalAsignado: formData.supervisorId,
          tipoActividad: "Venta",
          fechaInicioProgramada: formData.fechaProgramadaInicio,
          fechaFinProgramada: formData.fechaProgramadaFin,
          estado: "PENDIENTE"
        }))
      : equipos.map(eq => ({
          equipoId: eq.equipoId,
          descripcionEquipo: eq.descripcionEquipo.trim(),
          personalAsignado: eq.personalAsignado.trim(),
          tipoActividad: eq.tipoActividad === "Otro" ? eq.tipoActividadPersonalizada.trim() : eq.tipoActividad,
          fechaInicioProgramada: eq.fechaInicioProgramada,
          fechaFinProgramada: eq.fechaFinProgramada,
          estado: eq.estado
        }));

    const payload = {
      numeroOT: numeroOTGenerado,
      descripcionGeneral: formData.descripcionGeneral.trim(),
      avisoId: aviso.id,
      tratamientoId,
      supervisorId: formData.supervisorId,
      fechaProgramadaInicio: formData.fechaProgramadaInicio,
      fechaProgramadaFin: formData.fechaProgramadaFin,
      observaciones: formData.observaciones || null,
      estado: "CREADO",
      modoAgrupacion,
      equipos: equiposPayload,
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

  const equiposDisponibles = aviso?.equiposRelacion || [];
  const equiposYaSeleccionados = equipos.map(e => e.equipoId).filter(Boolean);

  const getEstadoBadgeColor = (estado) => {
    const colores = {
      PENDIENTE: "bg-amber-100 text-amber-700 border-amber-300",
      EN_PROCESO: "bg-blue-100 text-blue-700 border-blue-300",
      FINALIZADO: "bg-green-100 text-green-700 border-green-300"
    };
    return colores[estado] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getsupervisorId = (id) => {
    const supervisor = supervisores.find(s => s.id === id);
    return supervisor ? supervisor.nombre : id;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-slate-200/50">
          
          {/* HEADER */}
          <div className="relative p-8 border-b border-slate-200/70 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-t-3xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/30 transform rotate-3">
                  <FileText className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-3xl font-bold text-white tracking-tight">
                      Nueva Orden de Trabajo
                    </h3>
                    <span className="px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-lg text-amber-300 text-sm font-bold">
                      {numeroOTGenerado}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <p className="text-slate-300 font-medium">
                      Aviso: <span className="text-amber-400 font-bold">{aviso?.numeroAviso}</span>
                    </p>
                    <span className="text-slate-500">•</span>
                    <p className="text-slate-300 font-medium">
                      Estado: <span className="text-emerald-400 font-bold">{aviso?.estado}</span>
                    </p>
                    {aviso?.cliente && (
                      <>
                        <span className="text-slate-500">•</span>
                        <p className="text-slate-300 font-medium">
                          Cliente: <span className="text-blue-400 font-bold">{aviso.cliente}</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 group"
              >
                <X className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* CONTENIDO */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="space-y-8">
              
              {/* INFORMACIÓN BÁSICA */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <ClipboardCheck className="w-5 h-5 text-white" />
                  </div>
                  Información Básica
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Número OT (Solo lectura) */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                      Número de OT <span className="text-green-500">(Autogenerado)</span>
                    </label>
                    <div className="w-full px-4 py-3 border-2 border-green-300 rounded-xl bg-green-50 font-bold text-green-700 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      {numeroOTGenerado}
                    </div>
                  </div>

                  {/* Supervisor */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                      Supervisor Responsable <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="supervisorId"
                      value={formData.supervisorId}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${
                        errors.supervisorId ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <option value="">Seleccionar supervisor...</option>
                      {supervisores.map(supervisor => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.nombre} - {supervisor.cargo || "Supervisor"}
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
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                      Descripción General <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="descripcionGeneral"
                      value={formData.descripcionGeneral}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Descripción detallada de la orden de trabajo..."
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-medium ${
                        errors.descripcionGeneral ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
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

              {/* FECHAS PROGRAMADAS */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  Periodo General de la OT
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                      Fecha Inicio Programada <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="fechaProgramadaInicio"
                      value={formData.fechaProgramadaInicio}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium ${
                        errors.fechaProgramadaInicio ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
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
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                      Fecha Fin Programada <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="fechaProgramadaFin"
                      value={formData.fechaProgramadaFin}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium ${
                        errors.fechaProgramadaFin ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
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
              {esVenta ? (
                /* VENTA: equipos opcionales — solo mostrar los del aviso si existen */
                equiposDisponibles.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-200/60">
                    <h4 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      Equipos del Aviso
                      <span className="text-sm font-normal text-slate-500 ml-1">(incluidos automáticamente)</span>
                    </h4>
                    <div className="space-y-3">
                      {equiposDisponibles.map((eq) => (
                        <div key={eq.id} className="flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Settings className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{eq.nombre || eq.codigo || "Equipo sin nombre"}</p>
                            {eq.tipoEquipo && <p className="text-xs text-slate-500">{eq.tipoEquipo}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                /* MANTENIMIENTO / INSTALACIÓN: formulario completo de equipos */
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      Equipos Asignados
                    </h4>
                    <button
                      onClick={agregarEquipo}
                      disabled={equipos.length >= equiposDisponibles.length}
                      className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all font-semibold shadow-lg shadow-violet-500/30 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Equipo
                    </button>
                  </div>

                  {errors.equiposDuplicados && (
                    <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-semibold">{errors.equiposDuplicados}</span>
                    </div>
                  )}

                  {equiposDisponibles.length === 0 && (
                    <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-xl text-center">
                      <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                      <p className="text-amber-800 font-semibold">No hay equipos disponibles en este aviso</p>
                    </div>
                  )}

                  <div className="space-y-5">
                    {equipos.map((equipo, index) => (
                      <div key={index} className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-2 border-slate-200">
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${getEstadoBadgeColor(equipo.estado)}`}>
                            {equipo.estado}
                          </span>
                          {equipos.length > 1 && (
                            <button
                              onClick={() => eliminarEquipo(index)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="mb-5">
                          <span className="inline-block px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-full">
                            Equipo #{index + 1}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-20">
                          {/* Selector de Equipo */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Seleccionar Equipo <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={equipo.equipoId}
                              onChange={(e) => handleEquipoChange(index, 'equipoId', e.target.value)}
                              className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium ${
                                errors[`equipo_${index}_equipoId`] ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white'
                              }`}
                            >
                              <option value="">-- Seleccionar equipo --</option>
                              {equiposDisponibles.map(equipoDisp => (
                                <option
                                  key={equipoDisp.id}
                                  value={equipoDisp.id}
                                  disabled={equiposYaSeleccionados.includes(equipoDisp.id) && equipoDisp.id !== equipo.equipoId}
                                >
                                  {equipoDisp.nombre || equipoDisp.codigo} - {equipoDisp.tipo || "Sin tipo"}
                                  {equiposYaSeleccionados.includes(equipoDisp.id) && equipoDisp.id !== equipo.equipoId ? " (Ya asignado)" : ""}
                                </option>
                              ))}
                            </select>
                            {errors[`equipo_${index}_equipoId`] && (
                              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                {errors[`equipo_${index}_equipoId`]}
                              </p>
                            )}
                          </div>

                          {/* Descripción del Trabajo */}
                          <div className="md:col-span-2 bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
                            <label className="block text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Descripción del Trabajo a Realizar <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={equipo.descripcionEquipo}
                              onChange={(e) => handleEquipoChange(index, 'descripcionEquipo', e.target.value)}
                              rows={2}
                              placeholder="Describe detalladamente el trabajo específico para este equipo..."
                              className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium resize-none ${
                                errors[`equipo_${index}_descripcionEquipo`] ? 'border-red-400 bg-red-50/50' : 'border-amber-300 bg-white'
                              }`}
                            />
                            {errors[`equipo_${index}_descripcionEquipo`] && (
                              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                {errors[`equipo_${index}_descripcionEquipo`]}
                              </p>
                            )}
                          </div>

                          {/* Personal Asignado */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Personal Asignado <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={equipo.personalAsignado}
                              onChange={(e) => handleEquipoChange(index, 'personalAsignado', e.target.value)}
                              placeholder="Nombre del técnico responsable"
                              className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium ${
                                errors[`equipo_${index}_personalAsignado`] ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white'
                              }`}
                            />
                            {errors[`equipo_${index}_personalAsignado`] && (
                              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                {errors[`equipo_${index}_personalAsignado`]}
                              </p>
                            )}
                          </div>

                          {/* Tipo de Actividad */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Tipo de Actividad <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={equipo.tipoActividad}
                              onChange={(e) => handleEquipoChange(index, 'tipoActividad', e.target.value)}
                              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium bg-white"
                            >
                              {tiposActividad.map(tipo => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                              ))}
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
                                value={equipo.tipoActividadPersonalizada}
                                onChange={(e) => handleEquipoChange(index, 'tipoActividadPersonalizada', e.target.value)}
                                placeholder="Escribe el tipo de actividad..."
                                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium ${
                                  errors[`equipo_${index}_tipoActividadPersonalizada`] ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white'
                                }`}
                              />
                              {errors[`equipo_${index}_tipoActividadPersonalizada`] && (
                                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                                  <AlertCircle className="w-3 h-3" />
                                  {errors[`equipo_${index}_tipoActividadPersonalizada`]}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Fechas del Equipo */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Fecha Inicio <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="datetime-local"
                              value={equipo.fechaInicioProgramada}
                              onChange={(e) => handleEquipoChange(index, 'fechaInicioProgramada', e.target.value)}
                              className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium ${
                                errors[`equipo_${index}_fechaInicioProgramada`] ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white'
                              }`}
                            />
                            {errors[`equipo_${index}_fechaInicioProgramada`] && (
                              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                {errors[`equipo_${index}_fechaInicioProgramada`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Fecha Fin <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="datetime-local"
                              value={equipo.fechaFinProgramada}
                              onChange={(e) => handleEquipoChange(index, 'fechaFinProgramada', e.target.value)}
                              className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium ${
                                errors[`equipo_${index}_fechaFinProgramada`] ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white'
                              }`}
                            />
                            {errors[`equipo_${index}_fechaFinProgramada`] && (
                              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                {errors[`equipo_${index}_fechaFinProgramada`]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OBSERVACIONES */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Observaciones Generales
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Observaciones adicionales sobre la orden de trabajo..."
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-medium bg-white hover:border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-6 border-t border-slate-200/70 bg-gradient-to-r from-slate-50 to-slate-100 flex items-center justify-between rounded-b-3xl">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-slate-300 rounded-xl hover:bg-white transition-all font-bold text-slate-700 hover:border-slate-400"
            >
              Cancelar
            </button>

            <button
              onClick={handleSubmitInternal}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 transition-all font-bold shadow-xl shadow-orange-500/40 flex items-center gap-2.5 transform hover:scale-105 active:scale-95"
            >
              <FileText className="w-5 h-5" strokeWidth={2.5} />
              Crear Orden de Trabajo
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Confirmar Creación</h3>
            </div>
            
            <p className="text-slate-700 mb-6">
              ¿Estás seguro de crear la Orden de Trabajo <strong>{numeroOTGenerado}</strong>
              {esVenta
                ? equiposDisponibles.length > 0
                  ? ` con ${equiposDisponibles.length} equipo(s) del aviso?`
                  : " (sin equipos asignados)?"
                : ` con ${equipos.length} equipo(s) asignado(s)?`}
            </p>

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