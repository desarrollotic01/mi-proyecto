import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { Search, RefreshCw, Package, ShoppingCart, ChevronDown, ChevronRight, FileSpreadsheet } from "lucide-react";
import { getSolicitudesAlmacen, getSolicitudesCompra } from "../services/solicitudesService";

const TABS = [
  { id: "almacen", label: "Solicitud de Almacén", icon: Package },
  { id: "compra", label: "Solicitud de Compra", icon: ShoppingCart },
];

const ESTADO_BADGE = {
  DRAFT:  "bg-yellow-100 text-yellow-700",
  SENT:   "bg-green-100 text-green-700",
  ERROR:  "bg-red-100 text-red-700",
};

function EstadoBadge({ estado }) {
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${ESTADO_BADGE[estado] || "bg-slate-100 text-slate-600"}`}>
      {estado}
    </span>
  );
}

function LineasTable({ lineas }) {
  if (!lineas || lineas.length === 0) {
    return (
      <p className="text-xs text-slate-400 py-2 px-3">Sin ítems.</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-100 text-slate-500 font-bold uppercase tracking-wider">
            <th className="px-3 py-2 text-left">Código</th>
            <th className="px-3 py-2 text-left min-w-[200px]">Descripción</th>
            <th className="px-3 py-2 text-center">Cant.</th>
            <th className="px-3 py-2 text-left">Almacén</th>
            <th className="px-3 py-2 text-left">C. Costo</th>
            <th className="px-3 py-2 text-left">Proyecto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lineas.map((l, i) => (
            <tr key={l.id || i} className="bg-white hover:bg-slate-50">
              <td className="px-3 py-2 font-mono font-semibold text-slate-800 whitespace-nowrap">{l.itemCode || "—"}</td>
              <td className="px-3 py-2 text-slate-700">{l.description || "—"}</td>
              <td className="px-3 py-2 text-center font-semibold text-slate-800">{l.quantity ?? "—"}</td>
              <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{l.warehouseCode || "—"}</td>
              <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{l.costingCode || "—"}</td>
              <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{l.projectCode || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SolicitudTable({ fetchFn }) {
  const [rows, setRows]               = useState([]);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const [loading, setLoading]         = useState(false);
  const [expanded, setExpanded]       = useState(null); // id of expanded row

  const load = useCallback(async () => {
    setLoading(true);
    setExpanded(null);
    try {
      const res = await fetchFn(page, 20, search);
      setRows(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const toggleExpand = (id) => setExpanded((prev) => (prev === id ? null : id));

  const contexto = (row) => {
    if (row.ordenTrabajo?.numeroOT) return row.ordenTrabajo.numeroOT;
    if (row.equipo?.nombre) return row.equipo.nombre;
    if (row.ubicacionTecnica?.nombre) return row.ubicacionTecnica.nombre;
    return "—";
  };

  const COLS = 8; // número de columnas de la tabla (para colspan)

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por código..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Buscar
          </button>
        </form>

        <button
          onClick={() => { setPage(1); setSearch(""); setSearchInput(""); load(); }}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          title="Limpiar"
        >
          <RefreshCw size={16} />
        </button>

        <button
          onClick={() => {
            const data = rows.flatMap((row) => {
              const lineas = Array.isArray(row.lineas) ? row.lineas : [];
              if (lineas.length === 0) {
                return [{
                  "N° Solicitud": row.numeroSolicitud || "",
                  Estado: row.estado || "",
                  "OT / Equipo / Ubicación": contexto(row),
                  Origen: row.esGeneral ? "General" : (row.origen || ""),
                  Solicitante: row.requester || "",
                  "Fecha Requerida": row.requiredDate || "",
                  "Fecha Creación": row.createdAt ? new Date(row.createdAt).toLocaleDateString("es-PE") : "",
                  Código: "", Descripción: "", Cantidad: "", Almacén: "", "C. Costo": "", Proyecto: "",
                }];
              }
              return lineas.map((l) => ({
                "N° Solicitud": row.numeroSolicitud || "",
                Estado: row.estado || "",
                "OT / Equipo / Ubicación": contexto(row),
                Origen: row.esGeneral ? "General" : (row.origen || ""),
                Solicitante: row.requester || "",
                "Fecha Requerida": row.requiredDate || "",
                "Fecha Creación": row.createdAt ? new Date(row.createdAt).toLocaleDateString("es-PE") : "",
                Código: l.itemCode || "",
                Descripción: l.description || "",
                Cantidad: l.quantity ?? "",
                Almacén: l.warehouseCode || "",
                "C. Costo": l.costingCode || "",
                Proyecto: l.projectCode || "",
              }));
            });
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Solicitudes");
            XLSX.writeFile(wb, `Solicitudes_${new Date().toISOString().slice(0,10)}.xlsx`);
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <FileSpreadsheet size={15} /> Exportar Excel
        </button>

        <span className="ml-auto text-xs text-slate-500">{totalCount} resultado{totalCount !== 1 ? "s" : ""}</span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Código</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">OT / Equipo / Ubicación</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Origen</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Solicitante</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha Requerida</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Creado</th>
              <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ítems</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={COLS} className="px-4 py-10 text-center text-slate-400 text-sm">Cargando...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COLS} className="px-4 py-10 text-center text-slate-400 text-sm">No hay solicitudes</td>
              </tr>
            ) : rows.map((row) => {
              const isOpen = expanded === row.id;
              const lineas = Array.isArray(row.lineas) ? row.lineas : [];
              return (
                <>
                  <tr
                    key={row.id}
                    className={`transition-colors ${isOpen ? "bg-blue-50" : "hover:bg-slate-50"}`}
                  >
                    {/* Código — clic para expandir */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleExpand(row.id)}
                        className="flex items-center gap-1.5 font-mono font-semibold text-blue-700 hover:text-blue-900 text-[13px] transition-colors"
                        title="Ver ítems"
                      >
                        {isOpen
                          ? <ChevronDown size={14} className="text-blue-500 shrink-0" />
                          : <ChevronRight size={14} className="text-slate-400 shrink-0" />
                        }
                        {row.numeroSolicitud || "—"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={row.estado} />
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-[13px]">{contexto(row)}</td>
                    <td className="px-4 py-3 text-slate-500 text-[12px]">
                      {row.esGeneral ? "General" : row.origen || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-[13px]">{row.requester || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-[12px]">{row.requiredDate || "—"}</td>
                    <td className="px-4 py-3 text-slate-400 text-[12px]">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString("es-PE") : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {lineas.length}
                      </span>
                    </td>
                  </tr>

                  {/* Fila expandida con ítems */}
                  {isOpen && (
                    <tr key={`${row.id}-lineas`} className="bg-blue-50/60">
                      <td colSpan={COLS} className="px-6 pb-4 pt-1">
                        <div className="rounded-xl border border-blue-100 overflow-hidden shadow-sm">
                          <div className="px-3 py-2 bg-blue-100/60 border-b border-blue-100">
                            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                              Ítems de {row.numeroSolicitud || "la solicitud"} · {lineas.length} ítem{lineas.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <LineasTable lineas={lineas} />
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-500">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

export default function SolicitudesPage() {
  const [activeTab, setActiveTab] = useState("almacen");

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Solicitudes</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gestión de solicitudes de almacén y compra</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
              activeTab === id
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        {activeTab === "almacen" && (
          <SolicitudTable key="almacen" fetchFn={getSolicitudesAlmacen} />
        )}
        {activeTab === "compra" && (
          <SolicitudTable key="compra" fetchFn={getSolicitudesCompra} />
        )}
      </div>
    </div>
  );
}
