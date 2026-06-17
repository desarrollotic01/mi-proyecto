import { useState, useEffect, useRef } from "react";
import { Box, ChevronLeft, ChevronRight } from "lucide-react";
import EquipoCard from "./EquipoCard";

const PAGE_SIZE = 100;

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
  const equiposSeguros = Array.isArray(equipos) ? equipos : [];

  const [page, setPage] = useState(0);
  const scrollRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(equiposSeguros.length / PAGE_SIZE));

  useEffect(() => {
    setPage(0);
  }, [equipos]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const start = page * PAGE_SIZE;
  const visibleEquipos = equiposSeguros.slice(start, start + PAGE_SIZE);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden
      shrink-0 w-[85vw] md:w-[320px] lg:flex-1 lg:w-auto lg:min-w-0 snap-center">

      {/* Header */}
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

      {/* Cards */}
      <div
        ref={scrollRef}
        className="bg-[#f8fafc] border-x border-slate-200 p-3 min-h-[300px] space-y-3 overflow-y-auto flex-1"
      >
        {equiposSeguros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-30">
            <Box size={48} className="text-slate-400 mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sin equipos</p>
          </div>
        ) : (
          visibleEquipos.map((equipo) => (
            <EquipoCard
              key={equipo?.id}
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

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="border-x border-b border-slate-200 rounded-b-[1rem] bg-white px-3 py-2 flex items-center justify-between gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={3} className="text-slate-600" />
          </button>

          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            {start + 1}–{Math.min(start + PAGE_SIZE, equiposSeguros.length)} de {equiposSeguros.length}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} strokeWidth={3} className="text-slate-600" />
          </button>
        </div>
      )}
    </div>
  );
}
