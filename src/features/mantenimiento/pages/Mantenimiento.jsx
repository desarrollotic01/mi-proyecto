import { useEffect, useState } from "react";

import { useMantenimiento } from "../hooks/useMantenimiento";
import { ESTADOS_AV } from "../config/camposMantenimiento";
import { equipoService } from "../services/equipoService";

import MantenimientoEstado from "../components/MantenimientoEstado";
import MantenimientoLista from "../components/MantenimientoLista";
import MantenimientoCalendario from "../components/MantenimientoCalendario";
import MantenimientoKanban from "../components/MantenimientoKanban";

import ModalMantenimiento from "../modals/ModalMantenimiento";
import ModalMantenimientoView from "../modals/ModalMantenimientoView";
import ModalTratamiento from "../../../components/inputs/ModalTratamiento";
import ModalSeleccionTipoOT from "../../../features/OrdenTrabajo/Modalselecciontipoot";
import ModalOTIndividual from "../../../features/OrdenTrabajo/Modalotindividual";
import ModalOTGrupal from "../../../features/OrdenTrabajo/Modalotgrupal";
import ModalOTMixto from "../../../features/OrdenTrabajo/ModalotMixto";
import ModalConfiguracionCampos from "../../../components/ModalConfiguracionCampos";
import ModalSeleccionEquiposOT from "../../OrdenTrabajo/Modalseleccionequiposot";

import "../../../styles/fullcalendar.css";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

export default function Mantenimiento() {
  const m = useMantenimiento();
  
  // 🆕 Estados para los 3 modales de OT
  const [modalSeleccionOT, setModalSeleccionOT] = useState(false);
  const [modalIndividualOT, setModalIndividualOT] = useState(false);
  const [modalGrupalOT, setModalGrupalOT] = useState(false);
  const [modalMixtoOT, setModalMixtoOT] = useState(false);

  // 🆕 Estado para equipos
  const [equiposData, setEquiposData] = useState([]);
  const [loadingEquipos, setLoadingEquipos] = useState(true);


  const [modalEquiposOT, setModalEquiposOT] = useState(false);

  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
const [indiceEquipoActual, setIndiceEquipoActual] = useState(0);



  // 🆕 Cargar equipos al montar el componente
  useEffect(() => {
    const cargarEquipos = async () => {
      setLoadingEquipos(true);
      try {
        const equipos = await equipoService.getEquipos();
        setEquiposData(equipos);
      } catch (error) {
        console.error("Error cargando equipos:", error);
      } finally {
        setLoadingEquipos(false);
      }
    };

    cargarEquipos();
  }, []);

  useEffect(() => {
    if (m.avisoOrdenTrabajo) {
      setModalSeleccionOT(true);
    }
  }, [m.avisoOrdenTrabajo]);

  // 🆕 Función auxiliar para cerrar todos los modales de OT
 // 🆕 Función auxiliar para cerrar todos los modales de OT
const cerrarModalesOT = () => {
  setModalSeleccionOT(false);
  setModalIndividualOT(false);
  setModalGrupalOT(false);
  setModalMixtoOT(false);
  setModalEquiposOT(false); 
  setEquiposSeleccionados([]);
  setIndiceEquipoActual(0); 
  m.setEquiposProcesadosOT([]);
  m.setAvisoOrdenTrabajo(null);
};
  // 🆕 Función para generar número de OT
  const generarNumeroOT = () => {
    return `OT-${Date.now().toString().slice(-6)}`;
  };

  const handleEquiposSeleccionados = (equipos) => {
  console.log("Equipos seleccionados:", equipos);
  // aquí guardas estado, abres el modal individual, etc
};


  // 🆕 Función para manejar el guardado de OT
  const handleGuardarOT = (payload) => {
    m.guardarOrdenTrabajo(payload);
    cerrarModalesOT();
  };

  /* ================= FILTROS ================= */
  const filteredColumns = Object.fromEntries(
    Object.entries(m.columns).map(([key, col]) => {
      const filteredItems = col.items.filter((item) => {
        const searchLower = m.filters.search.toLowerCase();

        const matchSearch =
          !m.filters.search ||
          item.numeroAviso?.toLowerCase().includes(searchLower) ||
          item.descripcion?.toLowerCase().includes(searchLower) ||
          item.cliente?.toLowerCase().includes(searchLower) ||
          item.producto?.toLowerCase().includes(searchLower);

        const matchPrioridad =
          !m.filters.prioridad ||
          item.prioridad === m.filters.prioridad;

        const matchTipo =
          !m.filters.tipoMantenimiento ||
          item.tipoMantenimiento === m.filters.tipoMantenimiento;

        const matchSolicitante =
          !m.filters.solicitante ||
          item.solicitante
            ?.toLowerCase()
            .includes(m.filters.solicitante.toLowerCase());

        return (
          matchSearch &&
          matchPrioridad &&
          matchTipo &&
          matchSolicitante
        );
      });

      return [
        key,
        {
          ...col,
          items: filteredItems,
        },
      ];
    })
  );

  /* ================= CALENDARIO ================= */
  const filteredCalendarEvents = Object.values(filteredColumns)
    .flatMap((col) => col.items)
    .map((item) => ({
      id: item.id,
      title: item.numeroAviso,
      date:
        item.fechaAtencion ||
        new Date().toISOString().slice(0, 10),
      extendedProps: { ...item },
    }));

  /* ================= UI ================= */
  
  // 🆕 PANTALLA DE LOADING
  if (m.loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Cargando avisos...</p>
          <p className="text-sm text-gray-500 mt-2">Obteniendo información del servidor</p>
        </div>
      </div>
    );
  }

  // 🆕 PANTALLA DE ERROR
  if (m.error) {
    const getErrorMessage = (code) => {
      switch (code) {
        case 404:
          return {
            title: "Error 404",
            subtitle: "No encontrado",
            description: "No se pudieron encontrar los datos solicitados."
          };
        case 406:
          return {
            title: "Error 406",
            subtitle: "Formato no aceptable",
            description: "El servidor no puede generar una respuesta en el formato solicitado."
          };
        case 500:
          return {
            title: "Error 500",
            subtitle: "Fallo de servidor",
            description: "Ocurrió un error interno en el servidor. Intenta nuevamente."
          };
        default:
          return {
            title: `Error ${code || "Desconocido"}`,
            subtitle: "Error de conexión",
            description: "No se pudo conectar con el servidor. Verifica tu conexión."
          };
      }
    };

    const errorInfo = getErrorMessage(m.error);

    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {errorInfo.title}: {errorInfo.subtitle}
          </h2>
          <p className="text-gray-600 mb-6">{errorInfo.description}</p>
          <button
            onClick={m.cargarAvisos}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* HEADER + FILTROS - STICKY */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <MantenimientoEstado {...m} />
      </div>

      {/* CONTENIDO - SCROLLABLE */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6">
          {/* ================= KANBAN ================= */}
          {m.activeTab === "kanban" && (
            <MantenimientoKanban
              filteredColumns={filteredColumns}
              cardFields={m.cardFields}
              columnOrder={m.columnOrder}
              setViewData={m.setViewData}
              setViewStep={m.setViewStep}
              setViewOpen={m.setViewOpen}
              cambiarEstado={m.cambiarEstado}
              abrirTratamiento={m.abrirTratamiento}
              onDragEnd={m.onDragEnd}
              equiposData={equiposData}
              ordenesTrabajoData={m.ordenesTrabajoCompletas}
            />
          )}

          {/* ================= LISTA ================= */}
          {m.activeTab === "lista" && (
            <MantenimientoLista
              filteredColumns={filteredColumns}
              cardFields={m.cardFields}
              columnOrder={m.columnOrder}
              cambiarEstado={m.cambiarEstado}
              abrirTratamiento={m.abrirTratamiento}
              setViewData={m.setViewData}
              setViewStep={m.setViewStep}
              setViewOpen={m.setViewOpen}
              equiposData={equiposData}
            />
          )}

          {/* ================= CALENDARIO ================= */}
          {m.activeTab === "calendario" && (
            <MantenimientoCalendario
              calendarRef={m.calendarRef}
              calendarView={m.calendarView}
              setCalendarView={m.setCalendarView}
              filteredColumns={filteredColumns}
              cardFields={m.cardFields}
              setViewData={m.setViewData}
              setViewStep={m.setViewStep}
              setViewOpen={m.setViewOpen}
              equiposData={equiposData}
            />
          )}
        </div>
      </div>

      {/* ================= MODALES ================= */}
      <ModalMantenimiento
        isOpen={m.modalOpen}
        onClose={() => m.setModalOpen(false)}
        formData={m.formData}
        setFormData={m.setFormData}
        handleSaveAll={m.handleSaveAll}
        listaAvisos={Object.values(m.columns).flatMap(
          (c) => c.items
        )}
      />

      <ModalMantenimientoView
        isOpen={m.viewOpen}
        data={m.viewData}
        wizardStep={m.viewStep}
        setWizardStep={m.setViewStep}
        onClose={() => {
          m.setViewOpen(false);
          m.setViewData(null);
        }}
        cambiarEstado={m.cambiarEstado}
  abrirTratamiento={m.abrirTratamiento}
      />

      <ModalTratamiento
        isOpen={m.tratamientoOpen}
        aviso={m.avisoTratamiento}
        onClose={() => {
          m.setTratamientoOpen(false);
          m.setAvisoTratamiento(null);
        }}
        onGuardar={m.guardarTratamiento}
      />

      {/* 🆕 SISTEMA COMPLETO DE 3 MODALES PARA ORDEN DE TRABAJO */}
      
      {/* PASO 1: Modal de Selección de Tipo (Individual, Mixta o Grupal) */}
    <ModalSeleccionTipoOT
  isOpen={modalSeleccionOT}
  onClose={cerrarModalesOT}
  onSeleccionar={(tipo) => {
    setModalSeleccionOT(false);

    if (tipo === "individual") {
      setModalEquiposOT(true);
    }
    if (tipo === "grupal") {
      setModalGrupalOT(true);
    }

    if (tipo === "mixto") {
      setModalMixtoOT(true);
    }
  }}
/>

<ModalSeleccionEquiposOT
  isOpen={modalEquiposOT}
  onClose={cerrarModalesOT}
  aviso={m.avisoOrdenTrabajo}

  ordenesExistentes={(() => {
    const ordenes = m.ordenesTrabajoCompletas || [];
    console.log("📦 Enviando a ModalSeleccionEquiposOT:");
    console.log("- Aviso ID:", m.avisoOrdenTrabajo?.id);
    console.log("- Total órdenes:", ordenes.length);
    console.log("- Órdenes completas:", ordenes);
    return ordenes;
  })()}
  equiposProcesados={m.equiposProcesadosOT || []}
  onEquiposSeleccionados={(equipos) => {
    setEquiposSeleccionados(equipos);
    setIndiceEquipoActual(0);
    setModalEquiposOT(false);
    setModalIndividualOT(true);
  }}
/>



      {/* PASO 2A: Modal Individual */}
   <ModalOTIndividual
  isOpen={modalIndividualOT}
  onClose={cerrarModalesOT}
  aviso={m.avisoOrdenTrabajo}
  equipoActual={equiposSeleccionados[indiceEquipoActual]}
  progresoEquipos={{
    actual: indiceEquipoActual + 1,
    total: equiposSeleccionados.length,
  }}
  onGuardar={(payload) => {
    const equipoId = equiposSeleccionados[indiceEquipoActual].id;
    
    m.guardarOrdenTrabajo({
      ...payload,
      equipoId: equipoId,
      avisoId: m.avisoOrdenTrabajo.id,
    });

    // ✅ IMPORTANTE: Marcar este equipo como procesado
    m.setEquiposProcesadosOT(prev => [...(prev || []), equipoId]);

    // Avanzar al siguiente equipo
    if (indiceEquipoActual + 1 < equiposSeleccionados.length) {
      setIndiceEquipoActual(prev => prev + 1);
    } else {
      cerrarModalesOT();
      setEquiposSeleccionados([]);
      setIndiceEquipoActual(0);
    }
  }}
  onGenerarNumeroOT={generarNumeroOT}
/>


      {/* PASO 2B: Modal Mixta */}
      <ModalOTMixto
        isOpen={modalMixtoOT}
        onClose={cerrarModalesOT}
        aviso={m.avisoOrdenTrabajo}
        onGuardar={handleGuardarOT}
        onGenerarNumeroOT={generarNumeroOT}
      />

      {/* PASO 2C: Modal Grupal */}
      <ModalOTGrupal
        isOpen={modalGrupalOT}
        onClose={cerrarModalesOT}
        aviso={m.avisoOrdenTrabajo}
        onGuardar={handleGuardarOT}
        onGenerarNumeroOT={generarNumeroOT}
      />

      <ModalConfiguracionCampos
        isOpen={m.configOpen}
        onClose={() => m.setConfigOpen(false)}
        fields={m.cardFields}
        setFields={m.setCardFields}
        order={m.columnOrder}
        setOrder={m.setColumnOrder}
        onSave={m.guardarConfigVista}
        onReset={m.resetConfigVista}
      />
    </div>
  );
}