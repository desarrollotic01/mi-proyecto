import React, { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, AlertCircle, Loader2, Filter, ChevronDown,
  RefreshCw, List, Box, ShoppingCart, Building2, Wrench,
  Package, CreditCard, Truck, Shield, Globe, Eye, Edit2, Trash2, CheckCircle, FileText
} from "lucide-react";

import { equipoService } from "../mantenimiento/services/equipoService";
import { clienteService } from "../mantenimiento/services/clienteService";
import { familiaService } from "./service/familiaService";
import { paisService } from "../mantenimiento/services/paisService";

import EquipoModal from "./Equipomodal";
import ModalCrearPlan from "../PlanMantenimiento/components/ModalCrearPlan";

// Componentes limpios
import KanbanColumn from "./Components/KanbanColumn";
import EquipoDetailModal from "./Components/EquipoDetailModal";
import { GlobalPDFModal } from "../../components/GlobalPDFModal.jsx";
import { UbicacionPDF } from "../UbicacionTecnica/Components/UbicacionPDF.jsx";
import { usePDFReport } from "../../hooks/usePDFReport.js";

// =========================================================================
// ATRAPADOR DE ERRORES: Evita la pantalla en blanco y muestra el error
// =========================================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-red-200">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertCircle size={32} />
              <h2 className="text-2xl font-black">¡Ups! Ocurrió un error en la pantalla</h2>
            </div>
            <p className="text-slate-600 mb-4 font-medium">La aplicación detectó un problema en los datos o en un componente. Por favor, toma una captura de este error:</p>
            <pre className="bg-slate-900 text-red-400 p-4 rounded-xl overflow-x-auto text-sm font-mono shadow-inner">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Recargar la página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// =========================================================================
// COMPONENTE PRINCIPAL
// =========================================================================
function EquiposPageContent() {
  const [equipos, setEquipos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [paises, setPaises] = useState([]);

  const { pdfOpen, pdfData, setPdfOpen, handleOpenPDF } = usePDFReport(clientes, paises);

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
        equipoService.getEquipos().catch(() => []),
        clienteService.getClientes().catch(() => []),
        familiaService.getFamilias().catch(() => []),
        paisService.getPaises().catch(() => []),
      ]);
      setEquipos(equiposData || []);
      setClientes(clientesData || []);
      setFamilias(familiasData || []);
      setPaises(paisesData || []);
    } catch (err) {
      setError("Error al cargar los datos principales.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (payload) => {
    try {
      let familiaIdFinal = payload.familiaId;

      // Si el modal nos mandó una familia nueva, la creamos primero:
      if (payload.newFamilia) {
        const familiaCreada = await familiaService.createFamilia(payload.newFamilia);
        familiaIdFinal = familiaCreada.id;
      }

      // Armamos los datos definitivos del equipo
      const datosEquipo = {
        ...payload,
        familiaId: familiaIdFinal
      };
      delete datosEquipo.newFamilia;

      if (editing) {
        await equipoService.updateEquipo(editing.id, datosEquipo);
      } else {
        await equipoService.createEquipo(datosEquipo);
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

  // Lógica de Filtrado 100% protegida contra nulos
  const filteredEquipos = useMemo(() => {
    if (!Array.isArray(equipos)) return [];

    return equipos.filter((eq) => {
      if (!eq) return false;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        eq?.codigo?.toLowerCase().includes(q) ||
        eq?.numeroOV?.toLowerCase().includes(q) ||
        eq?.marca?.toLowerCase().includes(q) ||
        eq?.modelo?.toLowerCase().includes(q) ||
        eq?.serie?.toLowerCase().includes(q) ||
        eq?.nombre?.toLowerCase().includes(q) ||
        eq?.cliente?.razonSocial?.toLowerCase().includes(q);

      const matchEstado = filterEstado === "Todos" || eq?.estado === filterEstado;
      const matchCliente = filterCliente === "Todos" || String(eq?.clienteId) === String(filterCliente);

      return matchSearch && matchEstado && matchCliente;
    });
  }, [equipos, searchTerm, filterEstado, filterCliente]);

  const vendidos = filteredEquipos.filter((e) => e?.tipoEquipoPropiedad === "Vendido");
  const propios = filteredEquipos.filter((e) => e?.tipoEquipoPropiedad === "Propio");
  const atendidos = filteredEquipos.filter((e) => e?.tipoEquipoPropiedad === "Atendido");
  const almacen = filteredEquipos.filter((e) => e?.status === "Almacen" || e?.status === "Almacén");
  const enCompra = filteredEquipos.filter((e) => e?.status === "En compra");
  const entregado = filteredEquipos.filter((e) => e?.status === "Entregado");

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm gap-4">
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner w-max">
            <button onClick={() => setViewMode("propiedad")} className={`px-5 py-2.5 rounded-lg text-sm font-black transition-all ${viewMode === "propiedad" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-white hover:text-slate-700"}`}>
              Propiedad
            </button>
            <button onClick={() => setViewMode("logistica")} className={`px-5 py-2.5 rounded-lg text-sm font-black transition-all ${viewMode === "logistica" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-white hover:text-slate-700"}`}>
              Logística
            </button>
            <button onClick={() => setViewMode("lista")} className={`px-5 py-2.5 rounded-lg text-sm font-black transition-all flex items-center gap-2 ${viewMode === "lista" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-white hover:text-slate-700"}`}>
              <List size={16} strokeWidth={2.5} /> Lista
            </button>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => { setEditing(null); setModalOpen(true); }} className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/30 font-black text-sm active:scale-95">
              <Plus size={18} strokeWidth={3} /> Agregar Equipo
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl font-bold border border-red-200 flex gap-2"><AlertCircle /> {error}</div>}

        {/* ESTADÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-slate-300 transition-all text-left group">
            <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p><p className="text-2xl font-black text-slate-800 mt-0.5">{filteredEquipos.length}</p></div>
            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-slate-100 transition-colors"><Box className="text-slate-600" size={24} /></div>
          </button>

          {viewMode === "propiedad" || viewMode === "lista" ? (
            <>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vendidos</p><p className="text-2xl font-black text-blue-600 mt-0.5">{vendidos.length}</p></div>
                <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100"><ShoppingCart className="text-blue-600" size={24} /></div>
              </button>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-orange-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Propios</p><p className="text-2xl font-black text-amber-500 mt-0.5">{propios.length}</p></div>
                <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100"><Building2 className="text-amber-500" size={24} /></div>
              </button>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-purple-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atendidos</p><p className="text-2xl font-black text-purple-600 mt-0.5">{atendidos.length}</p></div>
                <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100"><Wrench className="text-purple-600" size={24} /></div>
              </button>
            </>
          ) : (
            <>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Almacén</p><p className="text-2xl font-black text-indigo-600 mt-0.5">{almacen.length}</p></div>
                <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100"><Package className="text-indigo-600" size={24} /></div>
              </button>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-orange-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Compra</p><p className="text-2xl font-black text-amber-500 mt-0.5">{enCompra.length}</p></div>
                <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100"><CreditCard className="text-amber-500" size={24} /></div>
              </button>
              <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-green-300 transition-all text-left group">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entregados</p><p className="text-2xl font-black text-emerald-600 mt-0.5">{entregado.length}</p></div>
                <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100"><Truck className="text-emerald-600" size={24} /></div>
              </button>
            </>
          )}
          <button className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all text-left group hidden lg:flex">
            <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operativos</p><p className="text-2xl font-black text-emerald-600 mt-0.5">{filteredEquipos.filter(e => e?.estado === "Operativo").length}</p></div>
            <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100"><Shield className="text-emerald-600" size={24} /></div>
          </button>
        </div>

        {/* BUSCADOR Y FILTROS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="text" placeholder="Buscar por código, nombre u OV..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm shadow-inner transition-all" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`px-5 py-3 border rounded-xl transition-all flex items-center justify-center gap-2 font-black text-sm ${showFilters ? "bg-blue-50 border-blue-200 text-blue-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              <Filter size={18} /> Filtros <ChevronDown size={18} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
            <button onClick={loadData} className="px-5 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors flex items-center justify-center gap-2" disabled={loading}>
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

        {/* CONTENIDO: KANBAN O TABLA */}
        {viewMode === "lista" ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto animate-in fade-in duration-300">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="p-4 w-[15%]">Identificación</th>
                  <th className="p-4 w-[20%]">Nombre</th>
                  <th className="p-4 w-[20%]">Cliente</th>
                  <th className="p-4 w-[15%]">Orden / Fechas</th>
                  <th className="p-4 w-[15%]">Clasificación / Estado</th>
                  <th className="p-4 w-[15%] text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEquipos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400 font-bold">
                      <Box className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      No hay equipos.
                    </td>
                  </tr>
                ) : (
                  filteredEquipos.map(equipo => (
                    <tr key={equipo?.id || Math.random()} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-black text-xs rounded-lg border border-blue-100 w-max">
                            {equipo?.codigo || "S/C"}
                          </span>
                          <div className="text-[11px] mt-1"><span className="font-black text-slate-400 uppercase">Serie: </span><span className="font-bold text-slate-700">{equipo?.serie || "N/A"}</span></div>
                          <div className="text-[11px]"><span className="font-black text-slate-400 uppercase">Placa: </span><span className="font-bold text-slate-700">{equipo?.idPlaca || "N/A"}</span></div>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <p className="font-black text-slate-800 text-sm mb-1.5">{equipo?.nombre || "Sin Nombre"}</p>
                        <div className="grid grid-cols-1 gap-1 text-[11px]">
                          <p><span className="font-black text-slate-400 uppercase">Marca:</span> <span className="font-bold text-slate-600">{equipo?.marca || "-"}</span></p>
                          <p><span className="font-black text-slate-400 uppercase">Modelo:</span> <span className="font-bold text-slate-600">{equipo?.modelo || "-"}</span></p>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <p className="font-bold text-slate-800 text-sm mb-1.5 line-clamp-1">{equipo?.cliente?.razonSocial || "Sin Cliente"}</p>
                        <div className="grid grid-cols-1 gap-1 text-[11px]">
                          <p><span className="font-black text-slate-400 uppercase">Sede:</span> <span className="font-bold text-slate-600">{equipo?.sede || "-"}</span></p>
                          <p><span className="font-black text-slate-400 uppercase">País:</span> <span className="font-bold text-slate-600">{equipo?.pais?.nombre || "-"}</span></p>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                          <p className="flex items-center gap-1"><span className="font-black text-slate-400 uppercase">OV:</span><span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{equipo?.numeroOV || "-"}</span></p>
                          <p><span className="font-black text-slate-400 uppercase">Entrega:</span> <span className="font-bold text-slate-600">{formatDate(equipo?.fechaEntregaPrevista)}</span></p>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-2 items-start">
                          <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-black text-[9px] uppercase border border-blue-100/50 flex items-center gap-1"><Globe size={12} /> {equipo?.tipoEquipoPropiedad || "-"}</span>
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border flex items-center gap-1 ${equipo?.status === "Almacen" ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}><Package size={12} /> {equipo?.status || "-"}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                          <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleOpenPDF(equipo)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg" title="Generar PDF"><FileText size={16} strokeWidth={2.5} /></button>
                          <button onClick={() => { setEquipoParaPlan(equipo); setPlanModalOpen(true); }} className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg" title="Plan"><Wrench size={16} strokeWidth={2.5} /></button>
                          <button onClick={() => { setSelectedEquipo(equipo); setDetailModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg" title="Detalle"><Eye size={16} strokeWidth={2.5} /></button>
                          <button onClick={() => { setEditing(equipo); setModalOpen(true); }} className="p-2 text-slate-400 hover:text-amber-600 rounded-lg" title="Editar"><Edit2 size={16} strokeWidth={2.5} /></button>
                          <button onClick={() => handleDelete(equipo?.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg" title="Eliminar"><Trash2 size={16} strokeWidth={2.5} /></button>
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
                <KanbanColumn title="Vendidos" icon={ShoppingCart} color="blue" equipos={vendidos} onView={(equipo) => { setSelectedEquipo(equipo); setDetailModalOpen(true); }} onEdit={(equipo) => { setEditing(equipo); setModalOpen(true); }} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} onOpenPDF={handleOpenPDF} moveCategory="propiedad" />
                <KanbanColumn title="Propios" icon={Building2} color="orange" equipos={propios} onView={(equipo) => { setSelectedEquipo(equipo); setDetailModalOpen(true); }} onEdit={(equipo) => { setEditing(equipo); setModalOpen(true); }} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} onOpenPDF={handleOpenPDF} moveCategory="propiedad" />
                <KanbanColumn title="Atendidos" icon={Wrench} color="purple" equipos={atendidos} onView={(equipo) => { setSelectedEquipo(equipo); setDetailModalOpen(true); }} onEdit={(equipo) => { setEditing(equipo); setModalOpen(true); }} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} onOpenPDF={handleOpenPDF} moveCategory="propiedad" />
              </>
            ) : (
              <>
                <KanbanColumn title="Almacén" icon={Package} color="indigo" equipos={almacen} onView={(equipo) => { setSelectedEquipo(equipo); setDetailModalOpen(true); }} onEdit={(equipo) => { setEditing(equipo); setModalOpen(true); }} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} onOpenPDF={handleOpenPDF} moveCategory="logistica" />
                <KanbanColumn title="En compra" icon={CreditCard} color="orange" equipos={enCompra} onView={(equipo) => { setSelectedEquipo(equipo); setDetailModalOpen(true); }} onEdit={(equipo) => { setEditing(equipo); setModalOpen(true); }} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} onOpenPDF={handleOpenPDF} moveCategory="logistica" />
                <KanbanColumn title="Entregado" icon={CheckCircle} color="green" equipos={entregado} onView={(equipo) => { setSelectedEquipo(equipo); setDetailModalOpen(true); }} onEdit={(equipo) => { setEditing(equipo); setModalOpen(true); }} onDelete={handleDelete} onMove={handleMove} onCreatePlan={handleCreatePlan} onOpenPDF={handleOpenPDF} moveCategory="logistica" />
              </>
            )}
          </div>
        )}
      </div>

      <EquipoModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} initialData={editing} clientes={clientes} familias={familias} paises={paises} />
      <EquipoDetailModal isOpen={detailModalOpen} onClose={() => { setDetailModalOpen(false); setSelectedEquipo(null); }} equipo={selectedEquipo} />
      <GlobalPDFModal isOpen={pdfOpen} onClose={() => { setPdfOpen(false); }} title="Ficha Técnica de Equipo">
        {pdfData && <UbicacionPDF data={pdfData} />}
      </GlobalPDFModal>
      {planModalOpen && <ModalCrearPlan onClose={() => { setPlanModalOpen(false); setEquipoParaPlan(null); }} onCreated={handlePlanCreated} equipoPreseleccionado={equipoParaPlan} />}
    </div>
  );
}

// Exportamos el componente envuelto en el atrapador de errores
export default function EquiposPage() {
  return (
    <ErrorBoundary>
      <EquiposPageContent />
    </ErrorBoundary>
  );
}