export default function ModalMantenimientoView({
  isOpen,
  onClose,
  wizardStep,
  setWizardStep,
  data,
}) {
  if (!isOpen || !data) return null;

  const ViewField = ({ label, value, fullWidth = false }) => (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'col-span-full' : ''}`}>
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}
      </label>
      <div className="p-3 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white text-sm text-gray-800 min-h-[42px] flex items-center">
        {value || <span className="text-gray-400">Sin información</span>}
      </div>
    </div>
  );

  const Badge = ({ children, variant = 'default' }) => {
    const variants = {
      default: 'bg-gray-100 text-gray-700',
      success: 'bg-green-100 text-green-700',
      warning: 'bg-yellow-100 text-yellow-700',
      info: 'bg-blue-100 text-blue-700',
      danger: 'bg-red-100 text-red-700',
      purple: 'bg-purple-100 text-purple-700',
      indigo: 'bg-indigo-100 text-indigo-700',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]}`}>
        {children}
      </span>
    );
  };

  const getPrioridadVariant = (prioridad) => {
    switch (prioridad?.toLowerCase()) {
      case 'alta': return 'danger';
      case 'media': return 'warning';
      case 'baja': return 'info';
      default: return 'default';
    }
  };

  const getEstadoVariant = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'tratado': return 'success';
      case 'con ot': return 'info';
      case 'pendiente': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      {/* MODAL RESPONSIVO */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">

        {/* ---------------- HEADER ---------------- */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Aviso de Mantenimiento
              </h2>
              <p className="text-blue-100 text-sm">
                {data.numeroAviso || 'Sin número de aviso'}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={getPrioridadVariant(data.prioridad)}>
                {data.prioridad || 'Sin prioridad'}
              </Badge>
              <Badge variant={getEstadoVariant(data.estadoAviso)}>
                {data.estadoAviso || 'Sin estado'}
              </Badge>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-6 border-b border-blue-500 pb-2">
            {[
              { num: 1, label: 'Información General' },
              { num: 2, label: 'Cliente y Contacto' },
              { num: 3, label: 'Equipos y Seguimiento' }
            ].map((step) => (
              <button
                key={step.num}
                className={`pb-2 font-semibold transition-all ${
                  wizardStep === step.num
                    ? "text-white border-b-2 border-white"
                    : "text-blue-200 hover:text-white"
                }`}
                onClick={() => setWizardStep(step.num)}
              >
                {step.label}
              </button>
            ))}
          </div>

          <p className="text-blue-100 font-medium mt-3 text-sm">
            Paso {wizardStep} de 3
          </p>
        </div>

        {/* ---------------- CONTENIDO ---------------- */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">

          {/* === PASO 1: INFORMACIÓN GENERAL === */}
          {wizardStep === 1 && (
            <div className="space-y-6">
              {/* Sección: Datos del Aviso */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded"></span>
                  Datos del Aviso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ViewField label="N° Orden de Venta" value={data.ordenVenta} />
                  <ViewField label="Centro de Costo" value={data.centroCosto} />
                  <ViewField label="Número de Aviso" value={data.numeroAviso} />
                  <ViewField label="Tipo de Aviso" value={data.tipoAviso} />
                  <ViewField label="Tipo de Mantenimiento" value={data.tipoMantenimiento} />
                  <ViewField label="Producto" value={data.producto} />
                  <ViewField label="Prioridad" value={data.prioridad} />
                  <ViewField label="Estado del Aviso" value={data.estadoAviso} />
                  <ViewField 
                    label="Fecha de Atención" 
                    value={formatDate(data.fechaAtencion)} 
                  />
                </div>
              </div>

              {/* Sección: Descripción */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded"></span>
                  Descripción
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <ViewField 
                    label="Descripción Resumida" 
                    value={data.descripcionResumida} 
                    fullWidth 
                  />
                  <ViewField 
                    label="Descripción Detallada" 
                    value={data.descripcion} 
                    fullWidth 
                  />
                </div>
              </div>

              {/* Sección: Ubicación */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded"></span>
                  Ubicación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ViewField label="Ubicación Técnica" value={data.ubicacionTecnica} />
                  <ViewField label="Dirección de Atención" value={data.direccionAtencion} />
                </div>
              </div>
            </div>
          )}

          {/* === PASO 2: CLIENTE Y CONTACTO === */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              {/* Sección: Datos del Cliente */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded"></span>
                  Datos del Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ViewField label="ID Cliente" value={data.cliente} />
                  <ViewField label="N° Orden Cliente" value={data.ordenCliente} />
                  <ViewField label="Sede" value={data.sede} />
                  <ViewField label="Almacén" value={data.almacen} />
                </div>
              </div>

              {/* Sección: Contacto */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded"></span>
                  Información de Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ViewField label="Nombre del Contacto" value={data.nombreContacto} />
                  <ViewField label="Correo Electrónico" value={data.correoContacto} />
                  <ViewField label="Número de Teléfono" value={data.numeroContacto} />
                </div>
              </div>

              {/* Sección: Solicitante */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded"></span>
                  Información del Solicitante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ViewField 
                    label="Solicitante" 
                    value={data.solicitante?.nombreApellido} 
                  />
                  <ViewField 
                    label="Usuario" 
                    value={data.solicitante?.alias} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* === PASO 3: EQUIPOS Y SEGUIMIENTO === */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              {/* Sección: Supervisor */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded"></span>
                  Asignación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ViewField 
                    label="Supervisor Asignado" 
                    value={data.supervisorAsignado} 
                  />
                  <ViewField 
                    label="Creado Por" 
                    value={data.creador?.nombreApellido} 
                  />
                </div>
              </div>

              {/* Sección: Ubicaciones Técnicas */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1 h-6 bg-purple-600 rounded"></span>
                    Ubicaciones Técnicas
                  </h3>
                  <Badge variant="purple">
                    {data.ubicacionesTecnicas?.length || 0} ubicaciones
                  </Badge>
                </div>
                
                {data.ubicacionesTecnicas && data.ubicacionesTecnicas.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {data.ubicacionesTecnicas.map((ubicacion) => (
                      <div 
                        key={ubicacion.codigo || Math.random()} 
                        className="group relative p-5 border-2 border-purple-100 rounded-xl bg-gradient-to-br from-purple-50 via-white to-purple-50 hover:border-purple-300 hover:shadow-lg transition-all duration-300"
                      >
                        {/* Indicador visual */}
                        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-500 to-purple-600 rounded-l-xl"></div>
                        
                        <div className="ml-3">
                          {/* Header con nombre */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <h4 className="font-bold text-gray-900 text-base">
                                  {ubicacion.nombre || 'Sin nombre'}
                                </h4>
                              </div>
                            </div>
                          </div>

                          {/* Información detallada */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-500 uppercase w-20">Código:</span>
                              <span className="text-sm font-mono font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">
                                {ubicacion.codigo || '—'}
                              </span>
                            </div>
                            
                            {ubicacion.descripcion && (
                              <div className="flex gap-2 pt-2 border-t border-purple-100">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Descripción:</span>
                                <p className="text-sm text-gray-700 flex-1">
                                  {ubicacion.descripcion}
                                </p>
                              </div>
                            )}

                            {ubicacion.direccion && (
                              <div className="flex gap-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Dirección:</span>
                                <p className="text-sm text-gray-700 flex-1">
                                  {ubicacion.direccion}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-dashed border-gray-200">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm font-medium">No hay ubicaciones técnicas asignadas</p>
                    <p className="text-gray-400 text-xs mt-1">Las ubicaciones aparecerán aquí cuando sean asignadas</p>
                  </div>
                )}
              </div>

              {/* Sección: Equipos Relacionados */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1 h-6 bg-indigo-600 rounded"></span>
                    Equipos Relacionados
                  </h3>
                  <Badge variant="indigo">
                    {data.equiposRelacion?.length || 0} equipos
                  </Badge>
                </div>
                
                {data.equiposRelacion && data.equiposRelacion.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {data.equiposRelacion.map((rel) => (
                      <div 
                        key={rel.equipo?.codigo || Math.random()} 
                        className="group relative p-5 border-2 border-indigo-100 rounded-xl bg-gradient-to-br from-indigo-50 via-white to-indigo-50 hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
                      >
                        {/* Indicador visual */}
                        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-l-xl"></div>
                        
                        <div className="ml-3">
                          {/* Header con nombre y badge */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                                <h4 className="font-bold text-gray-900 text-base">
                                  {rel.equipo?.nombre || 'Sin nombre'}
                                </h4>
                              </div>
                            </div>
                            {rel.equipo?.tipo && (
                              <Badge variant="indigo">
                                {rel.equipo.tipo}
                              </Badge>
                            )}
                          </div>

                          {/* Información detallada */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-500 uppercase w-20">Código:</span>
                              <span className="text-sm font-mono font-semibold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                                {rel.equipo?.codigo || '—'}
                              </span>
                            </div>
                            
                            {rel.equipo?.descripcion && (
                              <div className="flex gap-2 pt-2 border-t border-indigo-100">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Descripción:</span>
                                <p className="text-sm text-gray-700 flex-1">
                                  {rel.equipo.descripcion}
                                </p>
                              </div>
                            )}

                            {rel.equipo?.modelo && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase w-20">Modelo:</span>
                                <span className="text-sm text-gray-700">
                                  {rel.equipo.modelo}
                                </span>
                              </div>
                            )}

                            {rel.equipo?.marca && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase w-20">Marca:</span>
                                <span className="text-sm text-gray-700">
                                  {rel.equipo.marca}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-dashed border-gray-200">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    <p className="text-gray-500 text-sm font-medium">No hay equipos relacionados</p>
                    <p className="text-gray-400 text-xs mt-1">Los equipos aparecerán aquí cuando sean asignados</p>
                  </div>
                )}
              </div>

              {/* Sección: Tratamientos */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1 h-6 bg-green-600 rounded"></span>
                    Historial de Tratamientos
                  </h3>
                  <Badge variant="success">
                    {data.tratamientos?.length || 0} registros
                  </Badge>
                </div>
                
                {data.tratamientos && data.tratamientos.length > 0 ? (
                  <div className="space-y-3">
                    {data.tratamientos.map((trat, index) => (
                      <div 
                        key={index}
                        className="group relative p-4 border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-white rounded-lg hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                                <span className="text-green-700 font-bold text-sm">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  Tratamiento #{index + 1}
                                </p>
                                {trat.fechaTratamiento && (
                                  <p className="text-xs text-gray-500">
                                    {formatDateTime(trat.fechaTratamiento)}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {trat.descripcion && (
                              <div className="ml-11 mt-2">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {trat.descripcion}
                                </p>
                              </div>
                            )}
                            
                            {trat.observaciones && (
                              <div className="ml-11 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-xs text-yellow-800">
                                  <span className="font-semibold">Observaciones:</span> {trat.observaciones}
                                </p>
                              </div>
                            )}

                            {trat.realizadoPor && (
                              <div className="ml-11 mt-2 flex items-center gap-2 text-xs text-gray-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Realizado por: <span className="font-medium">{trat.realizadoPor}</span></span>
                              </div>
                            )}
                          </div>

                          {trat.estado && (
                            <Badge variant={trat.estado === 'completado' ? 'success' : 'warning'}>
                              {trat.estado}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-dashed border-gray-200">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <p className="text-gray-500 text-sm font-medium">No hay tratamientos registrados</p>
                    <p className="text-gray-400 text-xs mt-1">El historial de tratamientos aparecerá aquí</p>
                  </div>
                )}
              </div>

              {/* Sección: Auditoría */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-gray-600 rounded"></span>
                  Información de Auditoría
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ViewField 
                    label="Fecha de Creación" 
                    value={formatDateTime(data.createdAt)} 
                  />
                  <ViewField 
                    label="Última Actualización" 
                    value={formatDateTime(data.updatedAt)} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ---------------- FOOTER ---------------- */}
        <div className="p-4 border-t bg-white flex justify-between items-center">
          <button
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
            onClick={() => {
              if (wizardStep === 1) onClose();
              else setWizardStep((prev) => prev - 1);
            }}
          >
            {wizardStep === 1 ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cerrar
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Anterior
              </>
            )}
          </button>

          {wizardStep < 3 ? (
            <button
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              onClick={() => setWizardStep((prev) => prev + 1)}
            >
              Siguiente
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              onClick={onClose}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Finalizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}