import { X } from "lucide-react";
import AdjuntosViewer from "../../adjuntos/components/AdjuntosViewer";

export default function AdjuntosEquipoModal({ isOpen, onClose, equipo, adjuntos = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase">Adjuntos del equipo</h2>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              {equipo?.nombre || "Equipo"} {equipo?.codigo ? `• ${equipo.codigo}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <AdjuntosViewer
            adjuntos={adjuntos}
            titulo=""
            emptyMessage="Este equipo no tiene adjuntos visibles en el portal."
          />
        </div>
      </div>
    </div>
  );
}
