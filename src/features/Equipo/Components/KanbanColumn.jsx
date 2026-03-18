import { Box } from "lucide-react";
import EquipoCard from "./EquipoCard";

export default function KanbanColumn({ title, icon: Icon, color, equipos, onEdit, onDelete, onView, onMove, onCreatePlan, onOpenPDF, moveCategory }) {
  const colorStyles = {
    blue: "bg-[#2563eb] border-[#1d4ed8]",
    orange: "bg-[#f59e0b] border-[#d97706]",
    purple: "bg-[#8b5cf6] border-[#7c3aed]",
    green: "bg-[#10b981] border-[#059669]",
    slate: "bg-[#64748b] border-[#475569]",
    red: "bg-[#ef4444] border-[#dc2626]",
    indigo: "bg-[#6366f1] border-[#4f46e5]"
  };

  const bgHeader = colorStyles[color] || colorStyles.blue;
  const equiposSeguros = Array.isArray(equipos) ? equipos : [];

  return (
    // ✅ CLAVE MOBILE: Ancho de 88vw en móvil para dejar asomar la siguiente columna.
    // snap-center ayuda a que la columna se centre al deslizar.
    <div className="flex flex-col w-[88vw] sm:w-[340px] shrink-0 snap-center">
      
      {/* HEADER MÁS LIMPIO Y MODERNO */}
      <div className={`${bgHeader.split(' ')[0]} rounded-t-2xl p-4 flex items-center justify-between shadow-sm border-b border-black/10`}>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1.5 rounded-lg text-white">
            <Icon size={18} strokeWidth={2.5} />
          </div>
          <h3 className="text-white font-black text-sm uppercase tracking-wider">{title}</h3>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-black shadow-inner backdrop-blur-sm">
          {equiposSeguros.length}
        </div>
      </div>

      {/* CUERPO DE LA COLUMNA */}
      <div className="bg-slate-50/80 border-x border-b border-slate-200 p-3 sm:p-4 min-h-[500px] space-y-3 sm:space-y-4 rounded-b-2xl shadow-sm backdrop-blur-sm">
        {equiposSeguros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <Box size={48} className="text-slate-400 mb-3" strokeWidth={1.5} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Sin equipos</p>
          </div>
        ) : (
          equiposSeguros.map((equipo) => (
            <EquipoCard
              key={equipo?.id || Math.random()} equipo={equipo} onEdit={onEdit} onDelete={onDelete}
              onView={onView} onMove={onMove} onCreatePlan={onCreatePlan} onOpenPDF={onOpenPDF} moveCategory={moveCategory}
            />
          ))
        )}
      </div>
    </div>
  );
}