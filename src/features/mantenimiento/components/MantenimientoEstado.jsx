// src/features/mantenimiento/components/MantenimientoEstado.jsx

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
  return (
    <>
      {/* NAV */}
      <div className="flex gap-4 mb-4 border-b pb-2">
        {["kanban", "lista", "calendario"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-2 font-semibold ${
              activeTab === t &&
              "border-b-2 border-gray-600 text-gray-600"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}

        <button
          className="ml-auto px-4 py-2 rounded-md bg-gray-200 flex items-center gap-2"
          onClick={() => setConfigOpen(true)}
        >
          ⚙️ Configurar
        </button>

        <button
          className="px-4 py-2 rounded-md bg-gray-200"
          onClick={() => {
            setWizardStep(1);
            setSelectedDate(null);
            setModalOpen(true);
          }}
        >
          + Añadir aviso
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-3 rounded-md shadow-sm mb-4 border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="🔍 Buscar (N° Aviso, Cliente, Equipo...)"
          className="border p-2 rounded text-sm w-full"
          value={filters.search}
          onChange={(e) =>
            setFilters({ ...filters, search: e.target.value })
          }
        />

        <select
          className="border p-2 rounded text-sm w-full"
          value={filters.prioridad}
          onChange={(e) =>
            setFilters({ ...filters, prioridad: e.target.value })
          }
        >
          <option value="">Todas las prioridades</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </select>

        <select
          className="border p-2 rounded text-sm w-full"
          value={filters.tipoMantenimiento}
          onChange={(e) =>
            setFilters({ ...filters, tipoMantenimiento: e.target.value })
          }
        >
          <option value="">Todos los tipos</option>
          <option value="Preventivo">Preventivo</option>
          <option value="Correctivo">Correctivo</option>
          <option value="Predictivo">Predictivo</option>
        </select>

        <input
          type="text"
          placeholder="Solicitante..."
          className="border p-2 rounded text-sm w-full"
          value={filters.solicitante}
          onChange={(e) =>
            setFilters({ ...filters, solicitante: e.target.value })
          }
        />
      </div>
    </>
  );
}
