import { Box } from "lucide-react";
import EquipoCard from "./EquipoCard";


//kanban de equipos en el dashboard
export default function KanbanColumn({ title, icon: Icon, color, equipos, onEdit, onDelete, onView, onMove, onCreatePlan, onOpenPDF, moveCategory }) {
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
  
  // Protección contra arrays rotos
  const equiposSeguros = Array.isArray(equipos) ? equipos : [];

  return (
    <div className="flex flex-col flex-1 min-w-0 w-full rounded-2xl border border-slate-200 bg-white overflow-hidden ...">
   {/* Contenido de la columna */}
      <div className={`${bgHeader} rounded-t-[1rem] p-3.5 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-2.5">
          <div className="text-white/90">
            <Icon size={20} strokeWidth={2} />
          </div>
          <h3 className="text-white font-black text-sm uppercase tracking-wide">{title}</h3>
        </div>
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-[11px] font-black shadow-inner">
          {equiposSeguros.length}
        </div>
      </div>

      <div className="bg-[#f8fafc] border-x border-b border-slate-200 p-3 min-h-[450px] space-y-3 rounded-b-[1rem] shadow-sm">
        {equiposSeguros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-30">
            <Box size={48} className="text-slate-400 mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sin equipos</p>
          </div>

          
        ) : (
          equiposSeguros.map((equipo) => (
            <EquipoCard
              key={equipo?.id || Math.random()}
              equipo={equipo}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              onMove={onMove}
              onCreatePlan={onCreatePlan}
              onOpenPDF={onOpenPDF}
              moveCategory={moveCategory}
            />
          ))
        )}
      </div>
    </div>
  );
}