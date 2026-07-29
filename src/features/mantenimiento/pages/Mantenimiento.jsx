import { useEffect, useState } from "react";

import { useMantenimiento } from "../hooks/useMantenimiento";
import { ESTADOS_AV } from "../config/camposMantenimiento";
import { equipoService } from "../services/equipoService";

import MantenimientoEstado from "../components/MantenimientoEstado";
import MantenimientoLista from "../components/MantenimientoLista";
import MantenimientoCalendario from "../components/MantenimientoCalendario";
import MantenimientoKanban from "../components/MantenimientoKanban";
import AvisosExcelExport from "../components/AvisosExcelExport";

import ModalMantenimiento from "../modals/ModalMantenimiento";
import ModalMantenimientoView from "../modals/ModalMantenimientoView";
import ModalTratamiento from "../../../components/inputs/ModalTratamiento";
import ModalSeleccionTipoOT from "../../../features/OrdenTrabajo/Modalselecciontipoot";
import ModalOTGrupal from "../../../features/OrdenTrabajo/Modalotgrupal";
import ModalConfiguracionCampos from "../../../components/ModalConfiguracionCampos";

import "../../../styles/fullcalendar.css";

export default function Mantenimiento() {
  const m = useMantenimiento();
  
  const [modalSeleccionOT, setModalSeleccionOT] = useState(false);
  const [modalGrupalOT, setModalGrupalOT] = useState(false);

  // 🆕 Estado para equipos
  const [equiposData, setEquiposData] = useState([]);
  const [loadingEquipos, setLoadingEquipos] = useState(true);



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
      setModalGrupalOT(true);
    }
  }, [m.avisoOrdenTrabajo]);

  const cerrarModalesOT = () => {
  setModalSeleccionOT(false);
  setModalGrupalOT(false);
  m.setAvisoOrdenTrabajo(null);
};
  // 🆕 Función para generar número de OT
  const generarNumeroOT = () => {
    return `OT-${Date.now().toString().slice(-6)}`;
  };

  // 🆕 Función para manejar el guardado de OT
  const handleGuardarOT = async (payload) => {
    await m.guardarOrdenTrabajo(payload);
    cerrarModalesOT();
    // Cerrar el modal de vista ya que el aviso cambió de estado
    m.setViewOpen(false);
    m.setViewData(null);
  };

  /* ================= EDITAR AVISO ================= */
  const abrirEditarAviso = (aviso) => {
    m.setFormData({ ...aviso });
    m.setModalOpen(true);
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
          item.descripcionResumida?.toLowerCase().includes(searchLower) ||
          item.cliente?.toLowerCase().includes(searchLower) ||
          item.producto?.toLowerCase().includes(searchLower) ||
          item.solicitante?.toLowerCase().includes(searchLower);

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

        const matchEstado =
          !m.filters.estado ||
          item.estado === m.filters.estado;

        return (
          matchSearch &&
          matchPrioridad &&
          matchTipo &&
          matchSolicitante &&
          matchEstado
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
              onEliminar={m.eliminarAvisoKanban}
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
              onEditarAviso={abrirEditarAviso}
              setViewData={m.setViewData}
              setViewStep={m.setViewStep}
              setViewOpen={m.setViewOpen}
              equiposData={equiposData}
            />
          )}

          {/* ================= EXCEL ================= */}
          {m.activeTab === "excel" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <AvisosExcelExport
                avisos={Object.values(m.columns).flatMap((c) => c.items)}
              />
            </div>
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
        onClose={() => {
          m.setModalOpen(false);
          m.resetFormData();
        }}
        formData={m.formData}
        setFormData={m.setFormData}
        handleSaveAll={m.handleSaveAll}
        onCreated={() => {
          m.cargarAvisos();
          m.resetFormData();
        }}
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
        onEditarAviso={abrirEditarAviso}
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

      {/* Modal Grupal OT */}
      <ModalSeleccionTipoOT
        isOpen={modalSeleccionOT}
        onClose={cerrarModalesOT}
        onSeleccionar={(tipo) => {
          setModalSeleccionOT(false);
          if (tipo === "grupal") setModalGrupalOT(true);
        }}
      />

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