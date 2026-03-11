import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, Edit2, Trash2, Package, AlertCircle, 
  Loader2, Eye, Filter, X, ChevronDown, Calendar, MapPin, 
  Truck, Shield, Box, FileText, ShoppingCart, Building2, 
  Wrench, MoveRight, Globe, CheckCircle, CreditCard, RefreshCw, List, User
} from "lucide-react";

  import { equipoService } from "../mantenimiento/services/equipoService";
  import { clienteService } from "../mantenimiento/services/clienteService";
  import { familiaService } from "./service/familiaService";
  import { paisService } from "../mantenimiento/services/paisService";
  import EquipoModal from "./Equipomodal";
  import ModalCrearPlan from "../PlanMantenimiento/components/ModalCrearPlan";

/* ================= MODAL DE DETALLE ================= */
function EquipoDetailModal({ isOpen, onClose, equipo }) {
  if (!isOpen || !equipo) return null;

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-PE", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package size={24} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">{equipo.codigo}</h3>
              <p className="text-sm font-bold text-slate-500">{equipo.nombre || "Sin nombre"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={24} strokeWidth={2.5} /></button>
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
                <div><p className="text-xs font-bold text-slate-500 uppercase mb-1">País</p><p className="font-bold text-slate-800">{equipo.pais?.nombre || "-"}</p></div>
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

/* ================= TARJETA DE EQUIPO KANBAN REDISEÑADA ================= */
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
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all group relative flex flex-col h-full border-l-4 border-l-blue-500">
      
      {/* HEADER: Código y Acciones flotantes */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-600 rounded uppercase tracking-tighter">
          {equipo.codigo}
        </span>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border">
          <button onClick={() => onCreatePlan(equipo)} title="Plan" className="p-1 text-slate-400 hover:text-emerald-600"><Wrench size={14}/></button>
          <button onClick={() => onView(equipo)} title="Ver" className="p-1 text-slate-400 hover:text-blue-600"><Eye size={14}/></button>
          <button onClick={() => onEdit(equipo)} title="Editar" className="p-1 text-slate-400 hover:text-amber-600"><Edit2 size={14}/></button>
          <button onClick={() => onDelete(equipo.id)} title="Borrar" className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
        </div>
      </div>

      {/* CUERPO: Título y Cliente */}
      <div className="mb-2">
        <h4 className="text-[13px] font-black text-slate-800 leading-tight line-clamp-1 group-hover:line-clamp-none transition-all">
          {equipo.nombre}
        </h4>
   <div className="flex items-center gap-1 mt-1 text-slate-500">
  <User size={10} /> {/* Asegúrate de que tenga el cierre /> */}
  <p className="text-[10px] font-bold truncate uppercase">{equipo.cliente?.razonSocial || "Sin Cliente"}</p>
</div>
      </div>

      {/* INFO DETALLADA: Mini Grid compacta */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 py-2 border-y border-slate-50 mb-2">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase">Marca</span>
          <span className="text-[10px] font-bold text-slate-700 truncate">{equipo.marca || "-"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase">Modelo</span>
          <span className="text-[10px] font-bold text-slate-700 truncate">{equipo.modelo || "-"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase">Serie</span>
          <span className="text-[10px] font-mono font-bold text-blue-600 truncate">{equipo.serie || "-"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase">Sede</span>
          <span className="text-[10px] font-bold text-slate-700 truncate">{equipo.sede || "-"}</span>
        </div>
      </div>

      {/* STATUS BADGES */}
      <div className="flex flex-wrap gap-1 mb-2">
        {isPropiedad ? (
          <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-black text-[9px] uppercase border border-amber-100 flex items-center gap-1">
            <RefreshCw size={10}/> {equipo.status}
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-black text-[9px] uppercase border border-blue-100 flex items-center gap-1">
            <Globe size={10}/> {equipo.tipoEquipoPropiedad}
          </span>
        )}
        <span className={`px-1.5 py-0.5 rounded-md font-black text-[9px] uppercase border flex items-center gap-1 ${
          equipo.estado === 'Operativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          <Shield size={10}/> {equipo.estado}
        </span>
      </div>

      {/* FOOTER: OV y Botón Mover */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
        <div className="flex items-center gap-1 text-slate-400">
          <FileText size={10}/>
          <span className="text-[10px] font-bold uppercase">{equipo.numeroOV}</span>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMoveMenu(!showMoveMenu)} 
            className="flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors uppercase"
          >
            Mover <ChevronDown size={10} strokeWidth={3}/>
          </button>
          
          {showMoveMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-white shadow-xl border border-slate-200 rounded-lg p-1 z-50 min-w-[120px]">
              <div className="fixed inset-0" onClick={() => setShowMoveMenu(false)}></div>
              {moveOptions.map(opt => (
                <button 
                  key={opt} 
                  onClick={() => { 
                    onMove(equipo, isPropiedad ? "tipoEquipoPropiedad" : "status", opt); 
                    setShowMoveMenu(false); 
                  }} 
                  className="relative w-full text-left px-2 py-1.5 text-[9px] font-black text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded flex items-center gap-2 transition-colors uppercase"
                >
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

/* ================= COLUMNA KANBAN ================= */
function KanbanColumn({ title, icon: Icon, color, equipos, onEdit, onDelete, onView, onMove, onCreatePlan, moveCategory }) { const colorStyles = {
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
      <div className={`${bgHeader} rounded-t-[1rem] p-3.5 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-2.5">
          <div className="text-white/90">
            <Icon size={20} strokeWidth={2} />
          </div>
          <h3 className="text-white font-black text-sm uppercase tracking-wide">{title}</h3>
        </div>
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-[11px] font-black shadow-inner">
          {equipos.length}
        </div>
      </div>



      <div className="bg-[#f8fafc] border-x border-b border-slate-200 p-3 min-h-[450px] space-y-3 rounded-b-[1rem] shadow-sm">
        {equipos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-30">
            <Box size={48} className="text-slate-400 mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sin equipos</p>
          </div>
        ) : (
          equipos.map((equipo) => (
            <EquipoCard 
              key={equipo.id} 
              equipo={equipo} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              onView={onView} 
              onMove={onMove} 
              onCreatePlan={onCreatePlan} 
              moveCategory={moveCategory} 
            />
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
  
  // Toggle Switch para cambiar la vista
  const [viewMode, setViewMode] = useState("propiedad"); 
  
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
      setError("Error al cargar los datos. Verifica que el backend esté corriendo.");
      console.error(err);
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

      if (editing) {
        await equipoService.updateEquipo(editing.id, equipoData);
      } else {
        await equipoService.createEquipo(equipoData);
      }

      await loadData();
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar este equipo?")) {
      try {
        await equipoService.deleteEquipo(id);
        await loadData();
      } catch (err) {
        alert("Error al eliminar el equipo: " + err.message);
        console.error(err);
      }
    }
  };

  const handleMove = async (equipo, field, newValue) => {
    try {
      await equipoService.updateEquipo(equipo.id, {
        ...equipo,
        [field]: newValue,
      });
      await loadData();
    } catch (err) {
      alert("Error al mover el equipo: " + err.message);
      console.error(err);
    }
  };

  const handleCreatePlan = (equipo) => {
    setEquipoParaPlan(equipo);
    setPlanModalOpen(true);
  };

  const handlePlanCreated = () => {
    setPlanModalOpen(false);
    setEquipoParaPlan(null);
    alert("Plan de mantenimiento creado exitosamente");
    loadData();
  };

  const filteredEquipos = useMemo(() => {
    return equipos.filter((eq) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        eq.codigo?.toLowerCase().includes(q) ||
        eq.numeroOV?.toLowerCase().includes(q) ||
        eq.marca?.toLowerCase().includes(q) ||
        eq.modelo?.toLowerCase().includes(q) ||
        eq.serie?.toLowerCase().includes(q) ||
        eq.nombre?.toLowerCase().includes(q) ||
        eq.cliente?.razonSocial?.toLowerCase().includes(q);

      const matchEstado = filterEstado === "Todos" || eq.estado === filterEstado;
      const matchCliente = filterCliente === "Todos" || eq.clienteId === filterCliente;

      return matchSearch && matchEstado && matchCliente;
    });
  }, [equipos, searchTerm, filterEstado, filterCliente]);

  const vendidos = filteredEquipos.filter((e) => e.tipoEquipoPropiedad === "Vendido");
  const propios = filteredEquipos.filter((e) => e.tipoEquipoPropiedad === "Propio");
  const atendidos = filteredEquipos.filter((e) => e.tipoEquipoPropiedad === "Atendido");
  const almacen = filteredEquipos.filter((e) => e.status === "Almacen" || e.status === "Almacén");
  const enCompra = filteredEquipos.filter((e) => e.status === "En compra");
  const entregado = filteredEquipos.filter((e) => e.status === "Entregado");

  // Helper para fechas en la tabla
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading && equipos.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-black uppercase tracking-widest text-xs">Cargando equipos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-8 w-full font-sans">
      <div className="max-w-[1800px] mx-auto w-full space-y-6">
        
        {/* ENCABEZADO CON TRES OPCIONES */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm gap-4">
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner w-max">
            <button onClick={() => setViewMode("propiedad")} className={`px-5 py-2.5 rounded-lg text-sm font-black transition-all ${viewMode === "propiedad" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-white hover:text-slate-700"}`}>
              Propiedad
            </button>
            <button onClick={() => setViewMode("logistica")} className={`px-5 py-2.5 rounded-lg text-sm font-black transition-all ${viewMode === "logistica" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-white hover:text-slate-700"}`}>
              Logística
            </button>
            <button onClick={() => setViewMode("lista")} className={`px-5 py-2.5 rounded-lg text-sm font-black transition-all flex items-center gap-2 ${viewMode === "lista" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-white hover:text-slate-700"}`}>
              <List size={16} strokeWidth={2.5}/> Lista
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => { setEditing(null); setModalOpen(true); }} className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/30 font-black text-sm active:scale-95">
              <Plus size={18} strokeWidth={3}/> Agregar Equipo
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl font-bold border border-red-200 flex gap-2"><AlertCircle/> {error}</div>}

        {/* ESTADÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-slate-300 transition-all text-left group">
            <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p><p className="text-2xl font-black text-slate-800 mt-0.5">{equipos.length}</p></div>
            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-slate-100 transition-colors"><Box className="text-slate-600" size={24}/></div>
          </button>
          
          {viewMode === "propiedad" || viewMode === "lista" ? (
            <>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vendidos</p><p className="text-2xl font-black text-blue-600 mt-0.5">{equipos.filter(e => e.tipoEquipoPropiedad === "Vendido").length}</p></div>
                <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100"><ShoppingCart className="text-blue-600" size={24}/></div>
              </button>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-orange-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Propios</p><p className="text-2xl font-black text-amber-500 mt-0.5">{equipos.filter(e => e.tipoEquipoPropiedad === "Propio").length}</p></div>
                <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100"><Building2 className="text-amber-500" size={24}/></div>
              </button>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-purple-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atendidos</p><p className="text-2xl font-black text-purple-600 mt-0.5">{equipos.filter(e => e.tipoEquipoPropiedad === "Atendido").length}</p></div>
                <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100"><Wrench className="text-purple-600" size={24}/></div>
              </button>
            </>
          ) : (
            <>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Almacén</p><p className="text-2xl font-black text-indigo-600 mt-0.5">{equipos.filter(e => e.status === "Almacen" || e.status === "Almacén").length}</p></div>
                <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100"><Package className="text-indigo-600" size={24}/></div>
              </button>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-orange-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Compra</p><p className="text-2xl font-black text-amber-500 mt-0.5">{equipos.filter(e => e.status === "En compra").length}</p></div>
                <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100"><CreditCard className="text-amber-500" size={24}/></div>
              </button>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-green-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entregados</p><p className="text-2xl font-black text-emerald-600 mt-0.5">{equipos.filter(e => e.status === "Entregado").length}</p></div>
                <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100"><Truck className="text-emerald-600" size={24}/></div>
              </button>
            </>
          )}
          <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all text-left group hidden lg:flex">
            <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operativos</p><p className="text-2xl font-black text-emerald-600 mt-0.5">{equipos.filter(e => e.estado === "Operativo").length}</p></div>
            <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100"><Shield className="text-emerald-600" size={24}/></div>
          </button>
        </div>

        {/* BUSCADOR Y FILTROS */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-4 border-t border-slate-100 animate-in fade-in">
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

        {/* CONTENIDO PRINCIPAL: KANBAN O TABLA */}
        {viewMode === "lista" ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto animate-in fade-in duration-300">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="p-4 w-[15%]">Identificación</th>
                  <th className="p-4 w-[20%]">Nombre</th> {/* Datos del Equipos*/}
                  <th className="p-4 w-[20%]">Cliente</th> {/* Cliente*/}
                  <th className="p-4 w-[15%]">Orden / Fechas</th> {/* */}
                  <th className="p-4 w-[15%]">Clasificación / Estado</th>
                  <th className="p-4 w-[15%] text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEquipos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400 font-bold">
                      <Box className="w-12 h-12 mx-auto mb-2 opacity-30"/>
                      No hay equipos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredEquipos.map(equipo => (
                    <tr key={equipo.id} className="hover:bg-slate-50 transition-colors">
                      
                      {/* IDENTIFICACIÓN */}
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-black text-xs rounded-lg border border-blue-100 w-max">
                            {equipo.codigo}
                          </span>
                          <div className="text-[11px] mt-1">
                            <span className="font-black text-slate-400 uppercase">Serie: </span>
                            <span className="font-bold text-slate-700">{equipo.serie || "N/A"}</span>
                          </div>
                          <div className="text-[11px]">
                            <span className="font-black text-slate-400 uppercase">Placa: </span>
                            <span className="font-bold text-slate-700">{equipo.idPlaca || "N/A"}</span>
                          </div>
                        </div>
                      </td>

                      {/* DATOS DEL EQUIPO */}
                      <td className="p-4 align-top">
                        <p className="font-black text-slate-800 text-sm mb-1.5">{equipo.nombre}</p>
                        <div className="grid grid-cols-1 gap-1 text-[11px]">
                          <p><span className="font-black text-slate-400 uppercase">Marca:</span> <span className="font-bold text-slate-600">{equipo.marca || "-"}</span></p>
                          <p><span className="font-black text-slate-400 uppercase">Modelo:</span> <span className="font-bold text-slate-600">{equipo.modelo || "-"}</span></p>
                          <p><span className="font-black text-slate-400 uppercase">Familia:</span> <span className="font-bold text-slate-600">{equipo.familia?.nombre || "-"}</span></p>
                        </div>
                      </td>

                      {/* UBICACIÓN / CLIENTE */}
                      <td className="p-4 align-top">
                        <p className="font-bold text-slate-800 text-sm mb-1.5 line-clamp-1" title={equipo.cliente?.razonSocial}>
                          {equipo.cliente?.razonSocial || "Sin Cliente"}
                        </p>
                        <div className="grid grid-cols-1 gap-1 text-[11px]">
                          <p><span className="font-black text-slate-400 uppercase">Sede:</span> <span className="font-bold text-slate-600">{equipo.sede || "-"}</span></p>
                          <p><span className="font-black text-slate-400 uppercase">Almacén:</span> <span className="font-bold text-slate-600">{equipo.almacen || "-"}</span></p>
                          <p><span className="font-black text-slate-400 uppercase">País:</span> <span className="font-bold text-slate-600">{equipo.pais?.nombre || "-"}</span></p>
                        </div>
                      </td>

                      {/* ORDEN / FECHAS */}
                      <td className="p-4 align-top">
                        <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                          <p className="flex items-center gap-1">
                            <span className="font-black text-slate-400 uppercase">OV:</span> 
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">{equipo.numeroOV || "-"}</span>
                          </p>
                          <p><span className="font-black text-slate-400 uppercase">Entrega:</span> <span className="font-bold text-slate-600">{formatDate(equipo.fechaEntregaPrevista)}</span></p>
                          <p><span className="font-black text-slate-400 uppercase">Garantía:</span> <span className="font-bold text-slate-600">{formatDate(equipo.finGarantia)}</span></p>
                        </div>
                      </td>

                      {/* CLASIFICACIÓN / ESTADO */}
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-2 items-start">
                          <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-black text-[9px] uppercase border border-blue-100/50 flex items-center gap-1">
                            <Globe size={12}/> {equipo.tipoEquipoPropiedad}
                          </span>
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border flex items-center gap-1 ${
                            equipo.status === "Almacen" || equipo.status === "Almacén" ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                            equipo.status === "En compra" ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-emerald-50 text-emerald-700 border-emerald-100"
                          }`}>
                            <Package size={12}/> {equipo.status}
                          </span>
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border flex items-center gap-1 ${
                            equipo.estado === "Operativo" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            equipo.estado === "Inoperativo" ? "bg-red-50 text-red-700 border-red-100" :
                            "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            <Shield size={12}/> {equipo.estado}
                          </span>
                        </div>
                      </td>

                      {/* ACCIONES */}
                      <td className="p-4 align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEquipoParaPlan(equipo); setPlanModalOpen(true); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Crear Plan"><Wrench size={16} strokeWidth={2.5}/></button>
                          <button onClick={() => { setSelectedEquipo(equipo); setDetailModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver Detalle"><Eye size={16} strokeWidth={2.5}/></button>
                          <button onClick={() => { setEditing(equipo); setModalOpen(true); }} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar"><Edit2 size={16} strokeWidth={2.5}/></button>
                          <button onClick={() => handleDelete(equipo.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 size={16} strokeWidth={2.5}/></button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-8 pt-2 no-scrollbar min-h-[600px] animate-in fade-in duration-300 items-start">
    {viewMode === "propiedad" ? (
      <>
        <KanbanColumn title="Vendidos" icon={ShoppingCart} color="blue" equipos={vendidos} onView={(equipo) => { setSelectedEquipo(equipo); setDetailModalOpen(true); }} onEdit={(equipo) => { setEditing(equipo); setModalOpen(true); }} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} moveCategory="propiedad"/>
        <KanbanColumn title="Propios" icon={Building2} color="orange" equipos={propios} onView={(equipo) => { setSelectedEquipo(equipo); setDetailModalOpen(true); }} onEdit={(equipo) => { setEditing(equipo); setModalOpen(true); }} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} moveCategory="propiedad"/>
        <KanbanColumn title="Atendidos" icon={Wrench} color="purple" equipos={atendidos} onView={(equipo) => { setSelectedEquipo(equipo); setDetailModalOpen(true); }} onEdit={(equipo) => { setEditing(equipo); setModalOpen(true); }} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} moveCategory="propiedad"/>
      </>
    ) : (
      <>
        <KanbanColumn title="Almacén" icon={Package} color="indigo" equipos={almacen} onView={(equipo) => { setSelectedEquipo(equipo); setDetailModalOpen(true); }} onEdit={(equipo) => { setEditing(equipo); setModalOpen(true); }} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} moveCategory="logistica"/>
        <KanbanColumn title="En compra" icon={CreditCard} color="orange" equipos={enCompra} onView={(equipo) => { setSelectedEquipo(equipo); setDetailModalOpen(true); }} onEdit={(equipo) => { setEditing(equipo); setModalOpen(true); }} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} moveCategory="logistica"/>
        <KanbanColumn title="Entregado" icon={CheckCircle} color="green" equipos={entregado} onView={(equipo) => { setSelectedEquipo(equipo); setDetailModalOpen(true); }} onEdit={(equipo) => { setEditing(equipo); setModalOpen(true); }} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} moveCategory="logistica"/>
      </>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      <EquipoModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} initialData={editing} clientes={clientes} familias={familias} paises={paises} />
      <EquipoDetailModal isOpen={detailModalOpen} onClose={() => { setDetailModalOpen(false); setSelectedEquipo(null); }} equipo={selectedEquipo} />
      {planModalOpen && <ModalCrearPlan onClose={() => { setPlanModalOpen(false); setEquipoParaPlan(null); }} onCreated={handlePlanCreated} equipoPreseleccionado={equipoParaPlan} />}
    </div>
  );
}