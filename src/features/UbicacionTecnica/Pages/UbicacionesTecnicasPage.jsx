import { useEffect, useMemo, useState } from "react";
import {
  Search, Plus, Edit2, Trash2, RefreshCw, MapPin, Loader2,
  Building2, Globe, Truck, FileText, Calendar, Tag, Box, Zap, Package
} from "lucide-react";

import UbicacionTecnicaModal from "../Components/UbicacionTecnicaModal";
import { UbicacionTecnicaService } from "../../mantenimiento/services/ubicacionService";
import { paisService } from "../../mantenimiento/services/paisService";
import { clienteService } from "../../mantenimiento/services/clienteService";

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
      return [u.codigo, u.nombre, u.idPlaca, u.numeroOV, u.especialidad, u.almacen]
        .some(f => String(f).toLowerCase().includes(q));
    });
  }, [items, searchTerm]);

  // 👇 CÁLCULO DE TOTALES PARA LOS CONTADORES
  const stats = useMemo(() => ({
    total: filtered.length, // Total según el filtro
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

  if (loading && items.length === 0) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-3 font-sans text-slate-900">
      <div className="max-w-full mx-auto space-y-3">
        
        {/* Header Compacto */}
        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <h1 className="text-base font-black text-slate-800 flex items-center gap-2">
            <MapPin size={18} className="text-blue-600"/> Gestión de Activos
          </h1>
          <div className="flex gap-2">
             <button onClick={loadAllData} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/></button>
             <button onClick={() => { setEditing(null); setModalOpen(true); }} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1.5 shadow-md shadow-blue-200 transition-all">
               <Plus size={14} strokeWidth={3}/> NUEVO REGISTRO
             </button>
          </div>
        </div>

        {/* 👇 SECCIÓN DE CONTADORES (TOTALES) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={Package} label="Total Activos" value={stats.total} color="blue" />
          <StatCard icon={Globe} label="Países Activos" value={stats.paises} color="indigo" />
          <StatCard icon={Zap} label="Equipos Vendidos" value={stats.vendidos} color="emerald" />
        </div>

        {/* Buscador Slim */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Buscar identificación, nombre, placa, especialidad..." 
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500 bg-white shadow-sm transition-all"
          />
        </div>

        {/* Tabla Compacta con Nombres de Campo */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-tighter">
                  <th className="px-3 py-2 w-8 text-center italic">#</th>
                  <th className="px-3 py-2">Identificación</th>
                  <th className="px-3 py-2">Datos del Equipo</th>
                  <th className="px-3 py-2">Cliente / Ubicación</th>
                  <th className="px-3 py-2">Logística</th>
                  <th className="px-3 py-2">Comercial / Fechas</th>
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

                      {/* IDENTIFICACIÓN */}
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div><span className="font-bold text-slate-400 uppercase">CÓDIGO:</span> <span className="font-black text-blue-700">{val(item.codigo)}</span></div>
                          <div><span className="font-bold text-slate-400 uppercase">PLACA:</span> <span className="text-slate-700 font-bold">{val(item.idPlaca)}</span></div>
                          <div><span className="font-bold text-slate-400 uppercase">PROPIEDAD:</span> <span className="text-slate-600 uppercase font-medium">{val(item.tipoEquipoPropiedad)}</span></div>
                        </div>
                      </td>

                      {/* DATOS DEL EQUIPO */}
                      <td className="px-3 py-3 align-top max-w-[180px]">
                        <div className="flex flex-col gap-1">
                          <div className="font-black text-slate-800 uppercase text-[11px] mb-1 leading-none">{val(item.nombre)}</div>
                          <div><span className="font-bold text-slate-400 uppercase">ESPEC:</span> <span className="text-indigo-600 font-bold">{val(item.especialidad)}</span></div>
                          <div className="mt-1"><span className="font-bold text-slate-400 uppercase">DESC:</span> <span className="text-slate-500 italic line-clamp-2">{val(item.descripcion)}</span></div>
                        </div>
                      </td>

                      {/* CLIENTE / UBICACIÓN */}
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="font-black text-slate-700 uppercase leading-tight truncate max-w-[150px]">{cli?.nombre || cli?.razonSocial || "Sin Cliente"}</div>
                          <div><span className="font-bold text-slate-400 uppercase">ID_CLI:</span> {val(item.id_cliente)}</div>
                          <div><span className="font-bold text-slate-400 uppercase">SEDE:</span> {val(item.sede)}</div>
                          <div><span className="font-bold text-slate-400 uppercase">PAÍS:</span> {pFound?.nombre || "-"}</div>
                        </div>
                      </td>

                      {/* LOGÍSTICA */}
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div><span className="font-bold text-slate-400 uppercase">ALMACÉN:</span> <span className="font-bold text-slate-800">{val(item.almacen)}</span></div>
                          <div><span className="font-bold text-slate-400 uppercase">OPERADOR:</span> <span className="font-bold text-slate-800">{val(item.operadorLogistico)}</span></div>
                        </div>
                      </td>

                      {/* COMERCIAL / FECHAS */}
                      <td className="px-3 py-3 align-top min-w-[200px]">
                        <div className="grid grid-cols-1 gap-1">
                          <div className="flex gap-2">
                            <div><span className="font-bold text-slate-400 uppercase">OV:</span> <span className="font-black text-slate-700">{val(item.numeroOV)}</span> <span className="text-[8px] text-slate-400">({fmtDate(item.fechaOV)})</span></div>
                            <div><span className="font-bold text-slate-400 uppercase">OC:</span> <span className="text-slate-700 font-medium">{val(item.numeroOrdenCliente)}</span> <span className="text-[8px] text-slate-400">({fmtDate(item.fechaOrdenCliente)})</span></div>
                          </div>
                          <div className="h-[1px] bg-slate-100 my-0.5" />
                          <div><span className="font-bold text-slate-400 uppercase">ENTREGA:</span> <span className="text-slate-700 font-bold">{fmtDate(item.fechaEntregaReal)}</span> <span className="text-slate-400 text-[9px] italic ml-1">(Prev: {fmtDate(item.fechaEntregaPrevista)})</span></div>
                          <div><span className="font-bold text-slate-400 uppercase">GARANTÍA:</span> <span className="text-emerald-600 font-black">{fmtDate(item.finGarantia)}</span></div>
                        </div>
                      </td>

                      {/* ACCIONES */}
                      <td className="px-3 py-3 align-middle text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditing(item); setModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-100 transition-all"><Edit2 size={13}/></button>
                          <button onClick={() => handleDelete(item.id)} disabled={busyId === item.id} className="p-1.5 text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-all">
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

// 👇 COMPONENTE PARA LAS TARJETAS DE ESTADÍSTICAS (STAT CARDS)
function StatCard({ icon: Icon, label, value, color }) {
  const colors = { 
    blue: "bg-blue-50 text-blue-600", 
    emerald: "bg-emerald-50 text-emerald-600", 
    indigo: "bg-indigo-50 text-indigo-600" 
  };
  return (
    <div className="bg-white rounded-lg p-3 border border-slate-200 flex items-center gap-3 transition-all hover:border-blue-300 shadow-sm">
      <div className={`p-2 rounded-md ${colors[color]}`}><Icon size={18} strokeWidth={2.5} /></div>
      <div>
        <p className="text-xl font-black text-slate-800 leading-none">{value}</p>
        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{label}</p>
      </div>
    </div>
  );
}