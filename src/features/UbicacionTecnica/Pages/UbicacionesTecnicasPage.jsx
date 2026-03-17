import { useEffect, useMemo, useState } from "react";
import {
  Search, Plus, Edit2, Trash2, RefreshCw, MapPin, Loader2,
  Building2, Globe, Truck, FileText, Calendar, Tag, Box, Zap, Package
} from "lucide-react";

import UbicacionTecnicaModal from "../Components/UbicacionTecnicaModal";
import { UbicacionTecnicaService } from "../../mantenimiento/services/ubicacionService";
import { paisService } from "../../mantenimiento/services/paisService";
import { clienteService } from "../../mantenimiento/services/clienteService";

// 🆕 Importamos el Modal Global y el Diseño del PDF
import { GlobalPDFModal } from "../../../components/GlobalPDFModal";
import { UbicacionPDF } from "../Components/UbicacionPDF";

const val = (x) => (x === null || x === undefined || x === "" ? "-" : String(x));

const fmtDate = (d) => {
  try { 
    if (!d) return "-";
    const cleanDate = String(d).split('T')[0];
    const [year, month, day] = cleanDate.split("-");
    return `${day}/${month}/${year}`; 
  } catch { return "-"; }
};

export default function UbicacionesTecnicasPage() {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  // 🆕 Estados para el PDF
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfData, setPdfData] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [paises, setPaises] = useState([]);
  const [clientes, setClientes] = useState([]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resUbi, resPai, resCli] = await Promise.all([
        UbicacionTecnicaService.getUbicacionTecnicas(),
        paisService.getAll?.() ?? paisService.getPaises?.(),
        clienteService.getAll?.() ?? clienteService.getClientes?.()
      ]);
      setItems(Array.isArray(resUbi) ? resUbi : (resUbi?.data || []));
      setPaises(Array.isArray(resPai) ? resPai : (resPai?.data || []));
      setClientes(Array.isArray(resCli) ? resCli : (resCli?.data || []));
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { loadAllData(); }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((u) => {
      if (!q) return true;
      return [u.codigo, u.nombre, u.idPlaca, u.numeroOV, u.especialidad, u.almacen]
        .some(f => String(f).toLowerCase().includes(q));
    });
  }, [items, searchTerm]);

  const stats = useMemo(() => ({
    total: filtered.length,
    paises: new Set(filtered.map(u => u.paisId).filter(Boolean)).size,
    vendidos: filtered.filter(u => String(u.tipoEquipoPropiedad).toLowerCase() === "vendido").length
  }), [filtered]);

  const handleSave = async (payload, mode) => {
    try {
      if (mode === "edit") await UbicacionTecnicaService.updateUbicacionTecnica(editing.id, payload);
      else await UbicacionTecnicaService.createUbicacionTecnica(payload);
      await loadAllData(); 
      setModalOpen(false);
      setEditing(null);
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar registro?")) return;
    setBusyId(id);
    try { await UbicacionTecnicaService.deleteUbicacionTecnica(id); await loadAllData(); } 
    finally { setBusyId(null); }
  };

// 🆕 Función para abrir el PDF y enviarle los nombres reales (no solo los IDs)
  const handleOpenPDF = (item) => {
    // Buscamos el nombre del cliente y país para que salgan bien en el PDF
    const cli = clientes.find(c => String(c.id) === String(item.clienteId));
    const pFound = paises.find(p => String(p.id) === String(item.paisId));
    
    // Adjuntamos esos nombres al objeto que le pasamos al PDF
    const dataEnriquecida = {
      ...item,
      nombreClienteEnriquecido: cli?.nombre || cli?.razonSocial || "Sin Cliente",
      nombrePaisEnriquecido: pFound?.nombre || "-"
    };

    setPdfData(dataEnriquecida);
    setPdfOpen(true);
  };

  if (loading && items.length === 0) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-3 sm:p-6 font-sans text-slate-800 w-full overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-5">
        
        {/* Header Responsivo */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white px-4 sm:px-6 py-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
          <h1 className="text-[16px] sm:text-[17px] font-black text-slate-800 flex items-center gap-2.5 tracking-tight w-full sm:w-auto">
            <MapPin size={20} className="text-blue-600 stroke-[2.5] shrink-0"/> Gestión de Activos
          </h1>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
             <button onClick={loadAllData} className="p-2 sm:p-2.5 text-slate-400 hover:text-blue-600 transition-colors border border-transparent hover:border-slate-200 rounded-lg bg-slate-50 hover:bg-white shrink-0">
               <RefreshCw size={18} className={loading ? "animate-spin" : ""}/>
             </button>
             <button onClick={() => { setEditing(null); setModalOpen(true); }} className="bg-blue-600 text-white px-4 sm:px-5 py-2.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all uppercase tracking-wider flex-1 sm:flex-none">
               <Plus size={16} strokeWidth={3} className="shrink-0"/> 
               <span className="hidden sm:inline">NUEVO REGISTRO</span>
               <span className="sm:hidden">NUEVO</span>
             </button>
          </div>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5">
          <StatCard icon={Box} label="Total Activos" value={stats.total} color="blue" />
          <StatCard icon={Globe} label="Países Activos" value={stats.paises} color="indigo" />
          <StatCard icon={Zap} label="Equipos Vendidos" value={stats.vendidos} color="emerald" />
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Buscar identificación, nombre, placa..." 
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-[12px] font-medium outline-none focus:border-blue-500 bg-white shadow-sm transition-all text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* TABLA RESPONSIVA */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-[11px] border-collapse min-w-[1024px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[9px]">
                  <th className="px-4 py-4 w-10 text-center">#</th>
                  <th className="px-4 py-4">Identificación</th>
                  <th className="px-4 py-4">Datos del Equipo</th>
                  <th className="px-4 py-4">Cliente / Ubicación</th>
                  <th className="px-4 py-4">Logística</th>
                  <th className="px-4 py-4">Comercial / Fechas</th>
                  <th className="px-4 py-4 text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx) => {
                  const cli = clientes.find(c => String(c.id) === String(item.clienteId));
                  const pFound = paises.find(p => String(p.id) === String(item.paisId));
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-5 text-center text-slate-300 font-mono text-[10px] align-top pt-6">{idx + 1}</td>

                      {/* IDENTIFICACIÓN */}
                      <td className="px-4 py-5 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="text-[10px]"><span className="font-bold text-slate-400">CÓDIGO:</span> <span className="font-black text-blue-600 text-[11px] ml-1">{val(item.codigo)}</span></div>
                          <div className="text-[10px]"><span className="font-bold text-slate-400">PLACA:</span> <span className="text-slate-700 font-bold ml-1">{val(item.idPlaca)}</span></div>
                          <div className="text-[10px]"><span className="font-bold text-slate-400">PROPIEDAD:</span> <span className="text-slate-700 font-bold ml-1 uppercase">{val(item.tipoEquipoPropiedad)}</span></div>
                        </div>
                      </td>

                      {/* DATOS DEL EQUIPO */}
                      <td className="px-4 py-5 align-top max-w-[220px]">
                        <div className="flex flex-col gap-1.5">
                          <div className="font-black text-slate-800 uppercase text-[11px] mb-0.5 leading-tight whitespace-normal">{val(item.nombre)}</div>
                          <div className="text-[10px]"><span className="font-bold text-slate-400">ESPEC:</span> <span className="text-blue-600 font-bold ml-1">{val(item.especialidad)}</span></div>
                          <div className="text-[10px] mt-0.5 flex">
                             <span className="font-bold text-slate-400 mr-1">DESC:</span> 
                             <span className="text-slate-500 italic line-clamp-2 leading-tight flex-1">{val(item.descripcion)}</span>
                          </div>
                        </div>
                      </td>

                      {/* CLIENTE / UBICACIÓN */}
                      <td className="px-4 py-5 align-top max-w-[220px]">
                        <div className="flex flex-col gap-1.5">
                          <div className="font-black text-slate-800 uppercase leading-tight truncate mb-0.5">{cli?.nombre || cli?.razonSocial || "Sin Cliente"}</div>
                          <div className="text-[10px]"><span className="font-bold text-slate-400">ID_CLI:</span> <span className="text-slate-700 font-bold ml-1">{val(item.id_cliente)}</span></div>
                          <div className="text-[10px]"><span className="font-bold text-slate-400">SEDE:</span> <span className="text-slate-700 font-bold ml-1">{val(item.sede)}</span></div>
                          <div className="text-[10px]"><span className="font-bold text-slate-400">PAÍS:</span> <span className="text-slate-700 font-bold ml-1">{pFound?.nombre || "-"}</span></div>
                        </div>
                      </td>

                      {/* LOGÍSTICA */}
                      <td className="px-4 py-5 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="text-[10px]"><span className="font-bold text-slate-400">ALMACÉN:</span> <span className="font-bold text-slate-700 ml-1">{val(item.almacen)}</span></div>
                          <div className="text-[10px]"><span className="font-bold text-slate-400">OPERADOR:</span> <span className="font-bold text-slate-700 ml-1">{val(item.operadorLogistico)}</span></div>
                        </div>
                      </td>

                      {/* COMERCIAL / FECHAS */}
                      <td className="px-4 py-5 align-top min-w-[280px]">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-4">
                            <div className="text-[10px]"><span className="font-bold text-slate-400">OV:</span> <span className="font-black text-slate-800 ml-1">{val(item.numeroOV)}</span> <span className="text-[9px] text-slate-400 italic ml-1">({fmtDate(item.fechaOV)})</span></div>
                            <div className="text-[10px]"><span className="font-bold text-slate-400">OC:</span> <span className="font-bold text-slate-700 ml-1">{val(item.numeroOrdenCliente)}</span> <span className="text-[9px] text-slate-400 italic ml-1">({fmtDate(item.fechaOrdenCliente)})</span></div>
                          </div>
                          <div className="flex flex-col gap-1 mt-1">
                             <div className="text-[10px]"><span className="font-bold text-slate-400">ENTREGA:</span> <span className="text-slate-800 font-black text-[11px] ml-1">{fmtDate(item.fechaEntregaReal)}</span> <span className="text-slate-400 text-[9px] italic ml-1">(Prev: {fmtDate(item.fechaEntregaPrevista)})</span></div>
                             <div className="text-[10px]"><span className="font-bold text-slate-400">GARANTÍA:</span> <span className="text-emerald-600 font-black text-[11px] ml-1">{fmtDate(item.finGarantia)}</span></div>
                          </div>
                        </div>
                      </td>

                    {/* ACCIONES */}
                      <td className="px-4 py-5 align-middle text-right pr-6">
                        {/* 🆕 Quité opacity-0 y group-hover:opacity-100 para que SIEMPRE se vean */}
                        <div className="flex justify-end gap-2">
                          
                          {/* BOTÓN DE PDF */}
                          <button 
                            onClick={() => handleOpenPDF(item)} 
                            className="p-2 sm:p-1.5 text-indigo-600 hover:bg-indigo-100 bg-indigo-50 rounded-lg transition-colors border border-indigo-100 shadow-sm"
                            title="PDF"
                          >
                            <FileText size={16}/>
                          </button>
                          
                          {/* BOTÓN EDITAR */}
                          <button 
                            onClick={() => { setEditing(item); setModalOpen(true); }} 
                            className="p-2 sm:p-1.5 text-blue-600 hover:bg-blue-100 bg-blue-50 rounded-lg transition-colors border border-blue-100 shadow-sm" 
                            title="Editar"
                          >
                            <Edit2 size={16}/>
                          </button>
                          
                          {/* BOTÓN ELIMINAR */}
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            disabled={busyId === item.id} 
                            className="p-2 sm:p-1.5 text-red-600 hover:bg-red-100 bg-red-50 rounded-lg transition-colors border border-red-100 shadow-sm" 
                            title="Eliminar"
                          >
                            {busyId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                          
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <UbicacionTecnicaModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} initialData={editing} />
      
      {/* 🆕 MODAL DE PDF RENDERIZADO AL FINAL */}
      <GlobalPDFModal
        isOpen={pdfOpen}
        onClose={() => { setPdfOpen(false); setPdfData(null); }}
        title={`Reporte de Activo: ${pdfData?.codigo || 'Documento'}`}
      >
        {/* Le pasamos la data seleccionada al diseño del PDF */}
        {pdfData && <UbicacionPDF data={pdfData} />}
      </GlobalPDFModal>

    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = { 
    blue: "text-blue-600 bg-blue-50", 
    emerald: "text-emerald-600 bg-emerald-50", 
    indigo: "text-indigo-600 bg-indigo-50" 
  };
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 flex items-center gap-3 sm:gap-4 shadow-sm w-full">
      <div className={`p-3 sm:p-3.5 rounded-xl shrink-0 ${colors[color]}`}><Icon size={20} className="sm:w-6 sm:h-6" strokeWidth={2.5} /></div>
      <div className="flex flex-col gap-0.5 sm:gap-1 overflow-hidden">
        <p className="text-xl sm:text-2xl font-black text-slate-800 leading-none truncate">{value}</p>
        <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none truncate">{label}</p>
      </div>
    </div>
  );
}