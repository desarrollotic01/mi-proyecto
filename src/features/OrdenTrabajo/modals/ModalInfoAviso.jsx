import { 
  X, FileText, Calendar, AlertCircle, Settings, Wrench, Users, 
  User, Phone, Mail, MapPin, Building2, Clock, Package, AlertTriangle, Edit
} from "lucide-react";
import { useState, useEffect } from "react";
import { getTratamientoByAviso } from "../../mantenimiento/services/tratamientoService";
import ModalEditarSolicitudCompra from "./ModalEditarSolicitudCompra";
import { updateSolicitudCompra } from "../services/SolicitudCompraService";

export default function ModalInfoAviso({ isOpen, onClose, aviso }) {
  const [tratamientoData, setTratamientoData] = useState(null);
  const [cargandoTratamiento, setCargandoTratamiento] = useState(false);
  const [modalEditarSolicitud, setModalEditarSolicitud] = useState(false);

  const tieneSolicitud = !!tratamientoData?.solicitudCompra;

  useEffect(() => {
    if (isOpen && aviso?.id && !tratamientoData) {
      setCargandoTratamiento(true);
      getTratamientoByAviso(aviso.id)
        .then(data => {
          setTratamientoData(data);
        })
        .catch(err => {
          console.error("Error al cargar tratamiento:", err);
        })
        .finally(() => {
          setCargandoTratamiento(false);
        });
    }
  }, [isOpen, aviso?.id]);

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

  const handleGuardarSolicitud = async (data) => {
    try {
      await updateSolicitudCompra(tratamientoData.solicitudCompra.id, data);
      // Recargar el tratamiento para obtener los datos actualizados
      const updatedTratamiento = await getTratamientoByAviso(aviso.id);
      setTratamientoData(updatedTratamiento);
      alert("Solicitud de compra actualizada exitosamente");
    } catch (error) {
      console.error("Error al actualizar solicitud:", error);
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-end">
      <div 
        className="absolute inset-0"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white h-full w-full max-w-2xl shadow-2xl overflow-y-auto animate-slide-in-right">
        {/* Header del Modal Lateral */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 border-b border-indigo-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Información del Aviso</h3>
                <p className="text-sm text-indigo-200">#{aviso?.numeroAviso}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Contenido del Modal Lateral */}
        <div className="p-6 space-y-6">
          
          {/* DATOS PRINCIPALES DEL AVISO */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              Datos Principales
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm font-semibold text-slate-600">Número de Aviso:</span>
                <span className="text-sm font-bold text-slate-900">{aviso?.numeroAviso}</span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-sm font-semibold text-slate-600">Orden de Venta:</span>
                <span className="text-sm font-bold text-slate-900">{aviso?.ordenVenta}</span>
              </div>
              
              <div className="flex items-start justify-between">
                <span className="text-sm font-semibold text-slate-600">Tipo:</span>
                <span className="text-sm font-medium text-slate-900 capitalize">{aviso?.tipoAviso}</span>
              </div>
              
              <div className="flex items-start justify-between">
                <span className="text-sm font-semibold text-slate-600">Prioridad:</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border-2 ${getPrioridadColor(aviso?.prioridad)}`}>
                  {aviso?.prioridad}
                </span>
              </div>
              
              <div className="flex items-start justify-between">
                <span className="text-sm font-semibold text-slate-600">Estado:</span>
                <span className="text-sm font-medium text-slate-900 capitalize bg-green-100 text-green-700 px-2 py-1 rounded">
                  {aviso?.estadoAviso}
                </span>
              </div>
              
              <div className="flex items-start justify-between">
                <span className="text-sm font-semibold text-slate-600">Tipo Mantenimiento:</span>
                <span className="text-sm font-medium text-slate-900">{aviso?.tipoMantenimiento}</span>
              </div>
              
              <div className="flex items-start justify-between">
                <span className="text-sm font-semibold text-slate-600">Producto:</span>
                <span className="text-sm font-medium text-slate-900">{aviso?.producto}</span>
              </div>
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-600" />
              Descripción
            </h4>
            <p className="text-sm text-slate-700 font-medium">{aviso?.descripcionResumida}</p>
            <p className="text-sm text-slate-600 mt-2">{aviso?.descripcion}</p>
          </div>

          {/* FECHAS Y UBICACIÓN */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-600" />
              Fechas y Ubicación
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500">Fecha de Atención</p>
                  <p className="text-sm font-bold text-slate-900">{aviso?.fechaAtencion}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500">Ubicación Técnica</p>
                  <p className="text-sm font-bold text-slate-900">{aviso?.ubicacionTecnica}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500">Dirección de Atención</p>
                  <p className="text-sm font-bold text-slate-900">{aviso?.direccionAtencion}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500">Sede</p>
                  <p className="text-sm font-bold text-slate-900">{aviso?.sede}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CONTACTO */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-600" />
              Información de Contacto
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500">Nombre</p>
                  <p className="text-sm font-bold text-slate-900">{aviso?.nombreContacto}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500">Correo</p>
                  <p className="text-sm font-bold text-blue-600">{aviso?.correoContacto}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500">Teléfono</p>
                  <p className="text-sm font-bold text-slate-900">{aviso?.numeroContacto}</p>
                </div>
              </div>
            </div>
          </div>

          {/* INFORMACIÓN COMERCIAL */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-600" />
              Información Comercial
            </h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Centro de Costo:</span>
                <span className="font-bold text-slate-900">{aviso?.centroCosto}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Orden Cliente:</span>
                <span className="font-bold text-slate-900">{aviso?.ordenCliente}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Almacén:</span>
                <span className="font-bold text-slate-900">{aviso?.almacen}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Supervisor Asignado:</span>
                <span className="font-bold text-slate-900">{aviso?.supervisorAsignado}</span>
              </div>
            </div>
          </div>

          {/* EQUIPOS RELACIONADOS */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-600" />
              Equipos Relacionados ({aviso?.equiposRelacion?.length || 0})
            </h4>
            
            <div className="space-y-3">
              {aviso?.equiposRelacion?.map((equipoRel, idx) => (
                <div key={idx} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{equipoRel.equipo?.nombre}</p>
                      <p className="text-xs text-slate-600">Código: {equipoRel.equipo?.codigo}</p>
                      <p className="text-xs text-slate-600">Tipo: {equipoRel.equipo?.tipo}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INFORMACIÓN DEL TRATAMIENTO */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-600" />
              Información del Tratamiento
            </h4>
            
            {cargandoTratamiento ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="text-sm text-slate-600 mt-2">Cargando tratamiento...</p>
              </div>
            ) : tratamientoData ? (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-600">ID Tratamiento:</span>
                      <span className="font-mono text-xs text-slate-900">{tratamientoData.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-600">Contratista:</span>
                      <span className="font-bold text-slate-900">{tratamientoData.contratista}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-600">Estado:</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                        {tratamientoData.estado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Solicitud de Compra */}
                {tieneSolicitud && (
                  <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-600" />
                        Requerimientos
                      </h4>
                      <button
                        onClick={() => setModalEditarSolicitud(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                    </div>

                    <div className="text-sm space-y-2">
                      <p>
                        <span className="font-semibold text-slate-600">Estado:</span>{" "}
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                          {tratamientoData.solicitudCompra.estado}
                        </span>
                      </p>

                      <p>
                        <span className="font-semibold text-slate-600">Fecha requerida:</span>{" "}
                        {tratamientoData.solicitudCompra.requiredDate}
                      </p>

                      <div className="mt-3">
                        <p className="font-semibold text-slate-600 mb-1">Ítems solicitados</p>
                        <ul className="list-disc ml-4 text-xs text-slate-700 space-y-1">
                          {tratamientoData.solicitudCompra.lineas.map((l) => (
                            <li key={l.id}>
                              {l.description} — Cant: {l.quantity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Requerimientos */}
                {tratamientoData.requerimientos && tratamientoData.requerimientos.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <h5 className="font-bold text-slate-900 mb-3 text-sm">Requerimientos</h5>
                    <div className="space-y-2">
                      {tratamientoData.requerimientos.map((req, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-purple-50 rounded p-2">
                          <span className="text-sm font-medium text-slate-700">{req.label}</span>
                          <span className="text-xs font-bold text-purple-700 bg-purple-200 px-2 py-1 rounded">
                            Cantidad: {req.cantidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trabajadores Asignados */}
                {tratamientoData.trabajadores && tratamientoData.trabajadores.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <h5 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Trabajadores Asignados ({tratamientoData.trabajadores.length})
                    </h5>
                    <div className="space-y-2">
                      {tratamientoData.trabajadores.map((trab, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-slate-900">{trab.trabajador?.nombre}</span>
                            {trab.esPrincipal && (
                              <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                                Principal
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 space-y-1 ml-6">
                            <p><strong>Rol:</strong> {trab.rol}</p>
                            <p><strong>Empresa:</strong> {trab.trabajador?.empresa}</p>
                            <p><strong>Estado:</strong> {trab.trabajador?.activo ? '✅ Activo' : '❌ Inactivo'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">No se pudo cargar la información del tratamiento</p>
              </div>
            )}
          </div>

          {/* INFORMACIÓN DE AUDITORÍA */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900 mb-4">Auditoría</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Creado por:</span>
                <span className="font-bold text-slate-900">{aviso?.creador?.nombreApellido}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Solicitante:</span>
                <span className="font-bold text-slate-900">{aviso?.solicitante?.nombreApellido}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Fecha Creación:</span>
                <span className="font-mono text-xs text-slate-700">
                  {new Date(aviso?.createdAt).toLocaleString('es-ES')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Última Actualización:</span>
                <span className="font-mono text-xs text-slate-700">
                  {new Date(aviso?.updatedAt).toLocaleString('es-ES')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <ModalEditarSolicitudCompra
        isOpen={modalEditarSolicitud}
        onClose={() => setModalEditarSolicitud(false)}
        solicitudCompra={tratamientoData?.solicitudCompra}
        onSave={handleGuardarSolicitud}
      />

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}