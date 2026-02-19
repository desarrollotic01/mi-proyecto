import {
  X,
  FileText,
  Calendar,
  User,
  AlertCircle,
  Package,
  Wrench,
  Clock,
  CheckCircle2,Users, Star
} from "lucide-react";

export default function ModalOrdenTrabajoView({ isOpen, orden, onClose }) {
  if (!isOpen || !orden) return null;

  const formatFecha = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const estadoColor = {
    CREADO: "bg-blue-100 text-blue-700 border-blue-300",
    EN_PROCESO: "bg-yellow-100 text-yellow-700 border-yellow-300",
    FINALIZADO: "bg-green-100 text-green-700 border-green-300",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <FileText className="w-6 h-6" />
              Orden de Trabajo
            </h2>
            <p className="text-indigo-100 font-semibold mt-1">
              {orden.numeroOT}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">

          {/* ESTADO */}
          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 rounded-xl border-2 text-sm font-bold ${
                estadoColor[orden.estado] || "bg-gray-100 border-gray-300"
              }`}
            >
              {orden.estado}
            </span>
            <span className="text-sm text-slate-600">
              Aviso ID: {orden.avisoId}
            </span>
          </div>

          {/* INFO GENERAL */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-indigo-600" />
              Información General
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-slate-600">Descripción</p>
                <p className="text-slate-800">{orden.descripcionGeneral}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-600">Supervisor ID</p>
                <p className="text-slate-800">{orden.supervisorId}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-600">Inicio Programado</p>
                <p>{formatFecha(orden.fechaProgramadaInicio)}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-600">Fin Programado</p>
                <p>{formatFecha(orden.fechaProgramadaFin)}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-600">Observaciones</p>
                <p>{orden.observaciones || "—"}</p>
              </div>
            </div>
          </div>

          {/* EQUIPOS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Equipos Asociados ({orden.equipos.length})
            </h3>

            <div className="space-y-4">
              {orden.equipos.map((eq) => (
  <div
    key={eq.id}
    className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50"
  >
    {/* INFO EQUIPO */}
    <div className="flex items-center justify-between mb-2">
      <div>
        <p className="font-bold text-slate-900">
          {eq.equipo?.nombre}
        </p>
        <p className="text-xs text-slate-600">
          {eq.equipo?.codigo} • {eq.equipo?.tipo}
        </p>
      </div>

      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
        {eq.estadoEquipo}
      </span>
    </div>

    {/* DETALLE */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      <div>
        <p className="font-semibold text-slate-600">Tipo de Actividad</p>
        <p>{eq.tipoActividad}</p>
      </div>

      <div>
        <p className="font-semibold text-slate-600">Prioridad</p>
        <p>{eq.prioridad}</p>
      </div>

      <div>
        <p className="font-semibold text-slate-600">Inicio Programado</p>
        <p>{formatFecha(eq.fechaInicioProgramada)}</p>
      </div>

      <div>
        <p className="font-semibold text-slate-600">Fin Programado</p>
        <p>{formatFecha(eq.fechaFinProgramada)}</p>
      </div>

      <div className="md:col-span-2">
        <p className="font-semibold text-slate-600">
          Descripción del Trabajo
        </p>
        <p>{eq.descripcionEquipo}</p>
      </div>
    </div>

    {/* 👥 TRABAJADORES */}
    {eq.trabajadores?.length > 0 && (
      <div className="mt-4 border-t border-slate-300 pt-4">
        <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          Trabajadores Asignados ({eq.trabajadores.length})
        </h4>

        <div className="space-y-2">
          {eq.trabajadores.map((t) => {
            const trabajador = t.trabajador;

            return (
              <div
                key={t.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  t.esEncargado
                    ? "bg-indigo-50 border-indigo-300"
                    : "bg-white border-slate-200"
                }`}
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {trabajador.nombre} {trabajador.apellido}
                  </p>
                  <p className="text-xs text-slate-600">
                    {trabajador.rol.replace("_", " ")} • {trabajador.empresa}
                  </p>
                </div>

                {t.esEncargado && (
                  <span className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-200 px-3 py-1 rounded-full">
                    <Star className="w-3 h-3" />
                    Encargado
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
))}

            </div>
          </div>

          {/* FECHAS REALES */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Fechas Reales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-slate-600">Inicio Real</p>
                <p>{formatFecha(orden.fechaInicioReal)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-600">Fin Real</p>
                <p>{formatFecha(orden.fechaFinReal)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-600">Cierre</p>
                <p>{formatFecha(orden.fechaCierre)}</p>
              </div>
            </div>


          </div>
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-slate-700 text-white font-bold hover:bg-slate-800 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
