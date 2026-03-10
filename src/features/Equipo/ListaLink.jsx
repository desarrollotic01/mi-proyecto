import { useState, useMemo, useEffect } from "react";
import { 
  Search, Building2, User, ChevronLeft, ChevronRight, 
  ArrowUpDown, ChevronsLeft, ChevronsRight 
} from "lucide-react";

export default function InventarioPaginacionPro() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [paginaActual, setPaginaActual] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'codigo', direction: 'asc' });
  const itemsPorPagina = 10;

  // PETICIÓN A TU BACKEND REAL
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        // Asegúrate que esta URL sea la correcta de tu router (ej: /equipos en vez de /api/equipo)
        const response = await fetch('http://localhost:4000/api/equipo');
        
        // 1. Validamos que la respuesta sea exitosa (Status 200-299)
        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }

        // 2. Validamos que el backend realmente nos esté mandando un JSON y no un HTML
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("La ruta devuelta no es un JSON. Revisa la URL en el fetch.");
        }

        const data = await response.json();
        setProductos(data);
      } catch (error) {
        console.error("Fallo la conexión:", error.message);
        // Si falla, evitamos que la tabla se quede cargando infinitamente
        setProductos([]); 
      } finally {
        setCargando(false);
      }
    };
    fetchProductos();
  }, []);

  // Lógica de Filtrado y Ordenamiento
  const datosProcesados = useMemo(() => {
    let items = [...productos].filter(p => {
      // Extraemos el string de forma segura porque p.cliente viene como objeto desde PostgreSQL
      const nombreCliente = typeof p.cliente === 'object' ? p.cliente?.razonSocial : (p.cliente || "");
      
      const coincideBusqueda = (
        p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
        p.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        nombreCliente?.toLowerCase().includes(busqueda.toLowerCase())
      );

      // Estandarizamos a mayúsculas para evitar problemas de "Operativo" vs "OPERATIVO"
      const estadoMayusculas = p.estado?.toUpperCase() || "";
      const coincideFiltro = filtro === "TODOS" || estadoMayusculas === filtro;

      return coincideBusqueda && coincideFiltro;
    });
    
    if (sortConfig.key) {
      items.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Si estamos ordenando por cliente, necesitamos comparar por la razón social
        if (sortConfig.key === 'cliente') {
           valA = typeof valA === 'object' ? valA?.razonSocial : valA;
           valB = typeof valB === 'object' ? valB?.razonSocial : valB;
        }

        valA = valA?.toString().toLowerCase() || "";
        valB = valB?.toString().toLowerCase() || "";
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [productos, busqueda, filtro, sortConfig]);

  // Lógica de Paginación
  const totalPaginas = Math.ceil(datosProcesados.length / itemsPorPagina);
  const indicePrimerItem = (paginaActual - 1) * itemsPorPagina;
  const itemsPaginados = datosProcesados.slice(indicePrimerItem, indicePrimerItem + itemsPorPagina);

  const obtenerPaginasVisibles = () => {
    const paginas = [];
    if (totalPaginas <= 5) {
      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
    } else {
      if (paginaActual <= 3) paginas.push(1, 2, 3, 4, '...', totalPaginas);
      else if (paginaActual > totalPaginas - 3) paginas.push(1, '...', totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas);
      else paginas.push(1, '...', paginaActual - 1, paginaActual, paginaActual + 1, '...', totalPaginas);
    }
    return paginas;
  };

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600 border-solid mx-auto mb-4"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando Activos Reales...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-600">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 p-4 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Building2 size={20} />
            </div>
            <h1 className="text-md font-black text-slate-800 uppercase tracking-tighter">Inventario de Clientes</h1>
          </div>
          <div className="bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 text-[10px] font-black text-slate-500 uppercase">
            {datosProcesados.length} Equipos Registrados
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 mt-8">
        {/* BUSCADOR */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por equipo, código o cliente..." 
              className="w-full pl-12 pr-6 py-3.5 bg-white border-2 border-transparent rounded-2xl shadow-sm focus:border-blue-500 outline-none transition-all font-semibold"
              onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
            />
          </div>
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            {["TODOS", "OPERATIVO", "MANTENIMIENTO", "FALLA"].map(f => (
              <button 
                key={f} 
                onClick={() => {setFiltro(f); setPaginaActual(1);}}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${filtro === f ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA DE DATOS REALES */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-5">Foto</th>
                  {['codigo', 'nombre', 'cliente', 'estado', 'serie', 'sede'].map(key => (
                    <th 
                      key={key} 
                      onClick={() => setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                      className="px-6 py-5 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {key === 'nombre' ? 'Equipo' : key === 'sede' ? 'Ubicación' : key} 
                        <ArrowUpDown size={12} className={sortConfig.key === key ? 'text-blue-600' : 'opacity-20'} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {itemsPaginados.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-all group">
                    <td className="px-6 py-3">
                      <img src={item.foto || 'https://via.placeholder.com/100'} className="w-10 h-10 rounded-lg border border-slate-200 object-cover" alt="" />
                    </td>
                    <td className="px-6 py-3 font-black text-[11px] text-blue-600">{item.codigo}</td>
                    <td className="px-6 py-3 font-black text-slate-700 text-sm uppercase leading-tight">{item.nombre}</td>
                    
                    {/* COLUMNA DE CLIENTE SEGURA */}
                    <td className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-slate-300" />
                        {typeof item.cliente === 'object' ? item.cliente?.razonSocial : (item.cliente || "Sin asignar")}
                      </div>
                    </td>

                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${
                        item.estado?.toUpperCase() === 'OPERATIVO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        item.estado?.toUpperCase() === 'FALLA' ? 'bg-red-50 text-red-600 border-red-100' : 
                        'bg-orange-50 text-orange-600 border-orange-100'
                      }`}>
                        {item.estado || "SIN ESTADO"}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-[10px] font-bold text-slate-400">{item.serie || "-"}</td>
                    <td className="px-6 py-3 text-[10px] font-bold uppercase">{item.sede || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Mostrando <span className="text-slate-700">{indicePrimerItem + 1}-{Math.min(indicePrimerItem + itemsPorPagina, datosProcesados.length)}</span> de {datosProcesados.length}
            </p>

            <div className="flex items-center gap-2">
              <button onClick={() => setPaginaActual(1)} disabled={paginaActual === 1 || totalPaginas === 0} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-30 shadow-sm"><ChevronsLeft size={16} /></button>
              <button onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1 || totalPaginas === 0} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-30 shadow-sm"><ChevronLeft size={16} /></button>
              <div className="flex items-center gap-1.5 px-2">
                {obtenerPaginasVisibles().map((p, i) => (
                  p === '...' ? <span key={`sep-${i}`} className="px-2 text-slate-300 font-black">...</span> : (
                    <button key={p} onClick={() => setPaginaActual(p)} className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all ${paginaActual === p ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:text-blue-600'}`}>{p}</button>
                  )
                ))}
              </div>
              <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas || totalPaginas === 0} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-30 shadow-sm"><ChevronRight size={16} /></button>
              <button onClick={() => setPaginaActual(totalPaginas)} disabled={paginaActual === totalPaginas || totalPaginas === 0} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-30 shadow-sm"><ChevronsRight size={16} /></button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}