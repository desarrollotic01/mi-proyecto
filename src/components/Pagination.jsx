import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <span className="text-[11px] font-bold text-slate-500">
        Mostrando {start}–{end} de {totalItems} registros
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((page, idx, arr) => (
          <React.Fragment key={page}>
            {idx > 0 && arr[idx - 1] !== page - 1 && (
              <span className="px-1 text-slate-400 text-[11px] select-none">…</span>
            )}
            <button
              onClick={() => onPageChange(page)}
              className={`min-w-[30px] h-[30px] rounded-lg text-[11px] font-bold transition-all ${
                currentPage === page
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
