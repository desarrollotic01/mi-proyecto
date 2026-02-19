import { useEffect, useState } from "react";
import { planMantenimientoService } from "../services/planMantenimientoService";
import { Plus, Wrench, Eye, Calendar, Settings2 } from "lucide-react";
import PanelPlan from "../components/PanelPlan";
import ModalCrearPlan from "../components/ModalCrearPlan";

export default function PlanesMantenimiento() {
  const [planes, setPlanes] = useState([]);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);

  const cargarPlanes = async () => {
    try {
      const data = await planMantenimientoService.getPlanes();
      setPlanes(data);
    } catch (error) {
      console.error("Error cargando planes", error);
    }
  };

  useEffect(() => {
    cargarPlanes();
  }, []);

  const getTipoBadge = (tipo) => {
    const styles = {
      PREVENTIVO: "bg-blue-100 text-blue-700 border-blue-200",
      CORRECTIVO: "bg-red-100 text-red-700 border-red-200",
      MEJORA: "bg-purple-100 text-purple-700 border-purple-200",
      INSPECCION: "bg-amber-100 text-amber-700 border-amber-200",
    };
    return styles[tipo] || styles.PREVENTIVO;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                <Wrench className="text-white" size={32} />
              </div>
              Planes de Mantenimiento
            </h1>
            <p className="text-slate-600 ml-16">
              Gestiona y organiza tus planes de mantenimiento preventivo
            </p>
          </div>

          <button
            onClick={() => setMostrarModalCrear(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span className="font-semibold">Nuevo Plan</span>
          </button>
        </div>

        {/* ESTADÍSTICAS */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calendar className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{planes.length}</p>
                <p className="text-sm text-slate-600">Total Planes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Settings2 className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {planes.filter(p => p.activo).length}
                </p>
                <p className="text-sm text-slate-600">Activos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Wrench className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {planes.filter(p => p.tipo === "PREVENTIVO").length}
                </p>
                <p className="text-sm text-slate-600">Preventivos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Wrench className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {planes.filter(p => p.tipo === "CORRECTIVO").length}
                </p>
                <p className="text-sm text-slate-600">Correctivos</p>
              </div>
            </div>
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Nombre del Plan
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Tipo
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Equipo
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Estado
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Actividades
                  </th>
                  <th className="p-4 text-right text-sm font-semibold text-slate-700">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {planes.map((plan, index) => (
                  <tr
                    key={plan.id}
                    className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors duration-150"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">
                        {plan.nombre}
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTipoBadge(
                          plan.tipo
                        )}`}
                      >
                        {plan.tipo}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-slate-700">
                          {plan.equipo?.nombre || "Sin asignar"}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      {plan.activo ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                          Inactivo
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="text-slate-600 text-sm">
                        {plan.actividades?.length || 0} actividades
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setPlanSeleccionado(plan)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                      >
                        <Eye size={16} />
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}

                {planes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-slate-100 p-4 rounded-full">
                          <Wrench className="text-slate-400" size={32} />
                        </div>
                        <p className="text-slate-600 font-medium">
                          No hay planes de mantenimiento
                        </p>
                        <p className="text-slate-500 text-sm">
                          Crea tu primer plan para comenzar
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PANEL LATERAL */}
      {planSeleccionado && (
        <PanelPlan
          plan={planSeleccionado}
          onClose={() => setPlanSeleccionado(null)}
        />
      )}

      {/* MODAL CREAR */}
      {mostrarModalCrear && (
        <ModalCrearPlan
          onClose={() => setMostrarModalCrear(false)}
          onCreated={cargarPlanes}
        />
      )}
    </div>
  );
}