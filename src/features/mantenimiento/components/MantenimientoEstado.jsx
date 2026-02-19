import { Settings, Plus, Search, AlertCircle, Wrench, User, X } from "lucide-react";

export default function MantenimientoEstado({
  activeTab,
  setActiveTab,
  setConfigOpen,
  setWizardStep,
  setSelectedDate,
  setModalOpen,
  filters,
  setFilters,
}) {
  const hasActiveFilters = filters.search || filters.prioridad || filters.tipoMantenimiento || filters.solicitante;

  return (
    <div className="space-y-3 p-4">
      {/* HEADER CON NAV Y BOTONES - Siempre en una línea, sin wrap */}
      <div className="flex items-center gap-4">
        {/* NAV TABS - Con ancho mínimo */}
        <div className="flex gap-2 flex-shrink-0">
          {["kanban", "lista", "calendario"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-2 font-semibold rounded-lg transition-all whitespace-nowrap text-sm ${
                activeTab === t
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ESPACIADOR FLEXIBLE */}
        <div className="flex-1 min-w-0" />

        {/* BOTONES DE ACCIÓN - Siempre visibles, sin shrink */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 text-purple-700 font-semibold hover:from-purple-200 hover:to-pink-200 transition-all flex items-center gap-2 shadow-sm text-sm whitespace-nowrap"
            onClick={() => setConfigOpen(true)}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configurar</span>
          </button>

          <button
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30 text-sm whitespace-nowrap"
            onClick={() => {
              setModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Añadir</span>
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS - Grid responsivo */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Búsqueda General */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>

          {/* Prioridad */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <AlertCircle className="w-4 h-4 text-gray-400" />
            </div>
            <select
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer"
              value={filters.prioridad}
              onChange={(e) =>
                setFilters({ ...filters, prioridad: e.target.value })
              }
            >
              <option value="">Prioridad</option>
              <option value="Alta">🔴 Alta</option>
              <option value="Media">🟡 Media</option>
              <option value="Baja">🟢 Baja</option>
            </select>
          </div>

          {/* Tipo de Mantenimiento */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Wrench className="w-4 h-4 text-gray-400" />
            </div>
            <select
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer"
              value={filters.tipoMantenimiento}
              onChange={(e) =>
                setFilters({ ...filters, tipoMantenimiento: e.target.value })
              }
            >
              <option value="">Tipo</option>
              <option value="Preventivo">🛡️ Preventivo</option>
              <option value="Correctivo">🔧 Correctivo</option>
              <option value="Predictivo">📊 Predictivo</option>
              <option value="Mejora">✨ Mejora</option>
            </select>
          </div>

          {/* Solicitante */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Solicitante..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              value={filters.solicitante}
              onChange={(e) =>
                setFilters({ ...filters, solicitante: e.target.value })
              }
            />
          </div>
        </div>

        {/* Indicador de filtros activos - Compacto */}
        {hasActiveFilters && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-600">Activos:</span>
            
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {filters.search}
                <button
                  onClick={() => setFilters({ ...filters, search: "" })}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.prioridad && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                {filters.prioridad}
                <button
                  onClick={() => setFilters({ ...filters, prioridad: "" })}
                  className="hover:bg-orange-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.tipoMantenimiento && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                {filters.tipoMantenimiento}
                <button
                  onClick={() => setFilters({ ...filters, tipoMantenimiento: "" })}
                  className="hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.solicitante && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {filters.solicitante}
                <button
                  onClick={() => setFilters({ ...filters, solicitante: "" })}
                  className="hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={() => setFilters({ search: "", prioridad: "", tipoMantenimiento: "", solicitante: "" })}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}