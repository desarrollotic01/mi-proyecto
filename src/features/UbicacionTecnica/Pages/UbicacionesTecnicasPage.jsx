import { useEffect, useMemo, useState } from "react";
import {
  Search, Plus, Edit2, Trash2, RefreshCw, MapPin, Loader2,
  Building2, Globe, Truck, FileText, Calendar, Tag, Box, Hash
} from "lucide-react";

import UbicacionTecnicaModal from "../Components/UbicacionTecnicaModal";
import { UbicacionTecnicaService } from "../../mantenimiento/services/ubicacionService";
import { paisService } from "../../mantenimiento/services/paisService";
import { clienteService } from "../../mantenimiento/services/clienteService";

// --- HELPERS DE FORMATO ---
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
      const data = [u.codigo, u.nombre, u.idPlaca, u.numeroOV, u.especialidad, u.almacen, u.operadorLogistico, u.id_cliente].join(" ").toLowerCase();
      return data.includes(q);
    });
  }, [items, searchTerm]);

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
    if (!confirm("¿Eliminar?")) return;
    setBusyId(id);
    try { await UbicacionTecnicaService.deleteUbicacionTecnica(id); await loadAllData(); } 
    finally { setBusyId(null); }
  };

  if (loading && items.length === 0) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-3 font-sans text-slate-900">
      <div className="max-w-full mx-auto space-y-3">
        
        {/* Header Compacto */}
        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md shadow-blue-100">
              <MapPin size={18} strokeWidth={2.5}/>
            </div>
            <div>
              <h1 className="text-base font-black text-slate-800 tracking-tight leading-none">Activos Técnicos</h1>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Control Total de Inventario</span>
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={loadAllData} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/></button>
             <button onClick={() => { setEditing(null); setModalOpen(true); }} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1.5 hover:bg-blue-700 shadow-md shadow-blue-200 transition-all">
               <Plus size={14} strokeWidth={3}/> NUEVO REGISTRO
             </button>
          </div>
        </div>

        {/* Buscador Slim */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
          <input 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Buscar por Código, Nombre, Placa, Almacén, Operador, OV, Especialidad..." 
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 bg-white transition-all shadow-sm"
          />
        </div>

        {/* Tabla Totalmente Equipada y Compacta */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10.5px] border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-tighter">
                  <th className="px-3 py-2 w-8 text-center text-slate-300 italic">#</th>
                  <th className="px-3 py-2">Identificación & Tipo</th>
                  <th className="px-3 py-2">Detalles del Activo</th>
                  <th className="px-3 py-2">Cliente & Geografía</th>
                  <th className="px-3 py-2">Logística & Almacén</th>
                  <th className="px-3 py-2">Comercial & Fechas</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx) => {
                  const cli = clientes.find(c => String(c.id) === String(item.clienteId));
                  const pFound = paises.find(p => String(p.id) === String(item.paisId));
                  return (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      
                      <td className="px-2 py-3 text-center text-slate-300 font-mono text-[9px]">{idx + 1}</td>

                      {/* 1. IDENTIFICACIÓN & TIPO */}
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 w-fit">{val(item.codigo)}</span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold text-slate-400">PLACA: <span className="text-slate-700">{val(item.idPlaca)}</span></span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase w-fit border border-slate-200 mt-1">
                              {val(item.tipoEquipoPropiedad)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. DETALLES DEL ACTIVO (Nombre, Espec, Desc) */}
                      <td className="px-3 py-3 align-top max-w-[200px]">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-slate-800 uppercase leading-tight">{val(item.nombre)}</span>
                          <span className="text-[9px] font-bold text-indigo-600">ESPEC: {val(item.especialidad)}</span>
                          <p className="text-[9px] text-slate-400 italic line-clamp-2 leading-tight border-l-2 border-slate-100 pl-1.5 mt-0.5">
                            {val(item.descripcion)}
                          </p>
                        </div>
                      </td>

                      {/* 3. CLIENTE & GEOGRAFÍA */}
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-slate-700 truncate max-w-[160px] uppercase leading-none">{cli?.nombre || cli?.razonSocial || "Sin Cliente"}</span>
                          <div className="flex flex-col gap-0.5 mt-1">
                            <div className="flex items-center gap-1 text-[9px] text-slate-500">
                              <span className="font-bold text-slate-400">REF:</span> {val(item.id_cliente)}
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase">
                              <Globe size={10} className="text-blue-400" /> {pFound?.nombre || "-"} / {val(item.sede)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 4. LOGÍSTICA & ALMACÉN */}
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1 text-[9px] text-slate-600 font-bold">
                            <Box size={10} className="text-slate-400" /> ALM: <span className="text-slate-800">{val(item.almacen)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-slate-600 font-bold">
                            <Truck size={10} className="text-slate-400" /> OPER: <span className="text-slate-800">{val(item.operadorLogistico)}</span>
                          </div>
                        </div>
                      </td>

                      {/* 5. COMERCIAL & FECHAS */}
                      <td className="px-3 py-3 align-top min-w-[210px]">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">Ordenes</span>
                            <span className="text-[9px] font-black text-slate-700">OV: {val(item.numeroOV)}</span>
                            <span className="text-[9px] font-medium text-slate-700">OC: {val(item.numeroOrdenCliente)}</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">Entrega Real</span>
                            <span className="text-[9px] font-black text-slate-700">{fmtDate(item.fechaEntregaReal)}</span>
                            <span className="text-[8px] text-slate-400 italic">Prev: {fmtDate(item.fechaEntregaPrevista)}</span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Garantía:</span>
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1 rounded">{fmtDate(item.finGarantia)}</span>
                          </div>
                        </div>
                      </td>

                      {/* 6. ACCIONES */}
                      <td className="px-3 py-3 align-middle text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditing(item); setModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md border border-transparent hover:border-blue-100 transition-all"><Edit2 size={13}/></button>
                          <button onClick={() => handleDelete(item.id)} disabled={busyId === item.id} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md border border-transparent hover:border-red-100 transition-all">
                            {busyId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
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
    </div>
  );
}