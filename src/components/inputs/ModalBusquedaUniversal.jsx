import { useEffect, useMemo, useRef, useState } from "react";
import {
  X, Search, ChevronLeft, ChevronRight, CheckCircle2,
  Loader2, AlertCircle,
} from "lucide-react";

const PAGE_SIZE = 25;

const ACCENT = {
  blue:    { ring: "focus:ring-blue-400",    btn: "bg-blue-600 hover:bg-blue-700",    chip: "bg-blue-100 text-blue-700 border-blue-200",    check: "text-blue-600" },
  green:   { ring: "focus:ring-emerald-400", btn: "bg-emerald-600 hover:bg-emerald-700", chip: "bg-emerald-100 text-emerald-700 border-emerald-200", check: "text-emerald-600" },
  orange:  { ring: "focus:ring-orange-400",  btn: "bg-orange-500 hover:bg-orange-600", chip: "bg-orange-100 text-orange-700 border-orange-200", check: "text-orange-500" },
  slate:   { ring: "focus:ring-slate-400",   btn: "bg-slate-700 hover:bg-slate-800",  chip: "bg-slate-100 text-slate-700 border-slate-200",   check: "text-slate-600" },
};

/**
 * ModalBusquedaUniversal
 *
 * Props:
 *  isOpen        boolean
 *  onClose       () => void
 *  title         string
 *  icon          ReactElement  – lucide icon
 *  data          array         – items to show
 *  loading       boolean
 *  columns       Array<{ key, label, mono?, flex? }>
 *  searchKeys    string[]      – which keys to search
 *  selectedIds   any[]         – IDs already selected (highlights row)
 *  getRowId      (item) => any – default: item.id
 *  multiSelect   boolean       – if false, selects + closes immediately
 *  onSelect      (item) => void
 *  colorAccent   'blue'|'green'|'orange'|'slate'
 *  subtitle      (item) => string | null  – optional second line per row
 *  filters       Array<{ key, label, options: [{value,label}] }> – extra filter dropdowns
 */
export default function ModalBusquedaUniversal({
  isOpen,
  onClose,
  title = "Buscar",
  icon = null,
  data = [],
  loading = false,
  columns = [],
  searchKeys = ["codigo", "nombre"],
  selectedIds = [],
  getRowId = (item) => item.id,
  multiSelect = false,
  onSelect,
  colorAccent = "blue",
  subtitle = null,
  filters: extraFilters = [],
}) {
  const ac = ACCENT[colorAccent] || ACCENT.blue;

  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [extraVals, setExtraVals] = useState({});
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  /* Reset on open */
  useEffect(() => {
    if (isOpen) {
      setRawQuery("");
      setQuery("");
      setPage(1);
      setExtraVals({});
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  /* Debounce search 300 ms */
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(rawQuery.trim().toLowerCase());
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [rawQuery]);

  /* Filtered + paginated list */
  const filtered = useMemo(() => {
    let list = data;

    if (query) {
      list = list.filter((item) =>
        searchKeys.some((k) =>
          String(item[k] ?? "").toLowerCase().includes(query)
        )
      );
    }

    extraFilters.forEach(({ key }) => {
      const val = extraVals[key];
      if (val) {
        list = list.filter((item) => String(item[key] ?? "") === val);
      }
    });

    return list;
  }, [data, query, extraVals, searchKeys, extraFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selectedSet = useMemo(() => new Set(selectedIds.map(String)), [selectedIds]);

  const handleSelect = (item) => {
    onSelect?.(item);
    if (!multiSelect) onClose();
  };

  const setFilter = (key, val) => {
    setExtraVals((p) => ({ ...p, [key]: val }));
    setPage(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[88vh] border border-slate-100">

        {/* ── HEADER ── */}
        <div className="px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {icon && (
                <div className={`p-2 rounded-xl ${ac.btn}`}>
                  <span className="text-white [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                {!loading && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
                    {query ? ` para "${rawQuery}"` : ` · ${data.length} en total`}
                    {multiSelect && selectedIds.length > 0 && (
                      <span className={`ml-2 font-semibold ${ac.check}`}>
                        · {selectedIds.length} seleccionado{selectedIds.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search + extra filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar por código o nombre..."
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 ${ac.ring} transition`}
              />
            </div>
            {extraFilters.map(({ key, label, options }) => (
              <select
                key={key}
                value={extraVals[key] || ""}
                onChange={(e) => setFilter(key, e.target.value)}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300 bg-white"
              >
                <option value="">{label}</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Cargando datos...</p>
            </div>
          ) : pageItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
              <AlertCircle className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">Sin resultados</p>
              {query && (
                <p className="text-xs">Prueba con otro término de búsqueda</p>
              )}
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                <tr>
                  {multiSelect && <th className="w-10" />}
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                      style={col.flex ? { width: "100%" } : {}}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => {
                  const id = String(getRowId(item));
                  const selected = selectedSet.has(id);
                  return (
                    <tr
                      key={id}
                      onClick={() => !selected && handleSelect(item)}
                      className={`border-b border-slate-100 transition-colors ${
                        selected
                          ? "bg-slate-50 cursor-default opacity-60"
                          : "hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      {multiSelect && (
                        <td className="px-3 py-3">
                          {selected ? (
                            <CheckCircle2 className={`w-5 h-5 ${ac.check}`} />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                          )}
                        </td>
                      )}
                      {columns.map((col, ci) => (
                        <td
                          key={col.key}
                          className={`px-5 py-3 ${
                            col.mono
                              ? "font-mono font-semibold text-slate-800 whitespace-nowrap"
                              : "text-slate-700"
                          }`}
                        >
                          {ci === 0 && subtitle ? (
                            <div>
                              <div>{item[col.key] ?? "—"}</div>
                              {subtitle(item) && (
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {subtitle(item)}
                                </div>
                              )}
                            </div>
                          ) : (
                            item[col.key] ?? "—"
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── FOOTER / PAGINATION ── */}
        <div className="px-5 py-3 border-t border-slate-200 shrink-0 flex items-center justify-between bg-slate-50/80">
          {/* Pagination info */}
          <p className="text-xs text-slate-500">
            {loading || filtered.length === 0
              ? " "
              : `Página ${safePage} de ${totalPages} · ${filtered.length} resultado${filtered.length !== 1 ? "s" : ""}`}
          </p>

          <div className="flex items-center gap-2">
            {/* Prev/Next */}
            {totalPages > 1 && (
              <>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>

                {/* Page numbers (max 5 visible) */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="text-xs text-slate-400 px-1">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 text-xs rounded-lg font-medium transition ${
                          p === safePage
                            ? `${ac.btn} text-white`
                            : "border border-slate-200 hover:bg-white text-slate-600"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </>
            )}

            {multiSelect ? (
              <button
                onClick={onClose}
                className={`px-4 py-1.5 text-sm text-white rounded-xl font-medium transition ${ac.btn}`}
              >
                Listo
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-sm border border-slate-200 rounded-xl hover:bg-white text-slate-600 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
