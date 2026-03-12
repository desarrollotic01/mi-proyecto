import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Search,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  AlertCircle,
} from "lucide-react";

import { portalClienteService } from "../mantenimiento/services/portalClienteService";

export default function ListaLink() {
  const { token } = useParams();

  const [equipos, setEquipos] = useState([]);
  const [ubicacionesTecnicas, setUbicacionesTecnicas] = useState([]);
  const [cliente, setCliente] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [paginaActual, setPaginaActual] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "codigo",
    direction: "asc",
  });

  const itemsPorPagina = 10;

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        setCargando(true);
        setError("");

        const data = await portalClienteService.obtenerAcceso(token);

        setCliente(data?.cliente || null);
        setEquipos(Array.isArray(data?.equipos) ? data.equipos : []);
        setUbicacionesTecnicas(
          Array.isArray(data?.ubicacionesTecnicas) ? data.ubicacionesTecnicas : []
        );
      } catch (err) {
        console.error("Fallo la conexión:", err);
        setError(
          err?.response?.data?.error || "No se pudo cargar el portal del cliente."
        );
        setCliente(null);
        setEquipos([]);
        setUbicacionesTecnicas([]);
      } finally {
        setCargando(false);
      }
    };

    if (token) {
      fetchPortal();
    }
  }, [token]);

  const datosProcesados = useMemo(() => {
    let items = [...equipos].filter((p) => {
      const nombreCliente =
        typeof p.cliente === "object" ? p.cliente?.razonSocial : p.cliente || "";

      const coincideBusqueda =
        p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        nombreCliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.serie?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.modelo?.toLowerCase().includes(busqueda.toLowerCase());

      const estadoMayusculas = p.estado?.toUpperCase() || "";
      const coincideFiltro = filtro === "TODOS" || estadoMayusculas === filtro;

      return coincideBusqueda && coincideFiltro;
    });

    if (sortConfig.key) {
      items.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === "cliente") {
          valA = typeof valA === "object" ? valA?.razonSocial : valA;
          valB = typeof valB === "object" ? valB?.razonSocial : valB;
        }

        valA = valA?.toString().toLowerCase() || "";
        valB = valB?.toString().toLowerCase() || "";

        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return items;
  }, [equipos, busqueda, filtro, sortConfig]);

  const totalPaginas = Math.ceil(datosProcesados.length / itemsPorPagina);
  const indicePrimerItem = (paginaActual - 1) * itemsPorPagina;
  const itemsPaginados = datosProcesados.slice(
    indicePrimerItem,
    indicePrimerItem + itemsPorPagina
  );

  const obtenerPaginasVisibles = () => {
    const paginas = [];
    if (totalPaginas <= 5) {
      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
    } else {
      if (paginaActual <= 3) paginas.push(1, 2, 3, 4, "...", totalPaginas);
      else if (paginaActual > totalPaginas - 3)
        paginas.push(
          1,
          "...",
          totalPaginas - 3,
          totalPaginas - 2,
          totalPaginas - 1,
          totalPaginas
        );
      else
        paginas.push(
          1,
          "...",
          paginaActual - 1,
          paginaActual,
          paginaActual + 1,
          "...",
          totalPaginas
        );
    }
    return paginas;
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600 border-solid mx-auto mb-4"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Cargando portal del cliente...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-xl w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-600" />
            <h2 className="text-xl font-bold text-red-600">Acceso no disponible</h2>
          </div>
          <p className="text-slate-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-600">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 p-4 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-md font-black text-slate-800 uppercase tracking-tighter">
                Portal del Cliente
              </h1>
              <p className="text-sm text-slate-500 font-semibold">
                {cliente?.razonSocial || "Cliente"}
              </p>
            </div>
          </div>

          <div className="bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 text-[10px] font-black text-slate-500 uppercase">
            {datosProcesados.length} Equipos Registrados
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 mt-8 space-y-6">
        {/* DATOS DEL CLIENTE */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-800 uppercase mb-4">
            Información del Cliente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Razón Social</p>
              <p className="text-slate-800 font-semibold">{cliente?.razonSocial || "-"}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">RUC</p>
              <p className="text-slate-800 font-semibold">{cliente?.ruc || "-"}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Teléfono</p>
              <p className="text-slate-800 font-semibold">{cliente?.telefono || "-"}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Correo</p>
              <p className="text-slate-800 font-semibold">{cliente?.correo || "-"}</p>
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Dirección</p>
              <p className="text-slate-800 font-semibold">{cliente?.direccion || "-"}</p>
            </div>
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por equipo, código, serie, marca o modelo..."
              className="w-full pl-12 pr-6 py-3.5 bg-white border-2 border-transparent rounded-2xl shadow-sm focus:border-blue-500 outline-none transition-all font-semibold"
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
            />
          </div>

          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            {["TODOS", "OPERATIVO", "MANTENIMIENTO", "FALLA", "NO INSTALADO"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFiltro(f);
                  setPaginaActual(1);
                }}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${
                  filtro === f
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                    : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA DE EQUIPOS */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-5">Foto</th>
                  {["codigo", "nombre", "estado", "serie", "marca", "modelo", "sede"].map(
                    (key) => (
                      <th
                        key={key}
                        onClick={() =>
                          setSortConfig({
                            key,
                            direction:
                              sortConfig.key === key && sortConfig.direction === "asc"
                                ? "desc"
                                : "asc",
                          })
                        }
                        className="px-6 py-5 cursor-pointer hover:text-blue-600 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {key === "nombre"
                            ? "Equipo"
                            : key === "sede"
                            ? "Ubicación"
                            : key}
                          <ArrowUpDown
                            size={12}
                            className={sortConfig.key === key ? "text-blue-600" : "opacity-20"}
                          />
                        </div>
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {itemsPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-500 font-semibold">
                      No hay equipos para mostrar.
                    </td>
                  </tr>
                ) : (
                  itemsPaginados.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-all group">
                      <td className="px-6 py-3">
                        <img
                          src={item.foto || "https://via.placeholder.com/100"}
                          className="w-10 h-10 rounded-lg border border-slate-200 object-cover"
                          alt={item.nombre || "Equipo"}
                        />
                      </td>
                      <td className="px-6 py-3 font-black text-[11px] text-blue-600">
                        {item.codigo || "-"}
                      </td>
                      <td className="px-6 py-3 font-black text-slate-700 text-sm uppercase leading-tight">
                        {item.nombre || "-"}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-[9px] font-black border ${
                            item.estado?.toUpperCase() === "OPERATIVO"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : item.estado?.toUpperCase() === "FALLA"
                              ? "bg-red-50 text-red-600 border-red-100"
                              : "bg-orange-50 text-orange-600 border-orange-100"
                          }`}
                        >
                          {item.estado || "SIN ESTADO"}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-mono text-[10px] font-bold text-slate-400">
                        {item.serie || "-"}
                      </td>
                      <td className="px-6 py-3 text-[10px] font-bold uppercase">
                        {item.marca || "-"}
                      </td>
                      <td className="px-6 py-3 text-[10px] font-bold uppercase">
                        {item.modelo || "-"}
                      </td>
                      <td className="px-6 py-3 text-[10px] font-bold uppercase">
                        {item.sede || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Mostrando{" "}
              <span className="text-slate-700">
                {datosProcesados.length === 0
                  ? 0
                  : indicePrimerItem + 1}
                -
                {Math.min(indicePrimerItem + itemsPorPagina, datosProcesados.length)}
              </span>{" "}
              de {datosProcesados.length}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual(1)}
                disabled={paginaActual === 1 || totalPaginas === 0}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-30 shadow-sm"
              >
                <ChevronsLeft size={16} />
              </button>

              <button
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1 || totalPaginas === 0}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-30 shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                {obtenerPaginasVisibles().map((p, i) =>
                  p === "..." ? (
                    <span key={`sep-${i}`} className="px-2 text-slate-300 font-black">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPaginaActual(p)}
                      className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all ${
                        paginaActual === p
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-slate-200 text-slate-400 hover:text-blue-600"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas || totalPaginas === 0}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-30 shadow-sm"
              >
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => setPaginaActual(totalPaginas)}
                disabled={paginaActual === totalPaginas || totalPaginas === 0}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-30 shadow-sm"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* UBICACIONES TÉCNICAS */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
            <MapPin size={18} />
            Ubicaciones Técnicas ({ubicacionesTecnicas.length})
          </h2>

          {ubicacionesTecnicas.length === 0 ? (
            <p className="text-slate-500 font-semibold">
              No hay ubicaciones técnicas registradas.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ubicacionesTecnicas.map((ut) => (
                <div
                  key={ut.id}
                  className="border border-slate-200 rounded-2xl p-4 bg-slate-50"
                >
                  <p className="font-black text-slate-800 uppercase">
                    {ut.nombre || ut.descripcion || "Ubicación técnica"}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    <span className="font-bold">Código:</span> {ut.codigo || "-"}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-bold">Dirección:</span> {ut.direccion || "-"}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-bold">Cliente:</span>{" "}
                    {ut.cliente?.razonSocial || "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}