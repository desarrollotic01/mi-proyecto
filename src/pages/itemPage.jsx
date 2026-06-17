import { useEffect, useMemo, useState } from "react";
import { itemService } from "../features/PlanMantenimiento/services/itemService";
import { Loader2, AlertCircle, Search, RefreshCw, Package } from "lucide-react";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const cargarItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await itemService.getAll();
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Error cargando items:", err);
      setError("No se pudieron cargar los items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarItems(); }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.sapCode?.toLowerCase().includes(q) ||
        item.nombre?.toLowerCase().includes(q)
    );
  }, [items, searchTerm]);

  const { currentPage, setCurrentPage, totalPages, paginatedItems, totalItems, startIndex } =
    usePagination(filtered, 100);

  const fmtStock = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    const n = Number(val);
    return isNaN(n) ? "-" : n % 1 === 0 ? n.toString() : n.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] gap-2 text-red-500">
        <AlertCircle size={20} />
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-3 sm:p-6 font-sans text-slate-800 w-full overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto space-y-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white px-4 sm:px-6 py-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
          <h1 className="text-[16px] sm:text-[17px] font-black text-slate-800 flex items-center gap-2.5 tracking-tight">
            <Package size={20} className="text-blue-600 stroke-[2.5] shrink-0" />
            Catálogo de Items SAP
          </h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
              {filtered.length} de {items.length} items
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
              · Pág. {currentPage}/{totalPages}
            </span>
            <button
              onClick={cargarItems}
              className="p-2 sm:p-2.5 text-slate-400 hover:text-blue-600 transition-colors border border-transparent hover:border-slate-200 rounded-lg bg-slate-50 hover:bg-white"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código SAP o descripción..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-[12px] font-medium outline-none focus:border-blue-500 bg-white shadow-sm transition-all text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Tabla */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-2 py-2.5 border border-slate-700 text-center w-8">#</th>
                  <th className="px-3 py-2.5 border border-slate-700 whitespace-nowrap">Código SAP</th>
                  <th className="px-3 py-2.5 border border-slate-700 min-w-[300px]">Descripción</th>
                  <th className="px-3 py-2.5 border border-slate-700 text-center whitespace-nowrap">Unidad</th>
                  <th className="px-3 py-2.5 border border-slate-700 text-center whitespace-nowrap">Stock Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-400 font-bold border border-slate-100">
                      {searchTerm ? "Sin resultados para la búsqueda" : "No hay items registrados"}
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-blue-50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                    >
                      <td className="px-2 py-2 border border-slate-200 text-center text-slate-400 font-mono">{startIndex + idx + 1}</td>
                      <td className="px-3 py-2 border border-slate-200 font-black text-blue-700 font-mono whitespace-nowrap">
                        {item.sapCode || "-"}
                      </td>
                      <td className="px-3 py-2 border border-slate-200 text-slate-800 font-medium">
                        {item.nombre || "-"}
                      </td>
                      <td className="px-3 py-2 border border-slate-200 text-center">
                        {item.unidadInventario ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase">
                            {item.unidadInventario}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 border border-slate-200 text-center font-mono font-bold text-slate-700">
                        {fmtStock(item.stockMinimo)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={100}
          onPageChange={setCurrentPage}
        />

      </div>
    </div>
  );
}
