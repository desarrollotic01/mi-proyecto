import { Box } from "lucide-react";
import EquipoCard from "./EquipoCard";
import { KanbanColumn as BaseKanbanColumn } from "../../../components/ui";

//kanban de equipos en el dashboard
export default function KanbanColumn({ title, icon: Icon, color, equipos, onEdit, onDelete, onView, onMove, onCreatePlan, onOpenPDF, moveCategory }) {
  // Render function para el componente base
  const renderItem = (equipo, index) => (
    <EquipoCard
      key={equipo?.id || index}
      equipo={equipo}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      onMove={onMove}
      onCreatePlan={onCreatePlan}
      onOpenPDF={onOpenPDF}
      moveCategory={moveCategory}
    />
  );

  return (
    <BaseKanbanColumn
      title={title}
      icon={Icon}
      color={color}
      items={equipos}
      renderItem={renderItem}
      emptyMessage="Sin equipos"
    />
  );
}