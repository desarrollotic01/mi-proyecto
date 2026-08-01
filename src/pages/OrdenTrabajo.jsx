import { useState, useEffect } from "react";
import { Settings, Search, Filter, Wrench } from "lucide-react";
import KanbanView from "../features/OrdenTrabajo/components/OrdenTrabajoKanban";
import ListaView, { OT_DEFAULT_FIELDS, OT_DEFAULT_ORDER } from "../features/OrdenTrabajo/components/OrdenTrabajoLista";
import CalendarioView from "../features/OrdenTrabajo/components/OrdenTrabajoCalendario";
import ModalOrdenTrabajoView from "../features/OrdenTrabajo/modals/ModalOrdenTrabajoView";
import CrearNotificacionModal from "../features/OrdenTrabajo/modals/ModalNotificacion";
import ModalConfiguracionCampos from "../components/ModalConfiguracionCampos";
import {
  getAllOrdenesTrabajo,
  updateEstadoOrdenTrabajo,
  verificarLiberacionOT,
  liberarOrdenTrabajoService,
  cerrarOrdenTrabajoService,
} from "../features/mantenimiento/services/ordenTrabajoService";
import { getViewConfig, saveViewConfig, resetViewConfig } from "../features/mantenimiento/services/UserViewConfigService";
import ModalLiberarOT from "../features/OrdenTrabajo/modals/ModalLiberarOT";
import OrdenesTrabajoListView from "../features/OrdenTrabajo/modals/OrdenesTrabajoListModal";
import OrdenTrabajoExcelExport from "../features/OrdenTrabajo/components/OrdenTrabajoExcelExport";

const OT_FIELD_LABELS = {
  numeroOT:              "N° Orden de Trabajo",
  estado:                "Estado",
  tipoAviso:             "Tipo de Aviso",
  descripcionGeneral:    "Descripción",
  supervisorId:          "Supervisor",
  registros:             "Equipos / Ubicaciones",
  fechaProgramadaInicio: "Inicio Programado",
  fechaProgramadaFin:    "Fin Programado",
  fechaInicioReal:       "Inicio Real",
  fechaFinReal:          "Fin Real",
  fechaCierre:           "Fecha Cierre",
  avisoNumero:           "N° Aviso",
  observaciones:         "Observaciones",
};

const VIEW_KEY = "orden_trabajo";

/* ================= HELPERS ================= */

const mapEstadoToKanban = (estado) => {
  const mapping = {
    CREADO: "creado",
    LIBERADO: "liberado",
    CIERRE_TECNICO: "cierre_tecnico",
    CERRADO: "cerrado",
    CANCELADO: "cancelado",
  };
  return mapping[estado] || "creado";
};

/* ================= HEADER COMPONENT ================= */

function OrdenTrabajoEstado({ activeTab, setActiveTab, setConfigOpen, filters, setFilters }) {
  const hasActiveFilters = filters.search || filters.estado || filters.tipo;
  const showConfig = activeTab === "kanban" || activeTab === "lista";

  return (
    <div className="space-y-3 p-4">
      {/* NAV + BOTONES */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          {[
            { id: "kanban", label: "Kanban" },
            { id: "lista", label: "Lista" },
            { id: "calendario", label: "Calendario" },
            { id: "listaExcel", label: "Lista Excel" },
            { id: "excel", label: "📥 Excel" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-2 font-semibold rounded-lg transition-all whitespace-nowrap text-sm ${
                activeTab === id
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0" />

        <div className="flex items-center gap-2 flex-shrink-0">
          {showConfig && (
            <button
              onClick={() => setConfigOpen(true)}
              className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center gap-2 text-sm font-semibold"
              title="Configurar campos visibles"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configurar</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar N° OT, descripción..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-gray-400" />
            </div>
            <select
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer"
              value={filters.estado}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
            >
              <option value="">Estado</option>
              <option value="CREADO">🔵 Creado</option>
              <option value="LIBERADO">🟣 Liberado</option>
              <option value="CIERRE_TECNICO">🟡 Cierre Técnico</option>
              <option value="CERRADO">🟢 Cerrado</option>
              <option value="CANCELADO">🔴 Cancelado</option>
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Wrench className="w-4 h-4 text-gray-400" />
            </div>
            <select
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer"
              value={filters.tipo}
              onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
            >
              <option value="">Tipo aviso</option>
              <option value="mantenimiento">🔧 Mantenimiento</option>
              <option value="instalacion">🏗️ Instalación</option>
              <option value="venta">💼 Venta</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => setFilters({ search: "", estado: "", tipo: "" })}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium hover:bg-red-100 transition-all"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENT ================= */

export default function OrdenTrabajo() {
  const [activeTab, setActiveTab] = useState("kanban");
  const [ordenesData, setOrdenesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", estado: "", tipo: "" });

  /* ── Vista configurable ── */
  const [configOpen, setConfigOpen] = useState(false);
  const [cardFields, setCardFields] = useState(OT_DEFAULT_FIELDS);
  const [columnOrder, setColumnOrder] = useState(OT_DEFAULT_ORDER);

  /* ── Modals ── */
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [modalNotificacion, setModalNotificacion] = useState({ isOpen: false, ordenTrabajo: null });
  const [listaTecnicos, setListaTecnicos] = useState([]);
  const [listaPlanes, setListaPlanes] = useState([]);

  const [showModalLiberar, setShowModalLiberar] = useState(false);
  const [verificacion, setVerificacion] = useState(null);
  const [liberandoId, setLiberandoId] = useState(null);
  const [liberando, setLiberando] = useState(false);
  const [cargandoVerificacion, setCargandoVerificacion] = useState(false);

  /* ── Data + config load ── */
  useEffect(() => {
    loadOrdenesTrabajo();
    getViewConfig(VIEW_KEY).then((cfg) => {
      if (cfg?.cardFields) setCardFields({ ...OT_DEFAULT_FIELDS, ...cfg.cardFields });
      if (cfg?.columnOrder?.length) setColumnOrder(cfg.columnOrder);
    }).catch(() => {});
  }, []);

  const loadOrdenesTrabajo = async () => {
    try {
      setLoading(true);
      const data = await getAllOrdenesTrabajo();
      setOrdenesData(data);
    } catch (error) {
      console.error("Error cargando órdenes:", error);
      setOrdenesData([]);
    } finally {
      setLoading(false);
    }
  };

  /* ── Filters ── */
  const filteredOrdenes = ordenesData.filter((ot) => {
    const searchLower = filters.search.toLowerCase();
    const matchSearch =
      !filters.search ||
      ot.numeroOT?.toLowerCase().includes(searchLower) ||
      ot.descripcionGeneral?.toLowerCase().includes(searchLower) ||
      ot.supervisorId?.toLowerCase().includes(searchLower);

    const matchEstado = !filters.estado || ot.estado === filters.estado;
    const matchTipo = !filters.tipo || ot.aviso?.tipoAviso === filters.tipo;

    return matchSearch && matchEstado && matchTipo;
  });

  /* ── Kanban data ── */
  const columns = {
    creado: { name: "Creado", color: "#3b82f6" },
    liberado: { name: "Liberado", color: "#8b5cf6" },
    cierre_tecnico: { name: "Cierre Técnico", color: "#f59e0b" },
    cerrado: { name: "Cerrado", color: "#10b981" },
    cancelado: { name: "Cancelado", color: "#ef4444" },
  };

  const getKanbanData = () =>
    Object.keys(columns).reduce((acc, key) => {
      acc[key] = {
        ...columns[key],
        items: filteredOrdenes.filter((ot) => mapEstadoToKanban(ot.estado) === key),
      };
      return acc;
    }, {});

  /* ── Handlers ── */
  const handleUpdateEstado = async (ordenId, nuevoEstado) => {
    try {
      setOrdenesData((prev) =>
        prev.map((ot) => (ot.id === ordenId ? { ...ot, estado: nuevoEstado } : ot))
      );
      if (nuevoEstado === "CERRADO") {
        await cerrarOrdenTrabajoService(ordenId);
      } else {
        await updateEstadoOrdenTrabajo(ordenId, nuevoEstado);
      }
      await loadOrdenesTrabajo();
    } catch (error) {
      console.error("Error actualizando estado:", error);
      await loadOrdenesTrabajo();
    }
  };

  const handleViewOrden = (orden) => {
    setViewData(orden);
    setViewOpen(true);
  };

  const handleLiberar = async (ordenId) => {
    try {
      setCargandoVerificacion(true);
      setLiberandoId(ordenId);
      const r = await verificarLiberacionOT(ordenId);
      setVerificacion(r.data);
      setShowModalLiberar(true);
    } catch (error) {
      alert(error?.response?.data?.message || error?.message || "Error al verificar la OT");
    } finally {
      setCargandoVerificacion(false);
    }
  };

  const confirmarLiberacion = async (destinatarioId) => {
    try {
      setLiberando(true);
      const r = await liberarOrdenTrabajoService(liberandoId, destinatarioId);
      setShowModalLiberar(false);
      setVerificacion(null);
      setLiberandoId(null);

      const { compra, almacen } = r.data;
      let msg = "✅ OT liberada correctamente.";
      if (compra?.numeroSolicitud) msg += `\n📦 Solicitud de compra consolidada (${compra.numeroSolicitud}) — pendiente de envío a SAP.`;
      if (almacen?.numeroSolicitud) msg += `\n📦 Solicitud de almacén consolidada (${almacen.numeroSolicitud}) — pendiente de envío por correo.`;
      if (compra?.numeroSolicitud || almacen?.numeroSolicitud) msg += "\n\n⚠️ Recuerda enviar las solicitudes desde el estado LIBERADO.";
      alert(msg);

      await loadOrdenesTrabajo();
    } catch (error) {
      alert(error?.response?.data?.message || error?.message || "Error al liberar");
    } finally {
      setLiberando(false);
    }
  };

  const guardarConfigVista = async () => {
    await saveViewConfig(VIEW_KEY, { cardFields, columnOrder }).catch(() => {});
    setConfigOpen(false);
  };

  const resetConfigVista = async () => {
    setCardFields(OT_DEFAULT_FIELDS);
    setColumnOrder(OT_DEFAULT_ORDER);
    await resetViewConfig(VIEW_KEY).catch(() => {});
    setConfigOpen(false);
  };

  const handleAbrirCierreTecnico = async (ordenTrabajo) => {
    try {
      const [tecnicosData, planesData] = await Promise.all([
        fetch("/api/tecnicos").then((r) => r.json()).catch(() => []),
        fetch(`/api/ordenes-trabajo/${ordenTrabajo.id}/planes`).then((r) => r.json()).catch(() => []),
      ]);
      setListaTecnicos(tecnicosData);
      setListaPlanes(planesData);
      setModalNotificacion({ isOpen: true, ordenTrabajo });
    } catch (error) {
      console.error("Error al cargar datos para cierre técnico:", error);
      alert("❌ Error al cargar información para el cierre técnico");
    }
  };

  const handleCerrarModalNotificacion = async () => {
    setModalNotificacion({ isOpen: false, ordenTrabajo: null });
    await loadOrdenesTrabajo();
  };

  /* ── Render ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Cargando órdenes de trabajo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* HEADER STICKY */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <OrdenTrabajoEstado
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setConfigOpen={setConfigOpen}
          filters={filters}
          setFilters={setFilters}
        />
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6">
          {activeTab === "kanban" && (
            <KanbanView
              data={getKanbanData()}
              onUpdateEstado={handleUpdateEstado}
              onViewOrden={handleViewOrden}
              onLiberar={handleLiberar}
              onAbrirCierreTecnico={handleAbrirCierreTecnico}
              cardFields={cardFields}
            />
          )}

          {activeTab === "lista" && (
            <ListaView
              ordenes={filteredOrdenes}
              onViewOrden={handleViewOrden}
              onEditarOT={handleViewOrden}
              onEditarNotificacion={handleAbrirCierreTecnico}
              cardFields={cardFields}
              columnOrder={columnOrder}
            />
          )}

          {activeTab === "calendario" && (
            <CalendarioView
              ordenes={filteredOrdenes}
              onViewOrden={handleViewOrden}
            />
          )}

          {activeTab === "listaExcel" && (
            <OrdenesTrabajoListView
              ordenes={filteredOrdenes}
              onSelectOT={handleViewOrden}
              onSelectEquipo={(eq, ot) => console.log(eq.codigo)}
              onSelectUbicacion={(ub, ot) => console.log(ub.codigo)}
            />
          )}

          {activeTab === "excel" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <OrdenTrabajoExcelExport ordenes={filteredOrdenes} />
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <ModalOrdenTrabajoView
        isOpen={viewOpen}
        orden={viewData}
        onClose={() => { setViewOpen(false); setViewData(null); }}
        onUpdateEstado={handleUpdateEstado}
        onLiberar={handleLiberar}
        onAbrirCierreTecnico={handleAbrirCierreTecnico}
        onOrdenActualizada={async () => { await loadOrdenesTrabajo(); setViewOpen(false); setViewData(null); }}
      />

      <CrearNotificacionModal
        isOpen={modalNotificacion.isOpen}
        onClose={handleCerrarModalNotificacion}
        ordenTrabajoId={modalNotificacion.ordenTrabajo?.id}
        tipoAviso={modalNotificacion.ordenTrabajo?.aviso?.tipoAviso}
        listaTecnicos={listaTecnicos}
        listaPlanes={listaPlanes}
      />

      <ModalLiberarOT
        isOpen={showModalLiberar}
        onClose={() => { setShowModalLiberar(false); setVerificacion(null); setLiberandoId(null); }}
        onConfirm={confirmarLiberacion}
        verificacion={verificacion}
        liberando={liberando}
      />

      <ModalConfiguracionCampos
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
        fields={cardFields}
        setFields={setCardFields}
        order={columnOrder}
        setOrder={setColumnOrder}
        onSave={guardarConfigVista}
        onReset={resetConfigVista}
        fieldLabels={OT_FIELD_LABELS}
      />
    </div>
  );
}
