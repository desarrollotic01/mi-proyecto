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
  FileText,
  Package
} from "lucide-react";

import UbicacionTecnicaModal from "../Components/UbicacionTecnicaModal";
import { UbicacionTecnicaService } from "../../mantenimiento/services/ubicacionService";
import { paisService } from "../../mantenimiento/services/paisService";
import { clienteService } from "../../mantenimiento/services/clienteService";

// --- HELPERS DE FORMATO ---
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

  const [paises, setPaises] = useState([]);
  const [clientes, setClientes] = useState([]);

  // Carga inicial de datos
  const loadAllData = async () => {
    setLoading(true);
    try {
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

  useEffect(() => { loadAllData(); }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((u) => {
      if (!q) return true;
      const fields = [u.codigo, u.nombre, u.sede, u.numeroOV, u.idPlaca].join(" ").toLowerCase();
      return fields.includes(q);
    });
  }, [items, searchTerm]);

  const stats = useMemo(() => ({
    total: items.length,
    paises: new Set(items.map(u => u.paisId).filter(Boolean)).size,
    propios: items.filter(u => u.tipoEquipoPropiedad === "Propio").length
  }), [items]);

  // EL CAMBIO ESTÁ AQUÍ PARA ASEGURAR QUE REFRESQUE TRAS EDITAR
  const handleSave = async (payload, mode) => {
    try {
      if (mode === "edit") {
        await UbicacionTecnicaService.updateUbicacionTecnica(editing.id, payload);
      } else {
        await UbicacionTecnicaService.createUbicacionTecnica(payload);
      }
      await loadAllData(); // Recarga la tabla para mostrar los cambios frescos
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      alert("Error al guardar la ubicación técnica: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta Ubicación Técnica?")) return;
    setBusyId(id);
    try {
      await UbicacionTecnicaService.deleteUbicacionTecnica(id);
      await loadAllData();
    } catch (err) {
      alert("No se pudo eliminar: " + (err.response?.data?.message || err.message));
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

          {/* HEADER */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-3xl shadow-xl text-white">
                <MapPin size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Activos</h1>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                  Ubicaciones Técnicas <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={loadAllData} className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm">
                <RefreshCw className={loading ? "animate-spin" : ""} size={20} />
              </button>
              <button
                onClick={() => { setEditing(null); setModalOpen(true); }}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-xl transition-all hover:-translate-y-1 font-black text-xs uppercase tracking-widest"
              >
                <Plus size={20} strokeWidth={3} /> Nuevo Registro
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard icon={MapPin} label="Total Activos" value={stats.total} color="blue" />
            <StatCard icon={Globe} label="Presencia Global" value={stats.paises} color="purple" />
            <StatCard icon={ShieldCheck} label="Flota Propia" value={stats.propios} color="emerald" />
          </div>

          {/* BUSCADOR */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-4">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={22} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, nombre, placa, cliente o sede..."
                className="w-full pl-16 pr-8 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-500 transition-all outline-none text-sm font-bold text-slate-700 bg-slate-50/30"
              />
            </div>
          </div>

          {/* TABLA MEJORADA */}
          <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <Th className="text-center w-12">#</Th>
                    <Th>Información del Activo</Th>
                    <Th>Cliente / Geografía</Th>
                    <Th>Logística & Operación</Th>
                    <Th>Detalle Comercial (OV)</Th>
                    <Th>Fechas & Garantía</Th>
                    <Th className="text-right pr-10">Acciones</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((u, i) => {
                    const cli = clientes.find(c => String(c.id) === String(u.clienteId || u.ClienteId));
                    const nomCli = cli?.nombre || cli?.razonSocial || u.cliente?.nombre || "Sin Cliente";
                    const pFound = paises.find(p => String(p.id) === String(u.paisId));
                    const nomPais = pFound?.nombre || u.pais?.nombre || "—";
                    const isVigente = u.finGarantia && new Date(u.finGarantia) > new Date();

                    return (
                      <tr key={u.id} className="hover:bg-blue-50/40 transition-colors group">
                        <td className="px-4 py-6 text-center text-slate-400 font-mono font-bold border-r border-slate-50">{i + 1}</td>

                        {/* ACTIVO */}
                        <td className="px-5 py-4 border-r border-slate-50">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-[10px] w-max shadow-sm">{val(u.codigo)}</span>
                            <span className="font-black text-slate-800 text-sm">{val(u.nombre)}</span>
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded w-max">{val(u.especialidad)}</span>
                          </div>
                        </td>

                        {/* CLIENTE / PAIS */}
                        <td className="px-5 py-4 border-r border-slate-50">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase">
                              <Building2 size={12} className="text-blue-500" /> {nomCli}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px]">
                              <Globe size={12} /> {nomPais} • <span className="text-blue-600">{val(u.sede)}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 block italic">Ref: {val(u.id_cliente)}</span>
                          </div>
                        </td>

                        {/* LOGISTICA */}
                        <td className="px-5 py-4 border-r border-slate-50">
                          <div className="space-y-2">
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Ubicación / Operador</p>
                              <p className="text-slate-700 font-bold">{val(u.almacen)} / {val(u.operadorLogistico)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-indigo-600 font-black text-[10px] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{val(u.tipoEquipoPropiedad)}</span>
                              <span className="text-slate-600 font-bold">Placa: {val(u.idPlaca)}</span>
                            </div>
                          </div>
                        </td>

                        {/* OV / DESCRIPCION */}
                        <td className="px-5 py-4 border-r border-slate-50">
                          <div className="space-y-1 max-w-[180px]">
                            <p className="font-black text-slate-800 flex items-center gap-1.5">
                              <FileText size={12} className="text-slate-400" /> {val(u.numeroOV)}
                            </p>
                            <p className="text-[10px] text-slate-500 line-clamp-2 italic leading-tight">
                              {val(u.descripcion)}
                            </p>
                          </div>
                        </td>

                        {/* TIEMPOS */}
                        <td className="px-5 py-4">
                          <div className="space-y-1.5 text-[10px]">
                            <div className="flex justify-between border-b border-slate-50 pb-1">
                              <span className="text-slate-400 font-bold">ENTREGA:</span>
                              <span className="text-slate-700 font-black">{fmtDate(u.fechaEntregaReal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold">GARANTÍA:</span>
                              <span className={`font-black px-2 py-0.5 rounded ${isVigente ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                                {fmtDate(u.finGarantia)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* ACCIONES */}
                        <td className="px-4 py-4 text-right pr-6">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setEditing(u); setModalOpen(true); }} className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl border border-slate-200 shadow-sm"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(u.id)} disabled={busyId === u.id} className="p-2.5 text-red-600 hover:bg-red-100 rounded-xl border border-slate-200 shadow-sm">
                              {busyId === u.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
      </div>

      <UbicacionTecnicaModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        initialData={editing}
      />
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left ${className}`}>{children}</th>;
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = { blue: "bg-blue-600", emerald: "bg-emerald-600", purple: "bg-purple-600" };
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-6 transition-all hover:shadow-lg">
      <div className={`p-4 rounded-2xl ${colors[color]} text-white shadow-lg shadow-blue-500/10`}><Icon size={24} strokeWidth={2.5} /></div>
      <div>
        <p className="text-3xl font-black text-slate-800 leading-none mb-1">{value}</p>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}