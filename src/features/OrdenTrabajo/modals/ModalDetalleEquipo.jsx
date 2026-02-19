import { X, Settings, Info, MapPin, Wrench, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { equipoService } from "../../mantenimiento/services/equipoService";

export default function ModalDetallesEquipo({ equipoId, isOpen, onClose }) {
  const [equipoData, setEquipoData] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!isOpen || !equipoId) {
      setEquipoData(null);
      return;
    }

    setCargando(true);
    
    equipoService.getEquipos()
      .then(equipos => {
        const equipo = equipos.find(e => e.id === equipoId);
        setEquipoData(equipo);
      })
      .catch(err => {
        console.error("Error cargando detalles del equipo:", err);
      })
      .finally(() => {
        setCargando(false);
      });
  }, [equipoId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Detalles del Equipo</h3>
                <p className="text-sm text-cyan-200">Información completa</p>
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

        {/* Contenido */}
        <div className="p-6">
          {cargando ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
              <p className="text-sm text-slate-600 mt-4">Cargando detalles del equipo...</p>
            </div>
          ) : equipoData ? (
            <div className="space-y-5">
              {/* Información Principal */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-5 border-2 border-cyan-200">
                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-cyan-600" />
                  Información Principal
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Nombre</p>
                    <p className="font-bold text-slate-900">{equipoData.nombre}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Código</p>
                    <p className="font-mono text-slate-900 bg-white px-2 py-1 rounded">{equipoData.codigo}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Tipo</p>
                    <p className="font-bold text-slate-900">{equipoData.tipo}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Marca</p>
                    <p className="font-bold text-slate-900">{equipoData.marca || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Modelo</p>
                    <p className="font-bold text-slate-900">{equipoData.modelo || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Serie</p>
                    <p className="font-mono text-slate-900">{equipoData.serie || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-slate-600" />
                  Ubicación
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Ubicación Técnica</p>
                    <p className="font-bold text-slate-900">{equipoData.ubicacionTecnica || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Centro</p>
                    <p className="font-bold text-slate-900">{equipoData.centro || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Especificaciones Técnicas */}
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-slate-600" />
                  Especificaciones Técnicas
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Potencia</p>
                    <p className="font-bold text-slate-900">{equipoData.potencia || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Voltaje</p>
                    <p className="font-bold text-slate-900">{equipoData.voltaje || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Peso</p>
                    <p className="font-bold text-slate-900">{equipoData.peso || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Dimensiones</p>
                    <p className="font-bold text-slate-900">{equipoData.dimensiones || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Estado y Fechas */}
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-600" />
                  Estado y Fechas
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Estado</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      equipoData.estado === 'ACTIVO' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {equipoData.estado || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Fecha de Instalación</p>
                    <p className="font-mono text-xs text-slate-900">
                      {equipoData.fechaInstalacion 
                        ? new Date(equipoData.fechaInstalacion).toLocaleDateString('es-ES')
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Fecha de Compra</p>
                    <p className="font-mono text-xs text-slate-900">
                      {equipoData.fechaCompra 
                        ? new Date(equipoData.fechaCompra).toLocaleDateString('es-ES')
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">Garantía Hasta</p>
                    <p className="font-mono text-xs text-slate-900">
                      {equipoData.garantiaHasta 
                        ? new Date(equipoData.garantiaHasta).toLocaleDateString('es-ES')
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {equipoData.descripcion && (
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <h4 className="text-lg font-bold text-slate-900 mb-3">Descripción</h4>
                  <p className="text-sm text-slate-700">{equipoData.descripcion}</p>
                </div>
              )}

              {/* Notas */}
              {equipoData.notas && (
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                  <h4 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    Notas
                  </h4>
                  <p className="text-sm text-slate-700">{equipoData.notas}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No se encontraron detalles del equipo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}