import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Search, Plus, Edit2, Trash2, RefreshCw, MapPin, Loader2,
  Building2, Globe, Truck, FileText, Calendar, Tag, Box, Zap, Package, FileSpreadsheet
} from "lucide-react";
import ModalImportMasivo from "../../../components/inputs/ModalImportMasivo";

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
  const [importOpen, setImportOpen] = useState(false);

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
      return [u.codigo, u.nombre, u.especialidad, u.almacen]
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
             <button
               onClick={() => {
                 const data = filtered.map((u) => {
                   const cli = clientes.find(c => String(c.id) === String(u.clienteId));
                   const p = paises.find(p => String(p.id) === String(u.paisId));
                   return {
                     Código: u.codigo || "",
                     Nombre: u.nombre || "",
                     Especialidad: u.especialidad || "",
                     Almacén: u.almacen || "",
                     Cliente: cli?.nombre || cli?.razonSocial || "",
                     País: p?.nombre || "",
                     "N° OC": u.numeroOrdenCliente || "",
                   };
                 });
                 const ws = XLSX.utils.json_to_sheet(data);
                 const wb = XLSX.utils.book_new();
                 XLSX.utils.book_append_sheet(wb, ws, "Ubicaciones");
                 XLSX.writeFile(wb, `Ubicaciones_${new Date().toISOString().slice(0,10)}.xlsx`);
               }}
               className="bg-indigo-600 text-white px-4 sm:px-5 py-2.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all uppercase tracking-wider flex-1 sm:flex-none"
             >
               <FileSpreadsheet size={16} strokeWidth={3} className="shrink-0"/>
               <span className="hidden sm:inline">EXPORTAR EXCEL</span>
               <span className="sm:hidden">EXPORTAR</span>
             </button>
             <button onClick={() => setImportOpen(true)} className="bg-emerald-600 text-white px-4 sm:px-5 py-2.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-wider flex-1 sm:flex-none">
               <FileSpreadsheet size={16} strokeWidth={3} className="shrink-0"/>
               <span className="hidden sm:inline">IMPORTAR EXCEL</span>
               <span className="sm:hidden">EXCEL</span>
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

        {/* TABLA EXCEL-STYLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-[11px] border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-2 py-2.5 border border-slate-700 text-center w-8">#</th>
                  <th className="px-3 py-2.5 border border-slate-700">Código</th>
                  <th className="px-3 py-2.5 border border-slate-700 min-w-[160px]">Nombre</th>
                  <th className="px-3 py-2.5 border border-slate-700">Especialidad</th>
                  <th className="px-3 py-2.5 border border-slate-700 min-w-[140px]">Cliente</th>
                  <th className="px-3 py-2.5 border border-slate-700">Sede</th>
                  <th className="px-3 py-2.5 border border-slate-700">País</th>
                  <th className="px-3 py-2.5 border border-slate-700">Almacén</th>
                  <th className="px-3 py-2.5 border border-slate-700">Operador</th>
                  <th className="px-3 py-2.5 border border-slate-700">OC</th>
                  <th className="px-3 py-2.5 border border-slate-700 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-10 text-center text-slate-400 font-bold border border-slate-100">
                      Sin registros
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => {
                    const cli = clientes.find(c => String(c.id) === String(item.clienteId));
                    const pFound = paises.find(p => String(p.id) === String(item.paisId));
                    return (
                      <tr key={item.id}
                        className={`transition-colors hover:bg-blue-50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                        <td className="px-2 py-2 border border-slate-200 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-3 py-2 border border-slate-200 font-black text-blue-700">{val(item.codigo)}</td>
                        <td className="px-3 py-2 border border-slate-200 font-bold text-slate-800">{val(item.nombre)}</td>
                        <td className="px-3 py-2 border border-slate-200 text-blue-600 font-semibold">{val(item.especialidad)}</td>
                        <td className="px-3 py-2 border border-slate-200 font-semibold text-slate-800">{cli?.razonSocial || cli?.nombre || "—"}</td>
                        <td className="px-3 py-2 border border-slate-200 text-slate-600">{val(item.sede)}</td>
                        <td className="px-3 py-2 border border-slate-200 text-slate-600">{pFound?.nombre || "—"}</td>
                        <td className="px-3 py-2 border border-slate-200 text-slate-600">{val(item.almacen)}</td>
                        <td className="px-3 py-2 border border-slate-200 text-slate-600">{val(item.operadorLogistico)}</td>
                        <td className="px-3 py-2 border border-slate-200 font-mono text-slate-700">{val(item.numeroOrdenCliente)}</td>
                        <td className="px-3 py-2 border border-slate-200">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => handleOpenPDF(item)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="PDF">
                              <FileText size={14} />
                            </button>
                            <button onClick={() => { setEditing(item); setModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} disabled={busyId === item.id} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                              {busyId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <UbicacionTecnicaModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} initialData={editing} />
      <ModalImportMasivo
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        entidadInicial="ubicaciones"
        onSuccess={loadAllData}
      />
      
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