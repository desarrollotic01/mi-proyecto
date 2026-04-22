import { useEffect, useRef, useState } from "react";
import { X, Search, Package, Loader2 } from "lucide-react";
import { itemService } from "../services/itemService";

/**
 * Modal para seleccionar un ítem del catálogo.
 * Carga los items solo cuando se abre por primera vez.
 * Filtra en cliente — nunca re-fetchea mientras el modal esté montado.
 *
 * Props:
 *   isOpen   : boolean
 *   onClose  : () => void
 *   onSelect : (item: { id, sapCode, nombre }) => void
 */
export default function ModalSeleccionItem({ isOpen, onClose, onSelect }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [query, setQuery]       = useState("");
  const loaded                  = useRef(false);
  const inputRef                = useRef(null);

  /* ── Cargar items una sola vez al primer open ── */
  useEffect(() => {
    if (!isOpen || loaded.current) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await itemService.getAll();
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
          loaded.current = true;
        }
      } catch (err) {
        console.error("Error cargando items:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen]);

  /* ── Focus al input al abrir ── */
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  /* ── Filtro + límite de render ── */
  const q = query.trim().toLowerCase();
  const filtrados = q
    ? items.filter(
        (it) =>
          (it.sapCode || "").toLowerCase().includes(q) ||
          (it.nombre  || "").toLowerCase().includes(q)
      )
    : items;

  const MAX = 120;
  const visibles  = filtrados.slice(0, MAX);
  const hayMas    = filtrados.length > MAX;

  const handleSelect = (item) => {
    onSelect(item);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-900 rounded-lg">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Seleccionar Ítem</h3>
              {!loading && (
                <p className="text-xs text-slate-500">
                  {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
                  {q ? ` para "${query}"` : ` · ${items.length} en total`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buscador */}
        <div className="px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar por código o nombre..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Cargando catálogo de ítems...</p>
            </div>
          ) : visibles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
              <Package className="w-10 h-10 opacity-30" />
              <p className="text-sm">
                {q ? "Sin resultados para esa búsqueda" : "No hay ítems disponibles"}
              </p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                  <tr>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Código SAP</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((it) => (
                    <tr
                      key={it.id}
                      onClick={() => handleSelect(it)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {it.sapCode || "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {it.nombre || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hayMas && (
                <p className="text-center text-xs text-slate-400 py-3 border-t border-slate-100">
                  Mostrando {MAX} de {filtrados.length} resultados — refina la búsqueda para ver más
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
