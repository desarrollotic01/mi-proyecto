import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  MapPin,
  Loader2,
  Globe,
  Building2,
  Truck,
  ShieldCheck,
  Calendar,
  Filter
} from "lucide-react";

import UbicacionTecnicaModal from "../Components/UbicacionTecnicaModal";
import { UbicacionTecnicaService } from "../../mantenimiento/services/ubicacionService";
// 🔥 NUEVO: Importamos los servicios para traducir los IDs a Nombres
import { paisService } from "../../mantenimiento/services/paisService";
import { clienteService } from "../../mantenimiento/services/clienteService";

// --- HELPERS ---
const val = (x) => (x === null || x === undefined || x === "" ? "—" : String(x));
const fmtDate = (d) => { 
  try { return d ? new Date(d).toLocaleDateString("es-PE") : "—"; } 
  catch { return "—"; } 
};

export default function UbicacionesTecnicasPage() {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // 🔥 NUEVO: Estados para guardar los catálogos
  const [paises, setPaises] = useState([]);
  const [clientes, setClientes] = useState([]);

  // Carga inicial de datos
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Traemos las ubicaciones, los clientes y los países al mismo tiempo
        const [dataUbicaciones, dataPaises, dataClientes] = await Promise.all([
          UbicacionTecnicaService.getUbicacionTecnicas(),
          paisService.getAll?.() ?? paisService.getPaises?.(),
          clienteService.getAll?.() ?? clienteService.getClientes?.()
        ]);
        
        setItems(Array.isArray(dataUbicaciones) ? dataUbicaciones : []);
        setPaises(Array.isArray(dataPaises) ? dataPaises : []);
        setClientes(Array.isArray(dataClientes) ? dataClientes : []);
      } catch (err) {
        console.error("Error cargando datos", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Función para recargar solo la tabla
  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await UbicacionTecnicaService.getUbicacionTecnicas();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((u) => {
      if (!q) return true;
      const fields = [u.codigo, u.nombre, u.sede, u.numeroOV].join(" ").toLowerCase();
      return fields.includes(q);
    });
  }, [items, searchTerm]);

  const stats = useMemo(() => ({
    total: items.length,
    paises: new Set(items.map(u => u.paisId).filter(Boolean)).size,
    propios: items.filter(u => u.tipoEquipoPropiedad === "Propio").length
  }), [items]);

  const handleSave = async (payload, mode) => {
    if (mode === "edit") {
      await UbicacionTecnicaService.updateUbicacionTecnica(editing.id, payload);
    } else {
      await UbicacionTecnicaService.createUbicacionTecnica(payload);
    }
    await loadItems();
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro de eliminar esta Ubicación Técnica?")) return;
    setBusyId(id);
    try {
      await UbicacionTecnicaService.deleteUbicacion(id);
      await loadItems();
    } finally {
      setBusyId(null);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-full mx-auto space-y-6">

          {/* HEADER PREMIUM */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-3xl shadow-xl text-white">
                <MapPin size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Ubicaciones Técnicas</h1>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                   Administración de Activos <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={loadItems} className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm text-slate-500">
                <RefreshCw className={loading ? "animate-spin" : ""} size={20} />
              </button>
              <button
                onClick={() => { setEditing(null); setModalOpen(true); }}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-10 py-4 rounded-2xl flex items-center gap-3 shadow-2xl shadow-blue-500/40 transition-all hover:-translate-y-1 active:scale-95 font-black text-xs uppercase tracking-widest"
              >
                <Plus size={20} strokeWidth={3} /> Nueva Ubicación
              </button>
            </div>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard icon={MapPin} label="Registros Totales" value={stats.total} color="blue" />
            <StatCard icon={Globe} label="Países Operativos" value={stats.paises} color="purple" />
            <StatCard icon={ShieldCheck} label="Equipos Propios" value={stats.propios} color="emerald" />
          </div>

          {/* BUSCADOR */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-5">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={22} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, nombre o número OV..."
                className="w-full pl-16 pr-8 py-5 rounded-[1.5rem] border-2 border-slate-50 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-sm font-bold text-slate-700 shadow-inner bg-slate-50/30"
              />
            </div>
          </div>

          {/* TABLA */}
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <Th className="text-center w-14">#</Th>
                    <Th>Información del Activo</Th>
                    <Th>Cliente / Entorno</Th>
                    <Th>Logística & OV</Th>
                    <Th>Fechas & Garantía</Th>
                    <Th className="text-right pr-12">Acciones</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <MapPin className="w-12 h-12 mx-auto text-slate-300 mb-3"/>
                        <p className="text-slate-500 font-bold">No hay registros</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u, i) => {

                      // 🔥 MAGIA: Buscamos el nombre real cruzando el ID con los catálogos
                      const clienteEncontrado = clientes.find(c => c.id === u.clienteId || c.id === u.ClienteId || c.id === u.id_cliente);
                      const nombreCliente = clienteEncontrado?.nombre || clienteEncontrado?.razonSocial || u?.cliente?.nombre || u?.Cliente?.nombre || "Sin Cliente";

                      const paisEncontrado = paises.find(p => p.id === u.paisId);
                      const nombrePais = paisEncontrado?.nombre || u?.pais?.nombre || u?.Pais?.nombre || "Sin País";

                      return (
                        <tr key={u.id} className="hover:bg-blue-50/40 transition-colors group">
                          <td className="px-6 py-6 text-center text-slate-400 font-mono border-r border-slate-50 font-bold">{i + 1}</td>
                          
                          <td className="px-6 py-6 border-r border-slate-50">
                            <div className="flex flex-col gap-2">
                              <span className="font-mono font-black text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg w-max tracking-tighter shadow-sm">{val(u.codigo)}</span>
                              <span className="font-black text-slate-800 text-sm tracking-tight">{val(u.nombre)}</span>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{val(u.especialidad)}</span>
                            </div>
                          </td>

                          <td className="px-6 py-6 border-r border-slate-50">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 font-black text-slate-700 uppercase">
                                <Building2 size={14} className="text-slate-400"/>
                                {nombreCliente}
                              </div>
                              <div className="flex items-center gap-2 text-blue-600 font-bold uppercase text-[10px] tracking-widest">
                                <Globe size={14}/>
                                {nombrePais}
                              </div>
                              <span className="text-slate-500 font-medium block ml-6">{val(u.sede)}</span>
                            </div>
                          </td>

                          <td className="px-6 py-6 border-r border-slate-50">
                            <div className="space-y-1">
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Orden de Venta</p>
                              <p className="font-bold text-slate-800 flex items-center gap-2"><Truck size={14} className="text-slate-300"/> {val(u.numeroOV)}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic">Placa / Propiedad</p>
                              <p className="text-slate-600 font-black">{val(u.idPlaca)} | {val(u.tipoEquipoPropiedad)}</p>
                            </div>
                          </td>

                          <td className="px-6 py-6">
                            <div className="space-y-2 text-[10px]">
                              <div className="flex justify-between gap-4 border-b border-slate-100 pb-1">
                                <span className="text-slate-400 font-bold uppercase">Garantía:</span>
                                <span className={`font-black ${new Date(u.finGarantia) > new Date() ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  {fmtDate(u.finGarantia)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400 font-bold uppercase">Entrega Real:</span>
                                <span className="text-slate-700 font-black">{fmtDate(u.fechaEntregaReal)}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-6 text-right pr-10">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                              <button onClick={() => { setEditing(u); setModalOpen(true); }} className="p-3 text-blue-600 hover:bg-blue-100 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all"><Edit2 size={16}/></button>
                              <button onClick={() => handleDelete(u.id)} disabled={busyId === u.id} className="p-3 text-red-600 hover:bg-red-100 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all">
                                {busyId === u.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
      </div>
      <UbicacionTecnicaModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} initialData={editing} />
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-left ${className}`}>{children}</th>;
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    purple: "bg-purple-50 text-purple-600 border-purple-100" 
  };
  return (
    <div className={`bg-white rounded-[2.5rem] p-8 shadow-sm border ${colors[color].split(' ')[2]} flex items-center gap-8 transition-all hover:shadow-xl hover:scale-[1.02]`}>
      <div className={`p-5 rounded-3xl ${colors[color].split(' ').slice(0,2).join(' ')} shadow-inner`}><Icon size={32} strokeWidth={2.5} /></div>
      <div>
        <p className="text-4xl font-black text-slate-800 leading-none mb-1">{value}</p>
        <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}