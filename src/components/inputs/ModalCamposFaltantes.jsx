import { AlertTriangle, X } from "lucide-react";

export default function ModalCamposFaltantes({
  isOpen,
  onClose,
  titulo = "Faltan completar estos campos",
  items = [],
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl flex flex-col max-h-[80vh] shadow-2xl">
        <div className="p-5 border-b bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{titulo}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <ul className="space-y-2">
            {items.map((msg, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50/60 border border-amber-100 rounded-lg px-3 py-2"
              >
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border-t flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
