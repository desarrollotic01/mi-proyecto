import { useState, useMemo } from "react";
import { 
  Search, MapPin, Printer, ExternalLink, Building2, 
  ChevronLeft, ChevronRight, ArrowUpDown, ChevronsLeft, ChevronsRight 
} from "lucide-react";

export default function InventarioPaginacionPro() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [paginaActual, setPaginaActual] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'codigo', direction: 'asc' });
  const itemsPorPagina = 10;

  // Datos Simulados
  const productos = useMemo(() => {
    return Array.from({ length: 300 }).map((_, i) => ({
      id: i,
      foto: `https://picsum.photos/seed/${i + 70}/100/100`, 
      codigo: `EQUIP-${String(i + 1).padStart(3, '0')}`,
      nombre: i % 2 === 0 ? "Transformador de Potencia" : "Motor Hidráulico Industrial",
      marca: i % 2 === 0 ? "SIEMENS" : "ABB",
      serie: `SN-2024-X${1000 + i}`,
      sede: i % 2 === 0 ? "Sede Central" : "Planta Norte",
      estado: ["OPERATIVO", "MANTENIMIENTO", "FALLA"][i % 3]
    }));
  }, []);

  // Lógica de Filtrado y Ordenamiento
  const datosProcesados = useMemo(() => {
    let items = productos.filter(p => 
      (p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo.toLowerCase().includes(busqueda.toLowerCase())) &&
      (filtro === "TODOS" || p.estado === filtro)
    );
    if (sortConfig.key) {
      items.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [productos, busqueda, filtro, sortConfig]);

  // Lógica de Paginación
  const totalPaginas = Math.ceil(datosProcesados.length / itemsPorPagina);
  const indicePrimerItem = (paginaActual - 1) * itemsPorPagina;
  const itemsPaginados = datosProcesados.slice(indicePrimerItem, indicePrimerItem + itemsPorPagina);

  // Generador de números de página visibles
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-600">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 p-4 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Building2 size={20} />
            </div>
            <h1 className="text-md font-black text-slate-800 uppercase tracking-tighter">Inventario Corporativo</h1>
          </div>
          <div className="bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 text-[10px] font-black text-slate-500 uppercase">
            {datosProcesados.length} Activos Totales
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
              placeholder="Buscar por nombre o código..." 
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

        {/* TABLA */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-5">Foto</th>
                  {['codigo', 'nombre', 'estado', 'serie', 'sede'].map(key => (
                    <th 
                      key={key} 
                      onClick={() => setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                      className="px-6 py-5 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {key === 'nombre' ? 'Descripción' : key === 'sede' ? 'Ubicación' : key} 
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
                      <img src={item.foto} className="w-10 h-10 rounded-lg border border-slate-200 object-cover" alt="" />
                    </td>
                    <td className="px-6 py-3 font-black text-[11px] text-blue-600">{item.codigo}</td>
                    <td className="px-6 py-3 font-black text-slate-700 text-sm uppercase leading-tight">{item.nombre}</td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${item.estado === 'OPERATIVO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-[10px] font-bold text-slate-400">{item.serie}</td>
                    <td className="px-6 py-3 text-[10px] font-bold uppercase">{item.sede}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN UX MEJORADA */}
          <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Mostrando <span className="text-slate-700">{indicePrimerItem + 1}-{Math.min(indicePrimerItem + itemsPorPagina, datosProcesados.length)}</span> de {datosProcesados.length}
            </p>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPaginaActual(1)} 
                disabled={paginaActual === 1}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronsLeft size={16} />
              </button>
              
              <button 
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))} 
                disabled={paginaActual === 1}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                {obtenerPaginasVisibles().map((p, i) => (
                  p === '...' ? (
                    <span key={`sep-${i}`} className="px-2 text-slate-300 font-black">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPaginaActual(p)}
                      className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all ${
                        paginaActual === p 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'bg-white border border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      {p}
                    </button>
                  )
                ))}
              </div>

              <button 
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} 
                disabled={paginaActual === totalPaginas}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronRight size={16} />
              </button>

              <button 
                onClick={() => setPaginaActual(totalPaginas)} 
                disabled={paginaActual === totalPaginas}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}