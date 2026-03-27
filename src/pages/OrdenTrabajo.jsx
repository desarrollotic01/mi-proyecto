import { useState, useEffect } from "react";
import KanbanView from "../features/OrdenTrabajo/components/OrdenTrabajoKanban";
import ListaView from "../features/OrdenTrabajo/components/OrdenTrabajoLista";
import CalendarioView from "../features/OrdenTrabajo/components/OrdenTrabajoCalendario";
import ModalOrdenTrabajo from "../components/inputs/ModalOrdenTrabajo";
import ModalOrdenTrabajoView from "../features/OrdenTrabajo/modals/ModalOrdenTrabajoView";
import CrearNotificacionModal from "../features/OrdenTrabajo/modals/ModalNotificacion";
import { 
  getAllOrdenesTrabajo, 
  updateEstadoOrdenTrabajo,
  crearOrdenTrabajo,
  liberarOrdenTrabajo 
} from "../features/mantenimiento/services/ordenTrabajoService";

/* ================= HELPERS ================= */

const mapEstadoToKanban = (estado) => {
  const mapping = {
    "CREADO": "creado",
    "LIBERADO": "liberado",
    "CIERRE_TECNICO": "cierre_tecnico",
    "CERRADO": "cerrado",
    "CANCELADO": "cancelado"
  };
  return mapping[estado] || "creado";
};

const formatDate = (isoDate) => {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateForInput = (isoDate) => {
  if (!isoDate) return "";
  return isoDate.split('T')[0];
};

/* ================= COMPONENT ================= */

export default function OrdenTrabajo() {
  /* ================= STATE ================= */
  const [activeTab, setActiveTab] = useState("kanban");
  const [ordenesData, setOrdenesData] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= MODALS ================= */
  const [modalOpen, setModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewStep, setViewStep] = useState(1);
  const [formData, setFormData] = useState({});

  // Modal de Notificación (Cierre Técnico)
  const [modalNotificacion, setModalNotificacion] = useState({
    isOpen: false,
    ordenTrabajo: null,
  });
  const [listaTecnicos, setListaTecnicos] = useState([]);
  const [listaPlanes, setListaPlanes] = useState([]);

  /* ================= DATA LOADING ================= */
  useEffect(() => {
    loadOrdenesTrabajo();
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

  /* ================= KANBAN DATA ================= */
  const columns = {
    creado: { name: "Creado", color: "#f11414" },
    liberado: { name: "Liberado", color: "#8b5cf6" },
    cierre_tecnico: { name: "Cierre Técnico", color: "#f59e0b" },
    cerrado: { name: "Cerrado", color: "#10b981" },
    cancelado: { name: "Cancelado", color: "#ef4444" }
  };

  const getKanbanData = () => {
    const result = Object.keys(columns).reduce((acc, key) => {
      acc[key] = {
        ...columns[key],
        items: ordenesData.filter(ot => mapEstadoToKanban(ot.estado) === key)
      };
      return acc;
    }, {});
    return result;
  };

  /* ================= HANDLERS ================= */
  const handleSaveAll = async () => {
    try {
      await crearOrdenTrabajo(formData);
      await loadOrdenesTrabajo();
      
      setModalOpen(false);
      setFormData({});
      setWizardStep(1);
    } catch (error) {
      console.error("Error creando orden de trabajo:", error);
    }
  };

  const handleUpdateEstado = async (ordenId, nuevoEstado) => {
    try {
      // Actualizar optimísticamente en el estado local
      setOrdenesData(prev => 
        prev.map(ot => 
          ot.id === ordenId ? { ...ot, estado: nuevoEstado } : ot
        )
      );

      // Actualizar en el backend
      await updateEstadoOrdenTrabajo(ordenId, nuevoEstado);
    } catch (error) {
      console.error("Error actualizando estado:", error);
      await loadOrdenesTrabajo();
    }
  };

  const handleViewOrden = (orden) => {
    console.log("HANDLE VIEW ORDEN:", orden);
    setViewData(orden);
    setViewStep(1);
    setViewOpen(true);
  };

  // ===== NUEVA FUNCIÓN: LIBERAR ORDEN DE TRABAJO =====
  const handleLiberar = async (ordenId) => {
    try {
      const confirmar = window.confirm(
        "¿Estás seguro de liberar esta orden de trabajo? Esta acción cambiará su estado a LIBERADO."
      );
      
      if (!confirmar) return;

      // Actualizar optimísticamente
      setOrdenesData(prev => 
        prev.map(ot => 
          ot.id === ordenId ? { ...ot, estado: "LIBERADO" } : ot
        )
      );

      // Llamada al backend
      await liberarOrdenTrabajo(ordenId);
      
      // Recargar para asegurar sincronización
      await loadOrdenesTrabajo();
      
      // Opcional: mostrar toast de éxito
      alert("✅ Orden liberada correctamente");
    } catch (error) {
      console.error("Error al liberar orden:", error);
      alert("❌ Error al liberar la orden de trabajo");
      
      // Revertir cambio
      await loadOrdenesTrabajo();
    }
  };

  // ===== NUEVA FUNCIÓN: ABRIR MODAL DE CIERRE TÉCNICO =====
  const handleAbrirCierreTecnico = async (ordenTrabajo) => {
    try {
      // Cargar técnicos y planes en paralelo
      const [tecnicosData, planesData] = await Promise.all([
        fetch('/api/tecnicos').then(r => r.json()).catch(() => []),
        fetch(`/api/ordenes-trabajo/${ordenTrabajo.id}/planes`).then(r => r.json()).catch(() => [])
      ]);
      
      setListaTecnicos(tecnicosData);
      setListaPlanes(planesData);

      // Abrir modal
      setModalNotificacion({
        isOpen: true,
        ordenTrabajo: ordenTrabajo,
      });
    } catch (error) {
      console.error("Error al cargar datos para cierre técnico:", error);
      alert("❌ Error al cargar información para el cierre técnico");
    }
  };

  // ===== CERRAR MODAL DE NOTIFICACIÓN =====
  const handleCerrarModalNotificacion = async () => {
    setModalNotificacion({
      isOpen: false,
      ordenTrabajo: null,
    });
    
    // Recargar órdenes después de crear la notificación
    await loadOrdenesTrabajo();
  };

  /* ================= RENDER ================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium text-sm md:text-base">Cargando órdenes de trabajo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 overflow-x-hidden">
      <div className="container mx-auto px-4 py-6 md:py-8 w-full max-w-full">
        {/* HEADER */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
            Órdenes de Trabajo
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Gestiona y visualiza todas tus órdenes de trabajo
          </p>
        </div>

        {/* NAVIGATION & ACTIONS - 🚀 FLEX-WRAP y FLEX-COL para MÓVILES */}
        <div className="bg-white rounded-xl shadow-sm p-2 md:p-3 mb-6 border border-slate-200">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 md:gap-3 w-full">
            
            {/* Contenedor de Pestañas */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 flex-1">
              {["kanban", "lista", "calendario"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    w-full sm:w-auto sm:flex-1 px-4 py-2.5 md:px-6 md:py-2.5 rounded-lg font-semibold transition-colors duration-200 capitalize text-sm md:text-base border
                    ${activeTab === tab
                      ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                    }
                  `}
                >
                  {tab === "kanban" ? "📊 Estados" : tab === "lista" ? "📋 Lista" : "📅 Calendario"}
                </button>
              ))}
            </div>
            
            {/* Botón Nueva OT - 🚀 Ocupa el 100% en móvil y su propio espacio en PC */}
            <button
              onClick={() => {
                setWizardStep(1);
                setModalOpen(true);
              }}
              className="
                w-full sm:w-auto px-4 py-2.5 md:px-6 md:py-2.5 rounded-lg font-bold
                bg-emerald-600 text-white shadow-sm border border-emerald-700
                hover:bg-emerald-700 transition-colors duration-200
                whitespace-nowrap text-sm md:text-base flex items-center justify-center gap-2
              "
            >
              ✨ Nueva OT
            </button>
          </div>
        </div>

        {/* VIEWS */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200 w-full min-w-0 overflow-hidden">
          {activeTab === "kanban" && (
            <KanbanView
              data={getKanbanData()}
              onUpdateEstado={handleUpdateEstado}
              onViewOrden={handleViewOrden}
              onLiberar={handleLiberar}
              onAbrirCierreTecnico={handleAbrirCierreTecnico}
            />
          )}

          {activeTab === "lista" && (
            <ListaView
              ordenes={ordenesData}
              onViewOrden={handleViewOrden}
            />
          )}

          {activeTab === "calendario" && (
            <CalendarioView
              ordenes={ordenesData}
              onViewOrden={handleViewOrden}
            />
          )}
        </div>
      </div>

      {/* MODALS */}
      <ModalOrdenTrabajo
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        wizardStep={wizardStep}
        setWizardStep={setWizardStep}
        formData={formData}
        handleInputChange={(e) =>
          setFormData({ ...formData, [e.target.name]: e.target.value })
        }
        handleSaveAll={handleSaveAll}
      />

      <ModalOrdenTrabajoView
        isOpen={viewOpen}
        orden={viewData}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        onUpdateEstado={handleUpdateEstado}
        onLiberar={handleLiberar}
        onAbrirCierreTecnico={handleAbrirCierreTecnico}
      />

      {/* MODAL DE NOTIFICACIÓN (CIERRE TÉCNICO) */}
      <CrearNotificacionModal
        isOpen={modalNotificacion.isOpen}
        onClose={handleCerrarModalNotificacion}
        ordenTrabajoId={modalNotificacion.ordenTrabajo?.id}
        listaTecnicos={listaTecnicos}
        listaPlanes={listaPlanes}
      />
    </div>
  );
}