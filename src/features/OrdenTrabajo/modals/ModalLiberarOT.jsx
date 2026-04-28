import { X, Zap, ShoppingCart, Boxes, AlertCircle, Loader2, Info } from "lucide-react";

export default function ModalLiberarOT({ isOpen, onClose, onConfirm, verificacion, liberando }) {
  if (!isOpen || !verificacion) return null;

  const { hayCompra, hayAlmacen, totalLineasCompra, totalLineasAlmacen } = verificacion;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-violet-600 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Liberar Orden de Trabajo</h3>
          </div>
          <button onClick={onClose} disabled={liberando} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* Aviso principal */}
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Las solicitudes NO se envían al liberar</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Al liberar, las solicitudes quedarán en estado <strong>PENDIENTE</strong>. Deberás enviarlas
                manualmente desde el estado <strong>LIBERADO</strong>.
              </p>
            </div>
          </div>

          {/* Solicitudes detectadas */}
          {(hayCompra || hayAlmacen) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Solicitudes que quedarán pendientes
              </p>

              {/* Compra */}
              {hayCompra && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-800">Solicitud de Compra</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {totalLineasCompra} ítem{totalLineasCompra !== 1 ? "s" : ""} — se consolidará, envío a SAP pendiente
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-semibold whitespace-nowrap">
                    Pendiente
                  </span>
                </div>
              )}

              {/* Almacén */}
              {hayAlmacen && (
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 flex items-center gap-3">
                  <Boxes className="w-5 h-5 text-teal-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-teal-800">Solicitud de Almacén</p>
                    <p className="text-xs text-teal-600 mt-0.5">
                      {totalLineasAlmacen} ítem{totalLineasAlmacen !== 1 ? "s" : ""} — se consolidará, envío por correo pendiente
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-semibold whitespace-nowrap">
                    Pendiente
                  </span>
                </div>
              )}
            </div>
          )}

          {!hayCompra && !hayAlmacen && (
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
              <Info className="w-4 h-4 text-slate-400" />
              <p className="text-sm text-slate-500">No hay solicitudes pendientes en esta OT.</p>
            </div>
          )}

          {/* Aviso irreversible */}
          <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700">
              Una vez liberada, la OT cambiará a estado <strong>LIBERADO</strong> y no podrá revertirse.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 shrink-0">
          <button
            onClick={onClose}
            disabled={liberando}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 transition text-slate-700 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(null, [])}
            disabled={liberando}
            className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {liberando ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Liberando...</>
            ) : (
              <><Zap className="w-4 h-4" />Confirmar Liberación</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
