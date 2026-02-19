  import { X, Settings, CheckCircle2, AlertCircle, Info, FileText } from "lucide-react";
  import { useState, useEffect } from "react";
  import { getEquiposDisponiblesPorAviso } from "../mantenimiento/services/ordenTrabajoService";

export default function ModalSeleccionEquiposOT({
  isOpen,
  onClose,
  aviso,
  onEquiposSeleccionados,
  ordenesExistentes = [],
  equiposProcesados = []
}) {
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarConfirmacionSalida, setMostrarConfirmacionSalida] = useState(false);

  // ✅ LÓGICA CORREGIDA - SOPORTA AMBOS FORMATOS
  const equiposConEstado = equiposDisponibles.map(e => {
    const equiposConOT = ordenesExistentes
      .filter(ot => {
        const otAvisoId = ot.avisoId || ot.aviso_id;
        return otAvisoId === aviso?.id;
      })
      .flatMap(ot => ot.equipos || [])
      .map(eq => eq.equipoId || eq.equipo_id);

    const tieneOT = equiposConOT.includes(e.id) || equiposProcesados.includes(e.id);

    return {
      ...e,
      tieneOT
    };
  });

  // 🐛 DEBUGGING MEJORADO
  useEffect(() => {
    if (isOpen && aviso?.id) {
      console.log("🔍 === ANÁLISIS DE BLOQUEO ===");
      console.log("Aviso seleccionado:", aviso?.id, aviso?.numeroAviso);
      console.log("Total órdenes recibidas:", ordenesExistentes.length);
      
      const ordenesFiltradas = ordenesExistentes.filter(ot => {
        const otAvisoId = ot.avisoId || ot.aviso_id;
        return otAvisoId === aviso?.id;
      });
      
      console.log("Órdenes de este aviso:", ordenesFiltradas);
      
      const equiposIds = ordenesFiltradas
        .flatMap(ot => ot.equipos || [])
        .map(eq => eq.equipoId || eq.equipo_id);
      
      console.log("IDs de equipos con OT:", equiposIds);
      console.log("Equipos procesados:", equiposProcesados);
      console.log("=== FIN ANÁLISIS ===");
    }
  }, [isOpen, aviso, ordenesExistentes, equiposProcesados]);

  useEffect(() => {
    if (!isOpen || !aviso?.id) return;

    setCargando(true);
    getEquiposDisponiblesPorAviso(aviso.id)
      .then(data => {
        const equipos = data.map(rel => ({
          id: rel.equipo.id,
          nombre: rel.equipo.nombre || rel.equipo.codigo,
          tipo: rel.equipo.tipo,
          codigo: rel.equipo.codigo,
          relacionId: rel.id
        }));
        setEquiposDisponibles(equipos);
      })
      .finally(() => setCargando(false));
  }, [isOpen, aviso?.id]);

  const handleToggleEquipo = (equipoId) => {
    setEquiposSeleccionados(prev => {
      if (prev.includes(equipoId)) {
        return prev.filter(id => id !== equipoId);
      }
      return [...prev, equipoId];
    });
  };

  const handleContinuar = () => {
    if (equiposSeleccionados.length === 0) {
      alert("Debe seleccionar al menos un equipo");
      return;
    }

    const equipos = equiposConEstado.filter(e => 
      equiposSeleccionados.includes(e.id)
    );

    onEquiposSeleccionados(equipos);
  };

  const handleCerrar = () => {
    if (equiposSeleccionados.length > 0) {
      setMostrarConfirmacionSalida(true);
    } else {
      onClose();
    }
  };

  const confirmarSalida = () => {
    setEquiposSeleccionados([]);
    setMostrarConfirmacionSalida(false);
    onClose();
  };

  if (!isOpen) return null;

  const equiposSinOT = equiposConEstado.filter(e => !e.tieneOT);
  const equiposConOT = equiposConEstado.filter(e => e.tieneOT);

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200">
          
          {/* HEADER */}
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-8 rounded-t-3xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                  <Settings className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    Seleccionar Equipos para OT
                  </h3>
                  <p className="text-indigo-200 font-medium">
                    Aviso: <span className="text-white font-bold">{aviso?.numeroAviso}</span>
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleCerrar}
                className="p-2.5 hover:bg-white/15 rounded-xl transition-all duration-200"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* CONTENIDO */}
          <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-slate-50 to-indigo-50">
            
            {cargando ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600 font-medium">Cargando equipos disponibles...</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* INFO */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-blue-900 mb-1">
                      Seleccione los equipos para generar Órdenes de Trabajo Individuales
                    </p>
                    <p className="text-xs text-blue-700">
                      Se creará una OT separada para cada equipo seleccionado. Los equipos con OT existente no pueden ser seleccionados.
                    </p>
                  </div>
                </div>

                {/* EQUIPOS DISPONIBLES (SIN OT) */}
                {equiposSinOT.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 bg-indigo-600 rounded"></span>
                      Equipos Disponibles ({equiposSinOT.length})
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {equiposSinOT.map(equipo => {
                        const seleccionado = equiposSeleccionados.includes(equipo.id);
                        
                        return (
                          <div
                            key={equipo.id}
                            onClick={() => handleToggleEquipo(equipo.id)}
                            className={`relative bg-white rounded-2xl border-3 p-5 transition-all duration-200 cursor-pointer
                              ${seleccionado
                                ? 'border-indigo-500 shadow-xl shadow-indigo-500/30 scale-105'
                                : 'border-slate-200 hover:border-indigo-300 hover:shadow-lg'
                              }
                            `}
                          >
                            <div className="absolute top-4 right-4">
                              <div className={`w-7 h-7 rounded-lg border-3 flex items-center justify-center transition-all ${
                                seleccionado
                                  ? 'bg-indigo-600 border-indigo-600'
                                  : 'bg-white border-slate-300'
                              }`}>
                                {seleccionado && (
                                  <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={3} />
                                )}
                              </div>
                            </div>

                            <div className="pr-10">
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2.5 rounded-xl ${
                                  seleccionado ? 'bg-indigo-100' : 'bg-slate-100'
                                }`}>
                                  <Settings className={`w-5 h-5 ${
                                    seleccionado ? 'text-indigo-600' : 'text-slate-600'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-bold text-slate-900 text-base line-clamp-1">
                                    {equipo.nombre}
                                  </h5>
                                  <p className="text-xs text-slate-600 font-medium">
                                    Código: {equipo.codigo}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                                  {equipo.tipo || 'Sin tipo'}
                                </span>
                              </div>

                              {seleccionado && (
                                <div className="mt-4 pt-4 border-t border-indigo-200 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-indigo-600" />
                                  <span className="text-xs font-bold text-indigo-700">
                                    Se generará OT Individual
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* EQUIPOS CON OT EXISTENTE */}
                {equiposConOT.length > 0 && (
                  <div className="pt-6 border-t-2 border-slate-200">
                    <h4 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 bg-amber-500 rounded"></span>
                      Equipos con OT Existente ({equiposConOT.length})
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {equiposConOT.map(equipo => (
                        <div
                          key={equipo.id}
                          className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-5 opacity-75"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-amber-100 rounded-xl">
                              <Settings className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-bold text-slate-800 text-base line-clamp-1">
                                {equipo.nombre}
                              </h5>
                              <p className="text-xs text-slate-600">
                                Código: {equipo.codigo}
                              </p>
                            </div>
                          </div>

                          <div className="bg-amber-100 border border-amber-300 rounded-lg px-3 py-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-700" />
                            <span className="text-xs font-bold text-amber-800">
                              Ya tiene OT generada
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EMPTY STATE */}
                {equiposDisponibles.length === 0 && (
                  <div className="text-center py-20">
                    <div className="bg-slate-100 rounded-2xl p-8 inline-block mb-4">
                      <Settings className="w-16 h-16 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-bold text-lg mb-2">
                      No hay equipos disponibles
                    </p>
                    <p className="text-slate-500 text-sm">
                      Este aviso no tiene equipos relacionados
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="p-6 border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-b-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-700">
                  Equipos seleccionados:
                </span>
                <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-lg">
                  {equiposSeleccionados.length}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCerrar}
                  className="px-6 py-3 border-2 border-slate-400 rounded-xl hover:bg-white hover:border-slate-500 transition-all font-bold text-slate-700 flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancelar
                </button>

                <button
                  onClick={handleContinuar}
                  disabled={equiposSeleccionados.length === 0}
                  className={`px-8 py-3 rounded-xl font-bold shadow-xl flex items-center gap-3 transform transition-all ${
                    equiposSeleccionados.length > 0
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 shadow-indigo-500/40 hover:scale-105 active:scale-95'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {mostrarConfirmacionSalida && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-2 border-amber-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">¿Está seguro?</h3>
            </div>
            
            <p className="text-slate-700 mb-6">
              Tiene <span className="font-bold text-amber-600">{equiposSeleccionados.length} equipo(s)</span> seleccionado(s). 
              Si sale ahora, perderá esta selección.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmacionSalida(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700"
              >
                Continuar editando
              </button>
              <button
                onClick={confirmarSalida}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-bold shadow-lg shadow-red-500/30"
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}