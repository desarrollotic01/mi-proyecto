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
    creado: { name: "Creado", color: "#3b82f6" },
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
      // Mostrar indicador de carga (opcional)
      // setLoadingModal(true);

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">Cargando órdenes de trabajo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-6">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent mb-2">
            Órdenes de Trabajo
          </h1>
          <p className="text-slate-600">
            Gestiona y visualiza todas tus órdenes de trabajo
          </p>
        </div>

        {/* NAVIGATION */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-2 mb-6 border border-slate-200/50">
          <div className="flex items-center gap-2">
            {["kanban", "lista", "calendario"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 capitalize
                  ${activeTab === tab
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 transform scale-[1.02]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                {tab === "kanban" ? "📊 Estados" : tab === "lista" ? "📋 Lista" : "📅 Calendario"}
              </button>
            ))}
            
            <button
              onClick={() => {
                setWizardStep(1);
                setModalOpen(true);
              }}
              className="
                px-6 py-3 rounded-xl font-semibold
                bg-gradient-to-r from-emerald-600 to-emerald-500 
                text-white shadow-lg shadow-emerald-500/30
                hover:shadow-xl hover:shadow-emerald-500/40
                transform hover:scale-105 transition-all duration-300
                whitespace-nowrap
              "
            >
              ✨ Nueva OT
            </button>
          </div>
        </div>

        {/* VIEWS */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-slate-200/50">
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