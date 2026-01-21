import { useEffect, useState } from "react";

import { useMantenimiento } from "../hooks/useMantenimiento";
import { ESTADOS_AV } from "../config/camposMantenimiento";

import MantenimientoEstado from "../components/MantenimientoEstado";
import MantenimientoLista from "../components/MantenimientoLista";
import MantenimientoCalendario from "../components/MantenimientoCalendario";
import MantenimientoKanban from "../components/MantenimientoKanban";

import ModalMantenimiento from "../modals/ModalMantenimiento";
import ModalMantenimientoView from "../modals/ModalMantenimientoView";
import ModalTratamiento from "../../../components/inputs/ModalTratamiento";
import ModalConfiguracionCampos from "../../../components/ModalConfiguracionCampos";

import "../../../styles/fullcalendar.css";

export default function Mantenimiento() {
  const m = useMantenimiento();

  /* ================= FILTROS ================= */
  const filteredColumns = Object.fromEntries(
    Object.entries(m.columns).map(([key, col]) => [
      key,
      {
        ...col,
        items: col.items.filter((item) => {
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
        }),
      },
    ])
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
    <div className="p-4">
      {/* HEADER + FILTROS */}
      <MantenimientoEstado {...m} />

      {/* ================= KANBAN ================= */}
      {m.activeTab === "kanban" && (
        <MantenimientoKanban
          {...m}
          filteredColumns={filteredColumns}
        />
      )}

      {/* ================= LISTA ================= */}
      {m.activeTab === "lista" && (
        <MantenimientoLista
          {...m}
          filteredColumns={filteredColumns}
        />
      )}

      {/* ================= CALENDARIO ================= */}
      {m.activeTab === "calendario" && (
        <MantenimientoCalendario
          {...m}
          filteredCalendarEvents={filteredCalendarEvents}
        />
      )}

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

      <ModalConfiguracionCampos
        isOpen={m.configOpen}
        onClose={() => m.setConfigOpen(false)}
        fields={m.cardFields}
        setFields={m.setCardFields}
        order={m.columnOrder}
        setOrder={m.setColumnOrder}
      />
    </div>
  );
}
