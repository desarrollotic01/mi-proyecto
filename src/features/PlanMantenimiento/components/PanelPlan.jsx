import { X, Calendar, Clock, Users, Wrench, CheckCircle2 } from "lucide-react";

export default function PanelPlan({ plan, onClose }) {
  const getTipoBadge = (tipo) => {
    const styles = {
      PREVENTIVO: "bg-blue-100 text-blue-700 border-blue-200",
      CORRECTIVO: "bg-red-100 text-red-700 border-red-200",
      MEJORA: "bg-purple-100 text-purple-700 border-purple-200",
      INSPECCION: "bg-amber-100 text-amber-700 border-amber-200",
    };
    return styles[tipo] || styles.PREVENTIVO;
  };

  const getTipoTrabajoColor = (tipo) => {
    const colors = {
      LIMPIEZA: "bg-cyan-50 text-cyan-700 border-cyan-200",
      REVISION: "bg-blue-50 text-blue-700 border-blue-200",
      AJUSTE: "bg-purple-50 text-purple-700 border-purple-200",
      LUBRICACION: "bg-amber-50 text-amber-700 border-amber-200",
      INSPECCION: "bg-green-50 text-green-700 border-green-200",
    };
    return colors[tipo] || colors.REVISION;
  };

  const getFrecuenciaIcon = (frecuencia) => {
    return <Calendar size={14} />;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50 animate-in fade-in duration-200">
      <div className="bg-white w-[600px] h-full shadow-2xl animate-in slide-in-from-right duration-300">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{plan.nombre}</h2>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm border border-white/30`}
                >
                  {plan.tipo}
                </span>
                {plan.activo && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 backdrop-blur-sm border border-green-400/30">
                    <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div>
                    Activo
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors duration-200"
            >
              <X className="cursor-pointer" size={24} />
            </button>
          </div>

          {/* INFO DEL EQUIPO */}
          {plan.equipo && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-sm text-blue-100 mb-1">Equipo asignado</p>
              <p className="font-semibold text-lg flex items-center gap-2">
                <Wrench size={18} />
                {plan.equipo.nombre}
              </p>
            </div>
          )}
        </div>

        {/* CONTENIDO */}
        <div className="p-6 overflow-y-auto h-[calc(100vh-280px)]">
          {/* ESTADÍSTICAS */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-600 p-2 rounded-lg mb-2">
                  <CheckCircle2 className="text-white" size={20} />
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {plan.actividades?.length || 0}
                </p>
                <p className="text-xs text-blue-700 font-medium">Actividades</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex flex-col items-center text-center">
                <div className="bg-purple-600 p-2 rounded-lg mb-2">
                  <Clock className="text-white" size={20} />
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {plan.actividades?.reduce(
                    (acc, act) => acc + (act.duracionMinutos || 0),
                    0
                  ) || 0}
                </p>
                <p className="text-xs text-purple-700 font-medium">Min. totales</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
              <div className="flex flex-col items-center text-center">
                <div className="bg-amber-600 p-2 rounded-lg mb-2">
                  <Users className="text-white" size={20} />
                </div>
                <p className="text-2xl font-bold text-amber-900">
                  {Math.max(
                    ...plan.actividades?.map((act) => act.cantidadTecnicos || 1),
                    1
                  )}
                </p>
                <p className="text-xs text-amber-700 font-medium">Técnicos req.</p>
              </div>
            </div>
          </div>

          {/* ACTIVIDADES */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              Actividades Programadas
            </h3>

            <div className="space-y-3">
              {plan.actividades && plan.actividades.length > 0 ? (
                plan.actividades.map((act, index) => (
                  <div
                    key={act.id || index}
                    className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                  >
                    {/* HEADER DE ACTIVIDAD */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <h4 className="font-bold text-slate-800">
                            {act.componente || "Componente"}
                          </h4>
                        </div>
                        <p className="text-slate-600 text-sm ml-4">
                          {act.tarea || "Tarea no especificada"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getTipoTrabajoColor(
                          act.tipoTrabajo
                        )}`}
                      >
                        {act.tipoTrabajo}
                      </span>
                    </div>

                    {/* DETALLES */}
                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-lg">
                          <Calendar className="text-blue-600" size={14} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Frecuencia</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {act.frecuencia}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="bg-purple-100 p-1.5 rounded-lg">
                          <Clock className="text-purple-600" size={14} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Duración</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {act.duracionMinutos} min
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="bg-amber-100 p-1.5 rounded-lg">
                          <Users className="text-amber-600" size={14} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Técnicos</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {act.cantidadTecnicos || 1}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                  <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="text-slate-400" size={32} />
                  </div>
                  <p className="text-slate-600 font-medium">Sin actividades</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Este plan no tiene actividades asignadas
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-50 to-transparent p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}