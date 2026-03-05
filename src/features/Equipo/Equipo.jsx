import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, Edit2, Trash2, Package, AlertCircle, 
  Loader2, Eye, Filter, X, ChevronDown, Calendar, MapPin, 
  Truck, Shield, Box, FileText, ShoppingCart, Building2, 
  Wrench, MoveRight, Globe, CheckCircle, CreditCard, RefreshCw
} from "lucide-react";

import { equipoService } from "../mantenimiento/services/equipoService";
import { clienteService } from "../mantenimiento/services/clienteService";
import { familiaService } from "./service/familiaService";
import { paisService } from "../mantenimiento/services/paisService";
import EquipoModal from "./EquipoModal";
import ModalCrearPlan from "../PlanMantenimiento/components/ModalCrearPlan";

/* ================= MODAL DE DETALLE ================= */
function EquipoDetailModal({ isOpen, onClose, equipo }) {
  if (!isOpen || !equipo) return null;

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">{equipo.codigo}</h3>
              <p className="text-sm font-bold text-slate-500">{equipo.nombre || "Sin nombre"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-blue-600"><MapPin size={20} /><h4 className="font-black text-slate-700">Cliente y Ubicación</h4></div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase">Cliente</p>
                <p className="font-black text-slate-800">{equipo.cliente?.razonSocial || "-"}</p>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[10px] font-bold text-slate-500 uppercase">Sede</p><p className="text-sm font-bold text-slate-800">{equipo.sede || "-"}</p></div>
                  <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[10px] font-bold text-slate-500 uppercase">Almacén</p><p className="text-sm font-bold text-slate-800">{equipo.almacen || "-"}</p></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-amber-600"><Globe size={20} /><h4 className="font-black text-slate-700">Propiedad</h4></div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Propiedad</p>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-black bg-slate-100 text-slate-700 border border-slate-200">{equipo.tipoEquipoPropiedad}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">País</p>
                  <p className="font-bold text-slate-800">{equipo.pais?.nombre || "-"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-orange-600"><Truck size={20} /><h4 className="font-black text-slate-700">Estado Logístico</h4></div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Status</p>
                    <span className="inline-block px-3 py-1 rounded-lg text-sm font-black bg-orange-100 text-orange-700">{equipo.status}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Operatividad</p>
                    <span className="inline-block px-3 py-1 rounded-lg text-sm font-black bg-emerald-100 text-emerald-700">{equipo.estado}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">ID Placa (Matrícula)</p>
                  <p className="font-mono font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg inline-block border border-slate-200">{equipo.idPlaca || "SIN PLACA"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-purple-600"><FileText size={20} /><h4 className="font-black text-slate-700">Orden de Venta</h4></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-bold text-slate-500 uppercase">N° OV</p><p className="font-black text-slate-800">{equipo.numeroOV}</p></div>
                <div><p className="text-xs font-bold text-slate-500 uppercase">Fecha OV</p><p className="font-bold text-slate-700">{formatDate(equipo.fechaOV)}</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-white flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors">
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= TARJETA DE EQUIPO KANBAN ================= */
function EquipoCard({ equipo, onEdit, onDelete, onView, onMove, onCreatePlan, moveCategory }) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const isPropiedad = moveCategory === "propiedad";

  const moveOptions = isPropiedad 
    ? ["Vendido", "Propio", "Atendido"].filter(t => t !== equipo.tipoEquipoPropiedad)
    : ["Almacen", "En compra", "Entregado"].filter(t => t !== equipo.status && t !== "Almacén" || (t === "Almacen" && equipo.status === "Almacén"));

  const getIcon = (opt) => {
    switch(opt) {
      case "Vendido": return <ShoppingCart size={14}/>;
      case "Propio": return <Building2 size={14}/>;
      case "Atendido": return <Wrench size={14}/>;
      case "Almacen": return <Package size={14}/>;
      case "En compra": return <CreditCard size={14}/>;
      case "Entregado": return <Truck size={14}/>;
      default: return <Box size={14}/>;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all p-4 group relative">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-mono font-black text-blue-700 text-xs bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
          {equipo.codigo}
        </h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onCreatePlan(equipo)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Wrench size={16} /></button>
          <button onClick={() => onView(equipo)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={16} /></button>
          <button onClick={() => onEdit(equipo)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Edit2 size={16} /></button>
          <button onClick={() => onDelete(equipo.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
        </div>
      </div>

      <p className="text-sm font-black text-slate-800 mb-1 leading-tight line-clamp-2">{equipo.nombre}</p>
      <p className="text-[11px] font-bold text-slate-500 truncate mb-3">{equipo.cliente?.razonSocial || "Sin Cliente"}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {isPropiedad ? (
          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
            Status: {equipo.status}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
            Prop: {equipo.tipoEquipoPropiedad}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><FileText size={12}/> OV: {equipo.numeroOV}</span>
        
        <div className="relative">
          <button onClick={() => setShowMoveMenu(!showMoveMenu)} className="flex items-center gap-1 text-[10px] font-black text-slate-600 hover:text-blue-600 uppercase transition-colors bg-slate-50 px-2 py-1 rounded-lg">
            Mover <MoveRight size={12}/>
          </button>
          
          {showMoveMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-white shadow-2xl border border-slate-100 rounded-xl p-1 z-20 min-w-[130px] animate-in slide-in-from-bottom-2">
              <div className="fixed inset-0" onClick={() => setShowMoveMenu(false)}></div>
              {moveOptions.map(opt => (
                <button key={opt} onClick={() => { onMove(equipo, isPropiedad ? "tipoEquipoPropiedad" : "status", opt); setShowMoveMenu(false); }} className="relative w-full text-left px-3 py-2.5 text-[11px] font-black text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2 transition-colors uppercase">
                  {getIcon(opt)} {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= COLUMNA KANBAN (ESTILO IMÁGENES REFERENCIA) ================= */
function KanbanColumn({ title, icon: Icon, color, equipos, onEdit, onDelete, onView, onMove, onCreatePlan, moveCategory }) {
  const colorStyles = {
    blue: "bg-[#3b82f6]",
    orange: "bg-[#f59e0b]",
    purple: "bg-[#a855f7]",
    green: "bg-[#10b981]",
    slate: "bg-[#64748b]",
    red: "bg-[#ef4444]",
    indigo: "bg-[#6366f1]"
  };

  const bgHeader = colorStyles[color] || colorStyles.blue;

  return (
    <div className="flex flex-col min-w-[320px] flex-1">
      {/* Cabecera Sólida con Icono Circular y Contador */}
      <div className={`${bgHeader} rounded-t-2xl p-4 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl flex items-center justify-center text-white shadow-inner">
            <Icon size={18} strokeWidth={2.5} />
          </div>
          <h3 className="text-white font-black text-sm tracking-tight uppercase">{title}</h3>
        </div>
        <span className="bg-white/20 text-white text-[11px] font-black px-3 py-1 rounded-full border border-white/10 shadow-sm">
          {equipos.length}
        </span>
      </div>

      {/* Contenedor de Tarjetas Gris Claro */}
      <div className="bg-[#f8fafc] border-x border-b border-slate-200 p-3 min-h-[450px] space-y-3 rounded-b-2xl shadow-sm">
        {equipos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-30">
            <Box size={48} className="text-slate-400 mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sin equipos</p>
            <p className="text-[9px] text-slate-400 mt-1 font-bold">Esta columna está vacía</p>
          </div>
        ) : (
          equipos.map((equipo) => (
            <EquipoCard key={equipo.id} equipo={equipo} onEdit={onEdit} onDelete={onDelete} onView={onView} onMove={onMove} onCreatePlan={onCreatePlan} moveCategory={moveCategory} />
          ))
        )}
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function EquiposPage() {
  const [equipos, setEquipos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [paises, setPaises] = useState([]);
  
  // Toggle Switch para cambiar la vista (Propiedad vs Logística)
  const [kanbanView, setKanbanView] = useState("propiedad"); 
  
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [equipoParaPlan, setEquipoParaPlan] = useState(null);
  const [editing, setEditing] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [filterCliente, setFilterCliente] = useState("Todos");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [equiposData, clientesData, familiasData, paisesData] = await Promise.all([
        equipoService.getEquipos(),
        clienteService.getClientes().catch(() => []),
        familiaService.getFamilias().catch(() => []),
        paisService.getPaises().catch(() => []),
      ]);
      setEquipos(equiposData || []);
      setClientes(clientesData || []);
      setFamilias(familiasData || []);
      setPaises(paisesData || []);
    } catch (err) {
      setError("Error al cargar los datos. Verifica el backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (dataWithNewFamilia) => {
    try {
      let familiaId = dataWithNewFamilia.familiaId;
      if (dataWithNewFamilia.newFamilia && dataWithNewFamilia.newFamilia.nombre) {
        const nuevaFamilia = await equipoService.createFamilia({
          nombre: dataWithNewFamilia.newFamilia.nombre,
          descripcion: dataWithNewFamilia.newFamilia.descripcion || null,
        });
        familiaId = nuevaFamilia.id;
      }
      const { newFamilia, ...equipoData } = dataWithNewFamilia;
      equipoData.familiaId = familiaId;

      if (editing) await equipoService.updateEquipo(editing.id, equipoData);
      else await equipoService.createEquipo(equipoData);

      loadData(); setModalOpen(false); setEditing(null);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar este equipo?")) {
      await equipoService.deleteEquipo(id);
      loadData();
    }
  };

  const handleMove = async (equipo, field, newValue) => {
    try {
      await equipoService.updateEquipo(equipo.id, { ...equipo, [field]: newValue });
      loadData();
    } catch (err) { alert("Error al mover el equipo"); }
  };

  const handleCreatePlan = (equipo) => { setEquipoParaPlan(equipo); setPlanModalOpen(true); };
  const handlePlanCreated = () => { setPlanModalOpen(false); setEquipoParaPlan(null); alert("Plan de mantenimiento creado exitosamente"); };

  const filteredEquipos = useMemo(() => {
    return equipos.filter((eq) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || eq.codigo?.toLowerCase().includes(q) || eq.nombre?.toLowerCase().includes(q) || eq.numeroOV?.toLowerCase().includes(q) || eq.cliente?.razonSocial?.toLowerCase().includes(q);
      const matchEstado = filterEstado === "Todos" || eq.estado === filterEstado;
      const matchCliente = filterCliente === "Todos" || eq.clienteId === filterCliente;
      return matchSearch && matchEstado && matchCliente;
    });
  }, [equipos, searchTerm, filterEstado, filterCliente]);

  if (loading && equipos.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-black uppercase tracking-widest text-xs">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 w-full font-sans">
      <div className="max-w-[1800px] mx-auto w-full space-y-6">
        
        {/* ENCABEZADO CON SWITCH (ESTILO IMAGEN 21d98a.png) */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm gap-4">
          
          {/* Botones Tipo Switch */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner w-max">
            <button 
              onClick={() => setKanbanView("propiedad")}
              className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all ${kanbanView === "propiedad" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-white hover:text-slate-700"}`}
            >
              Propiedad
            </button>
            <button 
              onClick={() => setKanbanView("logistica")}
              className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all ${kanbanView === "logistica" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-white hover:text-slate-700"}`}
            >
              Logística
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => {setEditing(null); setModalOpen(true);}} className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/30 font-black text-sm active:scale-95">
              <Plus size={18} strokeWidth={3}/> Agregar Equipo
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl font-bold border border-red-200 flex gap-2"><AlertCircle/> {error}</div>}

        {/* ESTADÍSTICAS COMO BOTONES CLICKABLES (ESTILO IMAGEN 21e091.png) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-slate-300 transition-all text-left group">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
              <p className="text-2xl font-black text-slate-800">{equipos.length}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-slate-100 transition-colors"><Box className="text-slate-500" size={24}/></div>
          </button>
          
          {kanbanView === "propiedad" ? (
            <>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vendidos</p><p className="text-2xl font-black text-blue-600">{equipos.filter(e => e.tipoEquipoPropiedad === "Vendido").length}</p></div>
                <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100"><ShoppingCart className="text-blue-600" size={24}/></div>
              </button>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-orange-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Propios</p><p className="text-2xl font-black text-amber-500">{equipos.filter(e => e.tipoEquipoPropiedad === "Propio").length}</p></div>
                <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100"><Building2 className="text-amber-500" size={24}/></div>
              </button>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-purple-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atendidos</p><p className="text-2xl font-black text-purple-600">{equipos.filter(e => e.tipoEquipoPropiedad === "Atendido").length}</p></div>
                <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100"><Wrench className="text-purple-600" size={24}/></div>
              </button>
            </>
          ) : (
            <>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Almacén</p><p className="text-2xl font-black text-indigo-600">{equipos.filter(e => e.status === "Almacen" || e.status === "Almacén").length}</p></div>
                <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100"><Package className="text-indigo-600" size={24}/></div>
              </button>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-orange-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Compra</p><p className="text-2xl font-black text-amber-500">{equipos.filter(e => e.status === "En compra").length}</p></div>
                <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100"><CreditCard className="text-amber-500" size={24}/></div>
              </button>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-green-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entregados</p><p className="text-2xl font-black text-emerald-600">{equipos.filter(e => e.status === "Entregado").length}</p></div>
                <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100"><Truck className="text-emerald-600" size={24}/></div>
              </button>
            </>
          )}
          <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all text-left group">
            <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operativos</p><p className="text-2xl font-black text-emerald-600">{equipos.filter(e => e.estado === "Operativo").length}</p></div>
            <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100"><Shield className="text-emerald-600" size={24}/></div>
          </button>
        </div>

        {/* BUSCADOR Y FILTROS SECUNDARIOS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="text" placeholder="Buscar por código, nombre, OV, marca o cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm shadow-inner transition-all"/>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`px-5 py-3 border rounded-xl transition-all flex items-center justify-center gap-2 font-black text-sm ${showFilters ? "bg-blue-50 border-blue-200 text-blue-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              <Filter size={18} /> Filtros <ChevronDown size={18} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
            <button onClick={loadData} className="px-5 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors flex items-center justify-center gap-2" disabled={loading} title="Actualizar lista">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-4 border-t border-slate-100 animate-in fade-in">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cliente</label>
                <select value={filterCliente} onChange={(e) => setFilterCliente(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-700">
                  <option value="Todos">Todos los clientes</option>
                  {clientes.map((c) => (<option key={c.id} value={c.id}>{c.razonSocial}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estado Operativo</label>
                <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-700">
                  <option value="Todos">Todos los estados</option>
                  <option value="No instalado">No instalado</option>
                  <option value="Operativo">Operativo</option>
                  <option value="Inoperativo">Inoperativo</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* TABLERO KANBAN DINÁMICO */}
        <div className="flex gap-6 overflow-x-auto pb-8 pt-2 no-scrollbar animate-in fade-in duration-300">
          {kanbanView === "propiedad" ? (
            <>
              <KanbanColumn title="Vendidos" icon={ShoppingCart} color="blue" equipos={filteredEquipos.filter(e => e.tipoEquipoPropiedad === "Vendido")} onView={setSelectedEquipo} onEdit={setEditing} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} moveCategory="propiedad"/>
              <KanbanColumn title="Propios" icon={Building2} color="orange" equipos={filteredEquipos.filter(e => e.tipoEquipoPropiedad === "Propio")} onView={setSelectedEquipo} onEdit={setEditing} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} moveCategory="propiedad"/>
              <KanbanColumn title="Atendidos" icon={Wrench} color="purple" equipos={filteredEquipos.filter(e => e.tipoEquipoPropiedad === "Atendido")} onView={setSelectedEquipo} onEdit={setEditing} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} moveCategory="propiedad"/>
            </>
          ) : (
            <>
              <KanbanColumn title="Almacén" icon={Package} color="indigo" equipos={filteredEquipos.filter(e => e.status === "Almacen" || e.status === "Almacén")} onView={setSelectedEquipo} onEdit={setEditing} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} moveCategory="logistica"/>
              <KanbanColumn title="En compra" icon={CreditCard} color="orange" equipos={filteredEquipos.filter(e => e.status === "En compra")} onView={setSelectedEquipo} onEdit={setEditing} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} moveCategory="logistica"/>
              <KanbanColumn title="Entregado" icon={CheckCircle} color="green" equipos={filteredEquipos.filter(e => e.status === "Entregado")} onView={setSelectedEquipo} onEdit={setEditing} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} moveCategory="logistica"/>
            </>
          )}
        </div>
      </div>

      {/* Modales */}
      <EquipoModal isOpen={modalOpen} onClose={() => {setModalOpen(false); setEditing(null);}} onSave={handleSave} initialData={editing} clientes={clientes} familias={familias} paises={paises}/>
      <EquipoDetailModal isOpen={detailModalOpen} onClose={() => {setDetailModalOpen(false); setSelectedEquipo(null);}} equipo={selectedEquipo}/>
      {planModalOpen && <ModalCrearPlan onClose={() => {setPlanModalOpen(false); setEquipoParaPlan(null);}} onCreated={handlePlanCreated} equipoPreseleccionado={equipoParaPlan}/>}
    </div>
  );
}